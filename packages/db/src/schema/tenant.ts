import { text, timestamp, jsonb, integer, boolean, uuid, index } from "drizzle-orm/pg-core";
import { tenantTable } from "./tenant-table";

/**
 * Tenant-owned tables.
 *
 * Every one is declared through tenantTable(), which is what registers it with the
 * isolation suite and with the RLS drift check. A tenant-owned table created with a
 * bare pgTable() is a boundary violation, and the schema test says so by name.
 *
 * Column sets follow DATABASE.md. Where this file adds a table DATABASE.md does not
 * define, the reason is stated on the table.
 */

/* ── Business Brain ───────────────────────────────────────────────────────── */

/** DATABASE.md §4. The upstream source of truth for everything generated afterwards. */
export const businessProfiles = tenantTable("business_profiles", {
  businessName: text("business_name").notNull(),
  description: text("description"),
  industry: text("industry"),
  icpDescription: text("icp_description"),
  positioning: text("positioning"),
  toneOfVoice: text("tone_of_voice"),
  targetKeywords: jsonb("target_keywords").notNull().default([]),
  uniqueSellingPoints: jsonb("unique_selling_points").notNull().default([]),
  languages: jsonb("languages").notNull().default(["en"]),
  competitorUrls: jsonb("competitor_urls").notNull().default([]),
  brandColors: jsonb("brand_colors"),
  logoUrl: text("logo_url"),
  voiceTranscript: text("voice_transcript"),
  /** The pre-payment assessment this profile was seeded from. Provenance, not a foreign key. */
  sourceAssessmentId: uuid("source_assessment_id"),
  version: integer("version").notNull().default(1),
  status: text("status").notNull().default("draft"),
});

/* ── The approved plan ────────────────────────────────────────────────────── */

/**
 * Not in DATABASE.md, because block 3 was specified after it was written.
 *
 * The plan is copied out of the global `plans` table at checkout rather than
 * referenced across the boundary. Tenant-owned data must be reachable through
 * withTenant() and protected by RLS; a plan the product had to read through a
 * second door would be exactly the second door NN-2 forbids.
 */
export const businessPlans = tenantTable("business_plans", {
  sourcePlanId: uuid("source_plan_id"),
  version: integer("version").notNull().default(1),
  title: text("title").notNull(),
  summary: text("summary").notNull(),
  setupPath: text("setup_path").notNull(),
  subscriptionPlan: text("subscription_plan").notNull(),
  status: text("status").notNull().default("approved"),
  approvedAt: timestamp("approved_at", { withTimezone: true }),
  approvedByUserId: uuid("approved_by_user_id"),
});

/** One row per step the customer signed off. Execution attaches here. */
export const businessPlanSteps = tenantTable(
  "business_plan_steps",
  {
    planId: uuid("plan_id").notNull(),
    stepKey: text("step_key").notNull(),
    position: integer("position").notNull(),
    title: text("title").notNull(),
    outcome: text("outcome").notNull(),
    rationale: text("rationale").notNull(),
    phase: text("phase").notNull(),
    category: text("category").notNull(),
    priority: integer("priority").notNull().default(2),
    included: boolean("included").notNull().default(true),
    status: text("status").notNull().default("pending"),
  },
);

/* ── Billing ──────────────────────────────────────────────────────────────── */

/** DATABASE.md §13. */
export const subscriptions = tenantTable("subscriptions", {
  stripeCustomerId: text("stripe_customer_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  plan: text("plan").notNull(),
  status: text("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end", { withTimezone: true }),
  currency: text("currency").notNull().default("USD"),
});

/** DATABASE.md §13. Append-only: the migration revokes UPDATE and DELETE. */
export const paymentEvents = tenantTable("payment_events", {
  provider: text("provider").notNull(),
  externalEventId: text("external_event_id").notNull(),
  eventType: text("event_type").notNull(),
  payloadHash: text("payload_hash").notNull(),
  status: text("status").notNull(),
  processedAt: timestamp("processed_at", { withTimezone: true }),
});

/* ── Credits ──────────────────────────────────────────────────────────────── */

/**
 * DATABASE.md §14. Append-only, and the balance is never stored.
 *
 * `delta` is an integer in credits, signed. A grant is positive, a spend negative.
 * The balance is SUM(delta) and nothing else is authoritative.
 */
export const creditLedger = tenantTable("credit_ledger", {
  delta: integer("delta").notNull(),
  reason: text("reason").notNull(),
  refType: text("ref_type"),
  refId: uuid("ref_id"),
});

/** DATABASE.md §14. What a feature actually cost us, for gross-margin analysis. */
export const usageEvents = tenantTable("usage_events", {
  feature: text("feature").notNull(),
  model: text("model"),
  provider: text("provider"),
  units: integer("units").notNull().default(1),
  costCents: integer("cost_cents").notNull().default(0),
  currency: text("currency").notNull().default("USD"),
  metadata: jsonb("metadata").notNull().default({}),
});

/* ── Agents, activity, audit ──────────────────────────────────────────────── */

/** DATABASE.md §15. Every Business Architect run lands here, successful or not. */
export const agentRuns = tenantTable(
  "agent_runs",
  {
    agentType: text("agent_type").notNull(),
    trigger: text("trigger").notNull(),
    input: jsonb("input").notNull().default({}),
    output: jsonb("output"),
    status: text("status").notNull(),
    provider: text("provider"),
    model: text("model"),
    costCents: integer("cost_cents").notNull().default(0),
    durationMs: integer("duration_ms"),
    error: text("error"),
    completedAt: timestamp("completed_at", { withTimezone: true }),
  },
);

/** DATABASE.md §20. Product activity, feeding the Command Center timeline. */
export const activityEvents = tenantTable("activity_events", {
  eventType: text("event_type").notNull(),
  actorType: text("actor_type").notNull(),
  actorId: uuid("actor_id"),
  payload: jsonb("payload").notNull().default({}),
});

/**
 * DATABASE.md §17. Security audit, which is a different concept from product
 * activity and deliberately a different table. Append-only.
 */
export const auditLogs = tenantTable("audit_logs", {
  actorUserId: uuid("actor_user_id"),
  actorType: text("actor_type").notNull(),
  action: text("action").notNull(),
  entityType: text("entity_type"),
  entityId: uuid("entity_id"),
  /** Never a secret and never a document body — DATABASE.md §17. */
  metadata: jsonb("metadata").notNull().default({}),
  ip: text("ip"),
  userAgent: text("user_agent"),
});

/**
 * Tables that may only ever be inserted into.
 *
 * Enforced by REVOKE UPDATE, DELETE in the migration, not by a convention. A test
 * asserts the database actually refuses.
 */
export const APPEND_ONLY_TABLES = [
  "credit_ledger",
  "usage_events",
  "payment_events",
  "audit_logs",
  "activity_events",
] as const;

export const TENANT_TABLES = {
  business_profiles: businessProfiles,
  business_plans: businessPlans,
  business_plan_steps: businessPlanSteps,
  subscriptions,
  payment_events: paymentEvents,
  credit_ledger: creditLedger,
  usage_events: usageEvents,
  agent_runs: agentRuns,
  activity_events: activityEvents,
  audit_logs: auditLogs,
} as const;

export const _indexes = [
  index("business_plan_steps_plan_idx").on(businessPlanSteps.tenantId, businessPlanSteps.planId),
  index("agent_runs_tenant_created_idx").on(agentRuns.tenantId, agentRuns.createdAt),
  index("activity_events_tenant_created_idx").on(activityEvents.tenantId, activityEvents.createdAt),
];
