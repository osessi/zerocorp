import {
  MAX_INTERVIEW_TURNS,
  OPENING_QUESTION,
  SLOT_IDS,
  questionCardSchema,
  type Enrichment,
  type PartialAssessmentAnswers,
  type QuestionCard,
  type SlotId,
  type SlotState,
} from "@zerocorp/contracts";
import { mergeExtraction, shouldStop, slotsFrom, turnsRemaining } from "@zerocorp/domain";
import type { Interviewer } from "../ai/ports";
import type { Clock, SystemUnitOfWork } from "../ports";
import type { AssessmentRepository, AssessmentUsageRecorder, StoredTurn } from "./ports";
import { ASSESSMENT_TTL_DAYS } from "./use-cases";

/**
 * The adaptive interview — D18.
 *
 * It fills the same five slots `assessmentAnswersSchema` requires, one question at a
 * time. The Business Architect contract is untouched: this is a smarter way of filling
 * the same form, not a replacement for what reads it.
 *
 * Three limits are enforced here rather than trusted to the model:
 *
 *   1. The turn cap. A model told it has zero turns left can still return a question.
 *   2. No repeats. Asking again for something already answered is the most damaging
 *      thing this agent can do to the experience.
 *   3. Extraction never overwrites a stated answer. A model reading "three clients in
 *      France" must not rewrite an explicitly chosen market list.
 */

export interface InterviewState {
  readonly assessmentId: string;
  readonly card: QuestionCard | null;
  readonly turns: readonly StoredTurn[];
  readonly slots: Record<SlotId, SlotState>;
  readonly answers: PartialAssessmentAnswers;
  readonly enrichment: Enrichment;
  readonly turnsUsed: number;
  readonly complete: boolean;
  /** True when the run that chose the last question came from the rules fallback. */
  readonly deterministic: boolean;
}

export interface InterviewDeps<TTx> {
  readonly suow: SystemUnitOfWork<TTx>;
  readonly repository: AssessmentRepository<TTx>;
  readonly interviewer: Interviewer;
  readonly clock: Clock;
  readonly tokens: { generate(): { token: string; hash: string }; hash(token: string): string };
  readonly usage?: AssessmentUsageRecorder;
}

export class InterviewNotFoundError extends Error {
  override readonly name = "InterviewNotFoundError";
  constructor() {
    // Says nothing about whether the token existed and expired or never existed. A
    // different message for each is an oracle for guessing tokens.
    super("No assessment for that token");
  }
}

/**
 * The answer does not match the question the server asked.
 *
 * Taking the card from the client means the client decides which slot its answer lands
 * in, and could skip the interview entirely. Validating the card proves it is well
 * formed; it does not prove it is the one that was asked.
 */
export class UnexpectedAnswerError extends Error {
  override readonly name = "UnexpectedAnswerError";
  constructor() {
    super("That is not the question we asked. Reload and try again.");
  }
}

