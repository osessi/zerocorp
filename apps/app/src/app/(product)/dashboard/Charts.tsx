"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  PolarAngleAxis,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  AREA_FILL_BOTTOM,
  AREA_FILL_TOP,
  AXIS,
  CURVE,
  ChartFrame,
  ChartTooltip,
  EmptyChart,
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

/**
 * Where the work is — plan steps by area, as a radial.
 *
 * The list beside it says what ZeroCorp is doing and in what ORDER. It cannot say what
 * the plan is mostly MADE OF: eight rows read as eight equal things, and a founder
 * scrolling them has no idea that three of them are website work and one is the company.
 * Proportion is the one question a stack of rows cannot answer, and it is the question a
 * radial answers better than anything else on the page.
 *
 * The structure is the shadcn radial-with-label block, rebuilt on this system rather than
 * copied. What changed and why:
 *
 *   Card shell      -> ChartFrame. One chart frame in the product, not two (§22).
 *   var(--chart-n)  -> seriesColor(). Ours are measured tokens, §4.7, not a hex ladder.
 *   lucide          -> nothing. The frame carries the caption; no icon was doing work.
 *   fill-white      -> seriesInk(). One ink per SERIES, measured. See below.
 *
 * THE LABEL IS ON THE ARC. It was in a legend for one revision and that was wrong: a name
 * you have to hover to see is a name the chart does not carry, and the whole point of this
 * block is that you read it at a glance.
 *
 * The reason it was in a legend is real and the fix was a better one. A label on an arc has
 * to clear 4.5:1 against the colour under it, and white measures 5.36 / 7.10 / 5.17 / 4.09
 * / 6.04 on the light series — --chart-4 is gold and it fails. The reference reaches for
 * `mix-blend-luminosity`, which is a way of not measuring. The answer is that the ink is a
 * property of the SERIES, so §4.7 grew --chart-N-ink: white on four, near-black on the
 * gold, near-black on all five in dark where every series is bright.
 */
export function WorkloadChart({ data }: { data: readonly { area: string; steps: number; slot: number }[] }) {
  if (data.length === 0) {
    return (
      <ChartFrame
      title="Where the work is"
      subtitle="Plan steps by area"
      /*
        The legend, which this chart used to suppress with `series={[]}` while crowding
        the same information onto the arcs. Each entry carries its COUNT, so the number
        still rides with the name and the chart still never has to be trusted about a
        comparison a radial draws imperfectly. It is simply legible now.
      */
      series={data.map((d) => ({
        key: d.area,
        label: `${d.area} · ${d.steps}`,
        slot: d.slot as 1 | 2 | 3 | 4 | 5,
        pattern: "solid" as const,
      }))}
    >
        <EmptyChart message="The plan has no steps yet." />
      </ChartFrame>
    );
  }

  /*
    Headroom, so the largest arc never closes the circle.

    Without an explicit domain the scale ends at the maximum, so the biggest area sweeps a
    complete turn — a ring with no start and no end, which reads as a decoration rather
    than as a quantity, while everything else looks like an arbitrary fraction of nothing.
    "pourquoi tout a la meme demi cercle aussi. et les autres un cercle complet" is exactly
    that, and it is a scale problem, not a data problem.

    15% of headroom keeps every arc open at the top, so each one has a visible beginning
    and end and the comparison between them is a comparison of lengths.
  */
  const ceiling = Math.max(...data.map((d) => d.steps)) * 1.15;

  return (
    <ChartFrame
      title="Where the work is"
      subtitle="Plan steps by area"
      /*
        The legend, which this chart used to suppress with `series={[]}` while crowding
        the same information onto the arcs. Each entry carries its COUNT, so the number
        still rides with the name and the chart still never has to be trusted about a
        comparison a radial draws imperfectly. It is simply legible now.
      */
      series={data.map((d) => ({
        key: d.area,
        label: `${d.area} · ${d.steps}`,
        slot: d.slot as 1 | 2 | 3 | 4 | 5,
        pattern: "solid" as const,
      }))}
    >
      {/* 200, matching PublishingChart. The frames already stretch to a shared height;
          the PLOTS have to match too, or the row reads as two charts of different weight
          sitting in two boxes of the same size. */}
      <ResponsiveContainer width="100%" height={200}>
        {/* -90 to 270: one clean turn, starting at the top. The reference ends at 380,
            which laps the start by twenty degrees and draws the largest arc crossing
            under itself — a flourish on a chart whose whole job is comparing lengths. */}
        <RadialBarChart data={[...data]} startAngle={-90} endAngle={270} innerRadius="22%" outerRadius="98%">
          <PolarAngleAxis type="number" domain={[0, ceiling]} tick={false} axisLine={false} />
          <Tooltip
            cursor={false}
            content={({ active, payload }) =>
              active && payload?.length ? (
                <ChartTooltip
                  label={String(payload[0]!.payload.area)}
                  rows={[
                    {
                      key: "steps",
                      name: "Steps",
                      value: String(payload[0]!.value),
                      slot: payload[0]!.payload.slot as 1 | 2 | 3 | 4 | 5,
                      pattern: "solid" as const,
                    },
                  ]}
                />
              ) : null
            }
          />
          {/* The track is the sunken well, which is what every other empty region in the
              product is. It is what makes an arc read as a PROPORTION rather than a
              length you have to guess the scale of. */}
          <RadialBar dataKey="steps" background={{ fill: "var(--surface-sunken)" }} cornerRadius={0}>
            {data.map((d) => (
              <Cell key={d.area} fill={seriesColor(d.slot as 1 | 2 | 3 | 4 | 5)} />
            ))}
            {/*
              The on-arc labels are GONE, 2026-09-04.

              Every arc starts at the same angle, so every label anchored to a start
              landed at the same bearing, separated only by radius. Five rings across 76%
              of the radius give each ring ~15%, which is thinner than an 11px line of
              text. The labels could not not overlap: it was a geometry failure, not a
              positioning bug, and no amount of trigonometry fixes it.

              The counts moved to the legend strip above, which ChartFrame has always
              rendered and which this chart was passing an empty array to.
            */}
          </RadialBar>
        </RadialBarChart>
      </ResponsiveContainer>
    </ChartFrame>
  );
}
