"use client";

import type { ReactNode } from "react";
import { cx } from "../_prototype/primitives";

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

/** "0" rather than undefined: exactOptionalPropertyTypes rejects the latter, and a
    string everywhere means no caller has to special-case the solid stroke. */
export const DASH: Record<Series["pattern"], string> = {
  solid: "0",
  dashed: "6 4",
  dotted: "2 3",
};

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

export function EmptyChart({ message }: { message: string }) {
  return (
    <div className={cx("border-border bg-muted flex h-56 items-center justify-center border border-dashed")}>
      <span className="text-body-sm text-muted-foreground">{message}</span>
    </div>
  );
}
