"use client";

import { useState, useTransition } from "react";
import { MicrophoneIcon, StopIcon, KeyboardIcon, SparkleIcon } from "@phosphor-icons/react/dist/ssr";
import { Button, Thinking, cx, useSpeech } from "@zerocorp/ui";
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
 * Typing is the fallback, never the default. It is one click away and clearly offered,
 * because dictation is impossible in an open-plan office and some people simply hate it.
 */
export function Talk({ onExtracted, onSkip }: { onExtracted: (heard: string[]) => void; onSkip: () => void }) {
  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const speech = useSpeech({
    onTranscript: (t) => setText((prev) => (prev ? `${prev} ${t}` : t)),
  });
  const listening = speech.state === "listening";
  const enough = text.trim().length >= 20;

  function send() {
    if (!enough) return;
    if (listening) speech.stop();
    setError(null);
    start(async () => {
      try {
        const { heard } = await extractFromTranscript(text.trim());
        onExtracted(heard);
      } catch {
        setError("That did not go through. Your words are still here — try again.");
      }
    });
  }

  if (pending) {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-col items-center gap-6 px-5 py-24">
        <Thinking label="Reading what you said" />
        <p className="text-body text-muted-foreground max-w-prose text-center">
          Pulling out the eight things ZeroCorp needs. Anything it did not hear, it will ask for
          rather than guess.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-5 py-12 sm:px-8">
      <header className="flex flex-col gap-3 text-center">
        <span className="text-overline text-muted-foreground">Tell us about your business</span>
        <h1 className="text-h1">Just talk for a minute.</h1>
        <p className="text-body-lg text-muted-foreground mx-auto max-w-prose">
          What you do, who you do it for, and why they pick you. Ramble — it is easier to
          correct a form that is already full than to fill an empty one.
        </p>
      </header>

      {!typing ? (
        <div className="flex flex-col items-center gap-5">
          <button
            type="button"
            onClick={() => (listening ? speech.stop() : speech.start())}
            disabled={!speech.supported}
            aria-label={listening ? "Stop recording" : "Start recording"}
            className={cx(
              "focus-visible:outline-ring flex size-24 items-center justify-center rounded-full border-2 transition-[background-color,border-color] duration-normal ease-out focus-visible:outline-2 focus-visible:outline-offset-4",
              listening
                ? "border-destructive bg-destructive-subtle text-destructive-ink motion-safe:animate-pulse"
                : "border-processing bg-processing-subtle text-processing-ink hover:bg-accent",
              !speech.supported && "cursor-not-allowed opacity-50",
            )}
          >
            {listening ? <StopIcon size={34} weight="fill" /> : <MicrophoneIcon size={34} />}
          </button>

          <p className="text-body-sm text-muted-foreground" aria-live="polite">
            {!speech.supported
              ? "This browser cannot listen. Type instead — it works just as well."
              : listening
                ? "Listening. Take your time; pauses are fine."
                : text
                  ? "Paused. Press again to add more."
                  : "Press to start."}
          </p>
        </div>
      ) : null}

      {/* What was heard, always visible and always editable. A transcript the founder
          cannot see or fix is a black box at the most important moment in the product. */}
      {text || typing ? (
        <div className="flex flex-col gap-2">
          <label htmlFor="transcript" className="text-caption text-muted-foreground">
            {typing ? "In your own words" : "What we heard"}
          </label>
          <textarea
            id="transcript"
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={8}
            placeholder="I design brand identities for early-stage software companies. Mostly seed-stage teams rebranding before a launch. They pick me because I have shipped forty of these and I know what breaks…"
            className="border-input bg-surface text-body focus-visible:outline-ring w-full resize-y border p-4 focus-visible:outline-2 focus-visible:outline-offset-2"
          />
        </div>
      ) : null}

      {error ? (
        <p className="text-body-sm text-destructive-ink" role="alert">
          {error}
        </p>
      ) : null}

      <div className="border-border flex flex-wrap items-center justify-between gap-3 border-t pt-6">
        <div className="flex gap-2">
          {!typing ? (
            <Button onClick={() => setTyping(true)}>
              <KeyboardIcon size={16} aria-hidden="true" /> Type instead
            </Button>
          ) : null}
          <Button onClick={onSkip}>Answer one at a time</Button>
        </div>
        <Button variant="primary" onClick={send} disabled={!enough}>
          <SparkleIcon size={16} aria-hidden="true" /> Understand this
        </Button>
      </div>
    </div>
  );
}
