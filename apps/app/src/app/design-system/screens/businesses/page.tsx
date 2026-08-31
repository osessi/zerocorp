"use client";

import { useState } from "react";
import {
  MagnifyingGlassIcon, FunnelIcon, RowsIcon, TableIcon, CalendarBlankIcon,
  CaretDownIcon, CaretLeftIcon, CaretRightIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "../../_prototype/shell";
import { AvatarStack, Button, Progress, StatusBadge, Avatar, Tabs, cx } from "../../_prototype/primitives";
import { BUSINESSES, FORMATION_LABEL, FORMATION_TONE, money } from "../../_prototype/data";

/**
 * Screen 2 — DataTableLayout (§21.8).
 *
 * Toolbar order is fixed: search left, then view modes, filter carrying its active
 * count, then Options. Rows are continuous with full-width rules — no zebra, no card
 * per row. Numbers are Geist Mono. Pagination is centred with a filled active page.
 */
export default function BusinessesScreen() {
  const [tab, setTab] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);
  const allOn = selected.length === BUSINESSES.length;

  return (
    <>
      <PageHeader
        breadcrumb={<span>Businesses</span>}
        title="All businesses"
        subtitle={<span className="border-border border px-2 py-0.5">{BUSINESSES.length} businesses</span>}
        actions={
          <>
            <Button>Settings</Button>
            <Button variant="primary">Export all</Button>
          </>
        }
      />

      <div className="px-8">
        <Tabs
          items={[
            { id: "all", label: "All" },
            { id: "forming", label: "Forming", count: 4 },
            { id: "live", label: "Live", count: 3 },
          ]}
          active={tab}
          onSelect={setTab}
        />
      </div>

      <div className="flex flex-col gap-0 p-8 pt-6">
        {/* Toolbar — §21.8 */}
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <label className="border-input hover:border-input-hover focus-within:outline-ring flex h-9 min-w-0 flex-1 items-center gap-2 border px-3 transition-colors duration-normal focus-within:outline-2 focus-within:outline-offset-2">
            <MagnifyingGlassIcon size={16} className="text-muted-foreground shrink-0" />
            <input className="text-body-sm placeholder:text-muted-foreground w-full bg-transparent focus:outline-hidden" placeholder="Search businesses…" aria-label="Search businesses" />
          </label>
          <div className="border-input flex h-9 shrink-0 items-center border">
            {[RowsIcon, TableIcon, CalendarBlankIcon].map((Icon, i) => (
              <button key={i} aria-label={`View ${i + 1}`} className={cx("focus-visible:outline-ring flex size-9 items-center justify-center transition-colors duration-normal focus-visible:outline-2 focus-visible:-outline-offset-2", i === 1 ? "bg-accent" : "hover:bg-accent", i > 0 && "border-input border-l")}>
                <Icon size={16} />
              </button>
            ))}
          </div>
          <Button><FunnelIcon size={16} /> Filter <span className="bg-foreground text-background text-caption inline-flex size-4 items-center justify-center">1</span></Button>
          <Button>Options <CaretDownIcon size={14} /></Button>
        </div>

        {/* Table */}
        <div className="border-border overflow-x-auto border">
          <table className="w-full min-w-[64rem] border-collapse">
            <thead>
              <tr className="border-border border-b">
                <th className="w-12 px-4 py-3"><input type="checkbox" aria-label="Select all" checked={allOn} onChange={() => setSelected(allOn ? [] : BUSINESSES.map((b) => b.id))} className="accent-primary size-4" /></th>
                {["Business", "Founder", "State", "Plan", "MRR", "Team", "Progress", "Formation"].map((h) => (
                  <th key={h} className="text-overline text-muted-foreground px-4 py-3 text-left font-medium uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {BUSINESSES.map((b, i) => (
                <tr key={b.id} className={cx("hover:bg-accent transition-colors duration-fast", i > 0 && "border-border border-t")}>
                  <td className="px-4 py-4"><input type="checkbox" aria-label={`Select ${b.name}`} checked={selected.includes(b.id)} onChange={() => setSelected((s) => s.includes(b.id) ? s.filter((x) => x !== b.id) : [...s, b.id])} className="accent-primary size-4" /></td>
                  <td className="px-4 py-4">
                    <span className="flex items-center gap-3">
                      <Avatar initials={b.owners[0]!} />
                      <span className="text-body-sm">{b.name}</span>
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="flex flex-col">
                      <span className="text-body-sm">{b.founder}</span>
                      <span className="text-caption text-muted-foreground">{b.email}</span>
                    </span>
                  </td>
                  <td className="text-body-sm px-4 py-4">{b.state}</td>
                  <td className="text-body-sm px-4 py-4">{b.plan}</td>
                  <td className="text-body-sm px-4 py-4 font-mono">{money(b.mrrCents)}</td>
                  <td className="px-4 py-4"><AvatarStack people={b.owners} /></td>
                  <td className="px-4 py-4"><Progress value={b.progress} /></td>
                  <td className="px-4 py-4"><StatusBadge tone={FORMATION_TONE[b.formation]}>{FORMATION_LABEL[b.formation]}</StatusBadge></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination — centred, active page filled */}
        <div className="flex items-center justify-center gap-2 pt-6">
          <Button><CaretLeftIcon size={14} /> Previous</Button>
          {["1", "2", "…", "5"].map((p, i) => (
            <button key={i} className={cx("text-label focus-visible:outline-ring size-9 transition-colors duration-normal focus-visible:outline-2 focus-visible:outline-offset-2", p === "1" ? "bg-foreground text-background" : "hover:bg-accent text-muted-foreground")}>{p}</button>
          ))}
          <Button>Next <CaretRightIcon size={14} /></Button>
        </div>
      </div>
    </>
  );
}