export function createInterviewService<TTx>(deps: InterviewDeps<TTx>) {
  const requestId = () => `interview-${deps.clock.now().getTime()}`;

  /** Slot state rebuilt from the turns. Derived, so it cannot drift from the answers. */
  function reconstruct(turns: readonly StoredTurn[]): {
    answers: PartialAssessmentAnswers;
    slots: Record<SlotId, SlotState>;
  } {
    const answers = turns.reduce<PartialAssessmentAnswers>((all, t) => ({ ...all, ...t.patch }), {});
    const sources: Partial<Record<SlotId, SlotState["source"]>> = {};
    for (const turn of turns) {
      for (const id of turn.inferredSlots) sources[id] = "inferred";
      // Stated last and unconditionally: being asked outranks having been guessed.
      if (turn.statedSlot) sources[turn.statedSlot] = "stated";
    }
    return { answers, slots: slotsFrom(answers, sources) };
  }

  async function load(tx: TTx, token: string) {
    const assessment = await deps.repository.findByTokenHash(tx, deps.tokens.hash(token));
    if (!assessment) throw new InterviewNotFoundError();
    if (assessment.expiresAt.getTime() < deps.clock.now().getTime()) throw new InterviewNotFoundError();
    const turns = await deps.repository.listTurns(tx, assessment.id);
    return { assessment, turns, ...reconstruct(turns) };
  }

  /** What a card's answer writes into its slot. Choices carry values; free text is the text. */
  function patchFor(card: QuestionCard, text: string, values: readonly string[]): PartialAssessmentAnswers {
    if (!card.slot) return {};
    if (card.kind === "confirm") return {};
    const patch: Record<string, unknown> = {};
    patch[card.slot] =
      card.slot === "target_markets"
        ? values.map((v) => v.toUpperCase())
        : card.slot === "company_situation"
          ? (values[0] ?? text)
          : text;
    return patch as PartialAssessmentAnswers;
  }

  return {
    /**
     * Starts an interview.
     *
     * The opening question is FIXED and costs no model call — D18. The visitor commits
     * before anything is spent, the page has no first-turn latency, and a visitor who
     * closes the tab has cost nothing.
     */
    async start(locale = "en"): Promise<{ token: string; card: QuestionCard }> {
      const { token, hash } = deps.tokens.generate();
      const expiresAt = new Date(deps.clock.now().getTime() + ASSESSMENT_TTL_DAYS * 86_400_000);
      await deps.suow.withSystem(requestId(), async (tx) => {
        const id = await deps.repository.create(tx, { tokenHash: hash, locale, expiresAt });
        await deps.repository.setPendingQuestion(tx, id, OPENING_QUESTION);
      });
      return { token, card: OPENING_QUESTION };
    },

    async state(token: string): Promise<InterviewState> {
      return deps.suow.withSystem(requestId(), async (tx) => {
        const { assessment, turns, answers, slots } = await load(tx, token);
        const stop = shouldStop(slots, turns.length);
        return {
          assessmentId: assessment.id,
          // Read back, not guessed. Deriving the pending question from the first unfilled
          // slot is wrong the moment the interviewer asks anything adaptive, and wrong
          // for every confirm.
          card: assessment.pendingQuestion,
          turns,
          slots,
          answers,
          enrichment: assessment.enrichment,
          turnsUsed: assessment.turnsUsed,
          complete: stop.done && stop.reason === "complete",
          deterministic: false,
        };
      });
    },

    /**
     * Answers the current question and returns the next one.
     *
     * `null` means the interview is finished and the analysis can run.
     */
    async answer(
      token: string,
      card: QuestionCard,
      text: string,
      values: readonly string[] = [],
    ): Promise<{ card: QuestionCard | null; slots: Record<SlotId, SlotState>; deterministic: boolean }> {
      const validated = questionCardSchema.parse(card);

      const prepared = await deps.suow.withSystem(requestId(), async (tx) => {
        const loaded = await load(tx, token);
        return { ...loaded, id: loaded.assessment.id };
      });

      // The server asked a question and remembers which. An answer to any other one is
      // refused, so a crafted request cannot choose which slot it writes into or skip
      // the interview and arrive at the analysis with answers nobody was asked for.
      const asked = prepared.assessment.pendingQuestion;
      if (!asked || asked.question !== validated.question || asked.kind !== validated.kind) {
        throw new UnexpectedAnswerError();
      }

      const patch = patchFor(validated, text, values);
      const nextAnswers = { ...prepared.answers, ...patch };
      const stated = validated.kind === "confirm" ? null : validated.slot;

      const run = await deps.interviewer.next({
        slots: slotsFrom(nextAnswers, sourcesOf(prepared.turns, stated)),
        transcript: [
          ...prepared.turns.map((t) => ({ question: t.question, answer: t.answer })),
          { question: validated, answer: text },
        ],
        turnsRemaining: turnsRemaining(prepared.turns.length + 1),
        locale: "en",
      });

      const merged = mergeExtraction(nextAnswers, run.extracted, new Set(stated ? [stated] : []));
      const slots = slotsFrom(merged.answers, sourcesOf(prepared.turns, stated, merged.inferred));
      const stop = shouldStop(slots, prepared.turns.length + 1);

      // The cap is checked HERE as well as in the adapter, because this is the layer that
      // owns how many turns have actually been stored.
      const nextCard =
        stop.done || prepared.turns.length + 1 >= MAX_INTERVIEW_TURNS ? null : run.next;

      await deps.suow.withSystem(requestId(), async (tx) => {
        // `assessments.answers` is the materialised form of every turn's patch, written
        // in the same transaction as the turn that changed it.
        //
        // It is not a second source of truth: the value written IS the derivation. The
        // architect reads one field instead of replaying a conversation, and the two
        // cannot disagree because only this line produces it.
        await deps.repository.saveAnswers(tx, prepared.id, merged.answers);
        await deps.repository.appendTurn(tx, prepared.id, {
          position: prepared.turns.length,
          question: validated,
          answer: text,
          patch: { ...patch, ...pick(merged.answers, merged.inferred) },
          statedSlot: stated,
          inferredSlots: merged.inferred,
          costMicros: run.costMicros,
          model: run.model,
        });
        await deps.repository.setTurnsUsed(tx, prepared.id, prepared.turns.length + 1);
        await deps.repository.setPendingQuestion(tx, prepared.id, nextCard);
        if (Object.keys(run.enrichment).length > 0) {
          await deps.repository.setEnrichment(tx, prepared.id, {
            ...prepared.assessment.enrichment,
            ...run.enrichment,
          });
        }
      });

      if (run.costMicros > 0) {
        await deps.usage?.record({
          assessmentId: prepared.id,
          feature: "business_interviewer",
          provider: "openrouter",
          model: run.model,
          costMicros: run.costMicros,
          durationMs: 0,
          deterministic: run.model === "deterministic",
        });
      }

      return {
        card: nextCard,
        slots,
        deterministic: run.model === "deterministic",
      };
    },

    /**
     * Changes an answer already given.
     *
     * Nothing after it is discarded. A founder who comes back to fix one sentence should
     * not find four answers gone; that was the earlier behaviour and it is not what
     * anyone expects. No model call either, because no new question is being chosen.
     */
    async editTurn(
      token: string,
      position: number,
      text: string,
      values: readonly string[] = [],
    ): Promise<{ slots: Record<SlotId, SlotState> }> {
      return deps.suow.withSystem(requestId(), async (tx) => {
        const { assessment, turns } = await load(tx, token);
        const existing = turns[position];
        if (!existing) throw new InterviewNotFoundError();

        const patch = patchFor(existing.question, text, values);
        await deps.repository.replaceTurn(tx, assessment.id, position, {
          ...existing,
          answer: text,
          patch: { ...existing.patch, ...patch },
        });

        const updated = await deps.repository.listTurns(tx, assessment.id);
        const rebuilt = reconstruct(updated);
        // Same rule as answering: the materialised answers are rewritten from the turns
        // that now exist, so an edit cannot leave the architect reading the old sentence.
        await deps.repository.saveAnswers(tx, assessment.id, rebuilt.answers);
        return { slots: rebuilt.slots };
      });
    },
  };
}

export type InterviewService<TTx = unknown> = ReturnType<typeof createInterviewService<TTx>>;

function sourcesOf(
  turns: readonly StoredTurn[],
  stated: SlotId | null,
  inferred: readonly SlotId[] = [],
): Partial<Record<SlotId, SlotState["source"]>> {
  const out: Partial<Record<SlotId, SlotState["source"]>> = {};
  for (const turn of turns) {
    for (const id of turn.inferredSlots) out[id] = "inferred";
    if (turn.statedSlot) out[turn.statedSlot] = "stated";
  }
  for (const id of inferred) out[id] ??= "inferred";
  if (stated) out[stated] = "stated";
  return out;
}

function pick(source: PartialAssessmentAnswers, keys: readonly SlotId[]): PartialAssessmentAnswers {
  const out: Record<string, unknown> = {};
  for (const key of keys) if (source[key] !== undefined) out[key] = source[key];
  return out as PartialAssessmentAnswers;
}

export { SLOT_IDS };
