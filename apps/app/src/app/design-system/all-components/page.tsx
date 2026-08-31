"use client";

import { useEffect, useState } from "react";
import { Button, Skeleton, SkeletonText, Spinner } from "@zerocorp/ui";
import { Arbitration, Demo, Row, Section, cx } from "./_proto/shell";
import {
  CommandDemo,
  DialogDemo,
  DrawerDemo,
  MenuDemo,
  PopoverDemo,
  TooltipDemo,
} from "./_proto/overlays";
import { BreadcrumbDemo, PaginationDemo, StepperDemo, TabsDemo } from "./_proto/navigation";
import { AlertDemo, EmptyStateDemo, ProgressDemo, ToastDemo } from "./_proto/feedback";
import {
  ActivityFeedDemo,
  CardDemo,
  DataTableDemo,
  MetricGridDemo,
  TimelineDemo,
} from "./_proto/data";
import {
  AIReviewDemo,
  BillingDemo,
  BusinessStatusDemo,
  CreditMeterDemo,
  LeadPipelineDemo,
} from "./_proto/zerocorp";

/**
 * All components — the exploration pass, 2026-08-31.
 *
 * explore → compare → preview → surface the decisions. NOT a validation pass. Nothing on
 * this page enters packages/ui or the §19 registry until it is reviewed on its own.
 *
 * Source policy for this pass, and it is a deviation worth stating: §18 names Shadcn
 * Studio as the primary source, but Shadcn Studio ships Tailwind blocks built on Radix,
 * and §18's own licence gate forbids copying anything before its licence is read. §2
 * already resolved the primitive layer to **Base UI — which is now the shadcn/ui
 * default**. So these prototypes are built on Base UI (MIT, already in the tree) with
 * shadcn and Shadcn Studio used as STRUCTURAL reference only, never as copied code.
 * Same lineage, no licence debt.
 */

const NAV = [
  ["Overlays", ["tooltip", "menu", "popover", "dialog", "drawer", "command"]],
  ["Navigation", ["tabs", "breadcrumb", "pagination", "stepper"]],
  ["Feedback", ["alert", "toast", "progress", "spinner", "skeleton", "empty"]],
  ["Data", ["card", "table", "timeline", "activity", "metrics"]],
  ["ZeroCorp", ["credits", "status", "billing", "leads", "ai"]],
  ["Undecided", ["calendar", "chart"]],
] as const;

