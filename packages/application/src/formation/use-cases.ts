import {
  canTransitionOrder,
  canTransitionRequest,
  type EligibilityResult,
  type FormationOrderStatus,
  type FormationRequest,
  type FounderProfile,
  type RoutingDecision,
  type TenantContext,
} from "@zerocorp/contracts";
import { evaluateEligibility, requirementsFrom, selectProvider } from "@zerocorp/domain";
import type { Clock, UnitOfWork } from "../ports";
import { defineUseCase, type UseCase } from "../use-case";
import type {
  FormationCatalog,
  FormationProviderRegistry,
  FormationRepository,
} from "./ports";

/**
 * Formation use cases — the orchestration layer.
 *
 * The domain decides (eligibility, routing). Infrastructure executes (providers,
 * database). This layer sequences the two and owns the transaction boundary, and it
 * imports no provider SDK and no database client, which dependency-cruiser enforces.
 */

export interface FormationDeps<TTx> {
  readonly uow: UnitOfWork<TTx>;
  readonly catalog: FormationCatalog;
  readonly repository: FormationRepository<TTx>;
  readonly providers: FormationProviderRegistry;
  readonly clock: Clock;
  /** Staging may route to an unverified adapter. Production never does. */
  readonly allowUnverifiedProviders?: boolean;
}

/* ── Recommending an entity ───────────────────────────────────────────────── */

export interface EntityOption {
  readonly entityTypeCode: string;
  readonly jurisdictionCode: string;
  readonly customerLabel: string;
  readonly automationLevel: string;
  readonly eligibility: EligibilityResult;
  readonly requirements: ReturnType<typeof requirementsFrom>;
  readonly typicalDaysMin: number;
  readonly typicalDaysMax: number;
}

/**
 * Every entity in the catalog, each with its verdict for THIS founder.
 *
 * It returns ineligible options too, with the reason. Hiding them produces a screen
 * that silently differs between two founders and explains neither, and "why can't I
 * pick a C-Corp" is a question the product should answer rather than dodge.
 */
export function determineEntityOptions<TTx>(deps: FormationDeps<TTx>) {
  return defineUseCase<{ founder: FounderProfile }, EntityOption[]>(
    "formation.determineEntityOptions",
    async (_ctx, input) => {
      const entities = await deps.catalog.listEntityTypes();
      const options: EntityOption[] = [];

      for (const entity of entities) {
        const rules = await deps.catalog.listEligibilityRules(entity.code);
        const eligibility = evaluateEligibility(entity.code, rules, input.founder);
        options.push({
          entityTypeCode: entity.code,
          jurisdictionCode: entity.jurisdictionCode,
          customerLabel: entity.customerLabel,
          automationLevel: entity.automationLevel,
          eligibility,
          requirements: requirementsFrom(eligibility),
          typicalDaysMin: entity.typicalDaysMin,
          typicalDaysMax: entity.typicalDaysMax,
        });
      }

      // Eligible first, then by how quickly it completes. Never by price: the customer
      // pays one ZeroCorp price, so ordering by our cost would be ordering by our margin.
      return options.sort(
        (a, b) =>
          Number(b.eligibility.eligible) - Number(a.eligibility.eligible) ||
          a.typicalDaysMax - b.typicalDaysMax,
      );
    },
  );
}

/* ── Creating a request ───────────────────────────────────────────────────── */

export class EntityNotEligibleError extends Error {
  override readonly name = "EntityNotEligibleError";
  constructor(readonly entityTypeCode: string, readonly result: EligibilityResult) {
    super(`${entityTypeCode} is not available to this founder`);
  }
}

export class UnknownEntityTypeError extends Error {
  override readonly name = "UnknownEntityTypeError";
  constructor(code: string, jurisdiction: string) {
    super(`No entity type "${code}" in jurisdiction "${jurisdiction}"`);
  }
}

export function createFormationRequest<TTx>(deps: FormationDeps<TTx>): UseCase<
  { entityTypeCode: string; jurisdictionCode: string; proposedNames: string[]; founder: FounderProfile },
  { requestId: string; eligibility: EligibilityResult }
