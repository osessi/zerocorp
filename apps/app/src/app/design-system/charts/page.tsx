"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@zerocorp/ui";
import { AXIS, ChartFrame, ChartTooltip, DASH, EmptyChart, GRID_STROKE, seriesColor, type Series } from "./chart";
import { money } from "../_prototype/data";

/**
 * Chart variants, in ZeroCorp's own vocabulary. Recharts is the engine (D11); every visual
 * here is ours. §4.7 owns the series tokens and closes §24.14.
 *
 * The reference these were adapted from is shadcn's chart set. What was deliberately NOT
 * carried over: rounded bars and rounded tooltips (§7 is radius 0), the Card shell (we do
 * not have one, on purpose), and the raw --chart-n hex ladder.
 */

const REVENUE = [
  { m: "Mar", launch: 297_00, growth: 798_00, autopilot: 0 },
  { m: "Apr", launch: 396_00, growth: 1197_00, autopilot: 799_00 },
  { m: "May", launch: 495_00, growth: 1197_00, autopilot: 799_00 },
  { m: "Jun", launch: 594_00, growth: 1596_00, autopilot: 1598_00 },
  { m: "Jul", launch: 594_00, growth: 1995_00, autopilot: 1598_00 },
  { m: "Aug", launch: 693_00, growth: 2394_00, autopilot: 2397_00 },
];

const PLAN_SERIES: Series[] = [
  { key: "launch", label: "Launch", slot: 1, pattern: "solid" },
  { key: "growth", label: "Growth", slot: 2, pattern: "dashed" },
  { key: "autopilot", label: "Autopilot", slot: 3, pattern: "dotted" },
];

const FUNNEL = [
  { stage: "Collecting", n: 12 },
  { stage: "Verifying", n: 9 },
  { stage: "In review", n: 6 },
  { stage: "Filed", n: 5 },
  { stage: "Formed", n: 4 },
];

const MIX = [
  { name: "Launch", value: 7, slot: 1 as const },
  { name: "Growth", value: 6, slot: 2 as const },
  { name: "Autopilot", value: 3, slot: 3 as const },
];

