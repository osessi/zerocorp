"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ArrowRightIcon, CheckIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import {
  ONBOARDING_STEPS,
  REVEAL_GROUPS,
  isListStep,
  type OnboardingState,
  type RevealGroup,
} from "@zerocorp/contracts";
import { Button, ButtonLink, PromptDock, SegmentedProgress, StatusBadge } from "@zerocorp/ui";
import { STEP_COPY, GROUP_COPY } from "./copy";
import { finishOnboarding, saveAnswer } from "./actions";

/**
 * Launch your business.
 *
 * One question on the screen at a time, with the microphone as the primary input: these
 * are questions people answer better out loud than in a textarea, and the schema has
 * carried `voice_transcript` since the first migration.
 *
 * Each answer is saved on submit, so the resume point is the record rather than a number
 * held in this component. Going back never discards what is ahead — that was settled in
 * the assessment and the reasoning is the same here: nothing a founder said is thrown
 * away because they wanted to re-read an earlier answer.
 */
export function Onboarding({ initial }: { initial: OnboardingState }) {
  const [state, setState] = useState(initial);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const answeredCount = ONBOARDING_STEPS.filter((s) => (state.answers[s] ?? []).length > 0).length;
  const firstUnanswered = ONBOARDING_STEPS.findIndex((s) => (state.answers[s] ?? []).length === 0);
  const [index, setIndex] = useState(firstUnanswered === -1 ? ONBOARDING_STEPS.length : firstUnanswered);

  const done = index >= ONBOARDING_STEPS.length;
  const step = done ? null : ONBOARDING_STEPS[index]!;
  const [draft, setDraft] = useState("");

  // Moving to a step re-loads whatever was said there, so revisiting is editing rather
  // than re-answering from a blank field.
  const existing = useMemo(
    () => (step ? (state.answers[step] ?? []).join("\n") : ""),
    [state.answers, step],
  );

  function goTo(next: number) {
    setError(null);
    setIndex(next);
    setDraft("");
  }

  function submit(text: string) {
    if (!step) return;
    setError(null);
    start(async () => {
      try {
        const next = await saveAnswer({ step, text });
        setState(next);
        setDraft("");
        setIndex((i) => i + 1);
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "That did not save. Try again.");
      }
    });
  }

  if (done) return <Reveal state={state} onEdit={goTo} />;

  const copy = STEP_COPY[step!];
  const Icon = copy.icon;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 sm:px-8">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-overline text-muted-foreground">Launch your business</span>
          <span className="text-caption text-muted-foreground font-mono tabular-nums">
            {index + 1} of {ONBOARDING_STEPS.length}
          </span>
        </div>
        <SegmentedProgress
          total={ONBOARDING_STEPS.length}
          completed={answeredCount}
          current={index}
          label={`Question ${index + 1} of ${ONBOARDING_STEPS.length}`}
        />
      </header>

      <div className="flex flex-col gap-5">
        <div className="flex items-start gap-4">
          <span className="border-primary text-primary flex size-10 shrink-0 items-center justify-center border">
            <Icon size={20} aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-2">
            <h1 className="text-h2">{copy.title}</h1>
            <p className="text-body text-muted-foreground">{copy.help}</p>
          </div>
        </div>

        {/*
          Why this question exists. Eight questions before anything is built is a lot to
          ask, and a founder who can see what each one is FOR keeps going.

          A full border, not a left bar: §21.27 refuses the thick-left-bar panel, and the
          CI rule caught this the first time it was written that way. The tint carries its
          own tone border, per the bare-tint rule in §4.5.
        */}
        <p className="border-processing bg-processing-subtle text-processing-ink text-body-sm border px-4 py-2.5">
          <SparkleIcon size={14} className="mr-1.5 inline" aria-hidden="true" />
          {copy.why}
        </p>

        <PromptDock
          key={step}
          value={draft || existing}
          onValueChange={setDraft}
          onSubmit={submit}
          disabled={pending}
          placeholder={copy.placeholder}
          hint={
            isListStep(step!)
              ? "One per line. Press the microphone and say them; each pause starts a new line."
              : "Press the microphone and answer out loud, or type."
          }
        />

        {error ? (
          <p className="text-body-sm text-destructive-ink" role="alert">
            {error}
          </p>
        ) : null}
      </div>

      <nav className="border-border flex items-center justify-between border-t pt-5">
        <Button onClick={() => goTo(Math.max(0, index - 1))} disabled={index === 0 || pending}>
          <ArrowLeftIcon size={16} aria-hidden="true" /> Back
        </Button>
        <span className="text-caption text-muted-foreground">
          {answeredCount === ONBOARDING_STEPS.length
            ? "Every question answered"
            : `${ONBOARDING_STEPS.length - answeredCount} left`}
        </span>
        <Button
          variant="primary"
          onClick={() => submit(draft || existing)}
          disabled={pending || (draft || existing).trim().length === 0}
        >
          {pending ? "Saving" : "Next"} <ArrowRightIcon size={16} aria-hidden="true" />
        </Button>
      </nav>
    </div>
  );
}