export default function AllComponentsPage() {
  const [dark, setDark] = useState(false);
  const [grey, setGrey] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className={cx("mx-auto flex min-w-0 max-w-(--container-content) flex-col gap-12 p-4 sm:p-8", grey && "grayscale")}>
        <header className="border-border flex flex-col gap-4 border-b pb-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <h1 className="text-h2">All components</h1>
              <p className="text-body-sm text-muted-foreground max-w-2xl">
                Exploration pass. Built on Base UI — the primitive layer §2 resolved, and now
                the shadcn/ui default — with shadcn as structural reference only, never
                copied code. Nothing here is in the §19 registry yet.
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button onClick={() => setGrey((g) => !g)}>{grey ? "Colour" : "Greyscale"}</Button>
              <Button onClick={() => setDark((d) => !d)}>{dark ? "Light" : "Dark"}</Button>
            </div>
          </div>
          <nav aria-label="Components" className="flex flex-wrap gap-x-6 gap-y-2">
            {NAV.map(([group, items]) => (
              <div key={group} className="flex flex-wrap items-center gap-2">
                <span className="text-overline text-muted-foreground uppercase">{group}</span>
                {items.map((i) => (
                  <a
                    key={i}
                    href={`#${i}`}
                    // inline-flex + py-1 takes a 16px line box to a 24px target. WCAG
                    // 2.5.8 applies to the page's own furniture too.
                    className="text-caption text-muted-foreground hover:text-foreground focus-visible:outline-ring inline-flex min-h-6 items-center py-1 transition-[color] duration-normal ease-out focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {i}
                  </a>
                ))}
              </div>
            ))}
          </nav>
        </header>

        <Section id="tooltip" title="Tooltip" source="@base-ui/react/tooltip"
          note="Inverted surface — the one element that must read as “not the page”. 400ms delay, set on the Provider so a screen agrees with itself.">
          <TooltipDemo />
        </Section>

        <Section id="menu" title="Dropdown menu" source="@base-ui/react/menu"
          note="Reuses the Select popup idiom exactly — same item rules, same selected treatment, same edge. Submenu, radio group and checkbox items included.">
          <MenuDemo />
        </Section>

        <Section id="popover" title="Popover" source="@base-ui/react/popover"
          note="Same surface as Menu. Shown as the notification centre, which is the first real use.">
          <PopoverDemo />
        </Section>

        <Section id="dialog" title="Dialog" source="@base-ui/react/dialog"
          note="Backdrop at --foreground/40 so it flips with the theme. Destructive confirmation is the canonical case.">
          <DialogDemo />
        </Section>

        <Section id="drawer" title="Sheet / Drawer" source="@base-ui/react/drawer" status="blocked"
          note="Base UI 1.7 ships a real Drawer. Width and motion are §24.13 and still open — max-w-md here is a proposal, not a decision.">
          <DrawerDemo />
        </Section>

        <Section id="command" title="Command menu" source="Dialog + input, no new dependency"
          note="cmdk is the usual answer and would be a second overlay system. This is the Dialog we already have with a filtered list inside.">
          <CommandDemo />
        </Section>

        <Section id="tabs" title="Tabs" source="@base-ui/react/tabs"
          note="Underline, never a pill — radius 0 makes a pill impossible and a filled tab out-shouts the page. The indicator slides; §10.">
          <TabsDemo />
        </Section>

        <Section id="breadcrumb" title="Breadcrumb" source="nav + ol, no primitive"
          note="The platform gives the semantics free. The last crumb is aria-current and is not a link — a link to where you are is a dead control.">
          <BreadcrumbDemo />
        </Section>

        <Section id="pagination" title="Pagination" source="nav + Button, no primitive"
          note="Reuses Button and IconButton rather than adding a fourth clickable box. The current page is a filled Button, so it is not marked by colour alone.">
          <PaginationDemo />
        </Section>

        <Section id="stepper" title="Progress stepper" source="composition"
          note="§17 states: completed · current · locked · optional · failed. Numbered because it is a sequence you complete. Primary use is Launch Your Business.">
          <StepperDemo />
        </Section>

        <Section id="alert" title="Alert" source="composition + one shared tone map"
          note="role=alert for danger and warning, role=status for the rest. The title carries the tone colour; the body stays --foreground.">
          <AlertDemo />
        </Section>

        <Section id="toast" title="Toast" source="@base-ui/react/toast"
          note="Same tone map as Alert and StatusBadge — one status system, three surfaces. Transient, and never the only record of anything.">
          <ToastDemo />
        </Section>

        <Section id="progress" title="Progress" source="@base-ui/react/progress"
          note="A task advancing. Distinct from Meter, which is a measurement in a known range — see Credits.">
          <ProgressDemo />
        </Section>

        <Section id="spinner" title="Spinner" source="packages/ui/src/feedback/Spinner.tsx" status="registered"
          note="Already registered. Shown for completeness.">
          <Demo>
            <Row label="sizes">
              {[16, 20, 24, 32].map((s) => <Spinner key={s} size={s as 16} />)}
            </Row>
            <div className="mt-4">
              <Row label="with a name">
                <span className="text-body-sm inline-flex items-center gap-2">
                  <Spinner size={16} label="Checking availability" /> Checking availability
                </span>
              </Row>
            </div>
          </Demo>
        </Section>

        <Section id="skeleton" title="Skeleton" source="packages/ui/src/feedback/Skeleton.tsx" status="registered"
          note="Already registered. Sized by the caller so it occupies exactly the space its content will.">
          <Demo className="flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Skeleton className="size-8" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-5 w-24" />
            </div>
            <SkeletonText lines={3} className="max-w-md" />
          </Demo>
        </Section>

        <Section id="empty" title="Empty state" source="composition"
          note="What is missing, why, and the one action that fixes it. No illustration — an empty screen is usually someone stuck.">
          <EmptyStateDemo />
        </Section>

        <Section id="card" title="Card" source="a bordered div"
          note="Deliberately not a component. A border and padding is not an abstraction worth a file, and shipping Card invites CardHeader / CardTitle / CardFooter.">
          <CardDemo />
        </Section>

        <Section id="table" title="Data table" source="table element, hand-rolled" status="blocked"
          note="§24.12 leaves row height, column widths, hover and click target open. Settled regardless: every comparable number is Geist Mono, and the table scrolls rather than truncating a name.">
          <DataTableDemo />
        </Section>

        <Section id="timeline" title="Timeline" source="composition"
          note="Same rail as the Stepper. Timestamped rather than numbered, because these are things that happened, not steps you complete.">
          <TimelineDemo />
        </Section>

        <Section id="activity" title="Activity feed" source="composition"
          note="§17: event · actor · time · status · action. Human and agent get different glyphs — a run must never be mistaken for a decision.">
          <ActivityFeedDemo />
        </Section>

        <Section id="metrics" title="Metric grid" source="composition"
          note="One of the twelve §21 patterns still PROPOSED (§24.8). Previewed, not approved.">
          <MetricGridDemo />
        </Section>

        <Section id="credits" title="Credit / usage meter" source="@base-ui/react/meter"
          note="Meter, not Progress: a balance is a measurement in a range, not a task completing. The reset date sits beside the number — a balance with no reset date is how a credit meter misleads.">
          <CreditMeterDemo />
        </Section>

        <Section id="status" title="Business status" source="composition"
          note="§17: one card shape reused for Company, Website, Domain, Email, Marketing, Leads, Automation. Never seven cards.">
          <BusinessStatusDemo />
        </Section>

        <Section id="billing" title="Billing" source="composition + Intl.NumberFormat"
          note="Money is integer minor units and a currency — a product invariant. Formatted with Intl so a locale is data, not a rewrite.">
          <BillingDemo />
        </Section>

        <Section id="leads" title="Lead pipeline" source="composition"
          note="Read-only columns, not a drag-and-drop board: §24.8 has approved no board pattern, and drag-only would fail keyboard access.">
          <LeadPipelineDemo />
        </Section>

        <Section id="ai" title="AI generation and review" source="composition"
          note="Always three things: what was generated, what it was generated FROM, and the decision. An approve with no visible source is a rubber stamp.">
          <AIReviewDemo />
        </Section>

        <Section id="calendar" title="Calendar / Date picker" source="nothing covers it" status="blocked"
          note="Not built. This one genuinely needs your call.">
          <Arbitration title="Base UI has no calendar primitive">
            <p>
              Base UI 1.7 ships tooltip, menu, dialog, drawer, toast, popover, tabs, meter,
              progress, combobox — and no calendar. Neither does the registry. Every option
              is a real trade-off, so nothing was coded.
            </p>
            <p>
              It matters more than it looks: formation dates, annual-report deadlines and
              content scheduling all need it, and a date input carries locale, timezone and
              keyboard-entry problems that a wrong choice makes permanent.
            </p>
          </Arbitration>
        </Section>

        <Section id="chart" title="Chart" source="nothing covers it" status="blocked"
          note="Not built, and blocked twice over.">
          <Arbitration title="No primitive, and the tokens do not exist yet">
            <p>
              There is no chart primitive in Base UI, and §24.14 leaves series colours, axes,
              grid, empty and loading states unresolved. Choosing a library before the tokens
              exist would let the library decide the palette — which is exactly the inversion
              CLAUDE.md forbids.
            </p>
            <p>The tokens come first. Then the library.</p>
          </Arbitration>
        </Section>
      </div>
    </div>
  );
}
