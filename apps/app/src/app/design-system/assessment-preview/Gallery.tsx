"use client";

import { useState } from "react";
import {
  AnsweredTurn,
  PromptDock,
  PromptHero,
  QuestionCard,
  SlotProgress,
  Thinking,
} from "@zerocorp/ui";
import type { QuestionCard as Card } from "@zerocorp/contracts";
import { PlanResult } from "./PlanResult";
import { SAMPLE_PLAN } from "./sample";

/**
 * Every state, side by side.
 *
 * The walkthrough shows the experience; this shows the pieces. Reviewing a component by
 * walking to it takes five answers and a memory of what the last one looked like, which
 * is how a state ships unlooked at.
 */

function Case({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <section className="border-border flex flex-col gap-4 border-t py-8">
      <div className="flex flex-col gap-1">
        <h2 className="text-overline text-muted-foreground">{title}</h2>
        {note ? <p className="text-body-sm text-muted-foreground max-w-prose">{note}</p> : null}
      </div>
      <div className="border-border border p-6">{children}</div>
    </section>
  );
}

const SINGLE: Card = {
  kind: "single_choice",
  slot: "company_situation",
  question: "Do you already have a company?",
  help: "If you do, we will not suggest you create another one.",
  options: [
    { value: "none", label: "No, I do not have one" },
    { value: "existing", label: "Yes, I have one already" },
    { value: "in_progress", label: "One is being set up right now" },
  ],
  allowsOther: false,
};

const MULTI: Card = {
  kind: "multi_choice",
  slot: null,
  question: "What do you want ZeroCorp to help you with?",
  help: "Pick everything that applies. The plan is built from this.",
  options: [
    { value: "company", label: "Build my company" },
    { value: "website", label: "Build my website" },
    { value: "customers", label: "Get customers" },
    { value: "automation", label: "Automate my business" },
    { value: "content", label: "Publish content" },
    { value: "email", label: "Set up email" },
  ],
  min: 1,
  max: 6,
};

const FREE: Card = {
  kind: "free_text",
  slot: "business_description",
  question: "What best describes your business?",
  help: "Pick the closest, or write your own. Neither is more correct.",
  suggestions: [
    "Digital marketing agency",
    "AI automation agency",
    "Web development agency",
    "Something else",
  ],
};

const CONFIRM: Card = {
  kind: "confirm",
  slot: "target_markets",
  question: "Have I got this right?",
  statement: "You are based in France and want to sell to customers in the United States.",
};

export function Gallery() {
  const [log, setLog] = useState<string[]>([]);
  const record = (what: string) => setLog((l) => [what, ...l].slice(0, 4));

  return (
    <div className="mx-auto w-full max-w-2xl px-6 pb-24">
      <Case
        title="Prompt hero — page"
        note="The landing IS the first question. Fixed, so it costs no model call, which is why it can be rendered before anyone commits."
      >
        <PromptHero
          title="Tell us where you are."
          subtitle="Describe what you are building."
          footnote={<span>US LLC · C-Corp · UK Ltd · LLP</span>}
        >
          <PromptDock onSubmit={record} placeholder="I design brand identities…" />
        </PromptHero>
      </Case>

      <Case
        title="Prompt hero — panel"
        note="The same gesture inside the product. An empty panel stops being a dead end with a button in it."
      >
        <PromptHero
          variant="panel"
          title="What should we write about?"
          subtitle="Describe the article and we will draft, review and schedule it."
        >
          <PromptDock onSubmit={record} placeholder="A guide to opening a US bank account as a non-resident" />
        </PromptHero>
      </Case>

      <Case title="Slot progress" note="Not a step counter. It renders the same state that decides when the interview stops.">
        <div className="flex flex-col gap-4">
          <SlotProgress
            items={[
              { id: "1", label: "Business", filled: true },
              { id: "2", label: "Situation", filled: true },
              { id: "3", label: "Company", filled: true, tentative: true },
              { id: "4", label: "Goals", filled: false },
              { id: "5", label: "Markets", filled: false },
            ]}
          />
          <p className="text-caption text-muted-foreground">
            The third is outlined rather than filled: inferred, not yet confirmed.
          </p>
        </div>
      </Case>

      <Case title="Single choice" note="Picking IS the answer. A Continue button after a single choice adds a click carrying no information.">
        <QuestionCard card={SINGLE} onAnswer={record} />
      </Case>

      <Case title="Multiple selection" note="Needs a Continue, because the system cannot know when they are finished choosing.">
        <QuestionCard card={MULTI} onAnswer={record} />
      </Case>

      <Case title="Free text with AI suggestions" note="Chips are a starting point, never a closed set. The dock below is always available.">
        <QuestionCard card={FREE} onAnswer={record} />
      </Case>

      <Case title="Confirm" note="When the system inferred something rather than being told. One click instead of a repeated question.">
        <QuestionCard card={CONFIRM} onAnswer={record} />
      </Case>

      <Case title="Thinking" note="Opacity only. A spinner says the machine is busy; this says someone is considering what you said.">
        <div className="flex flex-col gap-6">
          <Thinking />
          <Thinking label="Building your plan" />
        </div>
      </Case>

      <Case title="Answered, collapsed" note="It stays on the page and stays editable. Hover or tab to reach the pencil.">
        <div className="flex flex-col gap-2">
          <AnsweredTurn question="What are you building?" answer="Brand identities for early-stage software companies." onEdit={() => record("edit")} />
          <AnsweredTurn question="Where are you today?" answer="Three clients, invoiced personally, no company." onEdit={() => record("edit")} />
        </div>
      </Case>

      <Case title="The dock" note="Always present, even on a choice question. Microphone morphs into send; two buttons where one will do makes the visitor choose every time.">
        <PromptDock onSubmit={record} hint="Or answer in your own words. You are never stuck with the options." />
      </Case>

      <Case title="The end of the assessment" note="Four sections read in order, then a plan whose steps open to show why each is recommended.">
        <PlanResult output={SAMPLE_PLAN} />
      </Case>

      {log.length > 0 ? (
        <div className="border-border bg-muted text-caption fixed right-6 bottom-6 z-30 max-w-xs border p-3">
          <p className="text-overline text-muted-foreground pb-1">Last answers</p>
          {log.map((entry, i) => (
            <p key={i} className="text-muted-foreground truncate">{entry}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
