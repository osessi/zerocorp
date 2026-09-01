import {
  MAX_INTERVIEW_TURNS,
  SLOT_IDS,
  assessmentAnswersSchema,
  type ExtractedSlots,
  type PartialAssessmentAnswers,
  type SlotId,
  type SlotState,
} from "@zerocorp/contracts";

/**
 * Slot state — the pure core of the adaptive interview (D18).
 *
 * The interviewer's job is bounded: fill five slots in as few questions as possible.
 * Everything about "are we done" and "what is still missing" is decided here, with no
 * model call, so the progress indicator and the stopping rule can never disagree with
 * each other or drift with a prompt change.
 */

export function emptySlots(): Record<SlotId, SlotState> {
  return Object.fromEntries(SLOT_IDS.map((id) => [id, { filled: false, source: null }])) as Record<
    SlotId,
    SlotState
  >;
}

/**
 * Slot state derived from the answers actually stored.
 *
 * Derived rather than tracked in parallel. A separate counter would eventually disagree
 * with the answers, and the one that is wrong is always the one the UI shows.
 */
export function slotsFrom(
  answers: PartialAssessmentAnswers,
  sources: Partial<Record<SlotId, SlotState["source"]>> = {},
): Record<SlotId, SlotState> {
  const shape = assessmentAnswersSchema.shape;
  const out = emptySlots();
  for (const id of SLOT_IDS) {
    const value = answers[id];
    // Validated against the SAME schema the assessment uses. A slot is not "filled"
    // because something was written into it; it is filled when what is there would
    // pass the check the analysis will later make.
    const filled = value !== undefined && shape[id].safeParse(value).success;
    out[id] = { filled, source: filled ? (sources[id] ?? "stated") : null };
  }
  return out;
}

export function missingSlots(slots: Record<SlotId, SlotState>): SlotId[] {
  return SLOT_IDS.filter((id) => !slots[id].filled);
}

export function filledCount(slots: Record<SlotId, SlotState>): number {
  return SLOT_IDS.length - missingSlots(slots).length;
}

/** Every slot filled, and none of them merely inferred without confirmation. */
export function isComplete(slots: Record<SlotId, SlotState>): boolean {
  return SLOT_IDS.every((id) => slots[id].filled && slots[id].source !== "inferred");
}

/**
 * Why the interview stops.
 *
 * Three reasons, and they are not the same thing to the visitor. "We have what we need"
 * is a success; "we ran out of questions" is a budget limit that still produces a plan;
 * "you have not answered enough" blocks the analysis. Collapsing them into a boolean is
 * how a limit gets shown as a failure.
 */
export type InterviewStop =
  | { done: false }
  | { done: true; reason: "complete" }
  | { done: true; reason: "budget_exhausted"; missing: SlotId[] }
  | { done: true; reason: "cannot_proceed"; missing: SlotId[] };

export function shouldStop(
  slots: Record<SlotId, SlotState>,
  turnsUsed: number,
  maxTurns: number = MAX_INTERVIEW_TURNS,
): InterviewStop {
  const missing = missingSlots(slots);
  if (missing.length === 0) return { done: true, reason: "complete" };
  if (turnsUsed < maxTurns) return { done: false };
  // The cap is reached. The analysis needs every slot, so an unfilled one at this point
  // is a wall rather than a shortfall — the visitor is asked directly for what is left.
  return { done: true, reason: "cannot_proceed", missing };
}

export function turnsRemaining(turnsUsed: number, maxTurns: number = MAX_INTERVIEW_TURNS): number {
  return Math.max(0, maxTurns - turnsUsed);
}

/**
 * Merges what the interviewer extracted into the answers.
 *
 * Extraction NEVER overwrites something the visitor stated. A model reading "three
 * clients in France" and rewriting an explicitly chosen market list is the failure mode
 * this guards: the visitor's own words outrank an inference from them, always.
 */
export function mergeExtraction(
  answers: PartialAssessmentAnswers,
  extracted: ExtractedSlots,
  statedSlots: ReadonlySet<SlotId>,
): { answers: PartialAssessmentAnswers; inferred: SlotId[] } {
  const next: Record<string, unknown> = { ...answers };
  const inferred: SlotId[] = [];

  for (const id of SLOT_IDS) {
    const value = extracted[id as keyof ExtractedSlots];
    if (value === undefined) continue;
    if (statedSlots.has(id)) continue;
    if (next[id] !== undefined) continue;
    next[id] = value;
    inferred.push(id);
  }

  return { answers: next as PartialAssessmentAnswers, inferred };
}
