"use client";

import { useState } from "react";
import { CaretDownIcon, CheckIcon, MapPinIcon, TargetIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { StatusBadge, cx } from "@zerocorp/ui";
import type { ArchitectOutput, PlanStep } from "@zerocorp/contracts";

/**
 * The end of the assessment.
 *
 * Not a results form: four sections a founder reads in order, then a plan whose steps
 * open to show WHY each one is recommended. The reason is the part that makes the plan
 * theirs rather than a template, so it is one click away and not buried.
 */

const SEVERITY_TONE = { blocking: "danger", important: "warning", nice_to_have: "info" } as const;
const SEVERITY_LABEL = { blocking: "Blocking", important: "Important", nice_to_have: "Worth doing" } as const;

const RECOMMENDATION_LABEL = {
  form_new: "We recommend forming a company",
  use_existing: "Use the company you have",
  none_needed: "You do not need a company yet",
  unavailable: "You likely need a company we cannot form yet",
} as const;

const RECOMMENDATION_TONE = {
  form_new: "processing", use_existing: "info", none_needed: "neutral", unavailable: "warning",
} as const;

function Section({ icon: Icon, eyebrow, children }: { icon: typeof MapPinIcon; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="border-border border-t py-7">
      <div className="flex items-center gap-2 pb-3">
        <Icon size={16} weight="regular" className="text-muted-foreground" />
        <h2 className="text-overline text-muted-foreground">{eyebrow}</h2>
      </div>
      {children}
    </section>
  );
}

function Step({ step, index }: { step: PlanStep; index: number }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="border-border border-b last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className={cx(
          "flex w-full items-start gap-4 py-4 text-left",
          "focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
        )}
      >
        <span className="text-muted-foreground font-mono text-body-sm tabular-nums pt-0.5">
          {String(index + 1).padStart(2, "0")}
        </span>
        <span className="flex min-w-0 flex-1 flex-col gap-1">
          <span className="text-h4">{step.title}</span>
          <span className="text-body-sm text-muted-foreground">{step.outcome}</span>
        </span>
        <CaretDownIcon
          size={16}
          className={cx("text-muted-foreground mt-1 shrink-0 transition-transform duration-emphasis", open && "rotate-180")}
        />
      </button>
      {open ? (
        <div className="zc-enter-fade border-primary mb-4 ml-9 border-l-2 pl-4">
          <p className="text-overline text-muted-foreground pb-1">Why this</p>
          <p className="text-body-sm max-w-prose">{step.rationale}</p>
        </div>
      ) : null}
    </li>
  );
}

export function PlanResult({ output }: { output: ArchitectOutput }) {
  const { analysis, plan } = output;
  const included = plan.steps.filter((s) => s.included);

  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2 pb-4">
        <p className="text-overline text-muted-foreground">Your assessment</p>
        <h1 className="text-h1 text-balance">{analysis.headline}</h1>
      </div>

      <Section icon={MapPinIcon} eyebrow="Where you are">
        <p className="text-body max-w-prose">{analysis.whereYouAre}</p>
      </Section>

      <Section icon={TargetIcon} eyebrow="Where you want to go">
        <p className="text-body max-w-prose">{analysis.whereYouWantToGo}</p>
      </Section>

      <Section icon={WarningIcon} eyebrow="What you are missing">
        <ul className="flex flex-col">
          {analysis.whatIsMissing.map((gap) => (
            <li key={gap.title} className="border-border flex flex-col gap-2 border-b py-4 last:border-b-0">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-h4">{gap.title}</h3>
                <StatusBadge tone={SEVERITY_TONE[gap.severity]}>{SEVERITY_LABEL[gap.severity]}</StatusBadge>
              </div>
              <p className="text-body-sm text-muted-foreground max-w-prose">{gap.why}</p>
            </li>
          ))}
        </ul>
      </Section>

      <Section icon={CheckIcon} eyebrow="Your ZeroCorp plan">
        <div className="flex flex-wrap items-center gap-3 pb-4">
          <StatusBadge tone={RECOMMENDATION_TONE[plan.companyRecommendation]}>
            {RECOMMENDATION_LABEL[plan.companyRecommendation]}
          </StatusBadge>
          {plan.recommendedEntityTypeCode ? (
            <span className="text-body-sm text-muted-foreground">
              {plan.recommendedEntityTypeCode} · {plan.recommendedJurisdictionCode}
            </span>
          ) : null}
        </div>
        <p className="text-body-sm text-muted-foreground max-w-prose pb-5">{plan.recommendationReason}</p>
        <ul className="border-border flex flex-col border-t">
          {included.map((step, i) => (
            <Step key={step.key} step={step} index={i} />
          ))}
        </ul>
      </Section>
    </div>
  );
}
