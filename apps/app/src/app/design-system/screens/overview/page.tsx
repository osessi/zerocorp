"use client";

import Link from "next/link";
import { ArrowRightIcon, BuildingsIcon, CurrencyDollarIcon, FileTextIcon, StackIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "../../_prototype/shell";
import { ActivityPanel, Button, MetricGrid, SectionHeader, StatusBadge, Avatar } from "../../_prototype/primitives";
import { FORMATION_ORDER_TERMINAL } from "@zerocorp/contracts";
import { ACTIVITY, BUSINESSES, FORMATION_LABEL, FORMATION_TONE, money } from "../../_prototype/data";

/**
 * Screen 1 — Overview.
 *
 * Composes: PageHeader · MetricGrid · SectionHeader · ActivityPanel · a compact list.
 *
 * The chart region is a deliberate placeholder. Chart tokens — series colours, axes,
 * grid, empty and loading states — are open item 14 (§21.14). Building a chart from a
 * screenshot taken at an angle would be guessing.
 */
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
              icon: <CurrencyDollarIcon size={14} />,
              tone: "success",
              delta: { text: "18% vs last month", direction: "up" },
            },
            {
              label: "Active businesses",
              value: String(BUSINESSES.length),
              icon: <BuildingsIcon size={14} />,
              tone: "info",
              delta: { text: "2 this month", direction: "up" },
            },
            {
              label: "Formations in flight",
              value: String(inFlight.length),
              sub: `of ${BUSINESSES.length}`,
              icon: <StackIcon size={14} />,
              tone: "processing",
              delta: { text: "1 needs your signature", direction: "flat" },
            },
          ]}
          link={
            <Link href="/design-system/screens/businesses" className="text-body-sm text-foreground focus-visible:outline-ring inline-flex w-fit items-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2">
              Go to businesses <ArrowRightIcon size={14} />
            </Link>
          }
        />

        {/* Chart placeholder — see the note above and §21.14 */}
        <section className="flex flex-col gap-4">
          <SectionHeader title="Revenue" subtitle="Recurring revenue by plan" action={<Button>See all</Button>} />
          <div className="border-border flex h-56 flex-col items-center justify-center gap-2 border">
            <p className="text-body-sm text-muted-foreground">Chart region</p>
            <p className="text-caption text-muted-foreground">
              Chart tokens are open item 14 — not derivable from the reference
            </p>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_20rem]">
          <section className="flex flex-col gap-4">
            <SectionHeader title="Recent businesses" count={BUSINESSES.length} action={<Button>View all</Button>} />
            <div className="border-border border">
              {BUSINESSES.slice(0, 5).map((b, i) => (
                <div key={b.id} className={`flex items-center gap-4 px-4 py-3 ${i > 0 ? "border-border border-t" : ""}`}>
                  <Avatar initials={b.owners[0]!} size="sm" />
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="text-body-sm truncate">{b.name}</span>
                    <span className="text-caption text-muted-foreground truncate">{b.state} · {b.plan}</span>
                  </div>
                  <span className="text-body-sm hidden font-mono sm:block">{money(b.mrrCents)}</span>
                  <StatusBadge tone={FORMATION_TONE[b.formation]}>{FORMATION_LABEL[b.formation]}</StatusBadge>
                </div>
              ))}
            </div>
          </section>

          <section className="flex flex-col gap-4">
            <SectionHeader title="Activity" action={<FileTextIcon size={16} className="text-muted-foreground" />} />
            <ActivityPanel events={ACTIVITY} />
          </section>
        </div>
      </div>
    </>
  );
}
