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
import { Button, ButtonLink, ENTER, PromptDock, REVEAL_MS, SegmentedProgress, StatusBadge, cx, staggerStyle } from "@zerocorp/ui";
import { STEP_COPY, GROUP_COPY } from "./copy";
import { Talk } from "./Talk";
import { finishOnboarding, saveAnswer } from "./actions";

/**
 * Tell us about your business.
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
  const router = useRouter();
  const [state, setState] = useState(initial);
  // Voice first. A founder who has already answered something is resuming, so the
  // recording screen would be asking them to start over.
  const anyAnswered = ONBOARDING_STEPS.some((s) => (initial.answers[s] ?? []).length > 0);
  const [phase, setPhase] = useState<"talk" | "form">(anyAnswered ? "form" : "talk");
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

  if (phase === "talk") {
    return (
      <Talk
        onExtracted={() => {
          // Straight to the reveal. The whole point of talking was to arrive at a form
          // that is already full; stepping through eight questions afterwards would
          // throw away what was just gained.
          router.refresh();
          setPhase("form");
          setIndex(ONBOARDING_STEPS.length);
        }}
        onSkip={() => {
          setPhase("form");
          setIndex(0);
        }}
      />
    );
  }

  if (done) return <Reveal state={state} onEdit={goTo} />;

  const copy = STEP_COPY[step!];
  const Icon = copy.icon;

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 px-5 py-10 sm:px-8">
      <header className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-4">
          <span className="text-overline text-muted-foreground">Tell us about your business</span>
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
    /*
      The reveal.

      The one screen in the product allowed to be slow. Everything before it was the
      founder doing work; this is the product showing it was listening, and a founder
      watching their own business appear line by line is the moment the price stops
      feeling like a gamble.

      Full bleed on --surface-focal rather than a panel inside a page: this is not a
      section of a screen, it IS the screen. The groups reveal in sequence at 90ms apart
      — slow enough to read as arriving, fast enough that nobody waits.
    */
    <div className="bg-surface-focal text-surface-focal-foreground flex min-h-full flex-col">
      <header className="border-surface-focal-foreground/15 border-b">
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-3 px-5 py-12 sm:px-8">
          <span className="text-overline text-surface-focal-foreground/60">Tell us about your business</span>
          <h1 className={cx("text-display-l", ENTER)}>Here is what we understood.</h1>
          <p className={cx("text-body-lg text-surface-focal-foreground/70 max-w-prose", ENTER)} style={staggerStyle(1, 8, REVEAL_MS)}>
            Everything ZeroCorp builds reads this. Change anything that is not right — one click,
            and far cheaper now than after a website exists.
          </p>
        </div>
      </header>

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 px-5 py-10 sm:px-8">
        {(Object.keys(REVEAL_GROUPS) as RevealGroup[]).map((group, gi) => {
          const g = GROUP_COPY[group];
          const filled = REVEAL_GROUPS[group].every((k) => (state.answers[k] ?? []).length > 0);
          return (
            <section
              key={group}
              className={cx("flex flex-col gap-3", ENTER)}
              /* 90ms apart. REVEAL_MS, not the 40ms option stagger: options are a list
                 you are about to scan, this is the product settling one line at a time,
                 which is what says it was worked out rather than fetched. */
              style={staggerStyle(gi + 2, 8, REVEAL_MS)}
            >
              <div className="flex items-center gap-3">
                <h2 className="text-h4">{g.title}</h2>
                {/* Honest per group. A group ZeroCorp did not hear says so and asks,
                    rather than presenting an empty line as understood. */}
                {filled ? (
                  <StatusBadge tone={g.tone}>Understood</StatusBadge>
                ) : (
                  <StatusBadge tone="warning">Needs a word from you</StatusBadge>
                )}
              </div>

              <dl className="flex flex-col gap-2">
                {REVEAL_GROUPS[group].map((key) => {
                  const values = state.answers[key] ?? [];
                  const stepIndex = ONBOARDING_STEPS.indexOf(key);
                  return (
                    <div
                      key={key}
                      className="border-surface-focal-foreground/15 bg-surface-focal-foreground/[0.03] hover:bg-surface-focal-foreground/[0.06] flex flex-col gap-2 border px-5 py-4 transition-[background-color] duration-normal sm:flex-row sm:items-start sm:gap-6"
                    >
                      <dt className="text-caption text-surface-focal-foreground/55 sm:w-48 sm:shrink-0">
                        {STEP_COPY[key].title}
                      </dt>
                      {/*
                        On the focal block the MARK is the readable step: 11.66:1 on
                        --surface-focal. --warning is the dark step of the same ramp, for
                        edges on a light ground, and reaches only 4.37 here.
                      */}
                      <dd className="m-0 flex min-w-0 flex-1 flex-col gap-1">
                        {values.length === 0 ? (
                          <span className="text-accent-highlight text-body-sm">Tell us this one</span>
                        ) : isListStep(key) ? (
                          <ul className="flex flex-col gap-1">
                            {values.map((v) => (
                              <li key={v} className="text-body-sm flex items-start gap-2">
                                <CheckIcon size={14} className="text-primary-emphasis mt-1 shrink-0" aria-hidden="true" />
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

        <div className="border-surface-focal-foreground/15 flex flex-wrap items-center justify-between gap-4 border-t pt-8 pb-4">
          <p className="text-body-sm text-surface-focal-foreground/70 max-w-prose">
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
