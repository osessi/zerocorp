"use client";

import { Meter } from "@base-ui/react/meter";
import {
  ArrowSquareOutIcon,
  CheckIcon,
  GlobeIcon,
  DownloadSimpleIcon,
  EnvelopeSimpleIcon,
  ReceiptIcon,
  RobotIcon,
  SparkleIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Alert, Button, IconButton, StatusBadge, type StatusTone } from "@zerocorp/ui";
import { Demo, cx } from "./shell";

/* ── Credit / usage meter ─────────────────────────────────────────────────── */

/**
 * Base UI `Meter`, which is exactly right: a meter is a measurement inside a known
 * range, a progress bar is a task advancing. Using Progress here would announce
 * "64% complete" for a balance that is not completing anything.
 *
 * §17: included · used · remaining · reset · additional usage, "without making the
 * billing model confusing". So the RESET DATE sits beside the number — a balance with no
 * reset date is the single most common way a credit meter misleads.
 */
function CreditMeter({ label, used, included, tone }: { label: string; used: number; included: number; tone: StatusTone }) {
  const pct = Math.min(100, Math.round((used / included) * 100));
  return (
    <Meter.Root value={pct} className="flex flex-col gap-2">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <Meter.Label className="text-label text-foreground">{label}</Meter.Label>
        <span className="text-caption text-muted-foreground">
          <span className="text-foreground font-mono">{used.toLocaleString("en-US")}</span> of{" "}
          <span className="font-mono">{included.toLocaleString("en-US")}</span>
        </span>
      </div>
      <Meter.Track className="bg-muted border-border h-1.5 w-full border">
        <Meter.Indicator
          className={cx(
            "h-full transition-[width] duration-emphasis ease-out",
            tone === "warning" ? "bg-warning" : tone === "danger" ? "bg-destructive" : "bg-primary",
          )}
        />
      </Meter.Track>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-caption text-muted-foreground">Resets 1 Sep</span>
        <StatusBadge tone={tone}>
          {included - used > 0 ? `${(included - used).toLocaleString("en-US")} left` : "Exhausted"}
        </StatusBadge>
      </div>
    </Meter.Root>
  );
}

export function CreditMeterDemo() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Demo><CreditMeter label="AI credits" used={1240} included={5000} tone="success" /></Demo>
      <Demo><CreditMeter label="Email sends" used={8600} included={10000} tone="warning" /></Demo>
      <Demo><CreditMeter label="Lead enrichment" used={500} included={500} tone="danger" /></Demo>
    </div>
  );
}

/* ── Business status ──────────────────────────────────────────────────────── */

/**
 * §17: reusable for Company, Website, Domain, Email, Marketing, Leads, Automation.
 * One card shape, one status system, seven meanings — never seven cards.
 */
const SURFACES: { icon: typeof GlobeIcon; label: string; value: string; tone: StatusTone; status: string }[] = [
  { icon: RobotIcon, label: "Company", value: "Northwind Studio LLC", tone: "success", status: "Active" },
  { icon: GlobeIcon, label: "Website", value: "northwind.studio", tone: "processing", status: "Publishing" },
  { icon: EnvelopeSimpleIcon, label: "Email", value: "hello@northwind.studio", tone: "warning", status: "Warming up" },
  { icon: SparkleIcon, label: "Automation", value: "3 agents running", tone: "info", status: "Autopilot off" },
];

export function BusinessStatusDemo() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {SURFACES.map((s) => {
        const Icon = s.icon;
        return (
          <div key={s.label} className="border-border flex flex-col gap-3 border p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-overline text-muted-foreground inline-flex items-center gap-2 uppercase">
                <Icon size={14} aria-hidden="true" />
                {s.label}
              </span>
              <IconButton label={`Open ${s.label}`} icon={ArrowSquareOutIcon} size="sm" />
            </div>
            <span className="text-body-sm text-foreground truncate">{s.value}</span>
            <StatusBadge tone={s.tone}>{s.status}</StatusBadge>
          </div>
        );
      })}
    </div>
  );
}

