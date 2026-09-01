import { describe, it, expect } from "vitest";
import type { FounderProfile, ProviderCapabilities } from "@zerocorp/contracts";
import { ROUTING_POLICY_VERSION, ROUTING_WEIGHTS, selectProvider } from "./routing";

const NOW = new Date("2026-09-01T00:00:00Z");

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

function provider(code: string, over: Partial<ProviderCapabilities> = {}): ProviderCapabilities {
  return {
    code,
    name: code,
    status: "active",
    features: {
      webhooks: true, sandbox: true, statusPolling: true, documentRetrieval: true,
      rfi: true, cancellation: true, registeredAgent: true, taxIdFiling: true,
      identityVerification: false,
    },
    reliabilityScore: 0.8,
    coverage: [
      {
        entityTypeCode: "us_llc",
        automationLevel: "automated",
        supportsNonResident: true,
        wholesaleFee: { amountMinor: 10_000, currency: "USD" },
        typicalDaysMin: 1,
        typicalDaysMax: 3,
        verified: true,
        verifiedAt: NOW,
        verificationNote: null,
      },
    ],
    ...over,
  };
}

function route(providers: ProviderCapabilities[], over: Record<string, unknown> = {}) {
  return selectProvider({ entityTypeCode: "us_llc", founder: founder(), providers, now: NOW, ...over });
}

describe("weights", () => {
  it("sum to one, so a score reads as a fraction", () => {
    const total = Object.values(ROUTING_WEIGHTS).reduce((a, b) => a + b, 0);
    expect(total).toBeCloseTo(1, 10);
  });
});

describe("exclusions run before scoring", () => {
  it("refuses an unverified coverage outright", () => {
    // Not a low score: a low score still wins when it is the only candidate, which is
    // exactly how an unverified provider ends up filing someone's company.
    const p = provider("unverified");
    p.coverage[0]!.verified = false;
    const d = route([p]);
    expect(d.selected).toBeNull();
    expect(d.candidates[0]!.excludedBecause).toMatch(/not verified/);
  });

  it("allows an unverified coverage only when explicitly asked", () => {
    const p = provider("unverified");
    p.coverage[0]!.verified = false;
    expect(route([p], { allowUnverified: true }).selected).toBe("unverified");
  });

  it("excludes a disabled provider", () => {
    expect(route([provider("off", { status: "disabled" })]).selected).toBeNull();
  });

  it("excludes a provider with no coverage for the entity", () => {
    const d = selectProvider({ entityTypeCode: "gb_ltd", founder: founder(), providers: [provider("us_only")], now: NOW });
    expect(d.selected).toBeNull();
    expect(d.candidates[0]!.excludedBecause).toContain("gb_ltd");
  });

  it("excludes a provider that cannot serve a non-resident founder", () => {
    const p = provider("residents_only");
    p.coverage[0]!.supportsNonResident = false;
    // Resident in FR, selling to US: non-resident for a US entity.
    expect(route([p]).selected).toBeNull();
  });

  it("records every exclusion with its reason, not just the winner", () => {
    const d = route([provider("good"), provider("off", { status: "disabled" })]);
    expect(d.candidates).toHaveLength(2);
    expect(d.candidates.find((c) => c.providerCode === "off")!.excludedBecause).toBeTruthy();
  });
});

describe("scoring", () => {
  it("prefers an automated route over an operator-assisted one, all else equal", () => {
    const manual = provider("manual");
    manual.coverage[0]!.automationLevel = "operator_assisted";
    expect(route([provider("api"), manual]).selected).toBe("api");
  });

  it("prefers the more reliable provider", () => {
    expect(route([provider("flaky", { reliabilityScore: 0.2 }), provider("solid", { reliabilityScore: 0.99 })]).selected)
      .toBe("solid");
  });

  it("penalises a degraded provider without excluding it", () => {
    // Degraded is "slower and less certain", not "cannot". Excluding it would take the
    // product offline whenever a provider has a bad afternoon.
    const d = route([provider("degraded", { status: "degraded" })]);
    expect(d.selected).toBe("degraded");
    expect(d.candidates[0]!.reasons).toContain("provider is degraded");
  });

  it("does not treat an unknown wholesale price as free", () => {
    // Otherwise every provider we have never negotiated with looks like the cheapest.
    const unknown = provider("unknown_price");
    unknown.coverage[0]!.wholesaleFee = null;
    const cheap = provider("cheap");
    cheap.coverage[0]!.wholesaleFee = { amountMinor: 0, currency: "USD" };
    const d = route([unknown, cheap]);
    expect(d.selected).toBe("cheap");
    expect(d.candidates.find((c) => c.providerCode === "unknown_price")!.reasons)
      .toContain("wholesale price unknown");
  });
});

describe("the decision is reproducible", () => {
  it("breaks ties deterministically", () => {
    // A router whose past decisions cannot be reproduced is a router whose past
    // decisions cannot be explained.
    const first = route([provider("bbb"), provider("aaa")]);
    const second = route([provider("aaa"), provider("bbb")]);
    expect(first.selected).toBe(second.selected);
    expect(first.selected).toBe("aaa");
  });

  it("stamps the policy version, so an old decision can be replayed", () => {
    expect(route([provider("a")]).policyVersion).toBe(ROUTING_POLICY_VERSION);
  });

  it("keeps the losers as ordered fallbacks", () => {
    const manual = provider("manual");
    manual.coverage[0]!.automationLevel = "operator_assisted";
    const d = route([provider("api"), manual]);
    expect(d.selected).toBe("api");
    expect(d.fallbacks).toEqual(["manual"]);
  });

  it("returns no fallback when nothing is eligible", () => {
    expect(route([provider("off", { status: "disabled" })]).fallbacks).toEqual([]);
  });
});
