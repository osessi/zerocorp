"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import {
  AREA_FILL_BOTTOM,
  AREA_FILL_TOP,
  AXIS,
  CURVE,
  ChartFrame,
  ChartTooltip,
  GRID_STROKE,
  seriesColor,
} from "@zerocorp/ui";

/**
 * The Command Center's charts.
 *
 * §4.7 settled every value here on 2026-09-01 — five series, the gradient at 0.85 to
 * 0.05, `natural` curves, axis contrast — and nothing in the product had ever drawn one.
 * A dashboard whose only shapes are rows is a list.
 *
 * Two charts, not six. The question this screen answers is "what is ZeroCorp doing for
 * me", so the charts are OUTPUT over time and the pipeline right now. Anything else is a
 * number the rail already carries better.
 */
export function PublishingChart({ data }: { data: readonly { week: string; published: number; scheduled: number }[] }) {
  return (
    <ChartFrame
      title="Publishing"
      subtitle="Articles out, by week"
      series={[
        { key: "published", label: "Published", slot: 1, pattern: "solid" },
        { key: "scheduled", label: "Scheduled", slot: 2, pattern: "solid" },
      ]}
    >
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart data={[...data]} margin={{ left: 4, right: 4, top: 4 }}>
          <defs>
            {[1, 2].map((slot) => (
              <linearGradient key={slot} id={`pub-${slot}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={seriesColor(slot as 1 | 2)} stopOpacity={AREA_FILL_TOP} />
                <stop offset="100%" stopColor={seriesColor(slot as 1 | 2)} stopOpacity={AREA_FILL_BOTTOM} />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid vertical={false} stroke={GRID_STROKE} />
          <XAxis dataKey="week" {...AXIS} axisLine={false} tickLine={false} tickMargin={8} />
          <YAxis {...AXIS} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
          <Tooltip
            cursor={{ stroke: GRID_STROKE }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <ChartTooltip
                  label={String(label)}
                  rows={payload.map((p) => ({
                    key: String(p.dataKey),
                    name: p.dataKey === "published" ? "Published" : "Scheduled",
                    value: String(p.value),
                    slot: p.dataKey === "published" ? 1 : 2,
                    pattern: "solid" as const,
                  }))}
                />
              ) : null
            }
          />
          {/* Stacked, so position is the second channel and the strokes stay solid —
              §4.7 is explicit that a dash belongs to overlapping LINES, not to every
              chart. */}
          <Area dataKey="published" stackId="out" type={CURVE} stroke={seriesColor(1)} strokeWidth={2} fill="url(#pub-1)" />
          <Area dataKey="scheduled" stackId="out" type={CURVE} stroke={seriesColor(2)} strokeWidth={2} fill="url(#pub-2)" />
        </AreaChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}

/**
 * The prospect pipeline.
 *
 * A funnel drawn as bars rather than a real funnel shape: the stages are not nested
 * subsets — a lead can be contacted without having been qualified — so a funnel would
 * draw a containment that is not true.
 */
export function PipelineChart({ data }: { data: readonly { stage: string; count: number; slot: number }[] }) {
  return (
    <ChartFrame
      title="Prospect pipeline"
      subtitle="Where every lead stands today"
      series={[]}
    >
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={[...data]} margin={{ left: 4, right: 4, top: 4 }} layout="vertical">
          <CartesianGrid horizontal={false} stroke={GRID_STROKE} />
          <XAxis type="number" {...AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <YAxis type="category" dataKey="stage" {...AXIS} axisLine={false} tickLine={false} width={82} />
          <Tooltip
            cursor={{ fill: "var(--accent)" }}
            content={({ active, payload, label }) =>
              active && payload?.length ? (
                <ChartTooltip
                  label={String(label)}
                  rows={[{ key: "count", name: "Prospects", value: String(payload[0]!.value), slot: 3, pattern: "solid" }]}
                />
              ) : null
            }
          />
          {/* Radius 0. §7 is about rectangles and a bar is the most rectangular thing on
              the page — the shadcn reference rounds these and it was the first thing to go. */}
          <Bar dataKey="count" radius={0}>
            {data.map((d) => (
              <Cell key={d.stage} fill={seriesColor(d.slot as 1 | 2 | 3 | 4 | 5)} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
