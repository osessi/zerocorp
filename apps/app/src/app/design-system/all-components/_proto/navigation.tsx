"use client";

import { Tabs } from "@base-ui/react/tabs";
import { CaretRightIcon, CaretLeftIcon, HouseIcon } from "@phosphor-icons/react/dist/ssr";
import type { FormationOrderStatus } from "@zerocorp/contracts";
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
 * ProgressStepper — Launch Your Business.
 *
 * The steps are DERIVED from `formation_orders.status`, not written out beside it. This
 * screen is that state machine rendered, and a hand-kept parallel list is how the
 * repository ended up with three of them (D2).
 *
 * `cancelled` and `rejected` are not steps. A stepper shows a path forward; `rejected`
 * is a detour the founder must clear and is surfaced as an Alert on the step that caused
 * it, and `cancelled` ends the journey rather than advancing it.
 *
 * **The EIN is not a step either** — that is the whole point of D2. It is an IRS filing
 * on its own clock, and putting it in this line would make the founder think the company
 * is not finished when it legally is. It sits beside the stepper as its own track.
 */
/*
  `satisfies`, not a type annotation. It proves every entry is a real contract state while
  keeping the narrow literal union — so the label and note maps below are checked against
  the seven STEPS, not against all nine statuses. Annotating it FormationOrderStatus[]
  demanded labels for `rejected` and `cancelled`, which is the compiler correctly refusing
  to let a stepper pretend a detour is a step.
*/
const STEP_ORDER = [
  "draft",
  "collecting_documents",
  "verifying_identity",
  "operator_review",
  "ready_to_file",
  "filed",
  "formed",
] as const satisfies readonly FormationOrderStatus[];

type Step = (typeof STEP_ORDER)[number];

const STEP_LABEL: Record<Step, string> = {
  draft: "Business details",
  collecting_documents: "Documents",
  verifying_identity: "Identity check",
  operator_review: "Review",
  ready_to_file: "Ready to file",
  filed: "Filed with the state",
  formed: "Formed",
};

const STEP_NOTE: Record<Step, string> = {
  draft: "Name, state and members",
  collecting_documents: "Passport and proof of address",
  verifying_identity: "Verified 1 Mar",
  operator_review: "A ZeroCorp operator checks the filing",
  ready_to_file: "Queued for Wyoming",
  filed: "Submitted 2 Mar · ref WY-2026-88214",
  formed: "Certificate issued",
};

export function StepperDemo() {
  // Where this founder actually is.
  const current: Step = "filed";
  const at = STEP_ORDER.indexOf(current);

  return (
    <div className="flex flex-col gap-4">
      <Demo>
        <ol className="flex flex-col gap-0">
          {STEP_ORDER.map((step, i) => {
            const last = i === STEP_ORDER.length - 1;
            const state = i < at ? "completed" : i === at ? "current" : "locked";
            const tone = state === "completed" ? "success" : state === "current" ? "processing" : "neutral";
            return (
              <li key={step} className="flex gap-3">
                <div className="flex flex-col items-center">
                  <span
                    className={cx(
                      "flex size-6 shrink-0 items-center justify-center border",
                      state === "completed" && "bg-success border-success text-background",
                      state === "current" && "bg-processing border-processing text-background",
                      state === "locked" && "border-input text-muted-foreground",
                    )}
                    aria-hidden="true"
                  >
                    <span className="text-overline font-mono">{i + 1}</span>
                  </span>
                  {!last ? <span className="bg-border w-px flex-1" /> : null}
                </div>
                <div className="flex flex-col gap-1 pb-6">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={cx("text-label", state === "locked" ? "text-muted-foreground" : "text-foreground")}>
                      {STEP_LABEL[step]}
                    </span>
                    <StatusBadge tone={tone}>{state}</StatusBadge>
                    <span className="text-caption text-muted-foreground font-mono">{step}</span>
                  </div>
                  <span className="text-caption text-muted-foreground">{STEP_NOTE[step]}</span>
                </div>
              </li>
            );
          })}
        </ol>
      </Demo>

      {/*
        The EIN track, deliberately outside the stepper. D2: it is an IRS filing on its
        own clock and it fails on its own. A founder whose company is formed but whose EIN
        is still pending must be able to see both facts at once, not one blocking the
        other.
      */}
      <Demo className="flex flex-wrap items-center gap-x-6 gap-y-2">
        <span className="text-caption text-muted-foreground w-40 shrink-0">EIN — separate track</span>
        <div className="flex flex-wrap items-center gap-3">
          <StatusBadge tone="neutral">not_started</StatusBadge>
          <CaretRightIcon size={12} className="text-muted-foreground" aria-hidden="true" />
          <StatusBadge tone="processing">requested</StatusBadge>
          <CaretRightIcon size={12} className="text-muted-foreground" aria-hidden="true" />
          <StatusBadge tone="success">issued</StatusBadge>
          <span className="text-caption text-muted-foreground">· usually 2–6 weeks after formation</span>
        </div>
      </Demo>
    </div>
  );
}
