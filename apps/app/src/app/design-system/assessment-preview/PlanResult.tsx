"use client";

import { useState } from "react";
import {
  ArticleIcon,
  BrowserIcon,
  BuildingsIcon,
  CaretDownIcon,
  CheckIcon,
  EnvelopeSimpleIcon,
  GearIcon,
  GlobeHemisphereWestIcon,
  MagnifyingGlassIcon,
  MapPinIcon,
  PaletteIcon,
  TargetIcon,
  UsersThreeIcon,
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import { cx } from "@zerocorp/ui";
import type { AnalysisGap, ArchitectOutput, PlanCategory, PlanStep } from "@zerocorp/contracts";

/**
 * The end of the assessment.
 *
 * The first version was a stack of headings and paragraphs, which is a document rather
 * than a result. A founder reaching this screen has answered five questions and is about
 * to be shown a price; what they need is to see at a glance that they were understood,
 * and then to be able to read into any part of it.
 *
 * So: the facts first, as data. Then the analysis as two cards. Then the gaps as tinted
 * cards, where the tint IS the severity rather than a badge floating beside a heading.
 * Then the plan grouped by phase, each step opening onto its reason.
 */

const CATEGORY_ICON: Record<PlanCategory, typeof BuildingsIcon> = {
  company: BuildingsIcon,
  brand: PaletteIcon,
  website: BrowserIcon,
  domain: GlobeHemisphereWestIcon,
  email: EnvelopeSimpleIcon,
  content: ArticleIcon,
  seo: MagnifyingGlassIcon,
  leads: UsersThreeIcon,
  operations: GearIcon,
};

/**
 * Severity as a whole card, not a chip.
 *
 * `-wash` exists for exactly this: a tint light enough to carry body text at full
 * contrast. A `-subtle` chip tint behind a paragraph measured 4.05:1, which is why the
 * two scales are separate.
 */
const SEVERITY: Record<AnalysisGap["severity"], { label: string; card: string; ink: string; edge: string }> = {
  blocking: {
    label: "Blocking",
    card: "bg-destructive-wash border-destructive",
    ink: "text-destructive-ink",
    edge: "bg-destructive",
  },
  important: {
    label: "Important",
    card: "bg-warning-wash border-warning",
    ink: "text-warning-ink",
    edge: "bg-warning",
  },
  nice_to_have: {
    label: "Worth doing",
    card: "bg-info-wash border-info",
    ink: "text-info-ink",
    edge: "bg-info",
  },
};

/**
 * Every variant written out.
 *
 * `rule.replace("bg-", "border-")` is the shape my own CI rule forbids: Tailwind scans
 * for literal class names, so the derived one is never generated and the border silently
 * does not appear.
 */
const PHASES: Array<{ id: PlanStep["phase"]; label: string; rule: string; edge: string; text: string }> = [
  { id: "understand", label: "Understand", rule: "bg-chart-1", edge: "border-chart-1", text: "text-chart-1" },
  { id: "plan", label: "Plan", rule: "bg-chart-2", edge: "border-chart-2", text: "text-chart-2" },
  { id: "build", label: "Build", rule: "bg-chart-3", edge: "border-chart-3", text: "text-chart-3" },
  { id: "launch", label: "Launch", rule: "bg-chart-4", edge: "border-chart-4", text: "text-chart-4" },
  { id: "find_customers", label: "Find customers", rule: "bg-chart-5", edge: "border-chart-5", text: "text-chart-5" },
];

const RECOMMENDATION = {
  form_new: { label: "Form a company", tone: "text-chart-1" },
  use_existing: { label: "Use the one you have", tone: "text-chart-3" },
  none_needed: { label: "None needed yet", tone: "text-muted-foreground" },
  unavailable: { label: "Not available here yet", tone: "text-warning-ink" },
} as const;

/** A number and its label. Quantities are never black — the dashboard rule, applied here. */
function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="flex flex-col gap-1 px-4 py-3">
      <span className="text-overline text-muted-foreground">{label}</span>
      <span className={cx("text-h4 font-mono tabular-nums", tone ?? "text-foreground")}>{value}</span>
    </div>
  );
}

function AnalysisCard({
  icon: Icon,
  eyebrow,
  body,
  accent,
}: {
  icon: typeof MapPinIcon;
  eyebrow: string;
  body: string;
  accent: string;
}) {
  return (
    <article className="border-border flex flex-col gap-3 border p-5">
      <div className="flex items-center gap-2">
        <Icon size={16} weight="regular" className={accent} />
        <h3 className="text-overline text-muted-foreground">{eyebrow}</h3>
      </div>
      <p className="text-body-sm">{body}</p>
    </article>
  );
}

function GapCard({ gap }: { gap: AnalysisGap }) {
  const severity = SEVERITY[gap.severity];
  return (
    <article className={cx("relative flex flex-col gap-2 border p-5 pl-6", severity.card)}>
      {/* The severity edge. Colour is never the only carrier: the label says it too. */}
      <span className={cx("absolute inset-y-0 left-0 w-1", severity.edge)} aria-hidden="true" />
      <div className="flex flex-wrap items-center gap-3">
        <span className={cx("text-overline flex items-center gap-1.5", severity.ink)}>
          <WarningIcon size={12} weight="fill" aria-hidden="true" />
          {severity.label}
        </span>
      </div>
      <h3 className="text-h4">{gap.title}</h3>
      <p className="text-body-sm text-foreground/80 max-w-prose">{gap.why}</p>
    </article>
  );
}

