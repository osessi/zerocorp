import { describe, it, expect, vi } from "vitest";
import type {
  EligibilityRule,
  EntityType,
  FormationRequest,
  FounderProfile,
  ProviderCapabilities,
  TenantContext,
} from "@zerocorp/contracts";
import {
  EntityNotEligibleError,
  NoProviderAvailableError,
  applyProviderStatus,
  createFormationRequest,
  determineEntityOptions,
  importExistingCompany,
  selectFormationProvider,
  submitFormation,
  type FormationDeps,
} from "./use-cases";
import type { FormationCatalog, FormationProvider, FormationRepository } from "./ports";

const NOW = new Date("2026-09-01T00:00:00Z");
const CTX: TenantContext = {
  tenantId: "11111111-1111-4111-8111-111111111111" as TenantContext["tenantId"],
  requestId: "req" as TenantContext["requestId"],
  accessMode: "read-write",
};

function founder(over: Partial<FounderProfile> = {}): FounderProfile {
  return { residencyCountry: "FR", targetMarkets: ["US"], hasUsTaxId: false, ownerCount: 1, wantsExternalInvestment: false, ...over };
}

function entity(over: Partial<EntityType> = {}): EntityType {
  return {
    code: "us_llc", jurisdictionCode: "us-wy", name: "Limited Liability Company", customerLabel: "LLC",
    liabilityModel: "limited", taxTreatment: "elective", automationLevel: "operator_assisted",
    governmentFee: { amountMinor: 10_000, currency: "USD" },
    typicalDaysMin: 1, typicalDaysMax: 10, requiredRegistrations: [], notes: [], ...over,
  };
}

function capabilities(code: string, over: Partial<ProviderCapabilities> = {}): ProviderCapabilities {
  return {
    code, name: code, status: "active", reliabilityScore: 0.9,
    features: { webhooks: false, sandbox: false, statusPolling: false, documentRetrieval: true, rfi: true, cancellation: true, registeredAgent: false, taxIdFiling: true, identityVerification: false },
    coverage: [{
      entityTypeCode: "us_llc", automationLevel: "operator_assisted", supportsNonResident: true,
      wholesaleFee: null, typicalDaysMin: 2, typicalDaysMax: 15, verified: true, verifiedAt: NOW, verificationNote: null,
    }],
    ...over,
  };
}

/** Ports as plain fakes. No database, no provider, no network. */
function deps(over: Partial<FormationDeps<unknown>> = {}): FormationDeps<unknown> & {
  repo: ReturnType<typeof fakeRepository>;
  provider: FormationProvider;
} {
  const repo = fakeRepository();
  const provider = fakeProvider();
  const catalog: FormationCatalog = {
    listJurisdictions: async () => [],
    listEntityTypes: async () => [entity(), entity({ code: "gb_ltd", jurisdictionCode: "gb", customerLabel: "Ltd", typicalDaysMin: 1, typicalDaysMax: 5 })],
    getEntityType: async (code, j) => (code === "us_llc" && j === "us-wy" ? entity() : null),
    listEligibilityRules: async () => RULES,
    listProviderCapabilities: async () => [capabilities("manual_operator")],
  };
  return {
    uow: { withTenant: async (_ctx, fn) => fn({}) },
    catalog,
    repository: repo as unknown as FormationRepository<unknown>,
    providers: { get: () => provider, all: () => [provider] },
    clock: { now: () => NOW },
    ...over,
    repo,
    provider,
  } as never;
}

let RULES: EligibilityRule[] = [];

function fakeRepository() {
  const requests = new Map<string, FormationRequest>();
  const orders: Array<{ id: string; requestId: string; providerCode: string; status: string; providerRef?: string }> = [];
  const events: Array<{ orderId: string; kind: string }> = [];
  const companies: Array<{ id: string; origin: string; status: string }> = [];
  const registrations: Array<{ companyId: string; kind: string }> = [];
  let n = 0;
  return {
    requests, orders, events, companies, registrations,
    createRequest: async (_t: unknown, _c: unknown, r: FormationRequest) => { const id = `req_${++n}`; requests.set(id, r); return id; },
    getRequest: async (_t: unknown, _c: unknown, id: string) => requests.get(id) ?? null,
    updateRequest: async (_t: unknown, _c: unknown, id: string, patch: Partial<FormationRequest>) => {
      requests.set(id, { ...requests.get(id)!, ...patch });
    },
    createOrder: async (_t: unknown, _c: unknown, i: { requestId: string; providerCode: string; status: string }) => {
      const id = `ord_${++n}`; orders.push({ id, ...i }); return id;
    },
    setOrderStatus: async (_t: unknown, _c: unknown, id: string, s: string) => {
      const o = orders.find((x) => x.id === id); if (o) o.status = s;
    },
    setOrderProviderRef: async (_t: unknown, _c: unknown, id: string, ref: string) => {
      const o = orders.find((x) => x.id === id); if (o) o.providerRef = ref;
    },
    appendEvent: async (_t: unknown, _c: unknown, orderId: string, e: { kind: string }) => { events.push({ orderId, kind: e.kind }); },
    openRfi: async () => "rfi_1",
    answerRfi: async () => {},
    recordDocument: async () => "doc_1",
    createCompany: async (_t: unknown, _c: unknown, i: { origin: string; status: string }) => {
      const id = `co_${++n}`; companies.push({ id, origin: i.origin, status: i.status }); return id;
    },
    upsertRegistration: async (_t: unknown, _c: unknown, companyId: string, r: { kind: string }) => {
      registrations.push({ companyId, kind: r.kind });
    },
  };
}

