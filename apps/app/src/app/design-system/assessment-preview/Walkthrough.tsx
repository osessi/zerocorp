"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowCounterClockwiseIcon,
  BriefcaseIcon,
  BuildingsIcon,
  GlobeHemisphereWestIcon,
  MapPinIcon,
  TargetIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  Button,
  ConversationLayout,
  PromptDock,
  QuestionCard,
  QuestionTimeline,
  Thinking,
  WizardRail,
  accentFor,
  type TimelineItem,
  type WizardStep,
} from "@zerocorp/ui";
import {
  MAX_INTERVIEW_TURNS,
  OPENING_QUESTION,
  SLOT_IDS,
  type ArchitectOutput,
  type InterviewTurn,
  type PartialAssessmentAnswers,
  type QuestionCard as Card,
  type SlotId,
} from "@zerocorp/contracts";
import { mergeExtraction, slotsFrom } from "@zerocorp/domain";
import { DeterministicArchitect, DeterministicInterviewer } from "@zerocorp/ai";
import { Hero } from "./Hero";
import { PlanResult } from "./PlanResult";

/**
 * A real interview, running in the browser.
 *
 * It uses the SAME DeterministicInterviewer and DeterministicArchitect that ship, not
 * mock data. A preview built from fixtures shows what someone hoped the experience would
 * be; this shows what it does.
 *
 * The one thing it fakes is latency, so the thinking state can be seen at all. The real
 * path is a network call and will be slower, not faster.
 */

const THINKING_MS = 700;

/**
 * A label and a glyph per step.
 *
 * The glyph is what the step IS, not decoration: a pin for where you are, a globe for
 * where you sell. A numbered circle tells a visitor how many are left; an icon tells them
 * what each one is about before they have read the word underneath it.
 */
const SLOT_STEPS: Record<SlotId, { label: string; icon: typeof BriefcaseIcon }> = {
  business_description: { label: "Business", icon: BriefcaseIcon },
  current_situation: { label: "Situation", icon: MapPinIcon },
  company_situation: { label: "Company", icon: BuildingsIcon },
  twelve_month_goal: { label: "Goals", icon: TargetIcon },
  target_markets: { label: "Markets", icon: GlobeHemisphereWestIcon },
};

const interviewer = new DeterministicInterviewer();
const architect = new DeterministicArchitect();

const CATALOG = [
  {
    entityTypeCode: "us_llc", jurisdictionCode: "us-wy", customerLabel: "LLC",
    automationLevel: "operator_assisted" as const, typicalDaysMin: 1, typicalDaysMax: 10,
    eligible: true, notes: ["A registered agent with a physical address in the state is required."],
  },
  {
    entityTypeCode: "gb_ltd", jurisdictionCode: "gb", customerLabel: "Ltd",
    automationLevel: "operator_assisted" as const, typicalDaysMin: 1, typicalDaysMax: 10,
    eligible: true, notes: [],
  },
];

/**
 * One answered turn, with everything needed to undo it.
 *
 * The state used to be three parallel pieces — answers, sources and a transcript — and
 * rewinding to turn three meant guessing which of them turn four had touched. Keeping
 * the patch beside the turn makes going back exact: drop the entries after it and
 * recompute. Answers are DERIVED from this list rather than stored again, so the two can
 * never disagree.
 */
interface Answered {
  readonly turn: InterviewTurn;
  readonly patch: PartialAssessmentAnswers;
  readonly stated: SlotId | null;
  readonly inferred: readonly SlotId[];
}

