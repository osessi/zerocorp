"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  KeyboardIcon,
  ListChecksIcon,
  MicrophoneIcon,
  SparkleIcon,
  StopIcon,
} from "@phosphor-icons/react/dist/ssr";
import { ONBOARDING_STEPS } from "@zerocorp/contracts";
import { AudioVisualizer, Button, cx, useSpeech } from "@zerocorp/ui";
import { STEP_COPY } from "./copy";
import { extractFromTranscript } from "./actions";

/**
 * The voice path, and the reason the interview exists in this shape.
 *
 * People describe their own business far better out loud than in form fields. Asked to
 * type "what is your positioning", a founder writes something careful and generic. Asked
 * to say it, they say the true thing in their own words — which is what every generator
 * downstream needs, because it is the voice the writing has to sound like.
 *
 * So: one recording, an agent fills the eight fields, and the founder corrects a form
 * that is already full. Correcting is a far smaller ask than composing, and it is the
 * difference between finishing onboarding and abandoning it.
 *
 * ── What this screen has to do ────────────────────────────────────────────────────
 *
 * The first version was a round button on a white page with a line of grey text under
 * it, which is a form that happens to have a microphone. This is not a form. It is the
 * one minute in the product where a person talks and something listens.
 *
 * The second version answered that by painting the whole thing on --surface-focal, which
 * was not asked for and was wrong: the product is in light mode, and a screen that turns
 * black for one step reads as a different application. Weight has to come from what is
 * ON the page, not from repainting the page. Everything here exists to answer the three
 * questions a person actually has while recording:
 *
 *   IS IT HEARING ME     the visualiser is driven by the real microphone, not a loop
 *   WHAT DID IT GET      the transcript is live, large and editable
 *   WHEN CAN I STOP      the eight things being filled, and a threshold that says "enough"
 *
 * Typing is the fallback, never the default. One click away and clearly offered, because
 * dictation is impossible in an open-plan office and some people simply hate it.
 */

/** Below this a transcript has not said enough for extraction to be worth running. */
const ENOUGH = 220;

