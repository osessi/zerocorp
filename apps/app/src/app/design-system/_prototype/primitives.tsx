"use client";

import {
  ArrowsClockwiseIcon,
  CaretRightIcon,
  RobotIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import type { Tone } from "./data";

/**
 * Prototype primitives for the Dashboard Visual Language (DESIGN_SYSTEM.md §21).
 *
 * These live in the review surface, NOT in @zerocorp/ui and NOT in the registry. The
 * thirteen patterns are PROPOSED; they are built here so they can be judged on real
 * ZeroCorp content before being promoted.
 *
 * Every value is a token. No hex, no arbitrary spacing, no rounding.
 */

export const cx = (...p: Array<string | false | undefined>) => p.filter(Boolean).join(" ");

/* ── StatusBadge ─────────────────────────────────────────────────────────────
   One status system for the whole product (§4.3, §17). Colour is never the only
   carrier of meaning: the label always states the status.                      */
const TONE: Record<Tone, string> = {
  success: "text-success border-success",
  warning: "text-warning border-warning",
  danger: "text-destructive border-destructive",
  info: "text-info border-info",
  processing: "text-processing border-processing",
  neutral: "text-muted-foreground border-border",
};

export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 border px-2 py-0.5",
        "text-caption whitespace-nowrap",
        TONE[tone],
      )}
    >
      <span className="size-1.5 shrink-0 bg-current" aria-hidden="true" />
      {children}
    </span>
  );
}

/* ── Avatar / AvatarStack ─────────────────────────────────────────────────── */
export function Avatar({ initials, size = "md" }: { initials: string; size?: "sm" | "md" | "lg" }) {
  const dim = size === "sm" ? "size-6 text-caption" : size === "lg" ? "size-12 text-h4" : "size-8 text-caption";
  return (
    <span
      className={cx(dim, "bg-secondary text-secondary-foreground inline-flex shrink-0 items-center justify-center font-medium")}
      aria-hidden="true"
    >
      {initials}
    </span>
  );
}

/**
 * AvatarStack — initials do NOT overlap.
 *
 * The reference overlaps photographs, which reads fine because a face survives being
 * half-covered. Two-letter initials do not: an 8px overlap at 24px hides the first
 * character, so "AO TK" renders as "AC TK". Found in review 2026-08-31.
 *
 * When real photographs replace initials, overlap can come back — as a deliberate
 * decision, on that condition.
 */
export function AvatarStack({ people, max = 3 }: { people: string[]; max?: number }) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;
  return (
    <span className="flex items-center gap-1">
      {shown.map((p) => (
        <Avatar key={p} initials={p} size="sm" />
      ))}
      {rest > 0 ? (
        <span className="bg-muted text-muted-foreground text-caption inline-flex size-6 items-center justify-center">
          +{rest}
        </span>
      ) : null}
    </span>
  );
}

/* ── Button ──────────────────────────────────────────────────────────────────
   Outlined by default, one filled primary per screen. Teal is the only accent. */
export function Button({
  children,
  variant = "secondary",
  className,
  ...props
}: React.ComponentPropsWithoutRef<"button"> & { variant?: "primary" | "secondary" | "ghost" }) {
  const tone =
    variant === "primary"
      ? "bg-primary text-primary-foreground border-primary hover:opacity-90"
      : variant === "ghost"
        ? "border-transparent hover:bg-accent text-foreground"
        : "border-input hover:border-input-hover text-foreground bg-background";
  return (
    <button
      {...props}
      className={cx(
        "text-label inline-flex h-9 shrink-0 items-center gap-2 border px-3",
        "transition-[color,background-color,border-color] duration-normal ease-out",
        "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-60",
        tone,
        className,
      )}
    >
      {children}
    </button>
  );
}

/* ── SectionHeader (§21.6) ────────────────────────────────────────────────── */
export function SectionHeader({
  title,
  subtitle,
  count,
  action,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-h4">{title}</h2>
          {count !== undefined ? (
            <span className="bg-foreground text-background text-caption inline-flex size-5 items-center justify-center">
              {count}
            </span>
          ) : null}
        </div>
        {subtitle ? <p className="text-caption text-muted-foreground">{subtitle}</p> : null}
      </div>
      {action}
    </div>
  );
}

/** Small uppercase label used inside panels. */
export function PanelLabel({ children }: { children: ReactNode }) {
  return <p className="text-overline text-muted-foreground uppercase">{children}</p>;
}

/* ── MetricGrid (§21.11) ──────────────────────────────────────────────────────
   Equal cells inside ONE bordered container divided by internal rules — never
   three floating cards.                                                        */
export function MetricGrid({
  items,
  link,
}: {
  items: Array<{ label: string; value: string; sub?: string; icon?: ReactNode }>;
  link?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="border-border grid grid-cols-1 divide-y divide-(--border) border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((m) => (
          <div key={m.label} className="flex flex-col gap-2 p-4">
            <span className="text-body-sm text-muted-foreground flex items-center gap-2">
              {m.icon}
              {m.label}
            </span>
            <span className="text-h3 font-mono">
              {m.value}
              {m.sub ? <span className="text-body-sm text-muted-foreground ml-1">{m.sub}</span> : null}
            </span>
          </div>
        ))}
      </div>
      {link}
    </div>
  );
}

