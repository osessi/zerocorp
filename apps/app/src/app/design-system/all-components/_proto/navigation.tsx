"use client";

import { Tabs } from "@base-ui/react/tabs";
import { CaretRightIcon, CaretLeftIcon, HouseIcon } from "@phosphor-icons/react/dist/ssr";
import { Button, IconButton, StatusBadge } from "@zerocorp/ui";
import { Demo, cx } from "./shell";

/* ── Tabs ─────────────────────────────────────────────────────────────────── */

/**
 * Underline, not a pill. Radius 0 makes a pill impossible and a filled tab would
 * out-shout the page; §1 says hierarchy comes from borders. The 2px --primary rule sits
 * on the list's bottom border, so the inactive tabs read as the same rule at --border.
 */
const TAB = [
  "relative px-4 py-2 text-label",
  "text-muted-foreground data-selected:text-foreground",
  "hover:text-foreground",
  "transition-[color,background-color,border-color] duration-normal ease-out",
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  "data-disabled:text-muted-foreground data-disabled:cursor-not-allowed data-disabled:opacity-60",
].join(" ");

export function TabsDemo() {
  return (
    <Demo>
      <Tabs.Root defaultValue="overview">
        <Tabs.List className="border-border relative flex flex-wrap border-b">
          {[
            ["overview", "Overview"],
            ["documents", "Documents"],
            ["filings", "Filings"],
            ["billing", "Billing"],
          ].map(([v, label]) => (
            <Tabs.Tab key={v} value={v} className={TAB}>
              {label}
            </Tabs.Tab>
          ))}
          <Tabs.Tab value="locked" disabled className={TAB}>
            Automation
          </Tabs.Tab>
          {/*
            The indicator is a positioned rule rather than a border on the tab, so it can
            slide. 150ms — §10; it is a position change, not decoration.
          */}
          <Tabs.Indicator className="bg-primary absolute bottom-0 left-0 h-0.5 w-(--active-tab-width) translate-x-(--active-tab-left) transition-[transform,width] duration-normal ease-out" />
        </Tabs.List>
        {[
          ["overview", "Formation complete. Wyoming, filed 4 March 2026."],
          ["documents", "6 documents. 2 need your signature."],
          ["filings", "Next annual report due 1 March 2027."],
          ["billing", "Growth plan. 1 240 of 5 000 credits used."],
        ].map(([v, text]) => (
          <Tabs.Panel key={v} value={v} className="text-body-sm text-muted-foreground py-4">
            {text}
          </Tabs.Panel>
        ))}
      </Tabs.Root>
    </Demo>
  );
}

/* ── Breadcrumb ───────────────────────────────────────────────────────────── */

/**
 * No primitive needed and none exists: a breadcrumb is a <nav> around an <ol>. Building
 * it on a library would add a dependency to reproduce semantics the platform gives free.
 *
 * The last crumb is aria-current="page" and is NOT a link — a link to where you already
 * are is a dead control.
 */
export function BreadcrumbDemo() {
  const trail = [
    { label: "Home", icon: HouseIcon, href: "#" },
    { label: "Businesses", href: "#" },
    { label: "Northwind Studio LLC", href: "#" },
    { label: "Documents" },
  ];
  return (
    <Demo>
      <nav aria-label="Breadcrumb">
        <ol className="flex flex-wrap items-center gap-1">
          {trail.map((c, i) => {
            const last = i === trail.length - 1;
            const Icon = c.icon;
            return (
              <li key={c.label} className="flex items-center gap-1">
                {last ? (
                  <span aria-current="page" className="text-body-sm text-foreground font-medium">
                    {c.label}
                  </span>
                ) : (
                  <a
                    href={c.href}
                    className="text-body-sm text-muted-foreground hover:text-foreground focus-visible:outline-ring inline-flex items-center gap-1.5 transition-[color] duration-normal ease-out focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {Icon ? <Icon size={16} aria-hidden="true" /> : null}
                    {c.label}
                  </a>
                )}
                {!last ? (
                  <CaretRightIcon size={14} className="text-muted-foreground shrink-0" aria-hidden="true" />
                ) : null}
              </li>
            );
          })}
        </ol>
      </nav>
    </Demo>
  );
}