> {
  return defineUseCase("formation.createRequest", async (ctx, input) => {
    const entity = await deps.catalog.getEntityType(input.entityTypeCode, input.jurisdictionCode);
    if (!entity) throw new UnknownEntityTypeError(input.entityTypeCode, input.jurisdictionCode);

    const rules = await deps.catalog.listEligibilityRules(entity.code);
    const eligibility = evaluateEligibility(entity.code, rules, input.founder);
    // Checked here, before anything is written. A request that cannot be fulfilled is
    // not a draft to clean up later, it is a question that has already been answered.
    if (!eligibility.eligible) throw new EntityNotEligibleError(entity.code, eligibility);

    const request: FormationRequest = {
      entityTypeCode: entity.code,
      jurisdictionCode: entity.jurisdictionCode,
      proposedNames: input.proposedNames,
      founder: input.founder,
      status: "eligibility_checked",
      eligibility: [eligibility],
      routing: null,
      price: null,
      governmentFee: entity.governmentFee,
      providerFee: null,
    };

    const requestId = await deps.uow.withTenant(ctx, (tx) =>
      deps.repository.createRequest(tx, ctx, request),
    );
    return { requestId, eligibility };
  });
}

/* ── Routing ──────────────────────────────────────────────────────────────── */

export class NoProviderAvailableError extends Error {
  override readonly name = "NoProviderAvailableError";
  constructor(readonly decision: RoutingDecision) {
    super(`No provider can execute ${decision.entityTypeCode} today`);
  }
}

export function selectFormationProvider<TTx>(deps: FormationDeps<TTx>): UseCase<
  { requestId: string },
  RoutingDecision
> {
  return defineUseCase("formation.selectProvider", async (ctx, input) => {
    const request = await deps.uow.withTenant(ctx, (tx) =>
      deps.repository.getRequest(tx, ctx, input.requestId),
    );
    if (!request) throw new Error(`No formation request ${input.requestId}`);

    const decision = selectProvider({
      entityTypeCode: request.entityTypeCode,
      founder: request.founder,
      providers: await deps.catalog.listProviderCapabilities(),
      now: deps.clock.now(),
      ...(deps.allowUnverifiedProviders === true ? { allowUnverified: true } : {}),
    });

    await deps.uow.withTenant(ctx, (tx) =>
      deps.repository.updateRequest(tx, ctx, input.requestId, {
        routing: decision,
        // Recorded either way. "Nothing can do this today" is a fact worth keeping:
        // it is what a new provider integration is measured against.
        status: decision.selected === null ? "unfulfillable" : "routed",
      }),
    );

    if (decision.selected === null) throw new NoProviderAvailableError(decision);
    return decision;
  });
}

/* ── Submitting ───────────────────────────────────────────────────────────── */

export function submitFormation<TTx>(deps: FormationDeps<TTx>): UseCase<
  { requestId: string },
  { orderId: string; providerCode: string }
> {
  return defineUseCase("formation.submit", async (ctx, input) => {
    const request = await deps.uow.withTenant(ctx, (tx) =>
      deps.repository.getRequest(tx, ctx, input.requestId),
    );
    if (!request) throw new Error(`No formation request ${input.requestId}`);
    if (!request.routing?.selected) throw new Error(`Request ${input.requestId} has not been routed`);
    assertRequestTransition(request.status, "executing");

    const providerCode = request.routing.selected;
    const provider = deps.providers.get(providerCode);

    // The order exists BEFORE the provider is called. If the call fails, or succeeds
    // and the response is lost, there is a row to reconcile against. Creating it after
    // would leave a formation at the provider that we have no record of.
    const orderId = await deps.uow.withTenant(ctx, (tx) =>
      deps.repository.createOrder(tx, ctx, { requestId: input.requestId, providerCode, status: "ready_to_file" }),
    );

    const ref = await provider.createFormation(request);
    await provider.submitFormation(ref);

    await deps.uow.withTenant(ctx, async (tx) => {
      await deps.repository.setOrderProviderRef(tx, ctx, orderId, ref.externalId);
      await deps.repository.setOrderStatus(tx, ctx, orderId, "awaiting_provider");
      await deps.repository.updateRequest(tx, ctx, input.requestId, { status: "executing" });
    });

    return { orderId, providerCode };
  });
}

/* ── Reading a provider's status back ─────────────────────────────────────── */

