import { and, eq } from "drizzle-orm";
import {
  customerMoneySchema,
  formationRequestSchema,
  type CompanyRegistration,
  type FormationEvent,
  type FormationOrderStatus,
  type FormationRequest,
  type FormationRfi,
  type TenantContext,
} from "@zerocorp/contracts";
import type { FormationRepository } from "@zerocorp/application";
import {
  companies,
  companyRegistrations,
  entityTypes,
  formationDocuments,
  formationEvents,
  formationOrders,
  formationRequests,
  formationRfis,
} from "../schema/formation";
import type { Tx } from "../types";

/**
 * The formation engine's persistence.
 *
 * ZeroCorp owns the formation abstraction; the tables it writes to are ZeroCorp's, not a
 * provider's (D14, CLAUDE_CODE_RULES §44). Nothing here knows a provider's name beyond a
 * code, and no provider vocabulary reaches a column.
 *
 * The one shape mismatch worth naming: the CONTRACT speaks in `entityTypeCode`, because
 * that is what a founder chose and what eligibility is evaluated against. The TABLE holds
 * `entity_type_id`, because the catalog is a real table with real foreign keys. The
 * translation happens here and nowhere else.
 */
export function createFormationRepository(): FormationRepository<Tx> {
  /** Code plus jurisdiction resolves to exactly one catalog row. */
  async function entityTypeId(tx: Tx, code: string, jurisdictionCode: string): Promise<string> {
    const [row] = await tx
      .select({ id: entityTypes.id })
      .from(entityTypes)
      .where(and(eq(entityTypes.code, code), eq(entityTypes.jurisdictionCode, jurisdictionCode)))
      .limit(1);
    if (!row) throw new Error(`No entity type ${code} in ${jurisdictionCode}`);
    return row.id;
  }

  async function entityTypeCode(tx: Tx, id: string): Promise<string> {
    const [row] = await tx.select({ code: entityTypes.code }).from(entityTypes).where(eq(entityTypes.id, id)).limit(1);
    if (!row) throw new Error(`Entity type ${id} has vanished from the catalog`);
    return row.code;
  }

  return {
    async createRequest(tx, ctx: TenantContext, request: FormationRequest) {
      const [row] = await tx
        .insert(formationRequests)
        .values({
          tenantId: ctx.tenantId,
          entityTypeId: await entityTypeId(tx, request.entityTypeCode, request.jurisdictionCode),
          jurisdictionCode: request.jurisdictionCode,
          proposedNames: request.proposedNames,
          founderProfile: request.founder,
          status: request.status,
          eligibility: request.eligibility,
          routingDecision: request.routing,
          priceMinor: request.price?.amountMinor ?? null,
          priceCurrency: request.price?.currency ?? null,
        })
        .returning({ id: formationRequests.id });
      return row!.id;
    },

    async getRequest(tx, ctx: TenantContext, requestId: string) {
      const [row] = await tx
        .select()
        .from(formationRequests)
        .where(and(eq(formationRequests.id, requestId), eq(formationRequests.tenantId, ctx.tenantId)))
        .limit(1);
      if (!row) return null;

      // Parsed on the way out, not cast. jsonb columns hold whatever was written to them,
      // including by a migration or a hand-fixed row, and a request that no longer
      // satisfies its own schema should fail loudly here rather than three layers up.
      return formationRequestSchema.parse({
        entityTypeCode: await entityTypeCode(tx, row.entityTypeId),
        jurisdictionCode: row.jurisdictionCode,
        proposedNames: row.proposedNames,
        founder: row.founderProfile,
        status: row.status,
        eligibility: row.eligibility,
        routing: row.routingDecision ?? null,
        price:
          row.priceMinor === null || row.priceCurrency === null
            ? null
            : customerMoneySchema.parse({ amountMinor: row.priceMinor, currency: row.priceCurrency }),
        governmentFee: null,
        providerFee: null,
      });
    },

    async updateRequest(tx, ctx: TenantContext, requestId: string, patch: Partial<FormationRequest>) {
      // Only the fields actually present are written. Spreading the whole patch would
      // turn an absent key into an explicit null and silently erase a routing decision.
      const set: Record<string, unknown> = { updatedAt: new Date() };
      if (patch.status !== undefined) set["status"] = patch.status;
      if (patch.eligibility !== undefined) set["eligibility"] = patch.eligibility;
      if (patch.routing !== undefined) set["routingDecision"] = patch.routing;
      if (patch.proposedNames !== undefined) set["proposedNames"] = patch.proposedNames;
      if (patch.price !== undefined) {
        set["priceMinor"] = patch.price?.amountMinor ?? null;
        set["priceCurrency"] = patch.price?.currency ?? null;
      }
      await tx
        .update(formationRequests)
        .set(set)
        .where(and(eq(formationRequests.id, requestId), eq(formationRequests.tenantId, ctx.tenantId)));
    },

    async createOrder(tx, ctx: TenantContext, input) {
      const [row] = await tx
        .insert(formationOrders)
        .values({
          tenantId: ctx.tenantId,
          requestId: input.requestId,
          providerCode: input.providerCode,
          status: input.status,
        })
        .returning({ id: formationOrders.id });
      return row!.id;
    },

    async setOrderStatus(tx, ctx: TenantContext, orderId: string, status: FormationOrderStatus, reason?: string) {
      // `submitted_at` and `completed_at` are set HERE, from the status, rather than
      // being passed in. A timestamp that a caller can set independently of the state it
      // describes is a timestamp that will eventually disagree with it.
      const now = new Date();
      await tx
        .update(formationOrders)
        .set({
          status,
          updatedAt: now,
          ...(reason !== undefined ? { rejectionReason: reason } : {}),
          ...(status === "awaiting_provider" ? { submittedAt: now } : {}),
          ...(status === "formed" || status === "rejected" || status === "cancelled" ? { completedAt: now } : {}),
        })
        .where(and(eq(formationOrders.id, orderId), eq(formationOrders.tenantId, ctx.tenantId)));
    },

    async setOrderProviderRef(tx, ctx: TenantContext, orderId: string, providerRef: string) {
      await tx
        .update(formationOrders)
        .set({ providerRef, updatedAt: new Date() })
        .where(and(eq(formationOrders.id, orderId), eq(formationOrders.tenantId, ctx.tenantId)));
    },

    async appendEvent(tx, ctx: TenantContext, orderId: string, event: FormationEvent) {
      // Append-only by grant (0003). No update path exists here on purpose: a log that
      // can be edited is not a log, and this one is what a dispute is settled from.
      await tx.insert(formationEvents).values({
        tenantId: ctx.tenantId,
        orderId,
        source: event.source,
        providerCode: event.providerCode ?? null,
        externalEventId: event.externalEventId ?? null,
        kind: event.kind,
        payload: event.payload ?? {},
        occurredAt: event.occurredAt ?? new Date(),
      });
    },

    async openRfi(tx, ctx: TenantContext, orderId: string, rfi: FormationRfi) {
      const [row] = await tx
        .insert(formationRfis)
        .values({
          tenantId: ctx.tenantId,
          orderId,
          question: rfi.question,
          requiredDocuments: rfi.requiredDocuments ?? [],
          status: "open",
          dueAt: rfi.dueAt ?? null,
        })
        .returning({ id: formationRfis.id });
      return row!.id;
    },

    async answerRfi(tx, ctx: TenantContext, rfiId: string, answer: string) {
      await tx
        .update(formationRfis)
        .set({ answer, status: "answered", answeredAt: new Date(), updatedAt: new Date() })
        .where(and(eq(formationRfis.id, rfiId), eq(formationRfis.tenantId, ctx.tenantId)));
    },

    async recordDocument(tx, ctx: TenantContext, document) {
      // `storageKey` is a key in a private bucket. It is never a URL, signed or otherwise:
      // a signed URL at rest is a credential with an expiry nobody is watching.
      const [row] = await tx
        .insert(formationDocuments)
        .values({
          tenantId: ctx.tenantId,
          orderId: document.orderId ?? null,
          companyId: document.companyId ?? null,
          type: document.type,
          storageKey: document.storageKey,
          issuedAt: document.issuedAt ?? null,
          retentionUntil: document.retentionUntil ?? null,
        })
        .returning({ id: formationDocuments.id });
      return row!.id;
    },

    async createCompany(tx, ctx: TenantContext, input) {
      const [row] = await tx
        .insert(companies)
        .values({
          tenantId: ctx.tenantId,
          legalName: input.legalName,
          jurisdictionCode: input.jurisdictionCode,
          entityTypeId: input.entityTypeCode
            ? await entityTypeId(tx, input.entityTypeCode, input.jurisdictionCode)
            : null,
          origin: input.origin,
          status: input.status,
        })
        .returning({ id: companies.id });
      return row!.id;
    },

    async upsertRegistration(tx, ctx: TenantContext, companyId: string, registration: CompanyRegistration) {
      // One registration of a kind per company. A second EIN row is a bug, not a history,
      // and the identifier is sensitive enough that two of them is a real problem.
      const [existing] = await tx
        .select({ id: companyRegistrations.id })
        .from(companyRegistrations)
        .where(
          and(
            eq(companyRegistrations.tenantId, ctx.tenantId),
            eq(companyRegistrations.companyId, companyId),
            eq(companyRegistrations.kind, registration.kind),
          ),
        )
        .limit(1);

      // Status is DERIVED from the timestamps rather than carried alongside them. The
      // contract has no status field, deliberately: "issued" and "issuedAt is null" is a
      // contradiction the type system cannot catch, so the two are never stored apart.
      const status =
        registration.issuedAt !== null ? "issued" : registration.requestedAt !== null ? "requested" : "not_started";

      const values = {
        identifier: registration.identifier ?? null,
        status,
        authority: registration.authority,
        requestedAt: registration.requestedAt ?? null,
        issuedAt: registration.issuedAt ?? null,
        updatedAt: new Date(),
      };

      if (existing) {
        await tx.update(companyRegistrations).set(values).where(eq(companyRegistrations.id, existing.id));
        return;
      }
      await tx.insert(companyRegistrations).values({ tenantId: ctx.tenantId, companyId, kind: registration.kind, ...values });
    },
  };
}
