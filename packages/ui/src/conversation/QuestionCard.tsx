"use client";

import { useState } from "react";
import { ArrowRightIcon, CheckIcon, PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import type { QuestionCard as Card, QuestionOption } from "@zerocorp/contracts";
import { Button } from "../button/index";
import { cx } from "../cx";
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
}

/**
 * An option button.
 *
 * `--input` at rest, `--primary` when chosen. The border does the work, not a fill:
 * a filled chip in a list of unfilled ones reads as a status, and none of these is a
 * status.
 */
function OptionButton({
  option,
  selected,
  onClick,
  disabled,
  index,
  multiple,
}: {
  option: QuestionOption;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean | undefined;
  index: number;
  multiple: boolean;
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
        selected
          ? "border-primary text-foreground"
          : "border-input text-foreground hover:border-input-hover",
      )}
    >
      <span
        aria-hidden="true"
        className={cx(
          "flex size-4 shrink-0 items-center justify-center border transition-[color,background-color,border-color] duration-normal ease-out",
          multiple ? "" : "rounded-full",
          selected ? "border-primary bg-primary text-primary-foreground" : "border-input text-transparent",
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

function Heading({ card }: { card: Card }) {
  return (
    <div className={cx(ENTER, "flex flex-col gap-2")}>
      <h2 className="text-h2 text-balance">{card.question}</h2>
      {card.kind !== "confirm" && card.help ? (
        <p className="text-body-sm text-muted-foreground max-w-prose">{card.help}</p>
      ) : null}
    </div>
  );
}

export function QuestionCard({ card, onAnswer, disabled }: QuestionCardProps) {
  const [selected, setSelected] = useState<string[]>([]);

  if (card.kind === "single_choice") {
    return (
      <div className="flex flex-col gap-8">
        <Heading card={card} />
        <div className="flex flex-col gap-2" role="radiogroup" aria-label={card.question}>
          {card.options.map((option, i) => (
            <OptionButton
              key={option.value}
              option={option}
              index={i}
              multiple={false}
              selected={false}
              disabled={disabled}
              // A single choice IS the answer. Asking someone to pick and then press
              // Continue adds a click that carries no information.
              onClick={() => onAnswer(option.label, [option.value])}
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
        <Heading card={card} />
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2" role="group" aria-label={card.question}>
          {card.options.map((option, i) => (
            <OptionButton
              key={option.value}
              option={option}
              index={i}
              multiple
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
        <Heading card={card} />
        <div className={cx(ENTER, "border-primary border-l-2 pl-4")}>
          <p className="text-body">{card.statement}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={CheckIcon} disabled={disabled} onClick={() => onAnswer("Yes, that is right.", ["confirmed"])}>
            That is right
          </Button>
          <Button variant="secondary" icon={PencilSimpleIcon} disabled={disabled} onClick={() => onAnswer("Not quite.", ["rejected"])}>
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
      <Heading card={card} />
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
                  "border-input hover:border-input-hover text-body-sm min-h-9 border px-3 py-1.5",
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