/* ── Tabs (§21.7) ─────────────────────────────────────────────────────────── */
export function Tabs({
  items,
  active,
  onSelect,
}: {
  items: Array<{ id: string; label: string; count?: number }>;
  active: string;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="border-border flex gap-6 overflow-x-auto border-b" role="tablist">
      {items.map((t) => {
        const on = t.id === active;
        return (
          <button
            key={t.id}
            role="tab"
            aria-selected={on}
            onClick={() => onSelect(t.id)}
            className={cx(
              "text-label -mb-px flex shrink-0 items-center gap-2 border-b-2 py-3",
              "transition-[color,background-color,border-color] duration-normal ease-out",
              "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
              on ? "border-foreground text-foreground" : "text-muted-foreground border-transparent",
            )}
          >
            {t.label}
            {t.count !== undefined ? (
              <span className="bg-foreground text-background text-caption inline-flex size-5 items-center justify-center">
                {t.count}
              </span>
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/* ── ActivityPanel (§21.10) ───────────────────────────────────────────────── */
export function ActivityPanel({
  events,
}: {
  events: Array<{
    id: string;
    actor: string;
    action: string;
    object?: string;
    at: string;
    kind: "person" | "agent" | "system";
    chip?: string;
    transition?: [string, string];
  }>;
}) {
  return (
    <ol className="flex flex-col">
      {events.map((e, i) => {
        const last = i === events.length - 1;
        return (
          <li key={e.id} className="flex gap-3">
            <div className="flex flex-col items-center">
              {/*
                Three kinds, three MARKERS. They were two: a round avatar for a person and,
                for both agent and system, the same grey square holding a 6px dot. Agent
                and system differed only by a background nobody could perceive, so a feed
                mixing people and machines read as one undifferentiated column.

                  person   a circle, with initials
                  agent    a square, --ai tint, robot glyph
                  system   a square, --processing tint, state-change glyph

                Round means a human, square means a machine. The glyph carries the rest, so
                the distinction survives greyscale and does not rest on colour (§14).
              */}
              {e.kind === "person" ? (
                <Avatar initials={e.actor.slice(0, 2).toUpperCase()} size="sm" />
              ) : e.kind === "agent" ? (
                <span
                  className="bg-ai-subtle border-ai text-ai-ink inline-flex size-6 shrink-0 items-center justify-center border"
                  aria-hidden="true"
                >
                  <RobotIcon size={14} weight="regular" />
                </span>
              ) : (
                <span
                  className="bg-processing-subtle border-processing text-processing-ink inline-flex size-6 shrink-0 items-center justify-center border"
                  aria-hidden="true"
                >
                  <ArrowsClockwiseIcon size={14} weight="regular" />
                </span>
              )}
              {!last ? <span className="bg-border w-px flex-1" aria-hidden="true" /> : null}
            </div>
            <div className={cx("flex flex-col gap-1.5", last ? "pb-0" : "pb-5")}>
              <p className="text-body-sm">
                <span className="text-foreground font-medium">{e.actor}</span>{" "}
                <span className="text-muted-foreground">{e.action}</span>
                {e.object ? <span className="text-foreground"> {e.object}</span> : null}
              </p>
              <p className="text-caption text-muted-foreground">{e.at}</p>
              {/* The chip belongs to whoever acted. An agent's chip is an agent's colour. */}
              {e.chip ? (
                <span
                  className={cx(
                    "text-caption w-fit border px-2 py-0.5",
                    e.kind === "agent"
                      ? "bg-ai-subtle border-ai text-ai-ink"
                      : "border-border text-muted-foreground",
                  )}
                >
                  {e.chip}
                </span>
              ) : null}
              {e.transition ? (
                <span className="text-caption text-muted-foreground flex items-center gap-2">
                  {/* The state left behind is spent: muted, struck through. The state
                      arrived at is live: tinted. Two identical outlined chips with an
                      arrow between them made the reader work out which was which. */}
                  <span className="border-border text-muted-foreground border px-2 py-0.5 line-through">
                    {e.transition[0]}
                  </span>
                  <CaretRightIcon size={12} aria-hidden="true" className="shrink-0" />
                  <span className="bg-processing-subtle border-processing text-processing-ink border px-2 py-0.5">
                    {e.transition[1]}
                  </span>
                </span>
              ) : null}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

/* ── Progress ─────────────────────────────────────────────────────────────────
   Hairline bar plus a numeric value. Never a chunky meter.                     */
export function Progress({ value }: { value: number }) {
  return (
    <span className="flex items-center gap-3">
      <span className="bg-muted h-1 w-full max-w-32" aria-hidden="true">
        <span className="bg-foreground block h-full" style={{ width: `${value}%` }} />
      </span>
      <span className="text-caption text-muted-foreground font-mono">{value}%</span>
    </span>
  );
}
