"use client";

/**
 * Charts — promoted from the design-system prototype 2026-09-03.
 *
 * §4.7 settled the series tokens, the gradient, the curve and the axis contrast on
 * 2026-09-01, and a working Recharts implementation has existed since. The Command
 * Center had no chart at all, which is most of why it read as a list rather than a
 * dashboard. Promoted rather than copied: two implementations of a chart frame is the
 * drift §22 exists to prevent.
 */
"use client";

import type { ReactNode } from "react";
import { cx } from "../cx";

/**
 * The ZeroCorp chart shell. Recharts is the engine (D11); this owns every visual.
 *
 * What was taken from the shadcn reference: the container-plus-config idea, the tooltip
 * shape, the legend shape. What was NOT taken, because it contradicts the system:
 *
 *   radius        every bar and tooltip in the reference is rounded. §7 is radius 0.
 *   Card shell    we have no Card component, deliberately: a bordered div is not an
 *                 abstraction worth five files.
 *   var(--chart-n) as a raw hex ladder. Ours are tokens with a measured rationale, §4.7.
 *
 * THE RULE THAT MATTERS. A chart may never rely on colour alone. The five series clear
 * 3:1 against the page but do NOT all separate in greyscale, and they cannot: the usable
 * band is about 40 to 149 in grey because anything lighter falls under 3:1 on white, and
 * five hue-distinct on-brand series will not ladder across it. So every chart here carries
 * a second channel, and `ChartFrame` will not render a legend without one.
 */

export type SeriesKey = 1 | 2 | 3 | 4 | 5;

export interface Series {
  key: string;
  label: string;
  slot: SeriesKey;
  /** The second channel. Required, because colour is not enough (§14). */
  pattern: "solid" | "dashed" | "dotted";
}

export const seriesColor = (slot: SeriesKey) => `var(--chart-${slot})`;

/**
 * The stroke pattern is OPTIONAL and off by default.
 *
 * The first version dashed every series on every chart, on the grounds that colour cannot
 * be the only carrier (§14). The rule is right and the application was wrong: it turned
 * every chart into a technical schematic and threw away the thing that makes an area chart
 * read at a glance.
 *
 * §14 asks for a second channel, not for that channel to be a dash. A STACKED area or bar
 * already has one: position in the stack. Series sit in a fixed order, the legend repeats
 * that order, and no two bands can be confused even in greyscale.
 *
 * Dashes are for the one case that genuinely needs them: overlapping LINES, which cross
 * and share space and have no position to distinguish them.
 */
export const DASH: Record<Series["pattern"], string> = {
  solid: "0",
  dashed: "6 4",
  dotted: "2 3",
};

/**
 * The area gradient. 0.85 at the top, 0.05 at the bottom.
 *
 * It was 0.35 to 0.02, which is nearly invisible, and that was the second mistake: §8
 * limits ELEVATION to one shadow, on UI surfaces. A gradient inside a data area is not
 * elevation, it is how an area chart shows magnitude, and weakening it removed the only
 * thing that separated an area chart from a line chart.
 */
export const AREA_FILL_TOP = 0.85;
export const AREA_FILL_BOTTOM = 0.05;

/**
 * Curves are `natural`, not `linear`.
 *
 * §7 is radius 0, and I applied it here, which was the third mistake. Radius 0 is a rule
 * about the corners of RECTANGLES: a button, a card, an input. A data curve is not a
 * corner, and forcing it angular made every trend look like a sawtooth.
 */
export const CURVE = "natural" as const;

/**
 * The frame every chart sits in. Bordered, square, with the panel header idiom the
 * dashboard already uses, so a chart is not a foreign object on the page.
 */
