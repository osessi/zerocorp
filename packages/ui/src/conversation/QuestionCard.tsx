"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowRightIcon, CheckIcon, PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import type { QuestionCard as Card, QuestionOption } from "@zerocorp/contracts";
import { Button } from "../button/index";
import { cx } from "../cx";
import { ACCENT_EDGE, ACCENT_EDGE_HOVER, ACCENT_FILL, ACCENT_RULE, ACCENT_TEXT, type AccentIndex } from "./accent";
import { ENTER, staggerStyle } from "./motion";

/**
 * The active question.
 *
 * Renders exactly four shapes, because the contract defines exactly four. A fifth would
 * be a design decision, so there is nowhere for one to appear from.
 *
 * Every shape follows the same rhythm — question, one line of help, then the control —
 * so a founder learns the layout once. What changes between them is the control, not
 * the page.
 */

export interface QuestionCardProps {
  card: Card;
  /** Called with the answer as the visitor would have written it. */
  onAnswer: (answer: string, values?: string[]) => void;
  disabled?: boolean | undefined;
  /**
   * Which of the five step colours this question belongs to. The same hue is on its
   * node in the rail and on its node in the timeline, so the three agree without any
   * of them having to say so.
   */
  accent?: AccentIndex;
  /** The step label, shown above the question. */
  eyebrow?: string;
}

/**
 * An option button.
 *
 * `--input` at rest, the step's accent on hover and on selection. The border does the
 * work rather than a fill: five coloured options competing for attention is a menu, not
 * a question, and a filled chip among unfilled ones reads as a status.
 */
function OptionButton({
  option,
  selected,
  onClick,
  disabled,
  index,
  multiple,
  accent,
}: {
  option: QuestionOption;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean | undefined;
  index: number;
  multiple: boolean;
  accent: AccentIndex;
}) {
  return (
    <button
      type="button"
      role={multiple ? "checkbox" : "radio"}
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      style={staggerStyle(index)}
      className={cx(
        ENTER,
        "group flex min-h-11 items-center gap-3 border px-4 py-2.5 text-left",
        "transition-[color,background-color,border-color] duration-normal ease-out",
        "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        // The accent lands on selection and on hover. At rest every option is neutral,
        // because five coloured options competing for attention is a menu, not a question.
        selected
          ? cx(ACCENT_EDGE[accent], "bg-accent text-foreground")
          : cx("border-input text-foreground", ACCENT_EDGE_HOVER[accent]),
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "flex size-4 shrink-0 items-center justify-center border transition-[color,background-color,border-color] duration-normal ease-out",
          multiple ? "" : "rounded-full",
          selected ? cx(ACCENT_FILL[accent], ACCENT_EDGE[accent], "zc-pop") : "border-input text-transparent",
        )}
      >
        <CheckIcon size={12} weight="bold" />
      </span>
      <span className="flex min-w-0 flex-col">
        <span className="text-body-sm">{option.label}</span>
        {option.hint ? <span className="text-caption text-muted-foreground">{option.hint}</span> : null}
      </span>
    </button>
  );
}

function Heading({ card, accent, eyebrow }: { card: Card; accent: AccentIndex; eyebrow?: string }) {
  return (
    <div className={cx(ENTER, "flex flex-col gap-2")}>
      {eyebrow ? <p className={cx("text-overline", ACCENT_TEXT[accent])}>{eyebrow}</p> : null}
      <div className="flex flex-col gap-3">
        <h2 className="text-h2 text-balance">{card.question}</h2>
        {/*
          Drawn once, left to right, as the question arrives.

          Full width rather than a stub. A twelve-unit dash under a two-line heading
          reads as a bullet someone forgot to finish; a rule the width of the question
          reads as the question being underlined, which is the thing being said: this is
          the one you are answering now.
        */}
        <span
          aria-hidden="true"
          className={cx("zc-underline h-0.5 w-full origin-left", ACCENT_RULE[accent])}
        />
      </div>
      {card.kind !== "confirm" && card.help ? (
        <p className="text-body-sm text-muted-foreground max-w-prose">{card.help}</p>
      ) : null}
    </div>
  );
}

/**
 * How long a single choice stays lit before it submits.
 *
 * A single choice IS the answer, so a Continue button after it adds a click carrying no
 * information. But submitting on the same frame as the click means the visitor never
 * sees their own choice register, and an interface that moves before acknowledging you
 * feels like it stopped listening. The pause is long enough to see the mark land and
 * short enough that nobody waits for it.
 */
