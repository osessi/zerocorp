import { describe, it, expect } from "vitest";
import {
  PLAN_CATEGORIES,
  PLAN_PHASES,
  architectOutputSchema,
  planProposalSchema,
  planStepSchema,
} from "./plan";

/**
 * These tests are the reason an LLM cannot put arbitrary text in the database.
 * They assert the shape of the refusal, not the shape of the success — a schema
 * that only ever gets tested with valid input is a schema nobody has checked.
 */

function step(over: Record<string, unknown> = {}) {
  return {
    key: "form_company",
    title: "Form your Wyoming LLC",
    outcome: "A registered US company with an EIN",
    rationale: "You are selling to US customers and cannot open a US bank account without one.",
    phase: "build",
    category: "company",
    included: true,
    priority: 1,
    ...over,
  };
}

function proposal(over: Record<string, unknown> = {}) {
  return {
    title: "Launch plan",
    summary: "Form the company, build the site, publish, and start finding customers.",
    businessKind: "new",
    recommendedSetupPath: "launch",
    recommendedSubscriptionPlan: "growth",
    recommendationReason: "You need the content engine, which the launch plan does not include.",
    steps: [step(), step({ key: "brand" }), step({ key: "website" }), step({ key: "domain" })],
    ...over,
  };
}

describe("plan step", () => {
  it("accepts a well-formed step", () => {
    expect(planStepSchema.safeParse(step()).success).toBe(true);
  });

  it("refuses a key that is not stable snake_case", () => {
    // The key is what makes a customer's edits survive a regeneration. A model that
    // returns "Form Company!" every other run silently loses their choices.
    for (const key of ["Form Company", "form-company", "ab", "x".repeat(49), ""]) {
      expect(planStepSchema.safeParse(step({ key })).success).toBe(false);
    }
  });

  it("refuses a category ZeroCorp cannot execute", () => {
    expect(planStepSchema.safeParse(step({ category: "fundraising" })).success).toBe(false);
  });

  it("refuses a phase outside the single journey", () => {
    expect(planStepSchema.safeParse(step({ phase: "scale" })).success).toBe(false);
  });

  it("keeps every category and phase lowercase snake_case", () => {
    for (const v of [...PLAN_CATEGORIES, ...PLAN_PHASES]) expect(v).toMatch(/^[a-z_]+$/);
  });
});

describe("plan proposal", () => {
  it("accepts a well-formed proposal", () => {
    expect(planProposalSchema.safeParse(proposal()).success).toBe(true);
  });

  it("refuses a plan with fewer than four steps", () => {
    // A three-step plan is an answer the visitor could have written themselves.
    expect(planProposalSchema.safeParse(proposal({ steps: [step(), step(), step()] })).success).toBe(false);
  });

  it("refuses an unbounded plan", () => {
    // An unbounded model response is an unbounded row, an unbounded render and an
    // unbounded bill.
    const steps = Array.from({ length: 15 }, (_, i) => step({ key: `step_${i}` }));
    expect(planProposalSchema.safeParse(proposal({ steps })).success).toBe(false);
  });

  it("has no field a model could put a price in", () => {
    // A model that can quote a price is a model that can quote the wrong price.
    // Prices come from @zerocorp/config.
    const keys = Object.keys(planProposalSchema.shape);
    expect(keys.filter((k) => /price|cost|amount|cents|usd|\$/i.test(k))).toEqual([]);
  });

  it("strips unknown keys rather than storing them", () => {
    const parsed = planProposalSchema.parse({ ...proposal(), sneakyPrice: 12_900 });
    expect(parsed).not.toHaveProperty("sneakyPrice");
  });
});

describe("architect output", () => {
  it("requires both the analysis and the plan", () => {
    // The visitor was promised three panels AND a recommendation. A run that produces
    // only one of them is a failed run, not a partial success.
    expect(architectOutputSchema.safeParse({ plan: proposal() }).success).toBe(false);
  });

  it("requires at least two gaps, because one gap is not an analysis", () => {
    const analysis = {
      headline: "A solo consultancy with no US entity",
      whereYouAre: "You bill three US clients through a personal account.",
      whereYouWantToGo: "A US company with a site that sells while you sleep.",
      whatIsMissing: [{ title: "No US entity", why: "Clients cannot pay a company that does not exist.", severity: "blocking" }],
    };
    expect(architectOutputSchema.safeParse({ analysis, plan: proposal() }).success).toBe(false);
  });
});
