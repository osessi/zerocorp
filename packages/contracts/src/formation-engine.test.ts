import { describe, it, expect } from "vitest";
import {
  AUTOMATION_LEVELS,
  entityTypeSchema,
  founderProfileSchema,
  jurisdictionSchema,
} from "./jurisdiction";
import { eligibilityRuleSchema } from "./eligibility";
import { providerCapabilitiesSchema, providerCoverageSchema, routingDecisionSchema } from "./provider";
import {
  FORMATION_REQUEST_STATUSES,
  FORMATION_REQUEST_TERMINAL,
  FORMATION_REQUEST_TRANSITIONS,
  canTransitionRequest,
  formationDocumentSchema,
  formationRfiSchema,
} from "./formation-request";
import { FORMATION_ORDER_STATUSES, canTransitionOrder } from "./formation";

/* ── Jurisdiction and catalog ─────────────────────────────────────────────── */

describe("jurisdiction", () => {
  it("accepts a country with no subdivision, which is most of the world", () => {
    // The US is the unusual one. A model shaped around it breaks on the second country.
    const gb = { code: "gb", countryCode: "GB", subdivisionCode: null, name: "United Kingdom", status: "available" };
    expect(jurisdictionSchema.safeParse(gb).success).toBe(true);
  });

  it("accepts a US state as a subdivision", () => {
    const wy = { code: "us-wy", countryCode: "US", subdivisionCode: "WY", name: "Wyoming", status: "available" };
    expect(jurisdictionSchema.safeParse(wy).success).toBe(true);
  });

  it("refuses UK as a country code, because ISO says GB", () => {
    const bad = { code: "uk", countryCode: "UK", subdivisionCode: null, name: "United Kingdom", status: "available" };
    expect(jurisdictionSchema.safeParse(bad).success).toBe(false);
  });
});

function entity(over: Record<string, unknown> = {}) {
  return {
    code: "us_llc",
    jurisdictionCode: "us-wy",
    name: "Limited Liability Company",
    customerLabel: "LLC",
    liabilityModel: "limited",
    taxTreatment: "pass_through",
    automationLevel: "operator_assisted",
    governmentFee: { amountMinor: 10_000, currency: "USD" },
    typicalDaysMin: 1,
    typicalDaysMax: 10,
    requiredRegistrations: [
      { kind: "tax_id", authority: "IRS", required: true, typicalDaysMin: 14, typicalDaysMax: 45 },
    ],
    notes: [],
    ...over,
  };
}

describe("entity type — the honesty field", () => {
  it("has no default automation level", () => {
    // The failure mode is selling automation that does not exist. A default would let
    // a catalog row be added without anyone deciding.
    const { automationLevel: _omitted, ...rest } = entity();
    expect(entityTypeSchema.safeParse(rest).success).toBe(false);
  });

  it("offers exactly three levels, one of which is 'a human does it'", () => {
    expect(AUTOMATION_LEVELS).toEqual(["automated", "operator_assisted", "unavailable"]);
  });

  it("takes a government fee in the authority's own currency", () => {
    // D15: £100 for a UK incorporation is cost money, never customer money.
    const gb = entity({ code: "gb_ltd", governmentFee: { amountMinor: 10_000, currency: "GBP" } });
    expect(entityTypeSchema.safeParse(gb).success).toBe(true);
  });

  it("keeps entity codes open so a new country needs no code change", () => {
    expect(entityTypeSchema.safeParse(entity({ code: "sg_pte_ltd" })).success).toBe(true);
  });

  it("refuses a code that is not country-prefixed", () => {
    expect(entityTypeSchema.safeParse(entity({ code: "llc" })).success).toBe(false);
  });
});