export function Walkthrough() {
  const [started, setStarted] = useState(false);
  const [history, setHistory] = useState<Answered[]>([]);
  const [card, setCard] = useState<Card | null>(OPENING_QUESTION);
  const [thinking, setThinking] = useState(false);
  const [plan, setPlan] = useState<ArchitectOutput | null>(null);

  const answers = useMemo<PartialAssessmentAnswers>(
    () => history.reduce<PartialAssessmentAnswers>((all, step) => ({ ...all, ...step.patch }), {}),
    [history],
  );

  const sources = useMemo(() => {
    const out: Partial<Record<SlotId, "stated" | "inferred">> = {};
    for (const step of history) {
      for (const id of step.inferred) out[id] = "inferred";
      // Stated last, and unconditionally: being asked outranks having been guessed.
      if (step.stated) out[step.stated] = "stated";
    }
    return out;
  }, [history]);

  const slots = useMemo(() => slotsFrom(answers, sources), [answers, sources]);

  const steps: WizardStep[] = SLOT_IDS.map((id) => ({
    id,
    label: SLOT_STEPS[id].label,
    icon: SLOT_STEPS[id].icon,
    done: slots[id].filled,
    ...(slots[id].source === "inferred" ? { tentative: true } : {}),
  }));

  const understood = SLOT_IDS.filter((id) => slots[id].filled && slots[id].source !== "inferred").length;

  const timeline: TimelineItem[] = [
    ...history.map((step, i) => ({
      id: `turn-${i}`,
      question: step.turn.question.question,
      answer: step.turn.answer,
      state: "answered" as const,
    })),
    ...(card ? [{ id: "active", question: card.question, state: "active" as const }] : []),
  ];

  const answer = useCallback(
    async (text: string, values?: string[]) => {
      if (!card) return;

      const stated = card.slot;
      const patch: Record<string, unknown> = {};
      if (stated) {
        patch[stated] =
          stated === "target_markets"
            ? (values ?? []).map((v) => v.toUpperCase())
            : stated === "company_situation"
              ? (values?.[0] ?? text)
              : text;
      }

      const turn: InterviewTurn = { question: card, answer: text };
      const nextAnswers = { ...answers, ...(patch as PartialAssessmentAnswers) };

      setCard(null);
      setThinking(true);
      await new Promise((r) => setTimeout(r, THINKING_MS));

      const result = await interviewer.next({
        slots: slotsFrom(nextAnswers, sources),
        transcript: [...history.map((h) => h.turn), turn],
        turnsRemaining: Math.max(0, MAX_INTERVIEW_TURNS - history.length - 1),
        locale: "en",
      });

      const merged = mergeExtraction(
        nextAnswers,
        result.extracted,
        new Set(stated ? [stated] : []),
      );

      setHistory((h) => [
        ...h,
        {
          turn,
          patch: { ...(patch as PartialAssessmentAnswers), ...pick(merged.answers, merged.inferred) },
          stated,
          inferred: merged.inferred,
        },
      ]);
      setThinking(false);
      setCard(result.next);
    },
    [answers, card, history, sources],
  );

  /**
   * Go back to an answered question.
   *
   * Everything after it is dropped, not merely re-asked: a founder who realises at
   * question five that they misread question two is correcting the answers that followed
   * from it, and leaving those in place would build the plan on the version they just
   * rejected.
   */
  const rewind = useCallback(
    (id: string) => {
      if (thinking) return;
      const index = Number.parseInt(id.replace("turn-", ""), 10);
      const target = history[index];
      if (!target) return;
      setPlan(null);
      setHistory((h) => h.slice(0, index));
      setCard(target.turn.question);
    },
    [history, thinking],
  );

  // Every slot filled and no card left: produce the plan.
  useEffect(() => {
    if (card !== null || thinking || plan !== null || history.length === 0) return;
    if (!SLOT_IDS.every((id) => slots[id].filled)) return;

    setThinking(true);
    void (async () => {
      await new Promise((r) => setTimeout(r, THINKING_MS * 2));
      const run = await architect.analyze({
        answers: answers as never,
        transcripts: {},
        catalog: CATALOG,
        constraints: [],
        conversation: [],
        locale: "en",
      });
      setPlan(run.output);
      setThinking(false);
    })();
  }, [answers, card, history.length, plan, slots, thinking]);

  function reset() {
    setStarted(false);
    setHistory([]);
    setCard(OPENING_QUESTION);
    setPlan(null);
    setThinking(false);
  }

  if (!started) {
    return (
      <Hero
        onStart={(text) => {
          setStarted(true);
          void answer(text);
        }}
      />
    );
  }

  if (plan) {
    return (
      <div className="bg-background text-foreground flex h-dvh flex-col overflow-hidden">
        <header className="border-border flex h-14 shrink-0 items-center justify-between border-b px-5 sm:px-8">
          <span className="text-label tracking-tight">ZeroCorp</span>
          <Button variant="tertiary" size="sm" icon={ArrowCounterClockwiseIcon} onClick={reset}>
            Start over
          </Button>
        </header>
        <div className="border-border shrink-0 border-b px-5 py-5 sm:px-8">
          <div className="mx-auto w-full max-w-5xl">
            <WizardRail steps={steps} />
          </div>
        </div>
        <main className="flex-1 overflow-y-auto px-5 py-10 sm:px-8">
          <div className="mx-auto w-full max-w-2xl">
            <PlanResult output={plan} />
          </div>
        </main>
      </div>
    );
  }

  const activeIndex = card?.slot ? SLOT_IDS.indexOf(card.slot) : history.length;

  return (
    <ConversationLayout
      status={`${understood} of ${SLOT_IDS.length} understood`}
      rail={<WizardRail steps={steps} activeId={card?.slot ?? null} />}
      timeline={<QuestionTimeline items={timeline} onSelect={rewind} />}
      dock={
        <PromptDock
          onSubmit={(text) => void answer(text)}
          disabled={thinking}
          {...(card && card.kind !== "free_text"
            ? { hint: "Or answer in your own words. You are never stuck with the options." }
            : {})}
        />
      }
    >
      {thinking ? (
        <Thinking label={history.length >= 4 ? "Building your plan" : "Thinking"} />
      ) : card ? (
        <QuestionCard
          key={`${card.question}-${history.length}`}
          card={card}
          accent={accentFor(activeIndex)}
          {...(card.slot ? { eyebrow: SLOT_STEPS[card.slot].label } : {})}
          onAnswer={(text, values) => void answer(text, values)}
        />
      ) : (
        <Thinking label="Finishing up" />
      )}
    </ConversationLayout>
  );
}

/** The subset of an object named by a list of keys. */
function pick(source: PartialAssessmentAnswers, keys: readonly SlotId[]): PartialAssessmentAnswers {
  const out: Record<string, unknown> = {};
  for (const key of keys) {
    if (source[key] !== undefined) out[key] = source[key];
  }
  return out as PartialAssessmentAnswers;
}
