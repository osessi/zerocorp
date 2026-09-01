"use client";

import { useEffect, useState } from "react";
import {
  XIcon, ChatCircleIcon, EnvelopeSimpleIcon, PhoneIcon, DotsThreeIcon,
  PlusIcon, ClockCounterClockwiseIcon, NoteIcon, SpinnerGapIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "../../_prototype/shell";
import { ActivityPanel, Avatar, Button, PanelLabel, SectionHeader, StatusBadge, cx } from "../../_prototype/primitives";
import { ACTIVITY, BUSINESSES, FIELD_INK, FORMATION_LABEL, FORMATION_TONE, PLAN_TONE, PROGRESS_FILL, PROGRESS_INK, STATE_TONE, money, progressTone } from "../../_prototype/data";

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

  // A dialog closes on Escape. Non-negotiable (§14).
  useEffect(() => {
    if (!openId) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpenId(null); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openId]);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PageHeader
        breadcrumb={<span>Businesses</span>}
        title="Formation queue"
        subtitle="Click any row to open the detail drawer"
        actions={<Button variant="primary">Export</Button>}
      />

      <div className="min-h-0 flex-1 overflow-y-auto p-8">
        <div className="border-border border">
          {BUSINESSES.map((b, i) => (
            <button
              key={b.id}
              onClick={() => setOpenId(b.id)}
              className={cx(
                "hover:bg-accent focus-visible:outline-ring flex w-full items-center gap-4 px-4 py-4 text-left transition-[color,background-color,border-color] duration-fast focus-visible:outline-2 focus-visible:-outline-offset-2",
                i > 0 && "border-border border-t",
                openId === b.id && "bg-accent",
              )}
            >
              <Avatar initials={b.owners[0]!} tone={FORMATION_TONE[b.formation]} />
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
          {/*
            fixed, not absolute: the veil and the drawer cover the WHOLE window —
            sidebar and top command bar included — as the reference does. Anchoring them
            to the content column left the drawer starting under the top bar and cut off
            at the bottom. Found in review 2026-08-31.
          */}
          <button
            aria-label="Close detail"
            onClick={() => setOpenId(null)}
            className="bg-background/80 fixed inset-0 z-40 cursor-default"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Business detail"
            className="border-border bg-background fixed inset-y-0 right-0 z-50 flex w-full flex-col border-l sm:w-[70%] lg:w-[40%]"
          >
            <header className="border-border flex shrink-0 items-center gap-3 border-b px-6 py-4">
              <button onClick={() => setOpenId(null)} aria-label="Close" className="hover:bg-accent focus-visible:outline-ring flex size-9 items-center justify-center transition-[color,background-color,border-color] duration-normal focus-visible:outline-2 focus-visible:-outline-offset-2">
                <XIcon size={20} />
              </button>
              <h2 className="text-h4 flex-1">Business detail</h2>
              <Button variant="primary">Open full record</Button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="flex min-w-0 items-center gap-3">
                  <Avatar initials={business.owners[0]!} size="lg" tone={FORMATION_TONE[business.formation]} />
                  <div className="flex min-w-0 flex-col gap-1">
                    <h3 className="text-h4 truncate">{business.name}</h3>
                    <p className="text-body-sm text-muted-foreground truncate">{business.email}</p>
                  </div>
                </div>
                {/*
                  Four grey squares with grey glyphs, labelled "Action 1" through
                  "Action 4". They read as one control repeated, and a screen reader got
                  nothing at all. Each channel now carries its own tint and its own name,
                  so message, mail and call are three things rather than three buttons.
                */}
                <span className="flex shrink-0 items-center gap-1">
                  {([
                    { Icon: ChatCircleIcon, label: "Send a message", tone: "bg-info-subtle border-info text-info-ink hover:bg-info-subtle" },
                    { Icon: EnvelopeSimpleIcon, label: "Send an email", tone: "bg-processing-subtle border-processing text-processing-ink" },
                    { Icon: PhoneIcon, label: "Call", tone: "bg-success-subtle border-success text-success-ink" },
                    { Icon: DotsThreeIcon, label: "More actions", tone: "border-border text-muted-foreground hover:bg-accent" },
                  ] as const).map(({ Icon, label, tone }) => (
                    <button
                      key={label}
                      aria-label={label}
                      title={label}
                      className={cx(
                        "focus-visible:outline-ring flex size-9 items-center justify-center border",
                        "transition-[color,background-color,border-color] duration-normal",
                        "focus-visible:outline-2 focus-visible:outline-offset-2",
                        tone,
                      )}
                    >
                      <Icon size={16} />
                    </button>
                  ))}
                </span>
              </div>

              {/*
                The same record vocabulary as the All businesses table, read from one map
                in _prototype/data.ts. A founder who learns "Wyoming is violet" in the list
                and finds it grey here has learned nothing: the mapping is only worth having
                if it holds everywhere. The label wears the field ink; State and Plan wear
                the same chips they wear in the table.
              */}
              <div className="border-border grid grid-cols-2 divide-x divide-y divide-(--border) border sm:grid-cols-4 sm:divide-y-0">
                {([
                  { label: "Founder", value: business.founder },
                  { label: "State", value: business.state, chip: STATE_TONE[business.state] },
                  { label: "Plan", value: business.plan, chip: PLAN_TONE[business.plan] },
                  { label: "MRR", value: money(business.mrrCents), mono: true },
                ] as const).map((m) => (
                  <div key={m.label} className="flex flex-col gap-1.5 p-3">
                    <span className={cx("text-overline uppercase", FIELD_INK[m.label])}>{m.label}</span>
                    {"chip" in m && m.chip ? (
                      <span className={cx("text-caption w-fit border px-2 py-0.5 whitespace-nowrap", m.chip)}>
                        {m.value}
                      </span>
                    ) : (
                      <span
                        className={cx(
                          "text-body-sm truncate",
                          "mono" in m && m.mono ? "text-success-ink font-mono" : "text-foreground",
                        )}
                      >
                        {m.value}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="border-border flex flex-col gap-3 border p-4">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-body-sm flex items-center gap-2">
                    <SpinnerGapIcon size={16} className="text-muted-foreground" /> Formation progress
                  </span>
                  <span className={cx("text-body-sm font-mono", PROGRESS_INK[progressTone(business.progress)])}>
                    {business.progress}%
                  </span>
                </div>
                {/* Same rule as the table's Progress column, read from one place: under
                    50 behind, under 75 moving, 75 and up landing. This bar was --primary
                    at every value, so 12% and 94% looked equally healthy. */}
                <span className="bg-muted border-border h-1.5 w-full border" aria-hidden="true">
                  <span
                    className={cx("block h-full", PROGRESS_FILL[progressTone(business.progress)])}
                    style={{ width: `${business.progress}%` }}
                  />
                </span>
                <p className="text-caption text-muted-foreground">
                  Next: {FORMATION_LABEL[business.formation]}
                </p>
              </div>

              <div className="border-border flex flex-col gap-4 border-t pt-6">
                <SectionHeader title="Latest activity" count={ACTIVITY.length} countTone="ai" action={<Button><ClockCounterClockwiseIcon size={16} /> View all</Button>} />
                <ActivityPanel events={ACTIVITY.slice(0, 3)} />
              </div>

              <div className="border-border flex flex-col gap-4 border-t pt-6">
                <SectionHeader title="Notes" count={2} countTone="warning" action={<Button><PlusIcon size={16} /> Add note</Button>} />
                {/*
                  A note is somebody's hand-written aside in a screen otherwise full of
                  machine-generated fact, so it gets the wash rather than blending in.
                  Warning-yellow because it is the colour of a sticky note, not because
                  anything is wrong: the icon and the byline carry the meaning.
                */}
                <article className="border-warning bg-warning-wash flex flex-col gap-3 border p-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-body-sm text-foreground flex items-center gap-2"><NoteIcon size={16} className="text-warning-ink" /> Note by Operations</span>
                    <span className="text-caption text-muted-foreground">Today 08:40</span>
                  </div>
                  <p className="text-body-sm text-muted-foreground">
                    Articles filed with Wyoming. SS-4 prepared; EIN request goes out once the
                    registered agent confirms the filing number.
                  </p>
                </article>
              </div>

              <PanelLabel>Prototype: RightDrawer is PROPOSED, not approved</PanelLabel>
            </div>
          </aside>
        </>
      ) : null}
    </div>
  );
}