function Section({ title, note, children }: { title: string; note: string; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <h2 className="text-h4">{title}</h2>
        <p className="text-body-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  );
}

export default function ChartsPage() {
  const [dark, setDark] = useState(false);
  const [grey, setGrey] = useState(false);
  const [range, setRange] = useState<3 | 6>(6);

  useMemo(() => {
    if (typeof document !== "undefined") document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const data = REVENUE.slice(-range);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className={`mx-auto flex min-w-0 max-w-(--container-content) flex-col gap-10 p-4 sm:p-8 ${grey ? "grayscale" : ""}`}>
        <header className="border-border flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div className="flex max-w-2xl flex-col gap-2">
            <h1 className="text-h2">Charts</h1>
            <p className="text-body-sm text-muted-foreground">
              Recharts as the engine, ZeroCorp for every visual. Five series, all clearing
              3:1 against the page. They do <span className="text-foreground">not</span> all
              separate in greyscale and cannot, so every chart carries a second channel:
              the stroke pattern, repeated in the legend and the tooltip. Turn on Greyscale
              and the series are still tellable apart.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={() => setGrey((g) => !g)}>{grey ? "Colour" : "Greyscale"}</Button>
            <Button onClick={() => setDark((d) => !d)}>{dark ? "Light" : "Dark"}</Button>
          </div>
        </header>

        <Section title="Area, stacked" note="Recurring revenue by plan. The default for anything cumulative over time.">
          <ChartFrame
            title="Recurring revenue"
            subtitle={`Last ${range} months, by plan`}
            series={PLAN_SERIES}
            action={
              <span className="flex gap-1">
                {([6, 3] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`text-caption border px-2 py-1 ${range === r ? "bg-primary border-primary text-primary-foreground" : "border-input text-muted-foreground hover:bg-accent"}`}
                  >
                    {r} months
                  </button>
                ))}
              </span>
            }
            footer="Setup fees are excluded. Recurring only."
          >
            <ResponsiveContainer width="100%" height={260}>
              <AreaChart data={data} margin={{ left: 4, right: 4, top: 4 }}>
                <defs>
                  {PLAN_SERIES.map((s) => (
                    <linearGradient key={s.key} id={`fill-${s.key}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={seriesColor(s.slot)} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={seriesColor(s.slot)} stopOpacity={0.02} />
                    </linearGradient>
                  ))}
                </defs>
                <CartesianGrid vertical={false} stroke={GRID_STROKE} />
                <XAxis dataKey="m" {...AXIS} axisLine={false} tickLine={false} tickMargin={8} />
                <YAxis {...AXIS} axisLine={false} tickLine={false} width={52}
                  tickFormatter={(v: number) => `$${Math.round(v / 100)}`} />
                <Tooltip
                  cursor={{ stroke: GRID_STROKE }}
                  content={({ active, payload, label }) =>
                    active && payload?.length ? (
                      <ChartTooltip
                        label={String(label)}
                        rows={payload.map((p) => {
                          const s = PLAN_SERIES.find((x) => x.key === p.dataKey)!;
                          return { key: s.key, name: s.label, value: money(Number(p.value)), slot: s.slot, pattern: s.pattern };
                        })}
                        total={money(payload.reduce((a, p) => a + Number(p.value), 0))}
                      />
                    ) : null
                  }
                />
                {PLAN_SERIES.map((s) => (
                  <Area
                    key={s.key}
                    dataKey={s.key}
                    stackId="revenue"
                    type="linear"
                    stroke={seriesColor(s.slot)}
                    strokeWidth={2}
                    strokeDasharray={DASH[s.pattern]}
                    fill={`url(#fill-${s.key})`}
                  />
                ))}
              </AreaChart>
            </ResponsiveContainer>
          </ChartFrame>
        </Section>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Section title="Bar" note="Formations per stage. Square corners: §7 has no radius, and the reference's rounded bars were the first thing dropped.">
            <ChartFrame
              title="Formation funnel"
              subtitle="Open formations by stage"
              series={[{ key: "n", label: "Formations", slot: 1, pattern: "solid" }]}
            >
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={FUNNEL} margin={{ left: 4, right: 4, top: 4 }}>
                  <CartesianGrid vertical={false} stroke={GRID_STROKE} />
                  <XAxis dataKey="stage" {...AXIS} axisLine={false} tickLine={false} tickMargin={8} />
                  <YAxis {...AXIS} axisLine={false} tickLine={false} width={28} allowDecimals={false} />
                  <Tooltip
                    cursor={{ fill: "var(--color-accent)" }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <ChartTooltip
                          label={String(label)}
                          rows={[{ key: "n", name: "Formations", value: String(payload[0]!.value), slot: 1, pattern: "solid" }]}
                        />
                      ) : null
                    }
                  />
                  {/* radius 0, always. A rounded bar is the reference's house style, not ours. */}
                  <Bar dataKey="n" fill={seriesColor(1)} radius={0} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </Section>

          <Section title="Line" note="Trend without magnitude. The dash pattern is the second channel, visible in greyscale.">
            <ChartFrame
              title="Revenue trend"
              subtitle="Per plan, last 6 months"
              series={PLAN_SERIES}
            >
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={REVENUE} margin={{ left: 4, right: 4, top: 4 }}>
                  <CartesianGrid vertical={false} stroke={GRID_STROKE} />
                  <XAxis dataKey="m" {...AXIS} axisLine={false} tickLine={false} tickMargin={8} />
                  <YAxis {...AXIS} axisLine={false} tickLine={false} width={52}
                    tickFormatter={(v: number) => `$${Math.round(v / 100)}`} />
                  <Tooltip
                    cursor={{ stroke: GRID_STROKE }}
                    content={({ active, payload, label }) =>
                      active && payload?.length ? (
                        <ChartTooltip
                          label={String(label)}
                          rows={payload.map((p) => {
                            const s = PLAN_SERIES.find((x) => x.key === p.dataKey)!;
                            return { key: s.key, name: s.label, value: money(Number(p.value)), slot: s.slot, pattern: s.pattern };
                          })}
                        />
                      ) : null
                    }
                  />
                  {PLAN_SERIES.map((s) => (
                    <Line
                      key={s.key}
                      dataKey={s.key}
                      type="linear"
                      stroke={seriesColor(s.slot)}
                      strokeWidth={2}
                      strokeDasharray={DASH[s.pattern]}
                      dot={false}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </ChartFrame>
          </Section>

          <Section title="Donut" note="A share of a whole, and only that. Never a trend, never more than five slices.">
            <ChartFrame
              title="Businesses by plan"
              subtitle="16 active"
              series={MIX.map((m, i) => ({ key: m.name, label: m.name, slot: m.slot, pattern: (["solid", "dashed", "dotted"] as const)[i]! }))}
            >
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Tooltip
                    content={({ active, payload }) =>
                      active && payload?.length ? (
                        <ChartTooltip
                          label={String(payload[0]!.name)}
                          rows={[{ key: "v", name: "Businesses", value: String(payload[0]!.value), slot: 1, pattern: "solid" }]}
                        />
                      ) : null
                    }
                  />
                  <Pie data={MIX} dataKey="value" nameKey="name" innerRadius={52} outerRadius={84} strokeWidth={2}
                       stroke="var(--color-background)">
                    {MIX.map((m) => <Cell key={m.name} fill={seriesColor(m.slot)} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
            </ChartFrame>
          </Section>

          <Section title="Empty" note="§17 requires an empty state on every component. A chart with no data says so, it does not draw an empty grid.">
            <ChartFrame title="Lead sources" subtitle="No campaigns yet" series={[]}>
              <EmptyChart message="No campaigns have run yet. Sources appear once outreach starts." />
            </ChartFrame>
          </Section>
        </div>
      </div>
    </div>
  );
}