export function Talk({ onExtracted, onSkip }: { onExtracted: (heard: string[]) => void; onSkip: () => void }) {
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);

  const speech = useSpeech({
    onTranscript: (t) => setText((prev) => (prev ? `${prev} ${t}` : t)),
  });
  const listening = speech.state === "listening";
  const enough = text.trim().length >= 20;
  const progress = Math.min(1, text.trim().length / ENOUGH);

  // A clock, so "how long have I been talking" is answerable without guessing. It runs
  // only while recording and resets nothing when paused — the total is what matters.
  useEffect(() => {
    if (!listening) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [listening]);

  // The transcript grows under the cursor while the browser is still recognising, so it
  // has to follow. Scrolling back up by hand mid-sentence is not something anyone does.
  const transcript = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    if (listening && transcript.current) transcript.current.scrollTop = transcript.current.scrollHeight;
  }, [text, listening]);

  function send() {
    if (!enough) return;
    if (listening) speech.stop();
    setError(null);
    start(async () => {
      try {
        const { heard } = await extractFromTranscript(text.trim());
        onExtracted(heard);
      } catch {
        setError("That did not go through. Your words are still here. Try again.");
      }
    });
  }

  if (pending) {
    return (
      <div className="flex min-h-full flex-col items-center justify-center gap-8 px-5 py-24">
        <AudioVisualizer
          variant="aura"
          state="thinking"
          size="lg"
          color="--primary"
          label="Reading what you said"
          className="max-w-md"
        />
        <div className="flex flex-col items-center gap-3 text-center">
          <h2 className="text-h2">Reading what you said.</h2>
          <p className="text-body text-muted-foreground max-w-prose">
            Pulling out the eight things ZeroCorp needs. Anything it did not hear, it will ask for
            rather than guess.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col items-center gap-10 px-5 py-12 sm:px-8">
      {/*
        Centred on the workspace, one column, everything on the axis.

        The previous version pushed the brief and the length meter into a 20rem rail on
        the right, where they sat marginal to a screen that has exactly one thing to do.
        A rail is for navigation. This screen has no navigation, it has a microphone and
        two notes about it, and those belong under the thing they annotate.
      */}
      <header className="flex flex-col items-center gap-3 text-center">
        <span className="text-overline text-muted-foreground">Tell us about your business</span>
        <h1 className="text-display-l text-balance">Just talk for a minute.</h1>
        <p className="text-body-lg text-muted-foreground max-w-prose">
          What you do, who you do it for, and why they pick you. Ramble. It is easier to
          correct a form that is already full than to fill an empty one.
        </p>
      </header>

      {!typing ? (
        <div className="flex flex-col items-center gap-5">
          {/*
            The visualiser IS the control.

            It was a 80px square button under a canvas, which is a slab: two objects for
            one action, the larger of them inert. Pressing the thing that reacts to your
            voice is the obvious gesture, and it leaves one object on the axis instead of
            two stacked ones.

            Round, which is the one place §7 bends. The radius scale is 0 by default and
            2 to 4px where a control truly needs it; a record control is the case the
            exception exists for, and it was round here before this rework touched it.

            Driven by the real microphone. A looping animation while recording is a lie
            with a nice curve on it: it looks identical whether the browser is hearing a
            voice or a muted input, which is the one thing a person is watching it to
            find out.
          */}
          <button
            type="button"
            onClick={() => (listening ? speech.stop() : speech.start())}
            disabled={!speech.supported}
            aria-label={listening ? "Stop recording" : "Start recording"}
            className={cx(
              "group focus-visible:outline-ring duration-glide ease-glide relative flex size-64 items-center justify-center rounded-full transition-transform focus-visible:outline-2 focus-visible:outline-offset-4",
              speech.supported ? "motion-safe:hover:scale-[1.02]" : "cursor-not-allowed opacity-50",
            )}
          >
            <AudioVisualizer
              variant="aura"
              state={listening ? "listening" : "idle"}
              size="xl"
              color={listening ? "--destructive" : "--primary"}
              barCount={32}
              lineWidth={2}
              label={listening ? "Your voice, live" : "Not recording"}
              className="absolute inset-0 h-full w-full"
            />
            <span
              className={cx(
                "duration-glide ease-glide relative flex size-14 items-center justify-center rounded-full transition-[background-color,color]",
                listening
                  ? "bg-destructive text-destructive-foreground"
                  : "bg-primary text-primary-foreground",
              )}
            >
              {listening ? <StopIcon size={24} weight="fill" /> : <MicrophoneIcon size={24} weight="fill" />}
            </span>
          </button>

          <div className="flex flex-col items-center gap-1.5">
            {/* The clock, in mono so the digits do not shuffle as they change. */}
            <span className="text-h2 text-foreground font-mono tabular-nums">
              {String(Math.floor(seconds / 60)).padStart(2, "0")}:
              {String(seconds % 60).padStart(2, "0")}
            </span>
            <p className="text-body-sm text-muted-foreground" aria-live="polite">
              {!speech.supported
                ? "This browser cannot listen. Type instead, it works just as well."
                : listening
                  ? "Listening. Take your time, pauses are fine."
                  : text
                    ? "Paused. Press again to add more."
                    : "Press to start."}
            </p>
          </div>
        </div>
      ) : null}

      {/* What was heard, always visible and always editable. A transcript the founder
          cannot see or fix is a black box at the most important moment in the product. */}
      {text || typing ? (
        <div className="border-border flex w-full flex-col border">
              <div className="border-border flex items-center gap-4 border-b px-4 py-2.5">
                <label htmlFor="transcript" className="text-caption text-muted-foreground">
                  {typing ? "In your own words" : "What we heard"}
                </label>
                {/* A second reading of the same signal, doing a different job: the aura
                    says "something is there", this says "it is coming in right now". */}
                <AudioVisualizer
                  variant="bar"
                  state={listening ? "listening" : "idle"}
                  size="sm"
                  color="--primary"
                  barCount={20}
                  label=""
                  className="h-6 w-24 shrink-0"
                />
                <span className="text-caption text-muted-foreground ml-auto font-mono tabular-nums">
                  {text.trim().split(/\s+/).filter(Boolean).length} words
                </span>
              </div>
              <textarea
                ref={transcript}
                id="transcript"
                value={text}
                onChange={(e) => setText(e.target.value)}
                rows={7}
                placeholder="I design brand identities for early-stage software companies. Mostly seed-stage teams rebranding before a launch. They pick me because I have shipped forty of these and I know what breaks…"
                className="text-body-lg placeholder:text-muted-foreground focus-visible:outline-ring w-full resize-y bg-transparent p-4 leading-relaxed focus-visible:outline-2 focus-visible:-outline-offset-2"
              />
        </div>
      ) : null}

      {error ? (
        <p className="text-body-sm text-destructive-ink" role="alert">
          {error}
        </p>
      ) : null}

      <div className="flex w-full flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {!typing ? (
            <Button onClick={() => setTyping(true)}>
              <KeyboardIcon size={16} aria-hidden="true" /> Type instead
            </Button>
          ) : null}
          <Button onClick={onSkip}>
            <ListChecksIcon size={16} aria-hidden="true" /> Answer one at a time
          </Button>
        </div>
        <Button variant="primary" onClick={send} disabled={!enough}>
          <SparkleIcon size={16} aria-hidden="true" /> Understand this
        </Button>
      </div>

      {/* ── What the minute is for, UNDER the thing it annotates ─────────────── */}
      <div className="grid w-full gap-3 sm:grid-cols-2">
          {/*
            The eight fields, named.

            Not a progress checklist. Nothing here can honestly tick until the model has
            read the transcript, and a list that ticks on keyword presence would be
            guessing out loud. It is a brief: these are the things worth covering, so a
            founder who dries up after two sentences has somewhere to look.
          */}
          <div className="border-border bg-surface-sunken flex flex-col gap-4 border p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-label">What this fills in</h2>
              <span className="text-caption text-muted-foreground font-mono tabular-nums">
                {ONBOARDING_STEPS.length}
              </span>
            </div>
            <ul className="flex flex-col gap-2.5">
              {ONBOARDING_STEPS.map((key) => {
                const Icon = STEP_COPY[key].icon;
                return (
                  <li key={key} className="flex items-start gap-2.5">
                    <Icon
                      size={16}
                      className="text-primary mt-0.5 shrink-0"
                      aria-hidden="true"
                    />
                    <span className="text-body-sm text-foreground min-w-0">
                      {STEP_COPY[key].title}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-caption text-muted-foreground">
              Anything ZeroCorp does not hear, it asks for rather than guesses.
            </p>
          </div>

          {/*
            Enough to work with.

            A founder recording into a void has no way to know when to stop, so they
            either stop too early or keep going long past the point of diminishing return.
            The threshold is the length below which extraction is not worth running, said
            plainly rather than enforced silently by a disabled button.
          */}
          <div className="border-border flex flex-col gap-3 border p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h2 className="text-label">Enough to work with</h2>
              <span className="text-caption text-muted-foreground font-mono tabular-nums">
                {Math.round(progress * 100)}%
              </span>
            </div>
            <div
              className="bg-muted h-1.5 w-full"
              role="progressbar"
              aria-valuenow={Math.round(progress * 100)}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-label="Transcript length against what extraction needs"
            >
              <div
                className={cx(
                  "duration-glide ease-glide h-full transition-[width]",
                  progress >= 1 ? "bg-success" : "bg-primary",
                )}
                style={{ width: `${progress * 100}%` }}
              />
            </div>
            <p className="text-caption text-muted-foreground">
              {progress >= 1
                ? "That is plenty. Keep going if you want to, or read it back."
                : "About a minute of talking. Shorter works, it just leaves more to correct."}
            </p>
          </div>
      </div>
    </div>
  );
}
