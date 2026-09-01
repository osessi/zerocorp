import { describe, it, expect } from "vitest";
import type { EligibilityRule, FounderProfile } from "@zerocorp/contracts";
import { evaluateEligibility, evaluatePredicate, requirementsFrom } from "./eligibility";

function founder(over: Partial<FounderProfile> = {}): FounderProfile {
  return {
    residencyCountry: "FR",
    targetMarkets: ["US"],
    hasUsTaxId: false,
    ownerCount: 1,
    wantsExternalInvestment: false,
    ...over,
  };
}

function rule(over: Partial<EligibilityRule> = {}): EligibilityRule {
  return {
    code: "r",
    entityTypeCode: "us_llc",
    predicate: { kind: "residency_not_in", countries: ["US"] },
    effect: "require",
    messageKey: "eligibility.us.ein_required",
    requires: { registration: "tax_id" },
    ...over,
  } as EligibilityRule;
}

describe("predicates", () => {
  it("reads residency both ways", () => {
    expect(evaluatePredicate({ kind: "residency_in", countries: ["FR"] }, founder())).toBe("true");
    expect(evaluatePredicate({ kind: "residency_not_in", countries: ["FR"] }, founder())).toBe("false");
  });

  it("counts owners", () => {
    expect(evaluatePredicate({ kind: "owner_count_max", value: 1 }, founder())).toBe("true");
    expect(evaluatePredicate({ kind: "owner_count_min", value: 2 }, founder())).toBe("false");
    expect(evaluatePredicate({ kind: "owner_count_min", value: 2 }, founder({ ownerCount: 3 }))).toBe("true");
  });

  it("returns unknown when the founder never told us", () => {
    // Nationality is optional, because asking for it up front costs conversions.
    // "We do not know" is a third answer and it has to be representable.
    expect(evaluatePredicate({ kind: "nationality_not_in", countries: ["IR"] }, founder())).toBe("unknown");
    expect(
      evaluatePredicate({ kind: "nationality_not_in", countries: ["IR"] }, founder({ nationalityCountry: "MA" })),
    ).toBe("true");
  });
});

describe("evaluation is not two-valued, on purpose", () => {
  it("does not silently drop a requirement it could not decide", () => {
    // Two-valued logic fails OPEN here: unknown reads as false, the rule does not fire,
    // and a mandatory step quietly disappears. In a compliance rule that is the wrong
    // direction to fail.
    const r = rule({
      predicate: { kind: "nationality_not_in", countries: ["XX"] },
      effect: "require",
      code: "needs_nationality",
    });
    const result = evaluateEligibility("us_llc", [r], founder());
    expect(result.findings).toHaveLength(1);
    expect(result.findings[0]!.effect).toBe("warn");
    expect(result.findings[0]!.messageKey).toContain("nationalityCountry");
  });

  it("does not block a founder on a rule it could not decide either", () => {
    // And the other failure: unknown reading as true blocks everyone who skipped an
    // optional question.
    const r = rule({ predicate: { kind: "nationality_not_in", countries: ["XX"] }, effect: "deny" });
    const result = evaluateEligibility("us_llc", [r], founder());
    expect(result.eligible).toBe(true);
    expect(result.findings[0]!.effect).toBe("warn");
  });

  it("keeps an indeterminate warn rule silent", () => {
    // A warning we cannot decide is not a warning, it is noise.
    const r = rule({ predicate: { kind: "nationality_not_in", countries: ["XX"] }, effect: "warn" });
    expect(evaluateEligibility("us_llc", [r], founder()).findings).toEqual([]);
  });
});

describe("results", () => {
  it("derives eligibility from the findings rather than storing it", () => {
    const denied = rule({ effect: "deny", predicate: { kind: "owner_count_max", value: 1 }, requires: undefined });
    expect(evaluateEligibility("us_llc", [denied], founder()).eligible).toBe(false);
    expect(evaluateEligibility("us_llc", [denied], founder({ ownerCount: 2 })).eligible).toBe(true);
  });

  it("ignores rules belonging to another entity type", () => {
    const other = rule({ entityTypeCode: "gb_ltd", effect: "deny", requires: undefined });
    expect(evaluateEligibility("us_llc", [other], founder()).findings).toEqual([]);
  });

  it("collects what became mandatory", () => {
    const result = evaluateEligibility(
      "us_llc",
      [
        rule({ code: "ein", requires: { registration: "tax_id" } }),
        rule({ code: "idv", requires: { identityVerification: true } }),
        rule({ code: "doc", requires: { document: "proof_of_address" } }),
      ],
      founder(),
    );
    const req = requirementsFrom(result);
    expect(req.registrations).toEqual(["tax_id"]);
    expect(req.documents).toEqual(["proof_of_address"]);
    expect(req.identityVerification).toBe(true);
  });

  it("adds nothing from a rule that did not fire", () => {
    const notFiring = rule({ predicate: { kind: "residency_in", countries: ["US"] } });
    expect(requirementsFrom(evaluateEligibility("us_llc", [notFiring], founder())).registrations).toEqual([]);
  });
});
