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
const SEVERITY: Record<AnalysisGap["severity"], { label: string; card: string; ink: string }> = {
  blocking: { label: "Blocking", card: "bg-destructive-wash border-destructive", ink: "text-destructive-ink" },
  important: { label: "Important", card: "bg-warning-wash border-warning", ink: "text-warning-ink" },
  nice_to_have: { label: "Worth doing", card: "bg-info-wash border-info", ink: "text-info-ink" },
};

/**
 * Every variant written out.
 *
 * `rule.replace("bg-", "border-")` is the shape my own CI rule forbids: Tailwind scans
 * for literal class names, so the derived one is never generated and the border silently
 * does not appear.
 */
/**
 * Every variant written out.
 *
 * `rule.replace("bg-", "border-")` is the shape the CI rule forbids: Tailwind scans for
 * literal class names, so a derived one is never generated and the border silently does
 * not appear.
 */
interface Phase {
  id: PlanStep["phase"];
  label: string;
  edge: string;
  /** Behind the whole card. Very light. */
  wash: string;
  /** Behind the icon tile only. Twice the card, so the tile still reads as a tile. */
  tint: string;
  text: string;
  hoverEdge: string;
  hoverWash: string;
  hoverFill: string;
}

/**
 * Three strengths of the same hue, and the ladder is the point.
 *
 *   5%   the card. Enough to say "this one belongs to Build" from across the page,
 *        not enough to touch the contrast of anything written on it.
 *   10%  the icon tile. Twice the card, so it still reads as a tile ON the card
 *        rather than as a hole in it.
 *   100% the tile on hover, and the border.
 *
 * Every variant written out. A derived name never reaches Tailwind's scanner, so the
 * colour silently never appears.
 */
const PHASES: Phase[] = [
  { id: "understand", label: "Understand", edge: "border-chart-1", wash: "bg-chart-1/5", tint: "bg-chart-1/10", text: "text-chart-1", hoverEdge: "hover:border-chart-1", hoverWash: "hover:bg-chart-1/10", hoverFill: "group-hover:bg-chart-1 group-hover:text-background" },
  { id: "plan", label: "Plan", edge: "border-chart-2", wash: "bg-chart-2/5", tint: "bg-chart-2/10", text: "text-chart-2", hoverEdge: "hover:border-chart-2", hoverWash: "hover:bg-chart-2/10", hoverFill: "group-hover:bg-chart-2 group-hover:text-background" },
  { id: "build", label: "Build", edge: "border-chart-3", wash: "bg-chart-3/5", tint: "bg-chart-3/10", text: "text-chart-3", hoverEdge: "hover:border-chart-3", hoverWash: "hover:bg-chart-3/10", hoverFill: "group-hover:bg-chart-3 group-hover:text-background" },
  { id: "launch", label: "Launch", edge: "border-chart-4", wash: "bg-chart-4/5", tint: "bg-chart-4/10", text: "text-chart-4", hoverEdge: "hover:border-chart-4", hoverWash: "hover:bg-chart-4/10", hoverFill: "group-hover:bg-chart-4 group-hover:text-background" },
  { id: "find_customers", label: "Find customers", edge: "border-chart-5", wash: "bg-chart-5/5", tint: "bg-chart-5/10", text: "text-chart-5", hoverEdge: "hover:border-chart-5", hoverWash: "hover:bg-chart-5/10", hoverFill: "group-hover:bg-chart-5 group-hover:text-background" },
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
  wash,
  edge,
}: {
  icon: typeof MapPinIcon;
  eyebrow: string;
  body: string;
  accent: string;
  wash: string;
  edge: string;
}) {
  return (
    <article className={cx("flex flex-col gap-3 border p-5", edge, wash)}>
      <div className="flex items-center gap-2">
        <Icon size={16} weight="regular" className={accent} aria-hidden="true" />
        <h3 className={cx("text-overline", accent)}>{eyebrow}</h3>
      </div>
      <p className="text-body-sm text-pretty">{body}</p>
    </article>
  );
}

