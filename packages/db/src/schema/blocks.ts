import { text, timestamp, jsonb, integer, uuid, char } from "drizzle-orm/pg-core";
import { tenantTable } from "./tenant-table";

/**
 * The remaining V1 blocks — PRODUCT_SPEC.md §29.3, schema per DATABASE.md.
 *
 * They arrive empty and they arrive together. A screen with nothing to read is a screen
 * that gets built against invented data, and invented data is what this repository
 * refuses everywhere else. An empty table is a real answer; a mock is not.
 */

export const brandIdentities = tenantTable("brand_identities", {
  businessProfileId: uuid("business_profile_id"),
  name: text("name"),
  positioning: text("positioning"),
  icp: text("icp"),
  valueProposition: text("value_proposition"),
  toneOfVoice: text("tone_of_voice"),
  colors: jsonb("colors").notNull().default([]),
  logoStorageKey: text("logo_storage_key"),
  status: text("status").notNull().default("draft"),
});

export const domains = tenantTable("domains", {
  hostname: text("hostname").notNull(),
  status: text("status").notNull().default("pending"),
  dnsStatus: text("dns_status").notNull().default("pending"),
  sslStatus: text("ssl_status").notNull().default("pending"),
  providerIdentifier: text("provider_identifier"),
  verifiedAt: timestamp("verified_at", { withTimezone: true }),
});

export const sites = tenantTable("sites", {
  domainId: uuid("domain_id"),
  subdomain: text("subdomain"),
  status: text("status").notNull().default("draft"),
  themeId: text("theme_id"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export const pages = tenantTable("pages", {
  siteId: uuid("site_id").notNull(),
  slug: text("slug").notNull(),
  type: text("type").notNull().default("page"),
  title: text("title").notNull(),
  status: text("status").notNull().default("draft"),
  currentDraftVersionId: uuid("current_draft_version_id"),
  publishedVersionId: uuid("published_version_id"),
});

export const pageVersions = tenantTable("page_versions", {
  pageId: uuid("page_id").notNull(),
  version: integer("version").notNull(),
  /** Validated block JSON. The LLM never emits HTML, React or CSS — a ZeroCorp invariant. */
  content: jsonb("content").notNull().default([]),
  createdBy: uuid("created_by"),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export const emailDomains = tenantTable("email_domains", {
  domainId: uuid("domain_id"),
  hostname: text("hostname").notNull(),
  spfStatus: text("spf_status").notNull().default("pending"),
  dkimStatus: text("dkim_status").notNull().default("pending"),
  dmarcStatus: text("dmarc_status").notNull().default("pending"),
  warmupStatus: text("warmup_status").notNull().default("not_started"),
  warmupDay: integer("warmup_day").notNull().default(0),
  dailyLimit: integer("daily_limit").notNull().default(0),
  reputationScore: integer("reputation_score"),
});

export const mailboxes = tenantTable("mailboxes", {
  emailDomainId: uuid("email_domain_id"),
  address: text("address").notNull(),
  displayName: text("display_name"),
  provider: text("provider"),
  status: text("status").notNull().default("pending"),
  dailyLimit: integer("daily_limit").notNull().default(0),
});

export const contentKeywords = tenantTable("content_keywords", {
  keyword: text("keyword").notNull(),
  intent: text("intent"),
  volume: integer("volume"),
  difficulty: integer("difficulty"),
  status: text("status").notNull().default("proposed"),
});

export const posts = tenantTable("posts", {
  siteId: uuid("site_id"),
  slug: text("slug").notNull(),
  title: text("title").notNull(),
  contentMd: text("content_md"),
  meta: jsonb("meta").notNull().default({}),
  status: text("status").notNull().default("draft"),
  scheduledFor: timestamp("scheduled_for", { withTimezone: true }),
  publishedAt: timestamp("published_at", { withTimezone: true }),
});

export const leadLists = tenantTable("lead_lists", {
  name: text("name").notNull(),
  source: text("source"),
  filters: jsonb("filters").notNull().default({}),
  leadCount: integer("lead_count").notNull().default(0),
});

export const leads = tenantTable("leads", {
  listId: uuid("list_id"),
  companyName: text("company_name").notNull(),
  domain: text("domain"),
  email: text("email"),
  phone: text("phone"),
  country: char("country", { length: 2 }),
  industry: text("industry"),
  enriched: jsonb("enriched").notNull().default({}),
  /** Why we may hold this record. A prospect row without one is a liability — C2. */
  consentBasis: text("consent_basis"),
  status: text("status").notNull().default("discovered"),
});

export const notifications = tenantTable("notifications", {
  type: text("type").notNull(),
  title: text("title").notNull(),
  body: text("body"),
  severity: text("severity").notNull().default("info"),
  channel: text("channel").notNull().default("in_app"),
  sourceEventId: uuid("source_event_id"),
  readAt: timestamp("read_at", { withTimezone: true }),
});

/**
 * A published page version is immutable — DATABASE.md §6.
 *
 * The migration revokes UPDATE and DELETE rather than leaving it to review: the renderer
 * reads these for years, and a page that changes under a published URL is a page nobody
 * can reason about.
 */
export const IMMUTABLE_TABLES = ["page_versions"] as const;