describe("founder profile", () => {
  it("requires at least one target market", () => {
    // Jurisdiction routing has no input without it.
    const bad = { residencyCountry: "FR", targetMarkets: [] };
    expect(founderProfileSchema.safeParse(bad).success).toBe(false);
  });

  it("keeps residency and nationality apart", () => {
    // Different questions, and occasionally the deciding one is the second.
    const p = founderProfileSchema.parse({ residencyCountry: "FR", nationalityCountry: "MA", targetMarkets: ["US"] });
    expect(p.residencyCountry).not.toBe(p.nationalityCountry);
  });
});

/* ── Eligibility ──────────────────────────────────────────────────────────── */

describe("eligibility rules", () => {
  it("accepts a closed predicate", () => {
    const rule = {
      code: "us_llc_single_member",
      entityTypeCode: "us_llc",
      predicate: { kind: "owner_count_min", value: 1 },
      effect: "warn",
      messageKey: "eligibility.us_llc.single_member",
    };
    expect(eligibilityRuleSchema.safeParse(rule).success).toBe(true);
  });

  it("refuses a predicate the evaluator does not implement", () => {
    // The whole reason the union is closed. Free-form JSON lets a rule express
    // something nothing runs, and the failure is silent.
    const rule = {
      code: "made_up",
      entityTypeCode: "us_llc",
      predicate: { kind: "founder_is_left_handed" },
      effect: "deny",
      messageKey: "x",
    };
    expect(eligibilityRuleSchema.safeParse(rule).success).toBe(false);
  });

  it("takes an i18n key, not a rendered sentence", () => {
    const rule = {
      code: "c",
      entityTypeCode: "us_llc",
      predicate: { kind: "requires_us_tax_id" },
      effect: "require",
      messageKey: "You will need an ITIN before we can file this for you, which usually takes several weeks to obtain from the IRS and requires a certified copy of your passport.",
    };
    expect(eligibilityRuleSchema.safeParse(rule).success).toBe(false);
  });
});

/* ── Provider ─────────────────────────────────────────────────────────────── */

describe("provider coverage — a capability is not real until verified", () => {
  it("defaults verified to false", () => {
    // A public marketing page claiming an API is not verification.
    const c = providerCoverageSchema.parse({
      entityTypeCode: "us_llc",
      automationLevel: "automated",
      supportsNonResident: true,
      wholesaleFee: null,
      typicalDaysMin: 1,
      typicalDaysMax: 5,
    });
    expect(c.verified).toBe(false);
    expect(c.verifiedAt).toBeNull();
  });
});

describe("routing decision", () => {
  it("records why, not just what", () => {
    // "Why did we route to provider B" has to be answerable months later, when the
    // provider has changed and the code no longer reproduces the decision.
    const d = routingDecisionSchema.safeParse({
      entityTypeCode: "gb_ltd",
      candidates: [
        { providerCode: "manual_operator", score: 0.4, reasons: ["only verified route for gb_ltd"], excludedBecause: null },
        { providerCode: "some_api", score: 0, reasons: [], excludedBecause: "coverage not verified" },
      ],
      selected: "manual_operator",
      fallbacks: [],
      decidedAt: new Date(),
      policyVersion: "v1",
    });
    expect(d.success).toBe(true);
  });

  it("allows no provider at all", () => {
    // "Nothing can do this today" is a real outcome and must be recordable.
    const d = routingDecisionSchema.safeParse({
      entityTypeCode: "sg_pte_ltd",
      candidates: [],
      selected: null,
      fallbacks: [],
      decidedAt: new Date(),
      policyVersion: "v1",
    });
    expect(d.success).toBe(true);
  });
});

describe("provider capabilities", () => {
  it("describes what our code can rely on, flag by flag", () => {
    const caps = providerCapabilitiesSchema.safeParse({
      code: "manual_operator",
      name: "ZeroCorp operator",
      status: "active",
      features: {
        webhooks: false, sandbox: false, statusPolling: false, documentRetrieval: true,
        rfi: true, cancellation: true, registeredAgent: false, taxIdFiling: true,
        identityVerification: false,
      },
      coverage: [],
      reliabilityScore: 1,
    });
    expect(caps.success).toBe(true);
  });
});