export function ChartFrame({
  title,
  subtitle,
  action,
  series,
  footer,
  children,
}: {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  series: Series[];
  footer?: ReactNode;
  children: ReactNode;
}) {
  return (
    <figure className="border-border flex flex-col border">
      <div className="border-border bg-muted flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
        <figcaption className="flex flex-col gap-0.5">
          <span className="text-label text-foreground">{title}</span>
          {subtitle ? <span className="text-caption text-muted-foreground">{subtitle}</span> : null}
        </figcaption>
        {action}
      </div>

      <div className="p-4">{children}</div>

      {/*
        The legend is not decoration, it is the second channel made visible: each entry
        shows the SWATCH and the STROKE, so a reader who cannot separate two hues still
        has the dash pattern. Rendering a legend without the pattern would defeat it.
      */}
      <div className="border-border flex flex-wrap items-center gap-x-5 gap-y-2 border-t px-4 py-3">
        {series.map((s) => (
          <span key={s.key} className="text-caption text-muted-foreground inline-flex items-center gap-2">
            <svg width="18" height="10" aria-hidden="true" className="shrink-0">
              <line
                x1="0"
                y1="5"
                x2="18"
                y2="5"
                stroke={seriesColor(s.slot)}
                strokeWidth="2"
                strokeDasharray={DASH[s.pattern]}
              />
            </svg>
            {s.label}
          </span>
        ))}
      </div>

      {footer ? (
        <div className="border-border text-caption text-muted-foreground border-t px-4 py-3">{footer}</div>
      ) : null}
    </figure>
  );
}

/**
 * The tooltip. Composes the overlay surface contract rather than inventing a third one:
 * a floating layer over the page keeps the --input edge, square corners and one shadow.
 *
 * Numbers are Geist Mono, because a tooltip exists to be compared against another
 * tooltip (§5).
 */
export function ChartTooltip({
  label,
  rows,
  total,
}: {
  label: string;
  rows: Array<{ key: string; name: string; value: string; slot: SeriesKey; pattern: Series["pattern"] }>;
  total?: string;
}) {
  return (
    <div className="bg-surface-elevated border-input shadow-floating flex min-w-44 flex-col gap-1.5 border p-2.5">
      <span className="text-caption text-muted-foreground">{label}</span>
      {rows.map((r) => (
        <span key={r.key} className="text-caption flex items-center gap-2">
          <svg width="12" height="8" aria-hidden="true" className="shrink-0">
            <line x1="0" y1="4" x2="12" y2="4" stroke={seriesColor(r.slot)} strokeWidth="2" strokeDasharray={DASH[r.pattern]} />
          </svg>
          <span className="text-muted-foreground">{r.name}</span>
          <span className="text-foreground ml-auto font-mono">{r.value}</span>
        </span>
      ))}
      {total ? (
        <span className="border-border text-caption text-foreground mt-0.5 flex items-center border-t pt-1.5">
          Total
          <span className="ml-auto font-mono">{total}</span>
        </span>
      ) : null}
    </div>
  );
}

/** Shared axis and grid styling, so no chart draws its own. */
export const AXIS = {
  tick: { fill: "var(--chart-axis)", fontSize: 11 },
  line: false as const,
  tickLine: false as const,
};

export const GRID_STROKE = "var(--chart-grid)";

/**
 * The empty state. A chart with no data is a PLACE, not a failure.
 *
 * Moved off the dashed outline 2026-09-02. A dashed box is the browser's vocabulary for
 * "this did not load"; a sunken well says the region exists and is waiting. Same reasoning
 * as `EmptyState` in @zerocorp/ui, and the two should keep agreeing.
 */
export function EmptyChart({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className={cx("border-border bg-surface-sunken flex h-56 flex-col items-center justify-center gap-3 border")}>
      <span className="text-body-sm text-muted-foreground">{message}</span>
      {action}
    </div>
  );
}

/**
 * The loading state — the axes and the grid, without the series.
 *
 * A spinner in a chart region tells you nothing about what is arriving. Rendering the
 * frame the data will land in means the layout does not jump when it does, and the reader
 * already knows the shape of what they are waiting for.
 *
 * Three bars, not a shimmer: `--muted` blocks at the heights a bar chart would occupy.
 * A shimmering gradient is decoration, and §8 keeps gradients out of UI surfaces.
 *
 * `aria-busy` rather than a live region: a chart loading is not news a screen reader
 * should interrupt for, but a reader landing on it must not be told the region is empty.
 */
export function LoadingChart({ label = "Loading chart" }: { label?: string }) {
  return (
    <div
      aria-busy="true"
      aria-label={label}
      role="img"
      className={cx("border-border bg-surface-sunken flex h-56 items-end gap-3 border p-6")}
    >
      {[0.45, 0.75, 0.3, 0.6, 0.85, 0.5].map((h, i) => (
        <span
          key={i}
          className="bg-muted-foreground/15 motion-safe:animate-pulse w-full"
          style={{ height: `${h * 100}%` }}
        />
      ))}
    </div>
  );
}
