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
 * The one thing it fakes is latency, so the thinking state can actually be seen. The
 * real path is a network call and will be slower, not faster.
 */

const THINKING_MS = 700;

/**
 * A label and a glyph per step.
 *
 * The glyph is what the step IS, not a decoration: a pin for where you are, a globe for
 * where you sell. A numbered circle tells a visitor how many are left; an icon tells
 * them what each one is about before they have read the word underneath it.
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

export function Walkthrough() {
  const [answers, setAnswers] = useState<PartialAssessmentAnswers>({});
  const [sources, setSources] = useState<Partial<Record<SlotId, "stated" | "inferred">>>({});
  const [transcript, setTranscript] = useState<InterviewTurn[]>([]);
  // The landing IS the first question, so the conversation starts empty and the hero
  // holds the opening card until it is answered.
  const [started, setStarted] = useState(false);
  const [card, setCard] = useState<Card | null>(OPENING_QUESTION);
  const [thinking, setThinking] = useState(false);
  const [plan, setPlan] = useState<ArchitectOutput | null>(null);

  const slots = useMemo(() => slotsFrom(answers, sources), [answers, sources]);

  const steps: WizardStep[] = SLOT_IDS.map((id) => ({
    id,
    label: SLOT_STEPS[id].label,
    icon: SLOT_STEPS[id].icon,
    done: slots[id].filled,
    ...(slots[id].source === "inferred" ? { tentative: true } : {}),
  }));

  const answeredCount = SLOT_IDS.filter((id) => slots[id].filled && slots[id].source !== "inferred").length;

  /**
   * The timeline: everything asked, plus the one being asked.
   *
   * Built from the transcript rather than from the slots, because a question and a slot
   * are not the same thing. One answer can fill three slots, and a confirm question
   * fills none.
   */
  const timeline: TimelineItem[] = [
    ...transcript.map((turn, i) => ({
      id: `turn-${i}`,
      question: turn.question.question,
      answer: turn.answer,
      state: "answered" as const,
    })),
    ...(card ? [{ id: "active", question: card.question, state: "active" as const }] : []),
  ];

  const answer = useCallback(
    async (text: string, values?: string[]) => {
      if (!card) return;

      // The slot this card was asking about is STATED, whatever else gets inferred from
      // the same sentence.
      const stated = new Set<SlotId>();
      const next: Record<string, unknown> = { ...answers };
      if (card.slot) {
        stated.add(card.slot);
        next[card.slot] =
          card.slot === "target_markets"
            ? (values ?? []).map((v) => v.toUpperCase())
            : card.slot === "company_situation"
              ? (values?.[0] ?? text)
              : text;
      }

      const turn: InterviewTurn = { question: card, answer: text };
      const history = [...transcript, turn];
      setTranscript(history);
      setCard(null);
      setThinking(true);

      await new Promise((r) => setTimeout(r, THINKING_MS));

      const result = await interviewer.next({
        slots: slotsFrom(next as PartialAssessmentAnswers, sources),
        transcript: history,
        turnsRemaining: Math.max(0, MAX_INTERVIEW_TURNS - history.length),
        locale: "en",
      });

      const merged = mergeExtraction(next as PartialAssessmentAnswers, result.extracted, stated);
      setAnswers(merged.answers);
      setSources((s) => {
        const updated = { ...s };
        if (card.slot) updated[card.slot] = "stated";
        for (const id of merged.inferred) updated[id] = "inferred";
        return updated;
      });

      setThinking(false);
      setCard(result.next);
    },
    [answers, card, sources, transcript],
  );

  // Every slot filled and no card left: produce the plan.
  useEffect(() => {
    if (card !== null || thinking || plan !== null || transcript.length === 0) return;
    const complete = SLOT_IDS.every((id) => slots[id].filled);
    if (!complete) return;

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
  }, [answers, card, plan, slots, thinking, transcript.length]);

  function reset() {
    setStarted(false);
    setAnswers({});
    setSources({});
    setTranscript([]);
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

  const activeIndex = card?.slot ? SLOT_IDS.indexOf(card.slot) : transcript.length;
  const accent = accentFor(activeIndex);

  return (
    <ConversationLayout
      status={`${answeredCount} of ${SLOT_IDS.length} understood`}
      rail={<WizardRail steps={steps} activeId={card?.slot ?? null} />}
      timeline={<QuestionTimeline items={timeline} />}
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
        <Thinking label={transcript.length >= 4 ? "Building your plan" : "Thinking"} />
      ) : card ? (
        <QuestionCard
          card={card}
          accent={accent}
          {...(card.slot ? { eyebrow: SLOT_STEPS[card.slot].label } : {})}
          onAnswer={(text, values) => void answer(text, values)}
        />
      ) : (
        <Thinking label="Finishing up" />
      )}
    </ConversationLayout>
  );
}
