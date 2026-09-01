import type { Membership, SessionRecord } from "./types";

/**
 * Identity storage. Every table here is GLOBAL: these are the tables that DEFINE
 * tenancy, so scoping them by tenant would be circular.
 */
export interface IdentityRepository<TTx = unknown> {
  findUserByEmail(tx: TTx, email: string): Promise<{ id: string; passwordHash: string | null } | null>;
  createUser(tx: TTx, input: { email: string; name?: string | null; passwordHash?: string | null }): Promise<string>;
  setPasswordHash(tx: TTx, userId: string, passwordHash: string): Promise<void>;

  createTenant(tx: TTx, input: { name: string; slug: string; plan: string }): Promise<string>;
  /** Unique per tenant, so a slug collision is a retry rather than a silent overwrite. */
  slugTaken(tx: TTx, slug: string): Promise<boolean>;

  createMembership(tx: TTx, input: { userId: string; tenantId: string; role: string }): Promise<void>;
  listMemberships(tx: TTx, userId: string): Promise<readonly Membership[]>;

  createSession(tx: TTx, input: {
    userId: string;
    tokenHash: string;
    activeTenantId: string | null;
    expiresAt: Date;
  }): Promise<void>;
  findSessionByTokenHash(tx: TTx, tokenHash: string): Promise<SessionRecord | null>;
  touchSession(tx: TTx, tokenHash: string, input: { expiresAt: Date; lastSeenAt: Date }): Promise<void>;
  deleteSession(tx: TTx, tokenHash: string): Promise<void>;
  setActiveTenant(tx: TTx, tokenHash: string, tenantId: string): Promise<void>;
}

/** Writes the tenant-owned rows a conversion creates. Goes through withTenant. */
export interface ConversionRepository<TTx = unknown> {
  createBusinessProfile(tx: TTx, ctx: import("@zerocorp/contracts").TenantContext, input: {
    businessName: string;
    description: string | null;
    sourceAssessmentId: string;
  }): Promise<string>;

  createBusinessPlan(tx: TTx, ctx: import("@zerocorp/contracts").TenantContext, input: {
    sourcePlanId: string;
    title: string;
    summary: string;
    setupPath: string;
    subscriptionPlan: string;
    approvedByUserId: string;
    approvedAt: Date;
  }): Promise<string>;

  createBusinessPlanSteps(tx: TTx, ctx: import("@zerocorp/contracts").TenantContext, planId: string, steps: readonly {
    stepKey: string;
    position: number;
    title: string;
    outcome: string;
    rationale: string;
    phase: string;
    category: string;
    priority: number;
    included: boolean;
  }[]): Promise<void>;

  recordActivity(tx: TTx, ctx: import("@zerocorp/contracts").TenantContext, input: {
    eventType: string;
    actorType: string;
    payload: Record<string, unknown>;
  }): Promise<void>;
}
