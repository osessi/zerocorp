"use client";

import { cx } from "../cx";
import { ACCENT_EDGE, ACCENT_FILL, ACCENT_RULE, ACCENT_TEXT, ACCENT_TINT, accentFor } from "./accent";

/**
 * The conversation so far, down the left.
 *
 * Every question asked stays visible with its answer beneath it. The visitor is building
 * a picture of what ZeroCorp has understood, and a conversation that scrolls itself away
 * gives them nothing to check.
 *
 * Each node carries its step's accent, so the rail at the top and the timeline on the
 * left agree at a glance without either of them saying so.
 *
 * It is a list of buttons, not a decorative rail: any answer can be revisited. A founder
 * who realises at question five that they misread question two should not start again.
 */
export interface TimelineItem {
  readonly id: string;
  readonly question: string;
  readonly answer?: string;
  readonly state: "answered" | "active" | "upcoming";
}

export function QuestionTimeline({
  items,
  onSelect,
  className,
}: {
  items: readonly TimelineItem[];
  onSelect?: (id: string) => void;
  className?: string;
}) {
  return (
    <nav className={cx("flex flex-col", className)} aria-label="Your answers">
      {items.map((item, i) => {
        const accent = accentFor(i);
        const answered = item.state === "answered";
        const active = item.state === "active";
        const last = i === items.length - 1;

        const body = (
          <>
            <span className="relative flex w-6 shrink-0 flex-col items-center">
              {/*
                The same three treatments as the rail, on the node itself. An earlier
                version ringed the active node with a second bordered square, which
                reads as a doubled box rather than as emphasis.
              */}
              <span
                className={cx(
                  "mt-1 flex size-3 shrink-0 items-center justify-center border",
                  "transition-[color,background-color,border-color] duration-emphasis ease-out",
                  answered
                    ? cx(ACCENT_FILL[accent], ACCENT_EDGE[accent])
                    : active
                      ? cx(ACCENT_EDGE[accent], ACCENT_TINT[accent])
                      : "border-border bg-background",
                )}
              />
              {!last ? (
                <span
                  className={cx(
                    "mt-1 w-px flex-1 transition-[background-color] duration-modal ease-out",
                    answered ? ACCENT_RULE[accent] : "bg-border",
                  )}
                />
              ) : null}
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-0.5 pb-6">
              <span
                className={cx(
                  "text-body-sm text-left transition-[color] duration-emphasis ease-out",
                  active ? cx(ACCENT_TEXT[accent], "font-medium") : answered ? "text-foreground" : "text-muted-foreground",
                )}
              >
                {item.question}
              </span>
              {item.answer ? (
                <span className="text-caption text-muted-foreground line-clamp-2 text-left">{item.answer}</span>
              ) : null}
            </span>
          </>
        );

        if (answered && onSelect) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              className={cx(
                "zc-slide-in group flex w-full gap-3 text-left",
                "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
              )}
            >
              {body}
            </button>
          );
        }

        return (
          <div key={item.id} className={cx("flex gap-3", active && "zc-slide-in")}>
            {body}
          </div>
        );
      })}
    </nav>
  );
}