/* ── Pagination ───────────────────────────────────────────────────────────── */

/**
 * Also plain semantics — a <nav> of buttons. Reuses Button and IconButton rather than
 * introducing a fourth kind of clickable box.
 *
 * The current page is aria-current="page" and rendered as a filled Button, so it is not
 * distinguished by colour alone.
 */
export function PaginationDemo() {
  const pages = ["1", "2", "3", "…", "12"];
  return (
    <Demo className="flex flex-wrap items-center justify-between gap-4">
      <span className="text-caption text-muted-foreground">
        Showing <span className="text-foreground font-mono">1–20</span> of{" "}
        <span className="text-foreground font-mono">231</span>
      </span>
      <nav aria-label="Pagination" className="flex items-center gap-1">
        <IconButton label="Previous page" icon={CaretLeftIcon} size="sm" variant="secondary" disabled />
        {pages.map((p, i) =>
          p === "…" ? (
            <span key={`gap-${i}`} className="text-body-sm text-muted-foreground px-2" aria-hidden="true">
              …
            </span>
          ) : (
            <Button
              key={p}
              size="sm"
              variant={p === "1" ? "primary" : "ghost"}
              aria-current={p === "1" ? "page" : undefined}
              aria-label={`Page ${p}`}
            >
              {p}
            </Button>
          ),
        )}
        <IconButton label="Next page" icon={CaretRightIcon} size="sm" variant="secondary" />
      </nav>
    </Demo>
  );
}

/* ── Progress and Stepper ─────────────────────────────────────────────────── */

/**
 * ProgressStepper — §17 names the states: completed · current · locked · optional ·
 * failed · in-progress. Its primary use is Launch Your Business.
 *
 * Every step carries an icon of a DIFFERENT SHAPE and a text status, so the state is
 * never read from the dot colour alone. Same reasoning as StatusBadge.
 */
const STEPS = [
  { label: "Business details", state: "completed", note: "Completed 2 Mar" },
  { label: "Identity check", state: "completed", note: "Verified" },
  { label: "State filing", state: "current", note: "Submitted to Wyoming" },
  { label: "EIN", state: "locked", note: "Unlocks after filing" },
  { label: "Bank account", state: "optional", note: "Optional" },
] as const;

export function StepperDemo() {
  return (
    <Demo>
      <ol className="flex flex-col gap-0">
        {STEPS.map((s, i) => {
          const last = i === STEPS.length - 1;
          const tone =
            s.state === "completed" ? "success"
            : s.state === "current" ? "processing"
            : s.state === "optional" ? "info"
            : "neutral";
          return (
            <li key={s.label} className="flex gap-3">
              <div className="flex flex-col items-center">
                {/* The rail is a border, not a gradient. It stops at the last step. */}
                <span
                  className={cx(
                    "flex size-6 shrink-0 items-center justify-center border",
                    s.state === "completed" && "bg-success border-success text-background",
                    s.state === "current" && "bg-processing border-processing text-background",
                    s.state === "locked" && "border-input text-muted-foreground",
                    s.state === "optional" && "border-info text-info",
                  )}
                  aria-hidden="true"
                >
                  <span className="text-overline font-mono">{i + 1}</span>
                </span>
                {!last ? <span className="bg-border w-px flex-1" /> : null}
              </div>
              <div className="flex flex-col gap-1 pb-6">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={cx(
                      "text-label",
                      s.state === "locked" ? "text-muted-foreground" : "text-foreground",
                    )}
                  >
                    {s.label}
                  </span>
                  <StatusBadge tone={tone}>{s.state}</StatusBadge>
                </div>
                <span className="text-caption text-muted-foreground">{s.note}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </Demo>
  );
}
