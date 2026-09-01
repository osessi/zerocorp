import { describe, it, expect, vi } from "vitest";
import {
  FORBIDDEN_INPUT_KEYS,
  architectInputSchema,
  architectOutputSchema,
  type ArchitectInput,
} from "@zerocorp/contracts";
import { ArchitectFailedError, type AITextProvider, type StructuredResponse } from "@zerocorp/application";
import { DeterministicArchitect } from "./deterministic";
import { FallbackArchitect, ModelBusinessArchitect } from "./model";
import { buildUserMessage } from "./prompt";
import { costMicros } from "../pricing";

function input(over: Partial<ArchitectInput> = {}): ArchitectInput {
  return architectInputSchema.parse({
    answers: {
      business_description: "I design brand identities for early-stage software companies.",
      current_situation: "Three clients, invoiced personally, no company.",
      company_situation: "none",
      twelve_month_goal: "Ten retained clients and a site that sells while I sleep.",
      target_markets: ["US", "GB"],
    },
    catalog: [
      {
        entityTypeCode: "us_llc", jurisdictionCode: "us-wy", customerLabel: "LLC",
        automationLevel: "operator_assisted", typicalDaysMin: 1, typicalDaysMax: 10,
        eligible: true, notes: [],
      },
      {
        entityTypeCode: "gb_ltd", jurisdictionCode: "gb", customerLabel: "Ltd",
        automationLevel: "operator_assisted", typicalDaysMin: 1, typicalDaysMax: 10,
        eligible: false, notes: [],
      },
    ],
    ...over,
  });
}

/* ── ADR 0002 §2 — the closed input ───────────────────────────────────────── */

describe("the architect cannot be handed sensitive data", () => {
  it("has no forbidden key anywhere in a serialised input", () => {
    // The type stops a field being ADDED. This walks the whole object graph, which is
    // what catches one smuggled into a nested record the type does not look into.
    const seen: string[] = [];
    const walk = (value: unknown, depth = 0): void => {
      if (depth > 8 || value === null || typeof value !== "object") return;
      for (const [key, child] of Object.entries(value)) {
        seen.push(key);
        walk(child, depth + 1);
      }
    };
    walk(input());
    const leaked = seen.filter((k) => (FORBIDDEN_INPUT_KEYS as readonly string[]).includes(k));
    expect(leaked).toEqual([]);
  });

  it("names no forbidden field in the prompt it builds", () => {
    const message = buildUserMessage(input()).toLowerCase();
    for (const key of ["passport", "stripe", "@", "tenantid", "storagekey"]) {
      expect(message).not.toContain(key);
    }
  });

  it("rejects an input carrying an unknown extra field rather than passing it on", () => {
    const parsed = architectInputSchema.parse({ ...input(), email: "a@b.com" });
    expect(parsed).not.toHaveProperty("email");
  });
});

/* ── The deterministic fallback ───────────────────────────────────────────── */

describe("DeterministicArchitect", () => {
  it("produces output that passes the real contract", async () => {
    const run = await new DeterministicArchitect().analyze(input());
    expect(architectOutputSchema.safeParse(run.output).success).toBe(true);
  });

  it("says it is deterministic, so the UI can label it", async () => {
    // Presenting a rules-based summary as an AI analysis is the dishonesty this
    // repository refuses everywhere else.
    const run = await new DeterministicArchitect().analyze(input());
    expect(run.deterministic).toBe(true);
    expect(run.usage.model).toBe("deterministic");
    expect(run.usage.costMinor).toBe(0);
  });

  it("recommends forming a company only when there is none", async () => {
    const none = await new DeterministicArchitect().analyze(input());
    expect(none.output.plan.companyRecommendation).toBe("form_new");
    expect(none.output.plan.recommendedEntityTypeCode).toBe("us_llc");
  });

  it("never re-forms a company that exists", async () => {
    const run = await new DeterministicArchitect().analyze(
      input({ answers: { ...input().answers, company_situation: "existing" } }),
    );
    expect(run.output.plan.companyRecommendation).toBe("use_existing");
    expect(run.output.plan.recommendedEntityTypeCode).toBeNull();
    expect(run.output.plan.recommendedSetupPath).toBe("activation");
  });

  it("can conclude that no company is needed", async () => {
    const run = await new DeterministicArchitect().analyze(
      input({ answers: { ...input().answers, company_situation: "in_progress" } }),
    );
    expect(run.output.plan.companyRecommendation).toBe("none_needed");
    expect(run.output.plan.recommendedEntityTypeCode).toBeNull();
  });

  it("never recommends an entity the founder is not eligible for", async () => {
    const run = await new DeterministicArchitect().analyze(
      input({ catalog: [{ ...input().catalog[0]!, eligible: false }] }),
    );
    expect(run.output.plan.recommendedEntityTypeCode).toBeNull();
  });

  it("says so when the founder needs a company we cannot form", async () => {
    // Not "none_needed". They may well need one; we cannot provide it, and the two are
    // different sentences to read.
    const run = await new DeterministicArchitect().analyze(
      input({ catalog: [{ ...input().catalog[0]!, eligible: false }] }),
    );
    expect(run.output.plan.companyRecommendation).toBe("unavailable");
    expect(run.output.plan.recommendationReason).toContain("cannot form one");
    // And the rest of the plan still runs.
    expect(run.output.plan.steps.filter((s) => s.included).length).toBeGreaterThanOrEqual(4);
  });

  it("honours an excluded jurisdiction", async () => {
    const run = await new DeterministicArchitect().analyze(
      input({ constraints: [{ kind: "exclude_jurisdiction", jurisdictionCode: "us-wy" }] }),
    );
    expect(run.output.plan.recommendedJurisdictionCode).not.toBe("us-wy");
  });

  it("removes a skipped category from the plan entirely", async () => {
    const run = await new DeterministicArchitect().analyze(
      input({ constraints: [{ kind: "skip_category", category: "brand" }] }),
    );
    expect(run.output.plan.steps.map((s) => s.category)).not.toContain("brand");
  });

  it("keeps a category they already have, excluded rather than deleted", async () => {
    // So a regeneration cannot resurrect it, and they can see it was considered.
    const run = await new DeterministicArchitect().analyze(
      input({ constraints: [{ kind: "already_have", category: "website" }] }),
    );
    const website = run.output.plan.steps.find((s) => s.category === "website");
    expect(website).toBeDefined();
    expect(website!.included).toBe(false);
  });

  it("stays inside the schema limits on a very long answer", async () => {
    // The clamps are the reason: a 2,000 character description would otherwise blow the
    // 160 character headline.
    const long = "x".repeat(1_999);
    const run = await new DeterministicArchitect().analyze(
      input({ answers: { ...input().answers, business_description: long } }),
    );
    expect(run.output.analysis.headline.length).toBeLessThanOrEqual(160);
  });
});

