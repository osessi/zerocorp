"use client";

import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
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
 * Answered items are buttons, not decoration: any answer can be revisited. A founder who
 * realises at question five that they misread question two should not start again.
 *
 * Everything after the revisited question is dropped rather than merely re-asked. They
 * are correcting the answers that FOLLOWED from the one they got wrong, and leaving
 * those in place would build the plan on the version they just rejected.
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
                // Two layers, like the rail: a track that is always there and a run
                // that grows down it. Switching the whole line's colour at once reads
                // as a state change; growing reads as progress.
                <span className="relative mt-1 w-0.5 flex-1">
                  <span className="bg-border absolute inset-x-0 top-0 bottom-0 w-px" />
                  <span
                    className={cx("absolute inset-x-0 top-0 ease-out", ACCENT_RULE[accent])}
                    style={{
                      height: answered ? "100%" : "0%",
                      transitionProperty: "height",
                      transitionDuration: "600ms",
                    }}
                  />
                </span>
              ) : null}
            </span>

            <span className="flex min-w-0 flex-1 flex-col gap-0.5 pb-6">
              <span
                className={cx(
                  "text-body-sm flex items-start gap-1.5 text-left transition-[color] duration-emphasis ease-out",
                  active ? cx(ACCENT_TEXT[accent], "font-medium") : answered ? "text-foreground" : "text-muted-foreground",
                  // Answered questions are clickable, and nothing said so. The glyph is
                  // the affordance; it appears on hover AND on keyboard focus, because a
                  // control that only exists for a mouse does not exist.
                  answered && "group-hover:text-foreground",
                )}
              >
                <span className="min-w-0 flex-1">{item.question}</span>
                {answered ? (
                  <PencilSimpleIcon
                    size={14}
                    aria-hidden="true"
                    className={cx(
                      "text-muted-foreground mt-0.5 shrink-0 opacity-0 transition-[opacity] duration-normal ease-out",
                      "group-hover:opacity-100 group-focus-visible:opacity-100",
                    )}
                  />
                ) : null}
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
              aria-label={`Change your answer to: ${item.question}`}
              className={cx(
                "zc-slide-in group flex w-full cursor-pointer gap-3 text-left",
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