function GapCard({ gap }: { gap: AnalysisGap }) {
  const severity = SEVERITY[gap.severity];
  return (
    <article className={cx("flex flex-col gap-2 border p-5", severity.card)}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={cx("text-overline flex items-center gap-1.5", severity.ink)}>
          <WarningIcon size={12} weight="fill" aria-hidden="true" />
          {severity.label}
        </span>
      </div>
      <h3 className="text-h4 text-balance">{gap.title}</h3>
      <p className="text-body-sm text-foreground/80 max-w-prose text-pretty">{gap.why}</p>
    </article>
  );
}

/**
 * A step, as a card.
 *
 * These are the screen that decides whether someone pays. A row with a number and two
 * lines of text is a task list; a founder reading a task list is reading admin. Each of
 * these is a THING THEY GET, so each one gets a shape: a tile carrying its category, a
 * number that stays out of the way, the outcome in plain words, and the reason one click
 * down.
 *
 * The whole card is the target. Hovering moves the border to the phase colour and fills
 * the tile, so the grid answers "what is this" before anything is clicked.
 */
function StepCard({ step, index, phase }: { step: PlanStep; index: number; phase: (typeof PHASES)[number] }) {
  const [open, setOpen] = useState(false);
  const Icon = CATEGORY_ICON[step.category];

  return (
    <article
      className={cx(
        "group border-border relative flex flex-col border",
        "transition-[border-color,background-color] duration-normal ease-out",
        phase.wash,
        phase.hoverEdge,
        phase.hoverWash,
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cx(
          "flex flex-1 flex-col items-start gap-4 p-5 text-left",
          "focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
        )}
      >
        <div className="flex w-full items-start justify-between gap-4">
          <span
            className={cx(
              "flex size-11 shrink-0 items-center justify-center border",
              "transition-[color,background-color,border-color] duration-normal ease-out",
              phase.edge,
              phase.tint,
              phase.text,
              phase.hoverFill,
            )}
          >
            <Icon size={22} weight="regular" aria-hidden="true" />
          </span>

          {/* Large, faint, and out of the reading path. It orders the plan without
              competing with what each step actually is. */}
          <span className="text-h2 text-muted-foreground/25 font-mono tabular-nums leading-none">
            {String(index + 1).padStart(2, "0")}
          </span>
        </div>

        <div className="flex w-full flex-col gap-1.5">
          <span className={cx("text-overline", phase.text)}>{phase.label}</span>
          <h4 className="text-h4 text-balance">{step.title}</h4>
          <p className="text-body-sm text-muted-foreground text-pretty">{step.outcome}</p>
        </div>

        <span className="text-caption text-muted-foreground mt-auto flex items-center gap-1.5 pt-1">
          Why this
          <CaretDownIcon
            size={12}
            aria-hidden="true"
            className={cx("transition-transform duration-emphasis", open && "rotate-180")}
          />
        </span>
      </button>

      {open ? (
        <div className="border-border zc-enter-fade border-t px-5 py-4">
          <p className="text-body-sm text-foreground/80 text-pretty">{step.rationale}</p>
        </div>
      ) : null}
    </article>
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
        <AnalysisCard
          icon={MapPinIcon}
          eyebrow="Where you are"
          body={analysis.whereYouAre}
          accent="text-chart-2"
          edge="border-chart-2"
          wash="bg-chart-2/5"
        />
        <AnalysisCard
          icon={TargetIcon}
          eyebrow="Where you want to go"
          body={analysis.whereYouWantToGo}
          accent="text-chart-4"
          edge="border-chart-4"
          wash="bg-chart-4/5"
        />
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

        {/*
          One grid, ordered by phase, with each card carrying its own phase label.

          Grouping them under headings put a divider between every two or three cards and
          chopped the plan into fragments. The plan is one thing the founder is buying,
          and it should read as one thing.
        */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {PHASES.flatMap((phase) =>
            included
              .filter((s) => s.phase === phase.id)
              .map((step) => <StepCard key={step.key} step={step} index={counter++} phase={phase} />),
          )}
        </div>
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
