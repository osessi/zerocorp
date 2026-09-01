"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { ArrowUpIcon, MicrophoneIcon, StopIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "../cx";
import { useSpeech } from "./useSpeech";

/**
 * The prompt dock.
 *
 * Always present, even on a choice question — D18. "None of these" and "skip to the
 * plan" are things a person says to an interlocutor and cannot say to a form, and the
 * absence of that escape hatch is exactly what makes a wizard feel like paperwork.
 *
 * The send button MORPHS rather than multiplying: microphone when there is nothing to
 * send, arrow when there is. Two buttons where one will do makes the visitor choose
 * between them every time.
 *
 * The structure is borrowed from a familiar AI composer; none of the styling is. Radius
 * stays 0, the icons are Phosphor and the border is `--input`, because a rounded dock in
 * an interface built from right angles is noticed immediately and not favourably.
 */
export interface PromptDockProps {
  onSubmit: (text: string) => void;
  placeholder?: string;
  disabled?: boolean;
  /** Shown above the field. Used to say "or answer in your own words". */
  hint?: string;
  value?: string;
  onValueChange?: (value: string) => void;
}

export function PromptDock({ onSubmit, placeholder, disabled, hint, value, onValueChange }: PromptDockProps) {
  const [internal, setInternal] = useState("");
  const text = value ?? internal;
  const setText = onValueChange ?? setInternal;

  const textarea = useRef<HTMLTextAreaElement>(null);
  const speech = useSpeech({ onTranscript: (t) => setText(text ? `${text} ${t}` : t) });

  // Grow with the content, to a ceiling. A field that grows without limit pushes the
  // question it belongs to off the screen.
  useEffect(() => {
    const node = textarea.current;
    if (!node) return;
    node.style.height = "auto";
    node.style.height = `${Math.min(node.scrollHeight, 200)}px`;
  }, [text]);

  const ready = text.trim().length > 0;

  function submit() {
    if (!ready || disabled) return;
    onSubmit(text.trim());
    setText("");
  }

  function onKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    // Enter sends, shift+Enter breaks the line. The opposite surprises everyone who has
    // used a chat interface, which is everyone.
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {hint ? <p className="text-caption text-muted-foreground px-1">{hint}</p> : null}

      <div
        className={cx(
          "border-input focus-within:outline-ring flex flex-col border bg-background",
          "transition-[color,background-color,border-color] duration-normal ease-out",
          "focus-within:outline-2 focus-within:outline-offset-2",
          speech.state === "listening" && "border-processing",
        )}
      >
        <textarea
          ref={textarea}
          rows={1}
          value={text}
          disabled={disabled}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder={speech.state === "listening" ? "Listening…" : (placeholder ?? "Say it in your own words…")}
          aria-label="Your answer"
          className={cx(
            "text-body placeholder:text-muted-foreground w-full resize-none bg-transparent px-4 pt-3 pb-1",
            "focus:outline-hidden disabled:cursor-not-allowed disabled:opacity-60",
          )}
        />

        <div className="flex items-center justify-between px-2 pb-2">
          {speech.state === "listening" || speech.state === "transcribed" ? (
            <span className="text-caption text-processing-ink zc-enter-fade px-2">
              {speech.state === "listening" ? "Listening" : "Edit it if it misheard you"}
            </span>
          ) : (
            <span />
          )}

          <div className="flex items-center gap-1">
            {speech.supported ? (
              <button
                type="button"
                disabled={disabled}
                onClick={speech.toggle}
                aria-label={speech.state === "listening" ? "Stop recording" : "Answer with your voice"}
                aria-pressed={speech.state === "listening"}
                className={cx(
                  "flex size-9 items-center justify-center transition-[color,background-color,border-color] duration-normal ease-out",
                  "focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                  speech.state === "listening"
                    ? "bg-processing text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent",
                )}
              >
                {speech.state === "listening" ? <StopIcon size={20} /> : <MicrophoneIcon size={20} />}
              </button>
            ) : null}

            <button
              type="button"
              disabled={!ready || disabled}
              onClick={submit}
              aria-label="Send"
              className={cx(
                "flex size-9 items-center justify-center transition-[color,background-color,border-color] duration-normal ease-out",
                "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                ready
                  ? "bg-primary text-primary-foreground hover:bg-primary-hover"
                  : "text-muted-foreground cursor-not-allowed opacity-50",
              )}
            >
              <ArrowUpIcon size={20} weight="regular" />
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
