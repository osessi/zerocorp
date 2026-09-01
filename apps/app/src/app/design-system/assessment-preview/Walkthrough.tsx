"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowCounterClockwiseIcon } from "@phosphor-icons/react/dist/ssr";
import {
  AnsweredTurn,
  Button,
  ConversationLayout,
  PromptDock,
  QuestionCard,
  SlotProgress,
  Thinking,
  type SlotProgressItem,
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

const SLOT_LABELS: Record<SlotId, string> = {
  business_description: "Business",
  current_situation: "Situation",
  company_situation: "Company",
  twelve_month_goal: "Goals",
  target_markets: "Markets",
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

  const progress: SlotProgressItem[] = SLOT_IDS.map((id) => ({
    id,
    label: SLOT_LABELS[id],
    filled: slots[id].filled,
    ...(slots[id].source === "inferred" ? { tentative: true } : {}),
  }));

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
      <ConversationLayout progress={<SlotProgress items={progress} />}>
        <PlanResult output={plan} />
        <div className="border-border border-t pt-6">
          <Button variant="tertiary" icon={ArrowCounterClockwiseIcon} onClick={reset}>
            Start over
          </Button>
        </div>
      </ConversationLayout>
    );
  }

  return (
    <ConversationLayout
      progress={<SlotProgress items={progress} />}
      history={transcript.map((t, i) => (
        <AnsweredTurn key={i} question={t.question.question} answer={t.answer} onEdit={() => undefined} />
      ))}
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
        <QuestionCard card={card} onAnswer={(text, values) => void answer(text, values)} />
      ) : (
        <Thinking label="Finishing up" />
      )}
    </ConversationLayout>
  );
}
