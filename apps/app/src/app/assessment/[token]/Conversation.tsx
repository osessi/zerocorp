"use client";

import { useCallback, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Alert,
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
  SLOT_IDS,
  type QuestionCard as Card,
  type SlotId,
  type SlotState,
} from "@zerocorp/contracts";
import { SLOT_STEPS } from "../steps";
import { answerQuestion, editAnswer, runAnalysis } from "../actions";

/**
 * The real interview.
 *
 * Every turn is a round trip: the server chose the question, the server remembers which
 * question it asked, and the server decides the next one. The client holds no
 * authority over the interview at all, which is what makes the pending-question check
 * on the server meaningful rather than ceremonial.
 */

export interface Turn {
  readonly position: number;
  readonly question: string;
  readonly answer: string;
  readonly slot: SlotId | null;
}

export function Conversation({
  token,
  initialCard,
  initialTurns,
  initialSlots,
}: {
  token: string;
  initialCard: Card | null;
  initialTurns: readonly Turn[];
  initialSlots: Record<SlotId, SlotState>;
}) {
  const router = useRouter();
  const [card, setCard] = useState<Card | null>(initialCard);
  const [turns, setTurns] = useState<readonly Turn[]>(initialTurns);
  const [slots, setSlots] = useState(initialSlots);
  const [editing, setEditing] = useState<{ position: number; resume: Card | null } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const steps: WizardStep[] = SLOT_IDS.map((id) => ({
    id,
    label: SLOT_STEPS[id].label,
    icon: SLOT_STEPS[id].icon,
    done: slots[id].filled,
    ...(slots[id].source === "inferred" ? { tentative: true } : {}),
  }));

  const understood = SLOT_IDS.filter((id) => slots[id].filled && slots[id].source !== "inferred").length;

  const timeline: TimelineItem[] = [
    ...turns.map((turn) => ({
      id: `turn-${turn.position}`,
      question: turn.question,
      answer: turn.answer,
      state: editing?.position === turn.position ? ("active" as const) : ("answered" as const),
      ...(turn.slot ? { icon: SLOT_STEPS[turn.slot].icon } : {}),
    })),
    ...(card && editing === null
      ? [
          {
            id: "active",
            question: card.question,
            state: "active" as const,
            ...(card.slot ? { icon: SLOT_STEPS[card.slot].icon } : {}),
          },
        ]
      : []),
  ];

  const submit = useCallback(
    (text: string, values: string[] = []) => {
      if (!card) return;
      setError(null);

      startTransition(async () => {
        // Changing an existing answer: no new question is chosen, so no model call and
        // nothing after it is discarded — D18.
        if (editing !== null) {
          const result = await editAnswer(token, editing.position, text, values);
          if (!result.ok) {
            setError(result.error ?? "We could not save that.");
            return;
          }
          setTurns((all) =>
            all.map((t) => (t.position === editing.position ? { ...t, answer: text } : t)),
          );
          if (result.slots) setSlots(result.slots);
          setCard(editing.resume);
          setEditing(null);
          return;
        }

        const asked = card;
        setCard(null);

        const result = await answerQuestion(token, asked, text, values);
        if (!result.ok) {
          setCard(asked);
          setError(result.error ?? "We could not save that.");
          return;
        }

        setTurns((all) => [
          ...all,
          { position: all.length, question: asked.question, answer: text, slot: asked.slot },
        ]);
        if (result.slots) setSlots(result.slots);

        if (result.card) {
          setCard(result.card);
          return;
        }

        // No next question: the interview is done and the analysis runs. runAnalysis
        // redirects on success, so anything it returns is a failure.
        const analysed = await runAnalysis(token);
        setError(analysed?.error ?? "We could not finish your assessment.");
        router.refresh();
      });
    },
    [card, editing, router, token],
  );

  const reopen = useCallback(
    (position: number) => {
      if (pending) return;
      const turn = turns.find((t) => t.position === position);
      if (!turn) return;
      setError(null);
      setEditing({ position, resume: card });
      // The question text is what we have; the card shape is not stored client-side, so
      // an edit is always a free-text correction. Honest and enough: the visitor is
      // rewriting a sentence, not re-choosing from a list they cannot see.
      setCard({
        kind: "free_text",
        slot: turn.slot,
        question: turn.question,
        help: "Rewrite your answer. Everything else stays as it is.",
        suggestions: [],
      });
    },
    [card, pending, turns],
  );

  return (
    <ConversationLayout
      status={`${understood} of ${SLOT_IDS.length} understood`}
      rail={
        <WizardRail
          steps={steps}
          activeId={card?.slot ?? null}
          onSelect={(slotId) => {
            const turn = turns.find((t) => t.slot === slotId);
            if (turn) reopen(turn.position);
          }}
        />
      }
      timeline={
        <QuestionTimeline
          items={timeline}
          onSelect={(id) => reopen(Number.parseInt(id.replace("turn-", ""), 10))}
        />
      }
      dock={
        <PromptDock
          onSubmit={submit}
          disabled={pending}
          {...(card && card.kind !== "free_text"
            ? { hint: "Or answer in your own words. You are never stuck with the options." }
            : {})}
        />
      }
    >
      {error ? (
        <div className="pb-6">
          <Alert tone="danger" title="That did not work">
            {error}
          </Alert>
        </div>
      ) : null}

      {pending && !card ? (
        <Thinking label={turns.length >= 4 ? "Building your plan" : "Thinking"} />
      ) : card ? (
        <QuestionCard
          key={`${card.question}-${turns.length}-${editing?.position ?? "new"}`}
          card={card}
          accent={accentFor(card.slot ? SLOT_IDS.indexOf(card.slot) : turns.length)}
          disabled={pending}
          {...(card.slot ? { eyebrow: SLOT_STEPS[card.slot].label } : {})}
          onAnswer={submit}
        />
      ) : (
        <Thinking label="Finishing up" />
      )}
    </ConversationLayout>
  );
}