function fakeProvider(): FormationProvider {
  return {
    code: "manual_operator",
    getCapabilities: async () => capabilities("manual_operator"),
    getEligibleEntities: async () => [],
    getPackages: async () => [],
    createFormation: async () => ({ providerCode: "manual_operator", externalId: "op_1" }),
    submitFormation: vi.fn(async () => {}),
    getFormationStatus: async () => ({ raw: "", observedAt: NOW }),
    uploadDocument: async () => {},
    getDocuments: async () => [],
    handleRfi: async () => {},
    cancelFormation: async () => {},
    getEvents: async () => [],
    translateStatus: (raw: string) => (raw === "filed_with_state" ? "filed" : raw === "in_review" ? "operator_review" : null),
  };
}

/* ─────────────────────────────────────────────────────────────────────────── */

describe("determineEntityOptions", () => {
  it("returns ineligible options too, with the reason", async () => {
    // Hiding them produces a screen that silently differs between two founders and
    // explains neither. "Why can't I pick a C-Corp" should be answerable.
    RULES = [{ code: "no", entityTypeCode: "gb_ltd", predicate: { kind: "residency_not_in", countries: ["GB"] }, effect: "deny", messageKey: "k" }];
    const options = await determineEntityOptions(deps()).execute(CTX, { founder: founder() });
    expect(options.map((o) => o.entityTypeCode)).toContain("gb_ltd");
    expect(options.find((o) => o.entityTypeCode === "gb_ltd")!.eligibility.eligible).toBe(false);
  });

  it("puts eligible options first, then the quickest", async () => {
    RULES = [];
    const options = await determineEntityOptions(deps()).execute(CTX, { founder: founder() });
    expect(options[0]!.entityTypeCode).toBe("gb_ltd"); // 1-5 days beats 1-10
  });
});

describe("createFormationRequest", () => {
  it("refuses before writing anything when the founder is not eligible", async () => {
    RULES = [{ code: "no", entityTypeCode: "us_llc", predicate: { kind: "residency_not_in", countries: ["US"] }, effect: "deny", messageKey: "k" }];
    const d = deps();
    await expect(
      createFormationRequest(d).execute(CTX, { entityTypeCode: "us_llc", jurisdictionCode: "us-wy", proposedNames: ["Acme"], founder: founder() }),
    ).rejects.toBeInstanceOf(EntityNotEligibleError);
    // A request that cannot be fulfilled is not a draft to clean up later.
    expect(d.repo.requests.size).toBe(0);
  });

  it("refuses an entity that is not in the catalog for that jurisdiction", async () => {
    RULES = [];
    await expect(
      createFormationRequest(deps()).execute(CTX, { entityTypeCode: "us_llc", jurisdictionCode: "gb", proposedNames: ["Acme"], founder: founder() }),
    ).rejects.toThrow(/No entity type/);
  });

  it("copies the government fee onto the request in the authority's currency", async () => {
    RULES = [];
    const d = deps();
    const { requestId } = await createFormationRequest(d).execute(CTX, {
      entityTypeCode: "us_llc", jurisdictionCode: "us-wy", proposedNames: ["Acme"], founder: founder(),
    });
    expect(d.repo.requests.get(requestId)!.governmentFee).toEqual({ amountMinor: 10_000, currency: "USD" });
  });
});

describe("selectFormationProvider", () => {
  it("records the decision even when nothing can execute it", async () => {
    // "No provider can do this today" is a fact worth keeping. It is what a new
    // integration gets measured against.
    RULES = [];
    const d = deps({ catalog: { ...deps().catalog, listProviderCapabilities: async () => [capabilities("off", { status: "disabled" })] } as never });
    const { requestId } = await createFormationRequest(d).execute(CTX, {
      entityTypeCode: "us_llc", jurisdictionCode: "us-wy", proposedNames: ["Acme"], founder: founder(),
    });
    await expect(selectFormationProvider(d).execute(CTX, { requestId })).rejects.toBeInstanceOf(NoProviderAvailableError);
    expect(d.repo.requests.get(requestId)!.status).toBe("unfulfillable");
    expect(d.repo.requests.get(requestId)!.routing).not.toBeNull();
  });

  it("stores why it chose what it chose", async () => {
    RULES = [];
    const d = deps();
    const { requestId } = await createFormationRequest(d).execute(CTX, {
      entityTypeCode: "us_llc", jurisdictionCode: "us-wy", proposedNames: ["Acme"], founder: founder(),
    });
    const decision = await selectFormationProvider(d).execute(CTX, { requestId });
    expect(decision.selected).toBe("manual_operator");
    expect(d.repo.requests.get(requestId)!.routing!.candidates[0]!.reasons.length).toBeGreaterThan(0);
  });
});