/* ── Billing ──────────────────────────────────────────────────────────────── */

/**
 * §17: plan card · usage summary · credit balance · invoice list · payment status ·
 * upgrade/downgrade.
 *
 * Money is integer minor units and a currency — a product invariant, not a formatting
 * preference. Displayed with Intl so a locale change is a data change, not a rewrite.
 */
const usd = (minor: number) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(minor / 100);

const INVOICES: { date: string; cents: number; tone: StatusTone; status: string }[] = [
  { date: "Aug 1, 2026", cents: 39900, tone: "success", status: "Paid" },
  { date: "Jul 1, 2026", cents: 39900, tone: "success", status: "Paid" },
  { date: "Jun 1, 2026", cents: 39900, tone: "danger", status: "Failed" },
];

export function BillingDemo() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="border-primary flex flex-col gap-3 border p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-overline text-muted-foreground uppercase">Current plan</span>
            <span className="text-h4 text-foreground">Growth</span>
          </div>
          <StatusBadge tone="success" emphasis="prominent">Active</StatusBadge>
        </div>
        <p className="text-display-l text-foreground font-mono">
          {usd(39900)}
          <span className="text-body-sm text-muted-foreground font-sans"> / month</span>
        </p>
        <ul className="text-body-sm text-foreground flex flex-col gap-2">
          {["5 000 AI credits", "10 000 email sends", "3 businesses", "Priority filing"].map((f) => (
            <li key={f} className="flex items-center gap-2">
              {/*
                A filled tick, not a bare glyph — the same badge the Select and the menu
                use for the chosen item. A loose check mark floating beside text reads as
                a bullet; a filled square reads as "included, confirmed".
                --primary-foreground on --primary is 5.14:1 in both themes.
              */}
              <span className="bg-primary text-primary-foreground flex size-4 shrink-0 items-center justify-center">
                <CheckIcon size={12} weight="bold" aria-hidden="true" />
              </span>
              {f}
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary">Upgrade to Scale</Button>
          {/* secondary, not ghost. A real second action must be findable. */}
          <Button variant="secondary">Change plan</Button>
        </div>
      </div>

      <div className="border-border flex flex-col border">
        {/*
          The header is anchored: --muted ground, an icon, and the count. A bare 14px
          word floating on white gives the eye nothing to land on, which is exactly what
          the review reported.
        */}
        <div className="border-border bg-muted flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
          <span className="text-label text-foreground inline-flex items-center gap-2">
            <ReceiptIcon size={16} weight="regular" aria-hidden="true" className="text-muted-foreground" />
            Invoices
            <span className="text-caption text-muted-foreground font-mono">3</span>
          </span>
          <Button size="sm" variant="secondary" icon={DownloadSimpleIcon}>
            Download all
          </Button>
        </div>
        {INVOICES.map((inv) => (
          <div
            key={inv.date}
            className="border-border hover:bg-accent flex items-center justify-between gap-3 border-b px-4 py-3 last:border-b-0"
          >
            <span className="text-body-sm text-muted-foreground font-mono">{inv.date}</span>
            <span className="text-body-sm text-foreground font-mono">{usd(inv.cents)}</span>
            {/*
              prominent, not the outlined default. An invoice status is terminal — paid or
              failed, nothing in between — and it is the one thing the eye scans this list
              for. The outlined default is for a status among many; this is the column.
            */}
            <StatusBadge tone={inv.tone} emphasis="prominent">
              {inv.status}
            </StatusBadge>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Lead pipeline ────────────────────────────────────────────────────────── */

/**
 * §17: lead table · profile · timeline · status · opportunity card · campaign status.
 *
 * Shown as a pipeline because that is the shape a founder reads. It is NOT a kanban with
 * drag and drop: §24.8 has not approved a board pattern, and a drag-only interaction
 * would fail keyboard access. Columns are read-only here.
 */
const PIPELINE: { stage: string; tone: StatusTone; leads: { name: string; company: string; value: number }[] }[] = [
  { stage: "New", tone: "neutral", leads: [{ name: "A. Moreau", company: "Fernwood Goods", value: 240000 }, { name: "T. Bakker", company: "Cobalt Tools", value: 90000 }] },
  { stage: "Contacted", tone: "info", leads: [{ name: "S. Rivera", company: "Tenpoint Media", value: 480000 }] },
  { stage: "Qualified", tone: "processing", leads: [{ name: "J. Okafor", company: "Auric Freight", value: 1200000 }] },
  { stage: "Won", tone: "success", leads: [{ name: "M. Lindqvist", company: "Bluepine Labs", value: 360000 }] },
];

export function LeadPipelineDemo() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {PIPELINE.map((col) => (
        <div key={col.stage} className="border-border flex flex-col border">
          <div className="border-border flex items-center justify-between gap-2 border-b px-3 py-2">
            <StatusBadge tone={col.tone}>{col.stage}</StatusBadge>
            <span className="text-caption text-muted-foreground font-mono">{col.leads.length}</span>
          </div>
          <div className="flex flex-col">
            {col.leads.map((l) => (
              <div key={l.name} className="border-border hover:bg-accent flex flex-col gap-1 border-b p-3 last:border-b-0">
                <span className="text-body-sm text-foreground">{l.name}</span>
                <span className="text-caption text-muted-foreground">{l.company}</span>
                <span className="text-caption text-foreground font-mono">{usd(l.value)}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ── AI generation / review ───────────────────────────────────────────────── */

/**
 * The approval gate. CLAUDE.md invariant: an agent never performs a privileged action
 * without explicit permission, and the Business Brain is upstream of every generated
 * output.
 *
 * So the panel always shows THREE things: what was generated, what it was generated
 * FROM, and the two irreversible-looking buttons. An approve with no visible source is
 * a rubber stamp.
 */
export function AIReviewDemo() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <div className="border-border flex flex-col gap-3 border p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-label inline-flex items-center gap-2">
            <SparkleIcon size={16} className="text-processing" aria-hidden="true" />
            Homepage headline
          </span>
          <StatusBadge tone="warning">Needs review</StatusBadge>
        </div>
        <blockquote className="border-l-primary text-body text-foreground border-l-2 pl-3">
          Launch your US company from anywhere — filed, banked and online in nine days.
        </blockquote>
        <div className="border-border flex flex-col gap-1 border-t pt-3">
          <span className="text-overline text-muted-foreground uppercase">Generated from</span>
          <span className="text-caption text-muted-foreground">
            Business Brain · positioning (approved 2 Mar) · target market (inferred, confidence 0.72)
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="primary" icon={CheckIcon}>Approve</Button>
          <Button variant="secondary" icon={XIcon}>Reject</Button>
          <Button variant="ghost">Regenerate</Button>
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Alert tone="info" title="Autopilot is off">
          Agents draft and queue work, but nothing publishes until you approve it.
        </Alert>
        <div className="border-border flex flex-col border">
          <div className="border-border flex items-center justify-between border-b px-3 py-2">
            <span className="text-label">Agent runs</span>
            <span className="text-caption text-muted-foreground font-mono">last 24 h</span>
          </div>
          {[
            ["Content agent", "4 posts drafted", "success", "18 credits"],
            ["SEO agent", "Keyword refresh", "processing", "running"],
            ["Lead agent", "Enrichment quota reached", "danger", "0 credits"],
          ].map(([agent, what, tone, cost]) => (
            <div key={agent as string} className="border-border flex items-center justify-between gap-3 border-b px-3 py-2 last:border-b-0">
              <div className="flex min-w-0 flex-col">
                <span className="text-body-sm text-foreground truncate">{agent as string}</span>
                <span className="text-caption text-muted-foreground truncate">{what as string}</span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <span className="text-caption text-muted-foreground font-mono">{cost as string}</span>
                <StatusBadge tone={tone as StatusTone}>{tone as string}</StatusBadge>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
