"use client";

import { useState } from "react";
import {
  XIcon, ChatCircleIcon, EnvelopeSimpleIcon, PhoneIcon, DotsThreeIcon,
  PlusIcon, ClockCounterClockwiseIcon, NoteIcon, SpinnerGapIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "../../_prototype/shell";
import { ActivityPanel, Avatar, Button, PanelLabel, SectionHeader, StatusBadge, cx } from "../../_prototype/primitives";
import { ACTIVITY, BUSINESSES, FORMATION_LABEL, FORMATION_TONE, money } from "../../_prototype/data";

/**
 * Screen 5 — RightDrawer (§21.13).
 *
 * Enters from the right at ~40% width over a WHITE VEIL, not a dark scrim: the page
 * stays faintly legible so the user keeps their place. Close sits on the left of the
 * header, opposite the single primary action. The body scrolls; the header does not.
 *
 * The drawer is rendered inline here rather than through a portal. Once promoted to
 * @zerocorp/ui it will use a portal — at which point §13 applies: the theme class must
 * be on document.documentElement or the drawer renders light tokens on a dark page.
 */
export default function DrawerScreen() {
  const [openId, setOpenId] = useState<string | null>("b1");
  const business = BUSINESSES.find((b) => b.id === openId) ?? null;

  return (
    <div className="relative">
      <PageHeader
        breadcrumb={<span>Businesses</span>}
        title="Formation queue"
        subtitle="Click any row to open the detail drawer"
        actions={<Button variant="primary">Export</Button>}
      />

      <div className="p-8">
        <div className="border-border border">
          {BUSINESSES.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setOpenId(b.id)}
              className={cx(
                "hover:bg-accent focus-visible:outline-ring flex w-full items-center gap-4 px-4 py-4 text-left transition-colors duration-fast focus-visible:outline-2 focus-visible:-outline-offset-2",
                i > 0 && "border-border border-t",
                openId === b.id && "bg-accent",
              )}
            >
              <Avatar initials={b.owners[0]!} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="text-body-sm truncate">{b.name}</span>
                <span className="text-caption text-muted-foreground truncate">{b.founder} · {b.state}</span>
              </span>
              <span className="text-body-sm hidden font-mono sm:block">{money(b.mrrCents)}</span>
              <StatusBadge tone={FORMATION_TONE[b.formation]}>{FORMATION_LABEL[b.formation]}</StatusBadge>
            </button>
          ))}
        </div>
      </div>

      {business ? (
        <>
          {/* White veil — the page stays legible. Not a dark scrim. */}
          <button
            aria-label="Close detail"
            onClick={() => setOpenId(null)}
            className="bg-background/80 absolute inset-0 z-40 cursor-default"
          />
          <aside
            role="dialog"
            aria-label="Business detail"
            className="border-border bg-background absolute inset-y-0 right-0 z-50 flex w-full flex-col border-l sm:w-[70%] lg:w-[40%]"
          >
            <header className="border-border flex shrink-0 items-center gap-3 border-b px-6 py-4">
              <button onClick={() => setOpenId(null)} aria-label="Close" className="hover:bg-accent focus-visible:outline-ring flex size-9 items-center justify-center transition-colors duration-normal focus-visible:outline-2 focus-visible:-outline-offset-2">
                <XIcon size={20} />
              </button>
              <h2 className="text-h4 flex-1">Business detail</h2>
              <Button variant="primary">Open full record</Button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar initials={business.owners[0]!} size="lg" />
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="text-h4 truncate">{business.name}</h3>
                    <p className="text-body-sm text-muted-foreground truncate">{business.email}</p>
                  </div>
                </div>
                <span className="flex shrink-0 items-center gap-1">
                  {[ChatCircleIcon, EnvelopeSimpleIcon, PhoneIcon, DotsThreeIcon].map((Icon, i) => (
                    <button key={i} aria-label={`Action ${i + 1}`} className="border-input hover:border-input-hover focus-visible:outline-ring flex size-9 items-center justify-center border transition-colors duration-normal focus-visible:outline-2 focus-visible:outline-offset-2">
                      <Icon size={16} />
                    </button>
                  ))}
                </span>
              </div>

              {/* Metadata grid — same device as MetricGrid, smaller scale */}
              <div className="border-border grid grid-cols-2 divide-x divide-y divide-(--border) border sm:grid-cols-4 sm:divide-y-0">
                {[
                  { label: "Founder", value: business.founder },
                  { label: "State", value: business.state },
                  { label: "Plan", value: business.plan },
                  { label: "MRR", value: money(business.mrrCents), mono: true },
                ].map((m) => (
                  <div key={m.label} className="flex flex-col gap-1 p-3">
                    <span className="text-caption text-muted-foreground">{m.label}</span>
                    <span className={cx("text-body-sm truncate", m.mono && "font-mono")}>{m.value}</span>
                  </div>
                ))}
              </div>

              <div className="border-border flex flex-col gap-3 border p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-body-sm flex items-center gap-2">
                    <SpinnerGapIcon size={16} className="text-muted-foreground" /> Formation progress
                  </span>
                  <span className="text-body-sm font-mono">{business.progress}%</span>
                </div>
                <span className="bg-muted h-1.5 w-full" aria-hidden="true">
                  <span className="bg-primary block h-full" style={{ width: `${business.progress}%` }} />
                </span>
                <p className="text-caption text-muted-foreground">
                  Next: {FORMATION_LABEL[business.formation]}
                </p>
              </div>

              <div className="border-border flex flex-col gap-4 border-t pt-6">
                <SectionHeader title="Latest activity" count={ACTIVITY.length} action={<Button><ClockCounterClockwiseIcon size={16} /> View all</Button>} />
                <ActivityPanel events={ACTIVITY.slice(0, 3)} />
              </div>

              <div className="border-border flex flex-col gap-4 border-t pt-6">
                <SectionHeader title="Notes" count={2} action={<Button><PlusIcon size={16} /> Add note</Button>} />
                <article className="border-border flex flex-col gap-3 border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-body-sm flex items-center gap-2"><NoteIcon size={16} className="text-muted-foreground" /> Note by Operations</span>
                    <span className="text-caption text-muted-foreground">Today 08:40</span>
                  </div>
                  <p className="text-body-sm text-muted-foreground">
                    Articles filed with Wyoming. SS-4 prepared; EIN request goes out once the
                    registered agent confirms the filing number.
                  </p>
                </article>
              </div>

              <PanelLabel>Prototype — RightDrawer is PROPOSED, not approved</PanelLabel>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