/* ── The model architect ──────────────────────────────────────────────────── */

function fakeProvider(responses: unknown[]): AITextProvider & { calls: number } {
  let calls = 0;
  const provider = {
    provider: "fake",
    get calls() { return calls; },
    async generateStructured(): Promise<StructuredResponse> {
      const json = responses[calls] ?? responses[responses.length - 1];
      calls += 1;
      return { json, provider: "fake", model: "claude-haiku-4-5-20251001", inputTokens: 3_000, outputTokens: 2_500 };
    },
  };
  return provider as AITextProvider & { calls: number };
}

async function validOutput(): Promise<unknown> {
  const run = await new DeterministicArchitect().analyze(input());
  return run.output;
}

describe("ModelBusinessArchitect", () => {
  it("returns a valid output on the first attempt", async () => {
    const provider = fakeProvider([await validOutput()]);
    const run = await new ModelBusinessArchitect({ provider }).analyze(input());
    expect(run.attempts).toBe(1);
    expect(run.deterministic).toBe(false);
  });

  it("retries once with the validation errors, then succeeds", async () => {
    const provider = fakeProvider([{ nonsense: true }, await validOutput()]);
    const run = await new ModelBusinessArchitect({ provider }).analyze(input());
    expect(run.attempts).toBe(2);
    expect(provider.calls).toBe(2);
  });

  it("fails rather than repairing a second invalid output", async () => {
    // Repairing usually works, which is the problem: it turns a loud failure into a
    // quiet one and produces a plan nobody specified.
    const provider = fakeProvider([{ nonsense: true }]);
    await expect(new ModelBusinessArchitect({ provider }).analyze(input())).rejects.toMatchObject({
      name: "ArchitectFailedError",
      reason: "invalid_output",
    });
    expect(provider.calls).toBe(2);
  });

  it("does not retry a schema correction against a dead provider", async () => {
    const dead: AITextProvider = {
      provider: "dead",
      generateStructured: vi.fn(async () => { throw new Error("ECONNREFUSED"); }),
    };
    await expect(new ModelBusinessArchitect({ provider: dead }).analyze(input())).rejects.toMatchObject({
      reason: "provider_unavailable",
    });
    expect(dead.generateStructured).toHaveBeenCalledTimes(1);
  });

  it("rejects a well-formed plan that names an entity we do not offer", async () => {
    // "Nevada LLC" reads fine and cannot be bought.
    const bad = await validOutput() as { plan: Record<string, unknown> };
    bad.plan.recommendedEntityTypeCode = "us_nevada_llc";
    const provider = fakeProvider([bad]);
    await expect(new ModelBusinessArchitect({ provider }).analyze(input())).rejects.toMatchObject({
      reason: "invalid_output",
    });
  });

  it("records what the run cost", async () => {
    const provider = fakeProvider([await validOutput()]);
    const run = await new ModelBusinessArchitect({ provider }).analyze(input());
    // 3,000 in at $1/M and 2,500 out at $5/M = $0.0155 = 15,500 micro-dollars.
    expect(run.usage.costMinor).toBe(15_500);
  });
});

describe("cost accounting", () => {
  it("prices a known model", () => {
    expect(costMicros("claude-haiku-4-5-20251001", 1_000_000, 0)).toBe(1_000_000);
  });

  it("returns null for a model it has no price for, rather than zero", () => {
    // Zero would quietly report 100% margin on it.
    expect(costMicros("some-new-model", 1_000, 1_000)).toBeNull();
  });
});

describe("FallbackArchitect", () => {
  it("falls back when the model path fails, so the visitor still gets an answer", async () => {
    const failing = {
      kind: "model" as const,
      analyze: async () => { throw new ArchitectFailedError("provider_unavailable", "down", 1); },
    };
    const reasons: string[] = [];
    const run = await new FallbackArchitect(failing, new DeterministicArchitect(), (r) => reasons.push(r)).analyze(input());
    expect(run.deterministic).toBe(true);
    expect(reasons).toEqual(["provider_unavailable"]);
  });

  it("does not fall back when the model succeeds", async () => {
    const provider = fakeProvider([await validOutput()]);
    const run = await new FallbackArchitect(new ModelBusinessArchitect({ provider }), new DeterministicArchitect()).analyze(input());
    expect(run.deterministic).toBe(false);
  });
});
