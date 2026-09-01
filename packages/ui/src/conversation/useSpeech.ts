"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Voice answers, using the browser's own recogniser.
 *
 * ADR 0002 measured a batch transcription API at $0.025 to $0.043 per assessment, which
 * is comparable to the model call itself and doubles the cost of a visitor who was never
 * going to convert. The free tier therefore uses what the browser already has, and the
 * paid deep onboarding uses the batch API behind AITranscriptionProvider.
 *
 * Two honesty rules, both load-bearing:
 *
 *   - Where the API does not exist, `supported` is false and the caller renders NO
 *     microphone. A control that appears and then fails is worse than one that never
 *     appeared.
 *   - Where it does exist, the browser's own permission prompt is the disclosure, and
 *     it arrives at the moment it matters rather than as standing small print.
 *
 * The transcript is always editable before it is sent. Recognition mishears, and a
 * founder should never have to fight an interface to correct their own words.
 */

interface RecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: ((event: { error?: string }) => void) | null;
  onend: (() => void) | null;
}

function constructorFor(): (new () => RecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]) as (new () => RecognitionLike) | null;
}

export type SpeechState = "idle" | "listening" | "transcribed" | "error";

export function useSpeech(options: { lang?: string; onTranscript: (text: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [state, setState] = useState<SpeechState>("idle");
  const recognition = useRef<RecognitionLike | null>(null);
  const onTranscript = useRef(options.onTranscript);
  onTranscript.current = options.onTranscript;

  // After mount: the server has no window, and rendering a microphone then removing it
  // flashes a capability that may not exist.
  useEffect(() => setSupported(constructorFor() !== null), []);

  useEffect(() => () => recognition.current?.stop(), []);

  const stop = useCallback(() => {
    recognition.current?.stop();
    recognition.current = null;
    setState((s) => (s === "listening" ? "idle" : s));
  }, []);

  const start = useCallback(() => {
    const Recognition = constructorFor();
    if (!Recognition) return;

    const instance = new Recognition();
    instance.continuous = true;
    instance.interimResults = false;
    instance.lang = options.lang ?? "en-US";

    instance.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) text += event.results[i]?.[0]?.transcript ?? "";
      const trimmed = text.trim();
      if (trimmed) {
        onTranscript.current(trimmed);
        setState("transcribed");
      }
    };
    // A denied microphone permission is the common case, and it is not an application
    // error. The dock falls back to typing without saying anything alarming.
    instance.onerror = () => setState("error");
    instance.onend = () => setState((s) => (s === "listening" ? "idle" : s));

    recognition.current = instance;
    instance.start();
    setState("listening");
  }, [options.lang]);

  return { supported, state, start, stop, toggle: () => (state === "listening" ? stop() : start()) };
}
