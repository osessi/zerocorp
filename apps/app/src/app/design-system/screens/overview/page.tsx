"use client";

import Link from "next/link";
import { ArrowRightIcon, BuildingsIcon, CurrencyDollarIcon, FileTextIcon, StackIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "../../_prototype/shell";
import { Button, StatusBadge } from "../../_prototype/primitives";
// The three patterns were promoted to @zerocorp/ui on 2026-09-02. Both call sites read
// the package now: the prototype and the live Overview cannot be allowed to drift, which
// is what two copies of MetricGrid guaranteed.
import { ActivityPanel, Avatar, MetricGrid, SectionHeader } from "@zerocorp/ui";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AREA_FILL_BOTTOM, AREA_FILL_TOP, AXIS, CURVE, ChartFrame, ChartTooltip, GRID_STROKE, seriesColor } from "../../charts/chart";
import { FORMATION_ORDER_TERMINAL } from "@zerocorp/contracts";
import { ACTIVITY, BUSINESSES, FORMATION_LABEL, FORMATION_TONE, money } from "../../_prototype/data";

/**
 * Screen 1 — Overview.
 *
 * Composes: PageHeader · MetricGrid · SectionHeader · ActivityPanel · a compact list.
 *
 * The chart is real. It was a placeholder citing "open item 14" until 2026-09-02, which
 * §4.7 had already closed on 2026-09-01 — series colours, grid, axis, gradient and curve
 * are all decided and measured. A comment claiming a resolved item is still open is the
 * same class of staleness as the §21.0 tint refusal, found in the same sweep.
 */
/** Six months of recurring revenue, in cents. Prototype data, same shape as the real query. */
const REVENUE = [
  { m: "Apr", mrr: 182_00 }, { m: "May", mrr: 241_00 }, { m: "Jun", mrr: 268_00 },
  { m: "Jul", mrr: 331_00 }, { m: "Aug", mrr: 389_00 }, { m: "Sep", mrr: 472_00 },
];

export default function OverviewScreen() {
  const mrr = BUSINESSES.reduce((s, b) => s + b.mrrCents, 0);
  // "In flight" is "not in a terminal state", read from the contract rather than from a
  // hand-written list. The list here named `complete` and `ein_issued`, two states D2
  // retired — the count would have been silently wrong.
  const inFlight = BUSINESSES.filter((b) => !FORMATION_ORDER_TERMINAL.includes(b.formation));

  return (
    <>
      <PageHeader
        breadcrumb={<span className="text-foreground">Overview</span>}
        meta="Updated today at 09:12"
        title="Performance this month"
        subtitle="7 active businesses · 4 formations in flight"
        actions={
          <>
            <Button>This month</Button>
            <Button variant="primary">Launch a business</Button>
          </>
        }
      />

      <div className="mx-auto flex max-w-(--container-content) flex-col gap-8 p-8">
        <MetricGrid
          items={[
            {
              label: "Monthly recurring revenue",
              value: money(mrr),
              icon: <CurrencyDollarIcon size={16} />,
              tone: "success",
              delta: { text: "18% vs last month", direction: "up" },
            },
            {
              label: "Active businesses",
              value: String(BUSINESSES.length),
              icon: <BuildingsIcon size={16} />,
              tone: "info",
              delta: { text: "2 this month", direction: "up" },
            },
            {
              label: "Formations in flight",
              value: String(inFlight.length),
              sub: `of ${BUSINESSES.length}`,
              icon: <StackIcon size={16} />,
              // Violet, not teal. MRR was green and this was teal, which sit next to each
              // other and read as the same card twice. Violet also matches what the badge
              // says: a formation in flight is mostly the collecting stage, which is violet.
              tone: "ai",
              delta: { text: "1 needs your signature", direction: "flat" },
            },
          ]}
          link={
            <Link href="/design-system/screens/businesses" className="text-body-sm text-foreground focus-visible:outline-ring inline-flex w-fit items-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2">
              Go to businesses <ArrowRightIcon size={16} />
            </Link>
          }
        />

        <ChartFrame
          title="Revenue"
          subtitle="Recurring revenue, last 6 months"
          series={[{ key: "mrr", label: "Recurring revenue", slot: 1, pattern: "solid" }]}
          footer="Setup fees are excluded. Recurring only."
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={REVENUE} margin={{ left: 4, right: 4, top: 4 }}>
              <defs>
                <linearGradient id="fill-mrr" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={seriesColor(1)} stopOpacity={AREA_FILL_TOP} />
                  <stop offset="100%" stopColor={seriesColor(1)} stopOpacity={AREA_FILL_BOTTOM} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke={GRID_STROKE} />
              <XAxis dataKey="m" {...AXIS} axisLine={false} tickLine={false} tickMargin={8} />
              <YAxis {...AXIS} axisLine={false} tickLine={false} width={52} tickFormatter={(v: number) => `$${Math.round(v / 100)}`} />
              <Tooltip
                cursor={{ stroke: GRID_STROKE }}
                content={({ active, payload, label }) =>
                  active && payload?.length ? (
                    <ChartTooltip
                      label={String(label)}
                      rows={[{ key: "mrr", name: "Recurring revenue", value: money(Number(payload[0]!.value)), slot: 1, pattern: "solid" }]}
                    />
                  ) : null
                }
              />
              {/* Solid stroke: a single series has nothing to be confused with, and §4.7
                  is explicit that the dash is for overlapping LINES, not for every chart. */}
              <Area dataKey="mrr" type={CURVE} stroke={seriesColor(1)} strokeWidth={2} fill="url(#fill-mrr)" />
            </AreaChart>
          </ResponsiveContainer>
        </ChartFrame>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_20rem]">
          <section className="flex flex-col gap-4">
            <SectionHeader title="Recent businesses" count={BUSINESSES.length} countTone="info" action={<Button>View all</Button>} />
            <div className="border-border border">
              {BUSINESSES.slice(0, 5).map((b, i) => (
                <div
                  key={b.id}
                  className={`hover:bg-accent flex items-center gap-4 px-4 py-3 transition-[background-color] duration-fast ${i > 0 ? "border-border border-t" : ""}`}
                >
                  <Avatar initials={b.owners[0]!} size="sm" tone={FORMATION_TONE[b.formation]} />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-body-sm truncate">{b.name}</span>
                    <span className="text-caption text-muted-foreground truncate">{b.state} · {b.plan}</span>
                  </div>
                  <span className="text-body-sm text-success-ink hidden font-mono sm:block">{money(b.mrrCents)}</span>
                  <StatusBadge tone={FORMATION_TONE[b.formation]}>{FORMATION_LABEL[b.formation]}</StatusBadge>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeader title="Activity" count={ACTIVITY.length} countTone="ai" action={<FileTextIcon size={16} className="text-muted-foreground" />} />
            <ActivityPanel events={ACTIVITY} />
          </section>
        </div>
      </div>
    </>
  );
}
