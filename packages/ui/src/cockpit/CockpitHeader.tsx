import type { ReactNode } from "react";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "../cx";
import { SegmentedProgress } from "./SegmentedProgress";

/**
 * CockpitHeader — the top of Overview.
 *
 * It was a full-bleed black slab. The contrast worked and the thing was ugly: a 200px
 * band of near-black at the top of every session, carrying an eyebrow, one sentence and
 * three figures. Impact came from the surface being loud rather than from anything on it
 * being important.
 *
 * This version gets its weight from TYPE and RULE instead. A display-sized headline, the
 * figures large and monospaced on the same ground, and one hairline separating the block
 * from the page. Nothing is inverted, so it does not fight the rest of the product, and
 * the one saturated mark on the screen is the yellow on the figure that matters.
 *
 * §21.1 says exactly this: hierarchy comes from typography, spacing, borders and
 * alignment, never from heavy surfaces. The black slab was the thing that rule forbids.
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
  eyebrow: string;
  headline: string;
  blocked?: { label: string; action?: ReactNode } | undefined;
  total: number;
  completed: number;
  current?: number | undefined;
  metrics: { label: string; value: string; sub?: string; highlight?: boolean }[];
  status?: ReactNode;
}) {
  return (
    <header className="border-border bg-surface w-full border-b">
      <div className="mx-auto flex max-w-(--container-content) flex-col gap-4 px-5 py-5 sm:px-8">
        <div className="flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-overline text-muted-foreground">{eyebrow}</span>

            {blocked ? (
              /*
                The blocked headline is the only place on this screen that raises its
                voice, and it does it with a tinted band the width of the sentence rather
                than a full-bleed surface. Warning tone, because a person must act — §4.6.
              */
              <div className="border-warning bg-warning-subtle flex max-w-prose items-start gap-3 border px-4 py-3">
                <WarningIcon size={20} weight="fill" className="text-warning-ink mt-0.5 shrink-0" aria-hidden="true" />
                <p className="text-body text-warning-ink">
                  <span className="font-semibold">Waiting on you.</span> {blocked.label}
                </p>
              </div>
            ) : (
              <h1 className="text-h2 max-w-prose text-balance">{headline}</h1>
            )}
          </div>

          {status ? <div className="flex shrink-0 items-center gap-2">{status}</div> : null}
        </div>

        {blocked?.action ? <div className="flex">{blocked.action}</div> : null}

        <div className="flex flex-col gap-2">
          <SegmentedProgress
            total={total}
            completed={completed}
            {...(current !== undefined ? { current } : {})}
            label={`${completed} of ${total} steps complete`}
          />
          <span className="text-caption text-muted-foreground font-mono tabular-nums">
            {completed} of {total} steps complete
          </span>
        </div>

        {/*
          The figures, large, on the page's own ground. Not three tinted boxes: three cells
          with three fills read as conditional formatting in a spreadsheet, which is what
          the previous version looked like. Not divided by rules either — a divide-x row
          sitting under a border-t is two single-side borders, which the standing rule
          bans. Space does the separating.
        */}
        <dl className="mt-4 flex flex-col gap-4 sm:flex-row sm:gap-10">
          {metrics.map((m) => (
            <div key={m.label} className="flex flex-1 flex-col gap-0.5">
              <dd className="flex items-baseline gap-2">
                <span
                  className={cx(
                    "text-h1 font-mono tabular-nums",
                    m.highlight ? "bg-accent-highlight text-accent-highlight-ink rounded-sm px-2" : "text-foreground",
                  )}
                >
                  {m.value}
                </span>
                {m.sub ? <span className="text-body-sm text-muted-foreground">{m.sub}</span> : null}
              </dd>
              <dt className="text-caption text-muted-foreground">{m.label}</dt>
            </div>
          ))}
        </dl>
      </div>
    </header>
  );
}