/**
 * Translate a provider status and advance the order.
 *
 * Two guards, and both have caught real classes of bug elsewhere:
 *
 *   1. An untranslatable status does NOT move the order. It is recorded as an event
 *      and left alone, because a status nobody mapped is information, and guessing
 *      turns it into a lie the customer reads.
 *   2. An illegal transition does not move it either. Providers send events out of
 *      order and re-send old ones; a state machine that accepts anything is a variable.
 */
export function applyProviderStatus<TTx>(deps: FormationDeps<TTx>): UseCase<
  { orderId: string; providerCode: string; currentStatus: FormationOrderStatus; raw: string },
  { status: FormationOrderStatus; changed: boolean; reason?: string }
> {
  return defineUseCase("formation.applyProviderStatus", async (ctx, input) => {
    const provider = deps.providers.get(input.providerCode);
    const translated = provider.translateStatus(input.raw);
    const now = deps.clock.now();

    const record = (kind: string, payload: Record<string, unknown>) =>
      deps.uow.withTenant(ctx, (tx) =>
        deps.repository.appendEvent(tx, ctx, input.orderId, {
          source: "provider",
          providerCode: input.providerCode,
          externalEventId: null,
          kind,
          payload,
          occurredAt: now,
        }),
      );

    if (translated === null) {
      await record("provider.status.untranslated", { raw: input.raw });
      return { status: input.currentStatus, changed: false, reason: "no ZeroCorp equivalent" };
    }

    if (translated === input.currentStatus) {
      return { status: input.currentStatus, changed: false, reason: "already in this state" };
    }

    if (!canTransitionOrder(input.currentStatus, translated)) {
      await record("provider.status.illegal_transition", {
        raw: input.raw,
        from: input.currentStatus,
        to: translated,
      });
      return { status: input.currentStatus, changed: false, reason: "illegal transition" };
    }

    await deps.uow.withTenant(ctx, async (tx) => {
      await deps.repository.setOrderStatus(tx, ctx, input.orderId, translated);
      await deps.repository.appendEvent(tx, ctx, input.orderId, {
        source: "provider",
        providerCode: input.providerCode,
        externalEventId: null,
        kind: "provider.status.applied",
        payload: { raw: input.raw, from: input.currentStatus, to: translated },
        occurredAt: now,
      });
    });

    return { status: translated, changed: true };
  });
}

/* ── Existing companies ───────────────────────────────────────────────────── */

/**
 * Import a company that already exists.
 *
 * PRODUCT_SPEC.md §29.3 block 4: it enters at `active` with NO formation order at all.
 * A formation order is the record of work ZeroCorp did, and inventing one for a company
 * formed elsewhere puts a fiction in the audit trail.
 *
 * "Créer une nouvelle LLC pour tout le monde est INTERDIT comme logique produit par
 * défaut" — this use case is the path that makes that rule usable.
 */
export function importExistingCompany<TTx>(deps: FormationDeps<TTx>): UseCase<
  {
    legalName: string;
    jurisdictionCode: string;
    entityTypeCode: string | null;
    registrations: Array<{ kind: string; authority: string; identifier: string | null }>;
  },
  { companyId: string }
> {
  return defineUseCase("formation.importExistingCompany", async (ctx, input) => {
    const companyId = await deps.uow.withTenant(ctx, async (tx) => {
      const id = await deps.repository.createCompany(tx, ctx, {
        legalName: input.legalName,
        jurisdictionCode: input.jurisdictionCode,
        entityTypeCode: input.entityTypeCode,
        origin: "imported",
        status: "active",
      });
      for (const r of input.registrations) {
        await deps.repository.upsertRegistration(tx, ctx, id, {
          kind: r.kind as never,
          authority: r.authority,
          identifier: r.identifier,
          requestedAt: null,
          issuedAt: r.identifier === null ? null : deps.clock.now(),
        });
      }
      return id;
    });
    return { companyId };
  });
}

/* ── Guards ───────────────────────────────────────────────────────────────── */

export class IllegalRequestTransitionError extends Error {
  override readonly name = "IllegalRequestTransitionError";
  constructor(from: string, to: string) {
    super(`A formation request cannot go from "${from}" to "${to}"`);
  }
}

function assertRequestTransition(from: FormationRequest["status"], to: FormationRequest["status"]): void {
  if (from === to) return;
  if (!canTransitionRequest(from, to)) throw new IllegalRequestTransitionError(from, to);
}

export type { TenantContext };