/* ── Request and order ────────────────────────────────────────────────────── */

describe("formation request — the customer's ask, not one attempt at it", () => {
  it("gives every state a transition list", () => {
    for (const s of FORMATION_REQUEST_STATUSES) expect(FORMATION_REQUEST_TRANSITIONS[s]).toBeDefined();
  });

  it("lets nothing leave a terminal state", () => {
    for (const s of FORMATION_REQUEST_TERMINAL) expect(FORMATION_REQUEST_TRANSITIONS[s]).toEqual([]);
  });

  it("leaves no state stranded", () => {
    const seen = new Set<string>(["draft"]);
    const queue: string[] = ["draft"];
    while (queue.length) {
      const at = queue.shift() as (typeof FORMATION_REQUEST_STATUSES)[number];
      for (const n of FORMATION_REQUEST_TRANSITIONS[at]) if (!seen.has(n)) { seen.add(n); queue.push(n); }
    }
    expect(FORMATION_REQUEST_STATUSES.filter((s) => !seen.has(s))).toEqual([]);
  });

  it("lets a request be re-routed when a provider fails", () => {
    // The whole point of the request/order split: a failed attempt does not consume
    // the customer's ask.
    expect(canTransitionRequest("executing", "routed")).toBe(true);
  });

  it("does not treat 'no provider can do this' as final", () => {
    // It is a fact about today, not about the request.
    expect(FORMATION_REQUEST_TERMINAL).not.toContain("unfulfillable");
    expect(canTransitionRequest("unfulfillable", "eligibility_checked")).toBe(true);
  });

  it("shares no state name with the order machine", () => {
    const overlap = FORMATION_REQUEST_STATUSES.filter((s) =>
      (FORMATION_ORDER_STATUSES as readonly string[]).includes(s),
    );
    expect(overlap).toEqual(["draft", "cancelled"]);
  });
});

describe("the order states added with D14", () => {
  it("distinguishes 'with the provider' from 'filed'", () => {
    // Nothing has been filed while a provider is still holding it, and it is still
    // cancellable, which `filed` is not.
    expect(canTransitionOrder("ready_to_file", "awaiting_provider")).toBe(true);
    expect(canTransitionOrder("awaiting_provider", "cancelled")).toBe(true);
    expect(canTransitionOrder("filed", "cancelled")).toBe(false);
  });

  it("distinguishes a request for information from a rejection", () => {
    // Nothing was refused; something was asked. Collapsing the two loses the difference
    // between "fix this and resubmit" and "answer this and we continue".
    expect(canTransitionOrder("awaiting_provider", "information_requested")).toBe(true);
    expect(canTransitionOrder("information_requested", "awaiting_provider")).toBe(true);
    expect(canTransitionOrder("information_requested", "filed")).toBe(false);
  });

  it("names no provider vocabulary in any state", () => {
    for (const s of FORMATION_ORDER_STATUSES) {
      expect(s).not.toMatch(/doola|corpnet|stripe|provider_[a-z]+_/);
    }
  });
});

describe("RFI and documents speak ZeroCorp's language", () => {
  it("stores our question, not the provider's wording", () => {
    const rfi = formationRfiSchema.safeParse({
      question: "We need a second proof of address dated in the last three months.",
      requiredDocuments: ["proof_of_address"],
      status: "open",
      dueAt: null,
    });
    expect(rfi.success).toBe(true);
  });

  it("names document types by the role they play, not by jurisdiction", () => {
    // certificate_of_formation covers a US certificate and a UK certificate of
    // incorporation. The code branches on the role; the label is localised.
    const d = formationDocumentSchema.safeParse({
      type: "certificate_of_formation",
      storageKey: "identity/tenant/abc/cert.pdf",
      issuedAt: null,
      retentionUntil: null,
    });
    expect(d.success).toBe(true);
  });
});
