import { pgTable, uuid, text, timestamp, jsonb, integer, uniqueIndex, index } from "drizzle-orm/pg-core";

/**
 * Global tables — the documented exceptions to tenancy.
 *
 * ARCHITECTURE.md §7 rule 6 requires system tables to be explicitly documented as
 * exceptions rather than discovered later. There are exactly two reasons a table
 * belongs here, and a third reason is a design mistake:
 *
 *   1. It DEFINES tenancy and cannot be scoped by it — tenants, users, memberships,
 *      sessions. A membership row is what makes a user a member of a tenant; scoping
 *      it by tenant would be circular.
 *   2. It exists BEFORE a tenant does — the whole free assessment funnel. A visitor
 *      who has paid nothing owns nothing. Giving every prospect a tenant would put
 *      unpaid strangers in the same table as paying customers, and every "how many
 *      customers do we have" query would silently be wrong.
 *
 * None of these carries tenant_id and none is registered through tenantTable(), so
 * none of them is protected by the tenant RLS policy. Their access rules are
 * different and are stated on each table below.
 */

/* ── 1. Tables that define tenancy ────────────────────────────────────────── */

export const tenants = pgTable(
  "tenants",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: text("name").notNull(),
    slug: text("slug").notNull(),
    status: text("status").notNull().default("active"),
    plan: text("plan").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("tenants_slug_key").on(t.slug)],
);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull(),
    name: text("name"),
    authProvider: text("auth_provider").notNull().default("password"),
    /** Argon2id. Null for a user who has only ever signed in through a provider. */
    passwordHash: text("password_hash"),
    emailVerifiedAt: timestamp("email_verified_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  // Case-insensitive: "Ana@x.com" and "ana@x.com" are one person, and two rows would
  // be two accounts holding one company's documents.
  (t) => [uniqueIndex("users_email_key").on(t.email)],
);

export const memberships = pgTable(
  "memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    tenantId: uuid("tenant_id").notNull(),
    role: text("role").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("memberships_user_tenant_key").on(t.userId, t.tenantId),
    index("memberships_tenant_idx").on(t.tenantId),
  ],
);

/**
 * Sessions.
 *
 * Only the SHA-256 digest of the session token is stored. A dump of this table
 * hands an attacker nothing they can present as a cookie.
 */
export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").notNull(),
    tokenHash: text("token_hash").notNull(),
    /** The tenant this session is currently acting in. Re-checked against memberships on every request. */
    activeTenantId: uuid("active_tenant_id"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("sessions_token_hash_key").on(t.tokenHash), index("sessions_user_idx").on(t.userId)],
);

/* ── 2. The pre-payment funnel ────────────────────────────────────────────── */

/**
 * The free assessment — PRODUCT_SPEC.md §29.3 block 0.
 *
 * Authorization is the token, because there is no session and no tenant yet. Only
 * the digest is stored, for the same reason as sessions.
 *
 * `contactEmail` is nullable on purpose: the assessment is answered before we ask
 * for an email, and asking earlier costs conversions for no product benefit.
 */
export const assessments = pgTable(
  "assessments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    tokenHash: text("token_hash").notNull(),
    status: text("status").notNull().default("draft"),
    businessKind: text("business_kind"),
    /** The 3 to 5 answers, validated against assessmentAnswersSchema before it lands here. */
    answers: jsonb("answers").notNull().default({}),
    /** BusinessAnalysis. Null until the Business Architect has run successfully. */
    analysis: jsonb("analysis"),
    contactEmail: text("contact_email"),
    locale: text("locale").notNull().default("en"),
    /** Set exactly once, when payment converts this assessment into a tenant. */
    convertedTenantId: uuid("converted_tenant_id"),
    failureReason: text("failure_reason"),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("assessments_token_hash_key").on(t.tokenHash),
    index("assessments_status_idx").on(t.status, t.createdAt),
  ],
);

/**
 * Plan proposals, one row per generation.
 *
 * Versions are never overwritten. "Ask the AI for another proposal" produces a new
 * row and supersedes the old one, so the customer can be shown what changed and the
 * approved version has a provenance.
 */
export const plans = pgTable(
  "plans",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id").notNull(),
    version: integer("version").notNull(),
    status: text("status").notNull().default("proposed"),
    title: text("title").notNull(),
    summary: text("summary").notNull(),
    recommendedSetupPath: text("recommended_setup_path").notNull(),
    recommendedSubscriptionPlan: text("recommended_subscription_plan").notNull(),
    recommendationReason: text("recommendation_reason").notNull(),
    /** PlanStep[], validated against planProposalSchema before it lands here. */
    steps: jsonb("steps").notNull(),
    approvedAt: timestamp("approved_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("plans_assessment_version_key").on(t.assessmentId, t.version)],
);

/** The conversation about the plan. Grounds the next regeneration and audits the approval. */
export const planMessages = pgTable(
  "plan_messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id").notNull(),
    role: text("role").notNull(),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("plan_messages_assessment_idx").on(t.assessmentId, t.createdAt)],
);

/**
 * Checkout.
 *
 * The amounts are copied in at creation rather than read from configuration at
 * completion. A price change between "show the price" and "take the money" must
 * never change what the customer is charged.
 */
export const checkoutSessions = pgTable(
  "checkout_sessions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assessmentId: uuid("assessment_id").notNull(),
    planId: uuid("plan_id").notNull(),
    provider: text("provider").notNull().default("stripe"),
    providerRef: text("provider_ref"),
    status: text("status").notNull().default("pending"),
    setupPath: text("setup_path").notNull(),
    subscriptionPlan: text("subscription_plan").notNull(),
    setupAmountCents: integer("setup_amount_cents").notNull(),
    subscriptionAmountCents: integer("subscription_amount_cents").notNull(),
    currency: text("currency").notNull().default("USD"),
    contactEmail: text("contact_email").notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("checkout_sessions_assessment_idx").on(t.assessmentId),
    uniqueIndex("checkout_sessions_provider_ref_key").on(t.provider, t.providerRef),
  ],
);

/**
 * The webhook inbox.
 *
 * Global rather than tenant-owned because the webhook that CREATES a tenant arrives
 * before that tenant exists. DATABASE.md §13 keeps `payment_events` tenant-owned for
 * everything after that point; this table is the receipt log in front of it, and the
 * unique constraint on (provider, external_event_id) is what makes replay harmless.
 */
export const webhookEvents = pgTable(
  "webhook_events",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    provider: text("provider").notNull(),
    externalEventId: text("external_event_id").notNull(),
    eventType: text("event_type").notNull(),
    payloadHash: text("payload_hash").notNull(),
    status: text("status").notNull().default("received"),
    error: text("error"),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [uniqueIndex("webhook_events_provider_event_key").on(t.provider, t.externalEventId)],
);

/** Every global table, for the schema-drift check. */
export const GLOBAL_TABLES = [
  "tenants",
  "users",
  "memberships",
  "sessions",
  "assessments",
  "plans",
  "plan_messages",
  "checkout_sessions",
  "webhook_events",
] as const;
