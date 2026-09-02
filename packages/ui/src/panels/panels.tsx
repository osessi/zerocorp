import type { ReactNode } from "react";
import {
  ArrowDownRightIcon,
  ArrowUpRightIcon,
  ArrowsClockwiseIcon,
  CaretRightIcon,
  MinusIcon,
  RobotIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Avatar } from "../avatar/Avatar";
import { cx } from "../cx";
import type { StatusTone } from "../tone";

/**
 * MetricGrid · SectionHeader · ActivityPanel — promoted from the dashboard prototype
 * 2026-09-02, closing three of the nine patterns open item 8 still held.
 *
 * §21.1b is explicit that a pattern is validated when a screen actually needs it, not in
 * advance. These three were exercised for two days in the prototype and the live Overview
 * now composes all three, so they graduate together and both call sites read this file.
 * Two implementations of MetricGrid, one in the prototype and one copied into the product,
 * is exactly the drift §22 exists to prevent.
 *
 * `Tone` in the prototype is `StatusTone` here. They were always the same six values plus
 * `ai`, which joined the union on the same day (open item 21).
 */
type Tone = StatusTone;

const COUNT_TONE: Record<Tone, string> = {
  success: "bg-success-subtle border-success text-success-ink",
  warning: "bg-warning-subtle border-warning text-warning-ink",
  danger: "bg-destructive-subtle border-destructive text-destructive-ink",
  info: "bg-info-subtle border-info text-info-ink",
  processing: "bg-processing-subtle border-processing text-processing-ink",
  ai: "bg-ai-subtle border-ai text-ai-ink",
  neutral: "border-border text-muted-foreground",
};

export function SectionHeader({
  title,
  subtitle,
  count,
  countTone,
  action,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  /** The tone the count reads as. Defaults to the accent, never black. */
  countTone?: Tone;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h2 className="text-h4">{title}</h2>
          {/*
            A quantity is never black. A black chip is the same weight as the heading beside
            it, so "Recent businesses 7" read as one long title rather than a title and a
            number. The count is the thing a founder scans for, and it should be findable
            without reading the words around it.

            Tinted rather than filled: a solid chip at every heading would out-shout the
            headings themselves once a page carries four of them.
          */}
          {count !== undefined ? (
            <span
              className={cx(
                "text-caption inline-flex min-w-5 items-center justify-center border px-1 font-mono",
                COUNT_TONE[countTone ?? "processing"],
              )}
            >
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

const METRIC_VALUE: Record<Tone, string> = {
  success: "text-success-ink",
  warning: "text-warning-ink",
  danger: "text-destructive-ink",
  info: "text-info-ink",
  processing: "text-processing-ink",
  ai: "text-ai-ink",
  neutral: "text-foreground",
};

const METRIC_WASH: Record<Tone, string> = {
  success: "bg-success-wash",
  warning: "bg-warning-wash",
  danger: "bg-destructive-wash",
  info: "bg-info-wash",
  processing: "bg-processing-wash",
  neutral: "",
  ai: "bg-ai-wash",
};

const METRIC_TILE: Record<Tone, string> = {
  success: "bg-success-subtle border-success text-success-ink",
  warning: "bg-warning-subtle border-warning text-warning-ink",
  danger: "bg-destructive-subtle border-destructive text-destructive-ink",
  info: "bg-info-subtle border-info text-info-ink",
  processing: "bg-processing-subtle border-processing text-processing-ink",
  neutral: "border-border text-muted-foreground",
  ai: "bg-ai-subtle border-ai text-ai-ink",
};

export function MetricGrid({
  items,
  link,
}: {
  items: Array<{
    label: string;
    value: string;
    sub?: string;
    icon?: ReactNode;
    tone?: Tone;
    /** A movement worth reading, e.g. "+18% vs last month". */
    delta?: { text: string; direction: "up" | "down" | "flat" };
  }>;
  link?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="border-border grid grid-cols-1 divide-y divide-(--border) border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {items.map((m) => (
          /* The WHOLE cell carries the tone, not just the icon tile. Three numbers on one
             ground read as one measurement repeated; three grounds read as three facts. */
          <div key={m.label} className={cx("flex flex-col gap-3 p-4", m.tone ? METRIC_WASH[m.tone] : "")}>
            {/*
              The label row used to be a grey icon beside grey text, three times over, so
              three different facts arrived with identical weight. The icon now sits in a
              tinted tile carrying the metric's own tone: money, count and progress stop
              looking like the same measurement.
            */}
            <span className="text-body-sm text-muted-foreground flex items-center gap-2">
              {m.icon ? (
                <span
                  className={cx(
                    "inline-flex size-7 shrink-0 items-center justify-center border",
                    m.tone ? METRIC_TILE[m.tone] : "border-border text-muted-foreground",
                  )}
                  aria-hidden="true"
                >
                  {m.icon}
                </span>
              ) : null}
              {m.label}
            </span>
            {/* The value takes the metric's tone. It was --foreground at every card, so
                three different measurements arrived in the same ink and the tinted tile
                beside them was doing all the work alone. */}
            <span className={cx("text-h2 font-mono", m.tone ? METRIC_VALUE[m.tone] : "text-foreground")}>
              {m.value}
              {m.sub ? <span className="text-body-sm text-muted-foreground ml-1 font-sans">{m.sub}</span> : null}
            </span>
            {/*
              A number with no movement beside it is a fact with no meaning. Direction is
              carried by the arrow as well as the colour, so it survives greyscale (§14).
            */}
            {m.delta ? (
              <span
                className={cx(
                  "text-caption inline-flex items-center gap-1",
                  m.delta.direction === "up"
                    ? "text-success-ink"
                    : m.delta.direction === "down"
                      ? "text-destructive-ink"
                      : "text-muted-foreground",
                )}
              >
                {m.delta.direction === "up" ? (
                  <ArrowUpRightIcon size={12} weight="bold" aria-hidden="true" />
                ) : m.delta.direction === "down" ? (
                  <ArrowDownRightIcon size={12} weight="bold" aria-hidden="true" />
                ) : (
                  <MinusIcon size={12} weight="bold" aria-hidden="true" />
                )}
                {m.delta.text}
              </span>
            ) : null}
          </div>
        ))}
      </div>
      {link}
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
