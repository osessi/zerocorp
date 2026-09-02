import type { ReactNode } from "react";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "../cx";
import { SegmentedProgress } from "./SegmentedProgress";

/**
 * CockpitHeader — the focal block at the top of Overview.
 *
 * The dashboard answers ONE question: what is ZeroCorp doing for me. This is the one
 * region on the screen that sits on `--surface-focal`; everything below stays on
 * `--background`. That contrast is what gives the page a top.
 *
 * Two things changed after looking at it rendered:
 *
 * 1. **The metrics moved IN.** They were a separate tinted row below, which read as
 *    spreadsheet conditional formatting and left the block as a 200px slab with an empty
 *    right half. A block that states the situation and then makes you look elsewhere for
 *    the numbers is not a cockpit. Inside, the hierarchy comes from the SURFACE, so the
 *    figures need no washes and no per-metric tints.
 * 2. **The blocked step became the headline.** "Waiting on you: connect your domain"
 *    answers the question better than a greeting does.
 *
 * On §4.6's "a quantity is never black": that rule exists because a metric in
 * `--foreground` carried exactly the weight of the heading beside it on a white page. In
 * here there is one headline and one surface, and the measurement decides the rest —
 * every `-ink` value fails on this ground (2.33 to 2.76 against 4.5) because they are
 * tuned for light tints. So the figures take `--surface-focal-foreground` and the labels
 * take it at 60%, which measures 6.26:1. `--muted-foreground` is NOT usable here: 3.40:1.
 *
 * One per screen. It is the focal block, and two focal blocks is no focal block.
 */
export function CockpitHeader({
  eyebrow,
  headline,
  blocked,
  total,
  completed,
  current,
  metrics,
  status,
}: {
  /** Small line above the headline. Courtesy, not information. */
  eyebrow: string;
  /** The status sentence, used when nothing is blocked. */
  headline: string;
  /** The step waiting on the founder. Takes over the headline when present. */
  blocked?: { label: string } | undefined;
  total: number;
  completed: number;
  current?: number | undefined;
  /** Three at most. Four figures on one line stop being scannable. */
  metrics: { label: string; value: string; sub?: string }[];
  /** Aligns with the headline, not floating in a corner. */
  status?: ReactNode;
}) {
  return (
    <header className="bg-surface-focal text-surface-focal-foreground border-border w-full border-b">
      {/* Same container and padding as the content below, so the left edge is one edge. */}
      <div className="mx-auto flex max-w-(--container-content) flex-col gap-4 px-5 py-6 sm:px-8">
        <span className="text-overline text-surface-focal-foreground/60">{eyebrow}</span>

        <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-3">
          {blocked ? (
            <p className="text-h3 flex min-w-0 items-start gap-2.5">
              <WarningIcon size={22} className="text-warning mt-0.5 shrink-0" weight="fill" />
              <span>
                <span className="text-warning">Waiting on you:</span> {blocked.label}
              </span>
            </p>
          ) : (
            <p className="text-h3 min-w-0">{headline}</p>
          )}
          {status ? <div className="flex shrink-0 items-center gap-2">{status}</div> : null}
        </div>

        <SegmentedProgress
          total={total}
          completed={completed}
          {...(current !== undefined ? { current } : {})}
          label={`${completed} of ${total} steps complete`}
          onFocal
        />

        {/* The figures, on one line. No washes: the surface already separates them from
            everything else on the page, and tinting three cells inside a dark block is
            three more grounds to measure for nothing. */}
        <dl className="flex flex-wrap items-baseline gap-x-10 gap-y-3">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-col gap-0.5">
              <dd className={cx("text-h3 font-mono tabular-nums")}>
                {m.value}
                {m.sub ? (
                  <span className="text-body-sm text-surface-focal-foreground/60 ml-1.5 font-sans">{m.sub}</span>
                ) : null}
              </dd>
              <dt className="text-caption text-surface-focal-foreground/60">{m.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