/**
 * The reveal.
 *
 * This is the screen that has to earn the price. It does one thing: show the founder,
 * in their own words, that something listened. Four groups, because four is what a
 * person takes in at a glance and because these are the four things they would check.
 *
 * Every line is editable in place — a reveal that cannot be corrected is a receipt, and
 * the first thing anyone does when shown a summary of themselves is fix one line of it.
 */
function Reveal({ state, onEdit }: { state: OnboardingState; onEdit: (i: number) => void }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function finish() {
    setError(null);
    start(async () => {
      try {
        await finishOnboarding();
        router.push("/dashboard");
      } catch (cause) {
        setError(cause instanceof Error ? cause.message : "That did not save.");
      }
    });
  }

  return (
    <div className="flex flex-col">
      <header className="bg-surface-focal text-surface-focal-foreground border-border border-b">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-5 py-8 sm:px-8">
          <span className="text-overline text-surface-focal-foreground/60">Launch your business</span>
          <h1 className="text-h1">Here is what we understood.</h1>
          <p className="text-body-lg text-surface-focal-foreground/70 max-w-prose">
            Everything ZeroCorp builds from here reads this. Change anything that is not right
            — it takes one click and it is worth doing now rather than after a website exists.
          </p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-5 py-8 sm:px-8">
        {(Object.keys(REVEAL_GROUPS) as RevealGroup[]).map((group) => {
          const g = GROUP_COPY[group];
          return (
            <section key={group} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <h2 className="text-h4">{g.title}</h2>
                <StatusBadge tone={g.tone}>Understood</StatusBadge>
              </div>

              <dl className="border-border border">
                {REVEAL_GROUPS[group].map((key) => {
                  const values = state.answers[key] ?? [];
                  const stepIndex = ONBOARDING_STEPS.indexOf(key);
                  return (
                    <div
                      key={key}
                      className="border-border hover:bg-accent flex flex-col gap-2 border-b px-5 py-4 last:border-b-0 sm:flex-row sm:items-start sm:gap-6"
                    >
                      <dt className="text-caption text-muted-foreground sm:w-48 sm:shrink-0">
                        {STEP_COPY[key].title}
                      </dt>
                      <dd className="m-0 flex min-w-0 flex-1 flex-col gap-1">
                        {values.length === 0 ? (
                          <span className="text-body-sm text-muted-foreground italic">Not answered</span>
                        ) : isListStep(key) ? (
                          <ul className="flex flex-col gap-1">
                            {values.map((v) => (
                              <li key={v} className="text-body-sm flex items-start gap-2">
                                <CheckIcon size={14} className="text-success mt-1 shrink-0" aria-hidden="true" />
                                {v}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-body-sm">{values[0]}</span>
                        )}
                      </dd>
                      <Button onClick={() => onEdit(stepIndex)} className="shrink-0">
                        Change
                      </Button>
                    </div>
                  );
                })}
              </dl>
            </section>
          );
        })}

        {error ? (
          <p className="text-body-sm text-destructive-ink" role="alert">
            {error}
          </p>
        ) : null}

        <div className="border-border flex flex-wrap items-center justify-between gap-4 border-t pt-6">
          <p className="text-body-sm text-muted-foreground max-w-prose">
            Confirming starts the build. ZeroCorp writes your brand, your site and your first
            articles from exactly what is above.
          </p>
          <div className="flex gap-2">
            <ButtonLink href="/dashboard">Later</ButtonLink>
            <Button variant="primary" onClick={finish} disabled={pending}>
              {pending ? "Starting" : "This is right — start building"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
