"use client";

import { useState, useTransition } from "react";
import { ArrowLeftIcon, ArrowRightIcon } from "@phosphor-icons/react/dist/ssr";
import {
  Alert,
  Button,
  Checkbox,
  Choice,
  Field,
  FlowStep,
  FocusedFlowLayout,
  Radio,
  RadioGroup,
  Textarea,
} from "@zerocorp/ui";
import type { PartialAssessmentAnswers } from "@zerocorp/contracts";
import { VoiceInput } from "./VoiceInput";
import { analyzeAssessment, saveAnswers, startAssessment } from "./actions";

/**
 * The Free Business Assessment — PRODUCT_SPEC.md §29.3 block 0.
 *
 * Five questions and no more. The cap is a hard one: every question here is asked
 * before any money has changed hands, so each has to earn its place.
 *
 * The assessment row is created on the FIRST continue, not on page load. A row per
 * visitor who bounced off the landing page is a table full of nothing.
 */

const MARKETS = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA", label: "Canada" },
  { code: "AU", label: "Australia" },
  { code: "FR", label: "France" },
  { code: "DE", label: "Germany" },
  { code: "ES", label: "Spain" },
  { code: "NL", label: "Netherlands" },
  { code: "AE", label: "United Arab Emirates" },
  { code: "SG", label: "Singapore" },
];

const TOTAL_STEPS = 5;

interface Draft {
  business_description: string;
  current_situation: string;
  company_situation: "none" | "existing" | "in_progress" | "";
  twelve_month_goal: string;
  target_markets: string[];
}

const EMPTY: Draft = {
  business_description: "",
  current_situation: "",
  company_situation: "",
  twelve_month_goal: "",
  target_markets: [],
};

export function Funnel() {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [token, setToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const set = <K extends keyof Draft>(key: K, value: Draft[K]) =>
    setDraft((d) => ({ ...d, [key]: value }));

  function patchFor(current: number): PartialAssessmentAnswers {
    switch (current) {
      case 1: return { business_description: draft.business_description.trim() };
      case 2: return { current_situation: draft.current_situation.trim() };
      case 3: return draft.company_situation === "" ? {} : { company_situation: draft.company_situation };
      case 4: return { twelve_month_goal: draft.twelve_month_goal.trim() };
      default: return { target_markets: draft.target_markets };
    }
  }

  function canContinue(): boolean {
    switch (step) {
      case 1: return draft.business_description.trim().length > 0;
      case 2: return draft.current_situation.trim().length > 0;
      case 3: return draft.company_situation !== "";
      case 4: return draft.twelve_month_goal.trim().length > 0;
      default: return draft.target_markets.length > 0;
    }
  }

  function advance() {
    setError(null);
    startTransition(async () => {
      // Created here rather than on page load: a row per bounced visitor is a table
      // full of nothing.
      const active = token ?? (await startAssessment()).token;
      if (!token) setToken(active);

      const saved = await saveAnswers(active, patchFor(step));
      if (!saved.ok) {
        setError(saved.error ?? "We could not save that.");
        return;
      }

      if (step < TOTAL_STEPS) {
        setStep(step + 1);
        return;
      }

      // analyzeAssessment redirects on success, so anything returned here is a failure.
      const analyzed = await analyzeAssessment(active);
      setError(analyzed?.error ?? "We could not finish your assessment.");
    });
  }

  return (
    <FocusedFlowLayout
      step={step}
      totalSteps={TOTAL_STEPS}
      back={
        step > 1 ? (
          <Button variant="tertiary" icon={ArrowLeftIcon} onClick={() => setStep(step - 1)} disabled={pending}>
            Back
          </Button>
        ) : null
      }
      forward={
        <Button
          variant="primary"
          icon={ArrowRightIcon}
          iconPosition="end"
          onClick={advance}
          disabled={!canContinue()}
          loading={pending}
        >
          {step < TOTAL_STEPS ? "Continue" : "Build my assessment"}
        </Button>
      }
    >
      {error ? (
        <div className="pb-6">
          <Alert tone="danger" title="That did not work">
            {error}
          </Alert>
        </div>
      ) : null}

      {step === 1 ? (
        <FlowStep
          eyebrow="Free business assessment"
          title="What do you do?"
          help="In your own words. One or two sentences is plenty."
        >
          <Field label="Your business" description="What you sell, and to whom.">
            <Textarea
              rows={5}
              value={draft.business_description}
              onChange={(e) => set("business_description", e.target.value)}
              placeholder="I design brand identities for early-stage software companies."
              maxLength={2000}
            />
          </Field>
          <VoiceInput onTranscript={(t) => set("business_description", t)} />
        </FlowStep>
      ) : null}

      {step === 2 ? (
        <FlowStep
          eyebrow="Where you are"
          title="Where are you today?"
          help="Revenue, clients, whatever is true. There is no wrong answer here."
        >
          <Field label="Your situation" description="Be blunt. A vague answer produces a vague plan.">
            <Textarea
              rows={5}
              value={draft.current_situation}
              onChange={(e) => set("current_situation", e.target.value)}
              placeholder="Three clients, invoiced personally, no company and no website."
              maxLength={2000}
            />
          </Field>
          <VoiceInput onTranscript={(t) => set("current_situation", t)} />
        </FlowStep>
      ) : null}

      {step === 3 ? (
        <FlowStep
          eyebrow="Your company"
          title="Do you already have a company?"
          help="If you do, we will not suggest you create another one."
        >
          <Field as="group" label="Company">
            <RadioGroup
              value={draft.company_situation}
              onValueChange={(v: unknown) => set("company_situation", v as Draft["company_situation"])}
            >
              <Choice label="No, I do not have one">
                <Radio value="none" />
              </Choice>
              <Choice label="Yes, I have a company already">
                <Radio value="existing" />
              </Choice>
              <Choice label="One is being set up right now">
                <Radio value="in_progress" />
              </Choice>
            </RadioGroup>
          </Field>
        </FlowStep>
      ) : null}

      {step === 4 ? (
        <FlowStep
          eyebrow="Where you want to go"
          title="Where do you want to be in twelve months?"
          help="The outcome, not the tactics. We will work out the tactics."
        >
          <Field label="Your goal">
            <Textarea
              rows={5}
              value={draft.twelve_month_goal}
              onChange={(e) => set("twelve_month_goal", e.target.value)}
              placeholder="Ten retained clients and a site that sells while I sleep."
              maxLength={2000}
            />
          </Field>
          <VoiceInput onTranscript={(t) => set("twelve_month_goal", t)} />
        </FlowStep>
      ) : null}

      {step === 5 ? (
        <FlowStep
          eyebrow="Your market"
          title="Where do you want to operate and sell?"
          help="This decides which structures make sense for you. Pick every market that matters."
        >
          <Field as="group" label="Markets" description="At least one.">
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {MARKETS.map((market) => (
                <Choice key={market.code} label={market.label}>
                  <Checkbox
                    checked={draft.target_markets.includes(market.code)}
                    onCheckedChange={(checked) =>
                      set(
                        "target_markets",
                        checked
                          ? [...draft.target_markets, market.code]
                          : draft.target_markets.filter((c) => c !== market.code),
                      )
                    }
                  />
                </Choice>
              ))}
            </div>
          </Field>
        </FlowStep>
      ) : null}
    </FocusedFlowLayout>
  );
}
