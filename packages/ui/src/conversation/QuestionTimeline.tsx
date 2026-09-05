"use client";

import { PencilSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import type { ComponentType } from "react";
import { cx } from "../cx";
import { ACCENT_EDGE, ACCENT_FILL, ACCENT_RULE, ACCENT_TEXT, ACCENT_TINT, accentFor } from "./accent";

/**
 * The conversation so far, down the left.
 *
 * Every question asked stays visible with its answer beneath it. The visitor is building
 * a picture of what ZeroCorp has understood, and a conversation that scrolls itself away
 * gives them nothing to check.
 *
 * Answered items are buttons: any answer can be revisited, and nothing after it is lost
 * when it is. Each node carries its step's accent, so this and the rail above agree at a
 * glance without either of them saying so.
 *
 * The row is a three-column grid rather than a flex chain. Flex let the pencil squeeze
 * the question text on a narrow rail, which is how the list ended up looking broken: a
 * fixed marker column, one flexible text column and a fixed pencil column cannot do that
 * to each other.
 */
export interface TimelineItem {
  readonly id: string;
  readonly question: string;
  readonly answer?: string;
  readonly state: "answered" | "active" | "upcoming";
  /**
   * The step's glyph — the same one the rail shows above.
   *
   * Two views of the same interview showing the same step as a briefcase in one place
   * and a bare square in the other makes the reader do the matching themselves. The
   * icon is what says "this row and that marker are the same thing".
   */
  readonly icon?: ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill" }>;
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
        const clickable = answered && onSelect !== undefined;

        const Icon = item.icon;

        const marker = (
          <span className="flex w-6 flex-col items-center" aria-hidden="true">
            <span
              className={cx(
                "flex size-6 shrink-0 items-center justify-center border",
                "transition-[color,background-color,border-color] duration-emphasis ease-out",
                answered
                  ? cx(ACCENT_FILL[accent], ACCENT_EDGE[accent])
                  : active
                    ? cx(ACCENT_EDGE[accent], ACCENT_TEXT[accent], ACCENT_TINT[accent])
                    : "border-border text-muted-foreground bg-background",
              )}
            >
              {/* The glyph stays; only the fill changes. Five identical ticks tell a
                  founder scanning back for one answer nothing at all. */}
              {Icon ? <Icon size={12} weight="regular" /> : null}
            </span>
            {!last ? (
              // Two layers, like the rail: a track that is always there and a run that
              // grows down it. Switching a whole line's colour reads as a state change;
              // growing reads as progress.
              <span className="relative mt-1.5 w-px flex-1">
                <span className="bg-border absolute inset-0" />
                <span
                  className={cx("absolute inset-x-0 top-0 ease-out", ACCENT_RULE[accent])}
                  style={{ height: answered ? "100%" : "0%", transitionProperty: "height", transitionDuration: "600ms" }}
                />
              </span>
            ) : null}
          </span>
        );

        const text = (
          <span className="flex min-w-0 flex-col gap-0.5 pt-0.5 pb-6">
            <span
              className={cx(
                "text-body-sm text-left break-words transition-[color] duration-emphasis ease-out",
                active ? cx(ACCENT_TEXT[accent], "font-medium") : answered ? "text-foreground" : "text-muted-foreground",
                clickable && "group-hover:text-foreground",
              )}
            >
              {item.question}
            </span>
            {item.answer ? (
              <span className="text-caption text-muted-foreground line-clamp-2 text-left break-words">
                {item.answer}
              </span>
            ) : null}
          </span>
        );

        // A fixed marker column, a flexible text column, and a fixed pencil column. The
        // pencil reserves its space whether or not it is visible, so nothing reflows on
        // hover.
        const row = "grid grid-cols-[1.5rem_1fr_1rem] gap-x-3";

        if (clickable) {
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelect(item.id)}
              aria-label={`Change your answer to: ${item.question}`}
              className={cx(
                row,
                "zc-slide-in group w-full cursor-pointer text-left",
                "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
              )}
            >
              {marker}
              {text}
              <PencilSimpleIcon
                size={16}
                aria-hidden="true"
                className={cx(
                  "text-muted-foreground mt-1 opacity-0 transition-[opacity] duration-normal ease-out",
                  "group-hover:opacity-100 group-focus-visible:opacity-100",
                )}
              />
            </button>
          );
        }

        return (
          <div key={item.id} className={cx(row, active && "zc-slide-in")}>
            {marker}
            {text}
            <span />
          </div>
        );
      })}
    </nav>
  );
}
