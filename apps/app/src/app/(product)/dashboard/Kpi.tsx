import type { ReactNode } from "react";
import { TrendUpIcon, TrendDownIcon, MinusIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "@zerocorp/ui";

/**
 * A KPI card.
 *
 * Replaces the cockpit slab. That block spent 240px on an eyebrow, a sentence, a progress
 * bar and three figures, and the figures — the only part anyone reads at a glance — were
 * the smallest thing in it.
 *
 * The card is the standard analytics shape for a reason: the label tells you what it is,
 * the number is the largest thing on it, the delta says which way it moved, and one line
 * underneath says whether that is good. Four across, one hairline grid, no shadows.
 *
 * Border on all four sides. There is no accent bar on any edge, on this or anything else
 * — enforced by a CI rule now, after being asked three times.
 */
export function Kpi({
  label,
  value,
  sub,
  delta,
  note,
  highlight,
}: {
  label: string;
  value: ReactNode;
  /** A unit or a qualifier, beside the number. */
  sub?: string;
  delta?: { text: string; direction: "up" | "down" | "flat" };
  /** One line saying whether the number is good news. */
  note?: string;
  /** The one figure on the screen worth marking. Yellow, §4.8. */
  highlight?: boolean;
}) {
  const Arrow = delta?.direction === "up" ? TrendUpIcon : delta?.direction === "down" ? TrendDownIcon : MinusIcon;

  return (
    <div className="border-border bg-surface hover:border-input flex flex-col gap-3 border p-5 transition-[border-color] duration-glide ease-glide">
      <div className="flex items-start justify-between gap-3">
        <span className="text-body-sm text-muted-foreground">{label}</span>
        {delta ? (
          <span
            className={cx(
              "text-caption rounded-sm inline-flex shrink-0 items-center gap-1 border px-1.5 py-0.5 font-mono tabular-nums",
              delta.direction === "up"
                ? "border-success text-success-ink"
                : delta.direction === "down"
                  ? "border-destructive text-destructive-ink"
                  : "border-border text-muted-foreground",
            )}
          >
            <Arrow size={12} aria-hidden="true" />
            {delta.text}
          </span>
        ) : null}
      </div>

      <span className="flex items-baseline gap-2">
        <span
          className={cx(
            "text-display-l font-mono tabular-nums leading-none",
            highlight ? "bg-accent-highlight text-accent-highlight-ink rounded-sm px-2" : "text-foreground",
          )}
        >
          {value}
        </span>
        {sub ? <span className="text-body-sm text-muted-foreground">{sub}</span> : null}
      </span>

      {note ? <span className="text-caption text-muted-foreground">{note}</span> : null}
    </div>
  );
}

/**
 * Four SEPARATE cards.
 *
 * They were glued into one bordered grid with 1px seams, which reads as a table of four
 * cells rather than four things. Separate cards with real space between them is what the
 * reference does and it is right: each number is its own object, and the gap is what says
 * so.
 */
export function KpiRow({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">{children}</div>;
}
