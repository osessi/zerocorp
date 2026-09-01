"use client";

import { useState } from "react";
import {
  BriefcaseIcon,
  BuildingsIcon,
  GlobeHemisphereWestIcon,
  MapPinIcon,
  TargetIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  PromptDock,
  PromptHero,
  QuestionCard,
  QuestionTimeline,
  Thinking,
  WizardRail,
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
        <PromptHero title="Tell us where you are." subtitle="Describe what you are building.">
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

      <Case
        title="The rail"
        note="Not a progress bar. A bar claims to know how far through you are; this interview may end at turn three or turn eight. The rail says something true instead: five things are needed, two are settled. Each step carries one of the five chart hues, because the status tones already mean something and Markets should not inherit the colour of an alert."
      >
        <WizardRail
          steps={[
            { id: "a", label: "Business", done: true, icon: BriefcaseIcon },
            { id: "b", label: "Situation", done: true, icon: MapPinIcon },
            { id: "c", label: "Company", done: true, tentative: true, icon: BuildingsIcon },
            { id: "d", label: "Goals", done: false, icon: TargetIcon },
            { id: "e", label: "Markets", done: false, icon: GlobeHemisphereWestIcon },
          ]}
          activeId="d"
        />
      </Case>

      <Case
        title="The timeline"
        note="Down the left, every question with its answer. The visitor is building a picture of what has been understood, and a conversation that scrolls itself away gives them nothing to check. Answered nodes are clickable: an answer can always be revisited."
      >
        <div className="max-w-xs">
          <QuestionTimeline
            onSelect={record}
            items={[
              { id: "1", question: "What are you building?", answer: "Brand identities for early-stage software companies.", state: "answered" },
              { id: "2", question: "Where are you today?", answer: "Three clients, invoiced personally, no company.", state: "answered" },
              { id: "3", question: "Do you already have a company?", state: "active" },
            ]}
          />
        </div>
      </Case>

      <Case title="Single choice" note="Picking IS the answer. A Continue button after a single choice adds a click carrying no information.">
        <QuestionCard card={SINGLE} onAnswer={record} accent={3} eyebrow="Company" />
      </Case>

      <Case title="Multiple selection" note="Needs a Continue, because the system cannot know when they are finished choosing.">
        <QuestionCard card={MULTI} onAnswer={record} accent={5} eyebrow="What you want" />
      </Case>

      <Case title="Free text with AI suggestions" note="Chips are a starting point, never a closed set. The dock below is always available.">
        <QuestionCard card={FREE} onAnswer={record} accent={1} eyebrow="Business" />
      </Case>

      <Case title="Confirm" note="When the system inferred something rather than being told. One click instead of a repeated question.">
        <QuestionCard card={CONFIRM} onAnswer={record} accent={5} eyebrow="Markets" />
      </Case>

      <Case title="Thinking" note="Opacity only. A spinner says the machine is busy; this says someone is considering what you said.">
        <div className="flex flex-col gap-6">
          <Thinking />
          <Thinking label="Building your plan" />
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
