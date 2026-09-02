import { eq } from "drizzle-orm";
import type { Role, TenantContext } from "@zerocorp/contracts";
import type { ConversionRepository, IdentityRepository } from "@zerocorp/application";
import { memberships, sessions, tenants, users } from "../schema/global";
import { activityEvents, businessPlanSteps, businessPlans, businessProfiles } from "../schema/tenant";
import type { Tx } from "../types";

/**
 * Identity, in PostgreSQL.
 *
 * Every table here is GLOBAL — these are the tables that DEFINE tenancy, so scoping them
 * by tenant would be circular. They are reached through withSystem, which clears
 * app.tenant_id and therefore sees zero rows in every tenant-owned table.
 */
export function createIdentityRepository(): IdentityRepository<Tx> {
  return {
    async findUserByEmail(tx, email) {
      // `users.email` is citext, so the comparison is case-insensitive at the database
      // rather than depending on every caller remembering to lowercase.
      const rows = await tx
        .select({ id: users.id, passwordHash: users.passwordHash })
        .from(users)
        .where(eq(users.email, email))
        .limit(1);
      return rows[0] ?? null;
    },

    async createUser(tx, input) {
      const [row] = await tx
        .insert(users)
        .values({
          email: input.email,
          name: input.name ?? null,
          passwordHash: input.passwordHash ?? null,
          authProvider: "password",
        })
        .returning({ id: users.id });
      if (!row) throw new Error("insert into users returned nothing");
      return row.id;
    },

    async setPasswordHash(tx, userId, passwordHash) {
      await tx.update(users).set({ passwordHash, updatedAt: new Date() }).where(eq(users.id, userId));
    },

    async createTenant(tx, input) {
      const [row] = await tx
        .insert(tenants)
        .values({ name: input.name, slug: input.slug, plan: input.plan, status: "active" })
        .returning({ id: tenants.id });
      if (!row) throw new Error("insert into tenants returned nothing");
      return row.id;
    },

    async slugTaken(tx, slug) {
      const rows = await tx.select({ id: tenants.id }).from(tenants).where(eq(tenants.slug, slug)).limit(1);
      return rows.length > 0;
    },

    async createMembership(tx, input) {
      await tx
        .insert(memberships)
        .values({ userId: input.userId, tenantId: input.tenantId, role: input.role, status: "active" });
    },

    async listMemberships(tx, userId) {
      const rows = await tx
        .select({ tenantId: memberships.tenantId, role: memberships.role, status: memberships.status, tenantName: tenants.name })
        .from(memberships)
        .innerJoin(tenants, eq(memberships.tenantId, tenants.id))
        .where(eq(memberships.userId, userId));
      return rows.map((r) => ({ ...r, role: r.role as Role }));
    },

    async createSession(tx, input) {
      await tx.insert(sessions).values({
        userId: input.userId,
        tokenHash: input.tokenHash,
        activeTenantId: input.activeTenantId,
        expiresAt: input.expiresAt,
      });
    },

    async findSessionByTokenHash(tx, tokenHash) {
      // By DIGEST, on a unique index. The cookie's plaintext never reaches the database.
      const rows = await tx
        .select({
          userId: sessions.userId,
          email: users.email,
          activeTenantId: sessions.activeTenantId,
          expiresAt: sessions.expiresAt,
          lastSeenAt: sessions.lastSeenAt,
        })
        .from(sessions)
        .innerJoin(users, eq(sessions.userId, users.id))
        .where(eq(sessions.tokenHash, tokenHash))
        .limit(1);
      return rows[0] ?? null;
    },

    async touchSession(tx, tokenHash, input) {
      await tx
        .update(sessions)
        .set({ expiresAt: input.expiresAt, lastSeenAt: input.lastSeenAt })
        .where(eq(sessions.tokenHash, tokenHash));
    },

    async deleteSession(tx, tokenHash) {
      await tx.delete(sessions).where(eq(sessions.tokenHash, tokenHash));
    },

    async setActiveTenant(tx, tokenHash, tenantId) {
      await tx.update(sessions).set({ activeTenantId: tenantId }).where(eq(sessions.tokenHash, tokenHash));
    },
  };
}

/**
 * The tenant-owned rows a conversion creates.
 *
 * Every write takes a TenantContext and runs inside withTenant. RLS then makes the
 * tenant_id on each row not merely correct but enforced: a wrong one fails the policy's
 * WITH CHECK rather than landing quietly in someone else's account.
 */
export function createConversionRepository(): ConversionRepository<Tx> {
  return {
    async createBusinessProfile(tx, ctx: TenantContext, input) {
      const [row] = await tx
        .insert(businessProfiles)
        .values({
          tenantId: ctx.tenantId,
          businessName: input.businessName,
          description: input.description,
          sourceAssessmentId: input.sourceAssessmentId,
          status: "draft",
        })
        .returning({ id: businessProfiles.id });
      if (!row) throw new Error("insert into business_profiles returned nothing");
      return row.id;
    },

    async createBusinessPlan(tx, ctx: TenantContext, input) {
      const [row] = await tx
        .insert(businessPlans)
        .values({
          tenantId: ctx.tenantId,
          sourcePlanId: input.sourcePlanId,
          title: input.title,
          summary: input.summary,
          setupPath: input.setupPath,
          subscriptionPlan: input.subscriptionPlan,
          status: "approved",
          approvedAt: input.approvedAt,
          approvedByUserId: input.approvedByUserId,
        })
        .returning({ id: businessPlans.id });
      if (!row) throw new Error("insert into business_plans returned nothing");
      return row.id;
    },

    async createBusinessPlanSteps(tx, ctx: TenantContext, planId, steps) {
      if (steps.length === 0) return;
      await tx.insert(businessPlanSteps).values(
        steps.map((step) => ({
          tenantId: ctx.tenantId,
          planId,
          stepKey: step.stepKey,
          position: step.position,
          title: step.title,
          outcome: step.outcome,
          rationale: step.rationale,
          phase: step.phase,
          category: step.category,
          priority: step.priority,
          included: step.included,
          status: "pending",
        })),
      );
    },

    async recordActivity(tx, ctx: TenantContext, input) {
      await tx.insert(activityEvents).values({
        tenantId: ctx.tenantId,
        eventType: input.eventType,
        actorType: input.actorType,
        payload: input.payload,
      });
    },
  };
}

/** Kept out of the public surface: only the drift test needs it. */
export const __identityTables = { users, tenants, memberships, sessions };
