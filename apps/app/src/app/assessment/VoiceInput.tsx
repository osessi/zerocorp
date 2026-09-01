"use client";

import { useEffect, useRef, useState } from "react";
import { MicrophoneIcon, StopIcon } from "@phosphor-icons/react/dist/ssr";
import { IconButton } from "@zerocorp/ui";

/**
 * Optional voice answer.
 *
 * Uses the browser's own SpeechRecognition where it exists. That keeps the free tier
 * free: ADR 0002 measured a batch transcription API at roughly $0.025 to $0.043 per
 * assessment, which is comparable to the model call itself and doubles the cost of a
 * visitor who was never going to convert.
 *
 * Two things this is honest about, because both matter:
 *
 *   - It is not available in every browser. Where it is missing the control does not
 *     render at all, rather than appearing and failing.
 *   - Where it exists, some browsers send the audio to the vendor's servers. The label
 *     says so. A visitor dictating their business plan deserves to know where it goes.
 *
 * The production path for the paid deep onboarding is a batch API behind
 * AITranscriptionProvider. This is the free tier's path, and it is deliberately cheaper
 * and weaker.
 */

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
}

function recognitionConstructor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w["SpeechRecognition"] ?? w["webkitSpeechRecognition"]) as (new () => SpeechRecognitionLike) | null;
}

export function VoiceInput({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recognition = useRef<SpeechRecognitionLike | null>(null);

  // Checked after mount: the server has no window, and rendering the control then
  // removing it would flash a capability that may not exist.
  useEffect(() => setSupported(recognitionConstructor() !== null), []);

  function toggle() {
    if (listening) {
      recognition.current?.stop();
      return;
    }
    const Recognition = recognitionConstructor();
    if (!Recognition) return;

    const instance = new Recognition();
    instance.continuous = true;
    instance.interimResults = false;
    instance.lang = "en-US";
    instance.onresult = (event) => {
      let text = "";
      for (let i = 0; i < event.results.length; i += 1) {
        text += event.results[i]?.[0]?.transcript ?? "";
      }
      onTranscript(text.trim());
    };
    instance.onerror = () => setListening(false);
    instance.onend = () => setListening(false);

    recognition.current = instance;
    instance.start();
    setListening(true);
  }

  if (!supported) return null;

  return (
    <div className="flex items-center gap-3 pt-3">
      <IconButton
        icon={listening ? StopIcon : MicrophoneIcon}
        label={listening ? "Stop recording" : "Answer with your voice"}
        variant={listening ? "danger" : "tertiary"}
        onClick={toggle}
      />
      <span className="text-caption text-muted-foreground">
        {listening
          ? "Listening. Speak naturally, then stop."
          : "Or answer out loud. Your browser does the transcription, and some send the audio to their own servers."}
      </span>
    </div>
  );
}