const CONFIRM_MS = 260;

export function QuestionCard({ card, onAnswer, disabled, accent = 1, eyebrow }: QuestionCardProps) {
  const [selected, setSelected] = useState<string[]>([]);
  const [committing, setCommitting] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // A card that is replaced mid-confirmation must not fire its old answer into the new
  // question.
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  function chooseOne(value: string, label: string) {
    if (committing || disabled) return;
    setSelected([value]);
    setCommitting(true);
    timer.current = setTimeout(() => onAnswer(label, [value]), CONFIRM_MS);
  }

  if (card.kind === "single_choice") {
    return (
      <div className="flex flex-col gap-8">
        <Heading card={card} accent={accent} {...(eyebrow ? { eyebrow } : {})} />
        <div className="flex flex-col gap-2" role="radiogroup" aria-label={card.question}>
          {card.options.map((option, i) => (
            <OptionButton
              key={option.value}
              option={option}
              index={i}
              multiple={false}
              accent={accent}
              selected={selected.includes(option.value)}
              disabled={disabled || (committing && !selected.includes(option.value))}
              onClick={() => chooseOne(option.value, option.label)}
            />
          ))}
        </div>
      </div>
    );
  }

  if (card.kind === "multi_choice") {
    const enough = selected.length >= card.min;
    return (
      <div className="flex flex-col gap-8">
        <Heading card={card} accent={accent} {...(eyebrow ? { eyebrow } : {})} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label={card.question}>
          {card.options.map((option, i) => (
            <OptionButton
              key={option.value}
              option={option}
              index={i}
              multiple
              accent={accent}
              selected={selected.includes(option.value)}
              disabled={disabled || (!selected.includes(option.value) && selected.length >= card.max)}
              onClick={() =>
                setSelected((current) =>
                  current.includes(option.value)
                    ? current.filter((v) => v !== option.value)
                    : [...current, option.value],
                )
              }
            />
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Button
            variant="primary"
            icon={ArrowRightIcon}
            iconPosition="end"
            disabled={!enough || disabled}
            onClick={() =>
              onAnswer(
                card.options.filter((o) => selected.includes(o.value)).map((o) => o.label).join(", "),
                selected,
              )
            }
          >
            Continue
          </Button>
          {!enough ? (
            <span className="text-caption text-muted-foreground">
              {card.min === 1 ? "Pick at least one." : `Pick at least ${card.min}.`}
            </span>
          ) : null}
        </div>
      </div>
    );
  }

  if (card.kind === "confirm") {
    return (
      <div className="flex flex-col gap-8">
        <Heading card={card} accent={accent} {...(eyebrow ? { eyebrow } : {})} />
        <div className={cx(ENTER, ACCENT_EDGE[accent], "border-l-2 pl-4")}>
          <p className="text-body">{card.statement}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="primary"
            icon={CheckIcon}
            disabled={disabled || committing}
            onClick={() => chooseOne("confirmed", "Yes, that is right.")}
          >
            That is right
          </Button>
          <Button
            variant="secondary"
            icon={PencilSimpleIcon}
            disabled={disabled || committing}
            onClick={() => chooseOne("rejected", "Not quite.")}
          >
            Not quite
          </Button>
        </div>
      </div>
    );
  }

  // free_text: the control is the dock at the bottom of the page, which is always
  // present. Repeating a textarea here would give the visitor two places to type and
  // no way to know which one counts.
  return (
    <div className="flex flex-col gap-8">
      <Heading card={card} accent={accent} {...(eyebrow ? { eyebrow } : {})} />
      {card.suggestions.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="text-overline text-muted-foreground">Or pick one to start from</p>
          <div className="flex flex-wrap gap-2">
            {card.suggestions.map((suggestion, i) => (
              <button
                key={suggestion}
                type="button"
                disabled={disabled}
                style={staggerStyle(i)}
                onClick={() => onAnswer(suggestion)}
                className={cx(
                  ENTER,
                  "border-input text-body-sm min-h-9 border px-3 py-1.5",
                  ACCENT_EDGE_HOVER[accent],
                  "transition-[color,background-color,border-color] duration-normal ease-out",
                  "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                  "disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
