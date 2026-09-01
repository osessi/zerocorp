import { pgTable, text, timestamp, jsonb, integer, boolean, uuid, date, char, numeric, uniqueIndex } from "drizzle-orm/pg-core";
import { tenantTable } from "./tenant-table";

/**
 * The Business Formation Engine — D14.
 *
 * The catalog is GLOBAL reference data: every tenant sees the same jurisdictions and
 * entity types, so scoping it per tenant would mean a thousand copies that drift.
 * Everything a customer owns is tenant-owned and declared through tenantTable().
 */

/* ── Catalog (global) ─────────────────────────────────────────────────────── */

export const jurisdictions = pgTable("jurisdictions", {
  code: text("code").primaryKey(),
  countryCode: char("country_code", { length: 2 }).notNull(),
  /** Null for a country that forms nationally, which is most of the world. */
  subdivisionCode: text("subdivision_code"),
  name: text("name").notNull(),
  status: text("status").notNull().default("available"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const entityTypes = pgTable(
  "entity_types",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    jurisdictionCode: text("jurisdiction_code").notNull(),
    code: text("code").notNull(),
    name: text("name").notNull(),
    customerLabel: text("customer_label").notNull(),
    liabilityModel: text("liability_model").notNull(),
    taxTreatment: text("tax_treatment").notNull(),
    /** The honesty field. No default, on purpose. */
    automationLevel: text("automation_level").notNull(),
    /** In the AUTHORITY's currency. Null means "not verified", and quoting must fail loudly. */
    governmentFeeMinor: integer("government_fee_minor"),
    governmentFeeCurrency: text("government_fee_currency"),
    typicalDaysMin: integer("typical_days_min").notNull(),
    typicalDaysMax: integer("typical_days_max").notNull(),
    requiredRegistrations: jsonb("required_registrations").notNull().default([]),
    notes: jsonb("notes").notNull().default([]),
    /** When a human last checked the fee against the authority. Null means never. */
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verificationNote: text("verification_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("entity_types_jurisdiction_code_key").on(t.jurisdictionCode, t.code)],
);

export const eligibilityRules = pgTable(
  "eligibility_rules",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    code: text("code").notNull(),
    entityTypeId: uuid("entity_type_id").notNull(),
    /** A closed predicate, validated by eligibilityPredicateSchema before it lands here. */
    predicate: jsonb("predicate").notNull(),
    effect: text("effect").notNull(),
    messageKey: text("message_key").notNull(),
    requires: jsonb("requires"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("eligibility_rules_code_key").on(t.entityTypeId, t.code)],
);

export const formationProviders = pgTable("formation_providers", {
  code: text("code").primaryKey(),
  name: text("name").notNull(),
  status: text("status").notNull().default("active"),
  features: jsonb("features").notNull().default({}),
  /** Observed, not claimed: updated from real order outcomes. */
  reliabilityScore: numeric("reliability_score", { precision: 3, scale: 2 }).notNull().default("0.50"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const formationProviderCoverage = pgTable(
  "formation_provider_coverage",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerCode: text("provider_code").notNull(),
    entityTypeId: uuid("entity_type_id").notNull(),
    automationLevel: text("automation_level").notNull(),
    supportsNonResident: boolean("supports_non_resident").notNull().default(false),
    wholesaleFeeMinor: integer("wholesale_fee_minor"),
    wholesaleFeeCurrency: text("wholesale_fee_currency"),
    typicalDaysMin: integer("typical_days_min").notNull(),
    typicalDaysMax: integer("typical_days_max").notNull(),
    /** A capability is not real until confirmed technically AND contractually. */
    verified: boolean("verified").notNull().default(false),
    verifiedAt: timestamp("verified_at", { withTimezone: true }),
    verificationNote: text("verification_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("fpc_provider_entity_key").on(t.providerCode, t.entityTypeId)],
);

/** Credentials live in a secret manager. This holds only a reference. */
export const formationProviderAccounts = pgTable(
  "formation_provider_accounts",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    providerCode: text("provider_code").notNull(),
    environment: text("environment").notNull(),
    credentialsRef: text("credentials_ref").notNull(),
    status: text("status").notNull().default("active"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [uniqueIndex("fpa_provider_env_key").on(t.providerCode, t.environment)],
);

export const CATALOG_TABLES = [
  "jurisdictions",
  "entity_types",
  "eligibility_rules",
  "formation_providers",
  "formation_provider_coverage",
  "formation_provider_accounts",
] as const;

/* ── Tenant-owned ─────────────────────────────────────────────────────────── */

export const companies = tenantTable("companies", {
  legalName: text("legal_name").notNull(),
  /** Replaces the old `state`, which could only hold a US state. */
  jurisdictionCode: text("jurisdiction_code").notNull(),
  entityTypeId: uuid("entity_type_id"),
  status: text("status").notNull().default("pending"),
  formationDate: date("formation_date"),
  registeredAgentUntil: date("registered_agent_until"),
  /** An imported company has no formation order at all — PRODUCT_SPEC.md §29.3 block 4. */
  origin: text("origin").notNull().default("formed_by_zerocorp"),
  externalRef: text("external_ref"),
});

/** Replaces companies.ein / ein_status / ein_requested_at / ein_issued_at. */
export const companyRegistrations = tenantTable("company_registrations", {
  companyId: uuid("company_id").notNull(),
  kind: text("kind").notNull(),
  authority: text("authority").notNull(),
  /** The EIN, the UTR, the VAT number. Sensitive: never logged. */
  identifier: text("identifier"),
  status: text("status").notNull().default("not_started"),
  requestedAt: timestamp("requested_at", { withTimezone: true }),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
});

/** The customer's ask. Provider-independent; survives every attempt to fulfil it. */
export const formationRequests = tenantTable("formation_requests", {
  entityTypeId: uuid("entity_type_id").notNull(),
  jurisdictionCode: text("jurisdiction_code").notNull(),
  proposedNames: jsonb("proposed_names").notNull().default([]),
  founderProfile: jsonb("founder_profile").notNull().default({}),
  status: text("status").notNull().default("draft"),
  eligibility: jsonb("eligibility").notNull().default([]),
  /** Why we routed where we routed, readable back months later. */
  routingDecision: jsonb("routing_decision"),
  priceMinor: integer("price_minor"),
  priceCurrency: text("price_currency"),
});

/** One attempt to execute one request against ONE provider. */
export const formationOrders = tenantTable("formation_orders", {
  requestId: uuid("request_id").notNull(),
  companyId: uuid("company_id"),
  providerCode: text("provider_code").notNull(),
  providerRef: text("provider_ref"),
  status: text("status").notNull().default("draft"),
  rejectionReason: text("rejection_reason"),
  costMinor: integer("cost_minor"),
  costCurrency: text("cost_currency"),
  submittedAt: timestamp("submitted_at", { withTimezone: true }),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

/** Append-only. A log that can be edited is not a log. */
export const formationEvents = tenantTable("formation_events", {
  orderId: uuid("order_id").notNull(),
  source: text("source").notNull(),
  providerCode: text("provider_code"),
  externalEventId: text("external_event_id"),
  kind: text("kind").notNull(),
  /** The provider's raw payload. Never rendered, never used to derive a customer status. */
  payload: jsonb("payload").notNull().default({}),
  occurredAt: timestamp("occurred_at", { withTimezone: true }).notNull().defaultNow(),
});

export const formationDocuments = tenantTable("formation_documents", {
  orderId: uuid("order_id"),
  companyId: uuid("company_id"),
  type: text("type").notNull(),
  /** A key in a PRIVATE bucket. Never a public URL, never a signed URL at rest. */
  storageKey: text("storage_key").notNull(),
  issuedAt: timestamp("issued_at", { withTimezone: true }),
  retentionUntil: timestamp("retention_until", { withTimezone: true }),
});

export const formationRfis = tenantTable("formation_rfis", {
  orderId: uuid("order_id").notNull(),
  /** OUR question, not the provider's wording. */
  question: text("question").notNull(),
  requiredDocuments: jsonb("required_documents").notNull().default([]),
  status: text("status").notNull().default("open"),
  dueAt: timestamp("due_at", { withTimezone: true }),
  answeredAt: timestamp("answered_at", { withTimezone: true }),
  answer: text("answer"),
});

/*
 * Indexes are declared in the SQL migrations, which are the source of truth for
 * them. A parallel Drizzle declaration here would be a second definition that
 * nothing applies and nothing checks, which is worse than no declaration at all.
 */
