"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ArrowClockwiseIcon, CheckIcon, PaperPlaneRightIcon } from "@phosphor-icons/react/dist/ssr";
import { Alert, Button, Checkbox, Field, Textarea, cx } from "@zerocorp/ui";
import type { PlanProposal, PlanStep } from "@zerocorp/contracts";
import { applyPlanEdits, approvePlan, discussPlan } from "../../actions";

/**
 * The plan editor — PRODUCT_SPEC.md §29.3 block 3, "the heart of V1".
 *
 * The customer can accept, edit, discuss and ask for a new proposal. This is what stops
 * ZeroCorp being a generator: the plan is the artefact they own and argue with, and
 * everything executed afterwards traces back to a step they approved.
 *
 * Including or excluding a step is arithmetic and costs nothing. Asking for a new
 * proposal costs a model call, so the two are different buttons with different weight.
 */

const PHASE_LABEL: Record<PlanStep["phase"], string> = {
  understand: "Understand",
  plan: "Plan",
  build: "Build",
  launch: "Launch",
  find_customers: "Find customers",
};

/*
  Steps carry NO status badge.

  There are nine plan categories and six status tones, and the status tones already mean
  something specific: warning is "a person must act", danger is "it came back". Reusing
  them to mark a phase would overload a vocabulary the rest of the product depends on.

  A dedicated colour scale for plan phases is a design decision, not a gap to fill with a
  guess. Raised as an open item; until then the phase is a label and the colour on this
  screen comes from the recommendation badge, which genuinely is a status.
*/

export function PlanEditor({ token, proposal, deterministic }: {
  token: string;
  proposal: PlanProposal;
  deterministic: boolean;
}) {
  const router = useRouter();
  const [steps, setSteps] = useState(proposal.steps);
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const included = steps.filter((s) => s.included).length;

  function toggle(step: PlanStep, next: boolean) {
    // Optimistic: the row moves now and reconciles on the server. Waiting a round trip
    // to tick a checkbox makes the plan feel like a form rather than a document.
    setSteps((all) => all.map((s) => (s.key === step.key ? { ...s, included: next } : s)));
    startTransition(async () => {
      const result = await applyPlanEdits(token, [
        { kind: next ? "include_step" : "exclude_step", key: step.key },
      ]);
      if (!result.ok) {
        setSteps((all) => all.map((s) => (s.key === step.key ? { ...s, included: !next } : s)));
        setError(result.error ?? "We could not save that change.");
      }
    });
  }

  function send() {
    const text = message.trim();
    if (!text) return;
    setError(null);
    startTransition(async () => {
      // discussPlan stores the message AND regenerates: a message the customer sends
      // that produces no new proposal is a message that went nowhere.
      const said = await discussPlan(token, text);
      if (!said.ok) {
        setError(said.error ?? "We could not build a new proposal.");
        return;
      }
      setMessage("");
      setNotice("A new proposal is ready.");
      router.refresh();
    });
  }

  function approve() {
    setError(null);
    startTransition(async () => {
      const result = await approvePlan(token);
      if (result && !result.ok) setError(result.error ?? "We could not approve this plan.");
    });
  }

  return (
    <div className="flex flex-col gap-8">
      {deterministic ? (
        <Alert tone="info" title="This plan was built from rules, not from a model">
          No AI provider is configured, so ZeroCorp assembled this from your answers and its
          own catalog. It is a real plan. It is not an AI analysis, and we will not pretend
          otherwise.
        </Alert>
      ) : null}

      {error ? <Alert tone="danger" title="That did not work">{error}</Alert> : null}
      {notice ? <Alert tone="success" title={notice}>Review the steps below.</Alert> : null}

      <ul className="border-border flex flex-col border-t">
        {steps.map((step) => (
          <li
            key={step.key}
            className={cx(
              "border-border flex gap-4 border-b py-5 transition-[opacity] duration-normal",
              !step.included && "opacity-55",
            )}
          >
            <div className="pt-0.5">
              <Checkbox
                checked={step.included}
                onCheckedChange={(next) => toggle(step, next)}
                aria-label={`Include ${step.title}`}
              />
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
              <div className="flex flex-col gap-1">
                <p className="text-overline text-muted-foreground">{PHASE_LABEL[step.phase]}</p>
                <h3 className={cx("text-h4", !step.included && "line-through")}>{step.title}</h3>
              </div>
              <p className="text-body-sm">{step.outcome}</p>
              <p className="text-body-sm text-muted-foreground max-w-prose">{step.rationale}</p>
            </div>
          </li>
        ))}
      </ul>

      <section className="border-border border p-5">
        <h2 className="text-h4 pb-1">Not quite right?</h2>
        <p className="text-body-sm text-muted-foreground pb-4">
          Tell us what to change and we will propose it again. For example: I do not want a
          Delaware company. Focus on France. I already have a website. Skip branding.
        </p>
        <Field label="What should change?" className="pb-3">
          <Textarea
            rows={3}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Skip branding, I already have a logo I like."
            maxLength={4000}
          />
        </Field>
        <Button
          variant="secondary"
          icon={pending ? ArrowClockwiseIcon : PaperPlaneRightIcon}
          onClick={send}
          disabled={message.trim().length === 0}
          loading={pending}
        >
          Ask for a new proposal
        </Button>
      </section>

      <div className="border-border flex flex-wrap items-center justify-between gap-4 border-t pt-6">
        <p className="text-body-sm text-muted-foreground">
          {included} of {steps.length} steps included.
        </p>
        <Button variant="primary" icon={CheckIcon} onClick={approve} loading={pending} disabled={included === 0}>
          Approve this plan
        </Button>
      </div>
    </div>
  );
}