describe("submitFormation", () => {
  it("creates the order before calling the provider", async () => {
    // If the call fails, or succeeds and the response is lost, there has to be a row to
    // reconcile against. Creating it afterwards leaves a formation at the provider that
    // we have no record of.
    RULES = [];
    const d = deps();
    const { requestId } = await createFormationRequest(d).execute(CTX, {
      entityTypeCode: "us_llc", jurisdictionCode: "us-wy", proposedNames: ["Acme"], founder: founder(),
    });
    await selectFormationProvider(d).execute(CTX, { requestId });

    const order = { seen: false };
    (d.provider.createFormation as unknown as { mockImplementation?: unknown }) = undefined;
    d.provider.createFormation = async () => {
      order.seen = d.repo.orders.length === 1;
      return { providerCode: "manual_operator", externalId: "op_1" };
    };

    const { orderId } = await submitFormation(d).execute(CTX, { requestId });
    expect(order.seen).toBe(true);
    expect(d.repo.orders.find((o) => o.id === orderId)!.status).toBe("awaiting_provider");
    expect(d.repo.orders.find((o) => o.id === orderId)!.providerRef).toBe("op_1");
  });

  it("refuses to submit a request that was never routed", async () => {
    RULES = [];
    const d = deps();
    const { requestId } = await createFormationRequest(d).execute(CTX, {
      entityTypeCode: "us_llc", jurisdictionCode: "us-wy", proposedNames: ["Acme"], founder: founder(),
    });
    await expect(submitFormation(d).execute(CTX, { requestId })).rejects.toThrow(/not been routed/);
  });
});

describe("applyProviderStatus", () => {
  it("translates a provider string into a ZeroCorp status", async () => {
    const d = deps();
    const out = await applyProviderStatus(d).execute(CTX, {
      orderId: "ord_1", providerCode: "manual_operator", currentStatus: "awaiting_provider", raw: "filed_with_state",
    });
    expect(out).toEqual({ status: "filed", changed: true });
  });

  it("does not move the order on a status nobody mapped", async () => {
    // Guessing turns missing information into a lie the customer reads.
    const d = deps();
    const out = await applyProviderStatus(d).execute(CTX, {
      orderId: "ord_1", providerCode: "manual_operator", currentStatus: "awaiting_provider", raw: "WIDGET_QUEUED_7",
    });
    expect(out.changed).toBe(false);
    expect(out.status).toBe("awaiting_provider");
    expect(d.repo.events.map((e) => e.kind)).toContain("provider.status.untranslated");
  });

  it("refuses an illegal transition and records it", async () => {
    // Providers send events out of order and re-send old ones. A state machine that
    // accepts anything is a variable.
    const d = deps();
    const out = await applyProviderStatus(d).execute(CTX, {
      orderId: "ord_1", providerCode: "manual_operator", currentStatus: "formed", raw: "in_review",
    });
    expect(out.changed).toBe(false);
    expect(d.repo.events.map((e) => e.kind)).toContain("provider.status.illegal_transition");
  });

  it("is idempotent for a status the order already has", async () => {
    const d = deps();
    const out = await applyProviderStatus(d).execute(CTX, {
      orderId: "ord_1", providerCode: "manual_operator", currentStatus: "filed", raw: "filed_with_state",
    });
    expect(out.changed).toBe(false);
    expect(d.repo.events).toHaveLength(0);
  });
});

describe("importExistingCompany", () => {
  it("creates an active company with no formation order at all", async () => {
    // PRODUCT_SPEC.md §29.3 block 4. Inventing an order for a company formed elsewhere
    // puts a fiction in the audit trail.
    const d = deps();
    const { companyId } = await importExistingCompany(d).execute(CTX, {
      legalName: "Existing Ltd", jurisdictionCode: "gb", entityTypeCode: "gb_ltd",
      registrations: [{ kind: "tax_id", authority: "HMRC", identifier: "1234567890" }],
    });
    expect(d.repo.companies).toEqual([{ id: companyId, origin: "imported", status: "active" }]);
    expect(d.repo.orders).toEqual([]);
    expect(d.repo.registrations).toEqual([{ companyId, kind: "tax_id" }]);
  });
});