function StepRow({ step, index, phase }: { step: PlanStep; index: number; phase: (typeof PHASES)[number] }) {
  const [open, setOpen] = useState(false);
  const Icon = CATEGORY_ICON[step.category];

  return (
    <li className="border-border border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cx(
          "group grid w-full grid-cols-[2.5rem_2rem_1fr_1.25rem] items-start gap-3 px-4 py-4 text-left",
          "transition-[background-color] duration-normal ease-out hover:bg-accent",
          "focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
        )}
      >
        <span className={cx("text-body-sm font-mono tabular-nums pt-0.5", phase.text)}>
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="border-border text-muted-foreground group-hover:text-foreground flex size-8 items-center justify-center border transition-[color] duration-normal">
          <Icon size={16} weight="regular" aria-hidden="true" />
        </span>
        <span className="flex min-w-0 flex-col gap-1">
          <span className="text-body-sm font-medium">{step.title}</span>
          <span className="text-body-sm text-muted-foreground">{step.outcome}</span>
        </span>
        <CaretDownIcon
          size={16}
          aria-hidden="true"
          className={cx("text-muted-foreground mt-1 transition-transform duration-emphasis", open && "rotate-180")}
        />
      </button>
      {open ? (
        // The same grid as the row above, so the reason lines up under the title rather
        // than under a margin someone measured once and will not measure again.
        <div className="grid grid-cols-[2.5rem_2rem_1fr_1.25rem] gap-3 px-4 pb-4">
          <span aria-hidden="true" />
          <span aria-hidden="true" />
          <div className={cx("zc-enter-fade border-l-2 pl-4", phase.edge)}>
            <p className="text-overline text-muted-foreground pb-1">Why this</p>
            <p className="text-body-sm text-foreground/80 max-w-prose">{step.rationale}</p>
          </div>
        </div>
      ) : null}
    </li>
  );
}

export function PlanResult({ output }: { output: ArchitectOutput }) {
  const { analysis, plan } = output;
  const included = plan.steps.filter((s) => s.included);
  const recommendation = RECOMMENDATION[plan.companyRecommendation];
  const blocking = analysis.whatIsMissing.filter((g) => g.severity === "blocking").length;

  let counter = 0;

  return (
    <div className="flex flex-col gap-10">
      {/* ── The facts, first and as data ───────────────────────────────── */}
      <header className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <p className="text-overline text-muted-foreground">Your assessment</p>
          <h1 className="text-h1 text-balance">{analysis.headline}</h1>
        </div>

        <div className="border-border bg-border grid grid-cols-2 gap-px border sm:grid-cols-4">
          <div className="bg-background">
            <Metric label="Company" value={recommendation.label} tone={recommendation.tone} />
          </div>
          <div className="bg-background">
            <Metric
              label="Entity"
              value={plan.recommendedEntityTypeCode ?? "None"}
              tone={plan.recommendedEntityTypeCode ? "text-chart-1" : "text-muted-foreground"}
            />
          </div>
          <div className="bg-background">
            <Metric label="Gaps" value={`${analysis.whatIsMissing.length}`} tone={blocking > 0 ? "text-destructive-ink" : "text-chart-3"} />
          </div>
          <div className="bg-background">
            <Metric label="Steps" value={`${included.length}`} tone="text-chart-5" />
          </div>
        </div>
      </header>

      {/* ── Where you are, where you want to go ─────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <AnalysisCard icon={MapPinIcon} eyebrow="Where you are" body={analysis.whereYouAre} accent="text-chart-2" />
        <AnalysisCard icon={TargetIcon} eyebrow="Where you want to go" body={analysis.whereYouWantToGo} accent="text-chart-4" />
      </div>

      {/* ── What is missing ────────────────────────────────────────────── */}
      <section className="flex flex-col gap-4">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-h3">What you are missing</h2>
          <span className="text-body-sm text-muted-foreground font-mono tabular-nums">
            {blocking} blocking
          </span>
        </div>
        <div className="flex flex-col gap-3">
          {analysis.whatIsMissing.map((gap) => (
            <GapCard key={gap.title} gap={gap} />
          ))}
        </div>
      </section>

      {/* ── The plan ───────────────────────────────────────────────────── */}
      <section className="flex flex-col gap-5">
        <div className="flex items-baseline justify-between gap-4">
          <h2 className="text-h3">Your ZeroCorp plan</h2>
          <span className="text-body-sm text-muted-foreground font-mono tabular-nums">
            {included.length} steps
          </span>
        </div>

        <p className="text-body-sm text-muted-foreground max-w-prose">{plan.recommendationReason}</p>

        {PHASES.map((phase) => {
          const steps = included.filter((s) => s.phase === phase.id);
          if (steps.length === 0) return null;

          return (
            <div key={phase.id} className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <span className={cx("h-0.5 w-6", phase.rule)} aria-hidden="true" />
                <h3 className={cx("text-overline", phase.text)}>{phase.label}</h3>
                <span className="bg-border h-px flex-1" aria-hidden="true" />
                <span className="text-caption text-muted-foreground font-mono tabular-nums">
                  {steps.length}
                </span>
              </div>
              <ul className="border-border border">
                {steps.map((step) => (
                  <StepRow key={step.key} step={step} index={counter++} phase={phase} />
                ))}
              </ul>
            </div>
          );
        })}
      </section>

      {/* ── What happens next ──────────────────────────────────────────── */}
      <section className="border-border flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-6">
        <span className="text-body-sm text-muted-foreground flex items-center gap-2">
          <CheckIcon size={14} className="text-chart-1" aria-hidden="true" />
          Approve the plan, see the price, then we build it
        </span>
      </section>
    </div>
  );
}
