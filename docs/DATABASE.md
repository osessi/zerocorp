> **STATUS: CURRENT**
>
> This document is part of the current ZeroCorp source of truth.
>
> **Owns:** schema, tenancy and RLS, identifiers, indexing, migrations, retention.
>
> When this document conflicts with anything under `docs/archive/`, **this document wins**.
> See [`docs/README.md`](./README.md) for the full documentation hierarchy and topic ownership map.
>
> Last reorganized: 2026-08-30

---

# ZeroCorp — Database Blueprint v1

> Status: Proposed
>
> Database: PostgreSQL
> ORM: Drizzle
> Security: Row Level Security
> Primary SaaS tenancy model: row-level tenant isolation

---

## 1. Database Principles

1. PostgreSQL is the primary system of record.
2. Drizzle is the application ORM/query layer.
3. Tenant-owned data uses `tenant_id`.
4. RLS is enabled on tenant-owned tables.
5. Application queries remain tenant-scoped.
6. Financial records are append-only.
7. Auditability is a product requirement.
8. External identifiers are stored separately from internal identifiers where appropriate.
9. Timestamps use UTC.
10. Monetary amounts use integer minor units plus currency.

---

## 2. Identifier Strategy

Prefer opaque unique IDs, such as UUID/UUIDv7 or an approved equivalent.

Every major entity should have:

```text
id
created_at
updated_at
```

where applicable.

Use database-generated timestamps where practical.

---

## 3. Tenant and Identity

### `tenants`

```text
id
name
slug
status
plan
created_at
updated_at
```

### `users`

```text
id
email
name
auth_provider
created_at
updated_at
```

### `memberships`

```text
id
user_id
tenant_id
role
status
created_at
updated_at
```

Roles should be explicit.

Examples:

```text
owner
admin
member
viewer
```

---

## 4. Business Brain

### `business_profiles`

```text
id
tenant_id
business_name
description
industry
icp_description
positioning
tone_of_voice
target_keywords
unique_selling_points
languages
competitor_urls
brand_colors_json
logo_url
source_document_ids
voice_transcript
version
status
created_at
updated_at
```

This is a first-class domain entity.

Do not collapse it into one unstructured metadata field.

### `business_facts`

Optional future normalization layer for important stable facts:

```text
id
tenant_id
fact_type
key
value_json
source
confidence
approved_at
created_at
updated_at
```

This can eventually improve AI truth control.

---

## 5. Company Formation

### State machines — RESOLVED 2026-08-31 (D2)

> **`packages/contracts/src/formation.ts` is the source of truth for these enums and for
> the transitions between them.** This section documents the model; it does not define it.
> Every other document references this one rather than restating the states — three
> restatements is exactly how the repository ended up with three different lists.

**Two machines, not one.** The nine-state list this repository kept re-deriving was a
single list trying to be two: `draft → … → formed` describes the ORDER, while
`ein_issued → complete` describes the COMPANY. Nobody could settle it because it had no
single subject.

#### `formation_orders.status` — the filing job

```text
draft
→ collecting_documents
→ verifying_identity
→ operator_review
→ ready_to_file
→ filed
→ formed          (terminal)

filed → rejected → collecting_documents      rejected is REPARABLE, not terminal
* → cancelled     (terminal)                 until filed; after that the outcome is the state's
```

`rejected` exists because a state rejecting a filing is ordinary — a PO box given as the
registered agent address, a name already taken. **None of the three earlier lists had this
state**, so a rejection had nowhere to go.

`operator_review` exists because `PRODUCT_SPEC.md` §21 says V1 is a manually assisted
operator workflow. It is where the work happens in V1, and it was dropped when the list
was shortened.

**No EIN state appears here.** See below.

#### `companies.status` — the legal entity

```text
pending → active → delinquent → dissolved (terminal)
delinquent → active                        reinstatement is real
```

A different question from "how is the filing going", and it outlives the order by years.
`delinquent` is a US concept, not a soft warning: miss an annual report and the state
marks the entity delinquent, then administratively dissolves it.

The two enums share **no state name**, so a value can never be read against the wrong
machine. A test asserts it.

#### `ein_status` — its own track

```text
not_started → requested → issued (terminal)
requested → rejected → requested            reparable, like a state rejection
```

Separate because it is a separate filing, with a separate authority, on a separate clock,
that fails separately. The EIN is an **IRS** filing, not a state filing, and usually lands
two to six weeks after formation. Keeping it inside `formation_orders.status` would hold
the order open for weeks after the company legally exists — the company is active, the
filing job is done.

`not_started` is a real state, not a null: "we have not asked yet" and "we asked and are
waiting" are different things to show a founder.

### The Business Formation Engine — REVISED 2026-09-01 (D14)

> **`packages/db/migrations/0003_formation_engine.sql` and `0004_v1_catalog.sql` are the
> source of truth for these tables.** This section documents the model.

The previous model had one country in it. `companies.state` could only hold a US state,
and `ein`, `ein_status`, `ein_requested_at` and `ein_issued_at` made a US federal filing
part of the shape of every company in the world. Adding the United Kingdom would have
been four migrations and a rename.

Two structural changes fix that.

**Four columns become rows.** `company_registrations` holds one row per post-incorporation
registration: an EIN is `kind = 'tax_id', authority = 'IRS'`, a UK company gets a UTR row
and, when relevant, a VAT row. **Adding a country stops being a migration.**

**The request/order split.** A `formation_request` is what the customer asked for and is
provider-independent. A `formation_order` is one attempt to execute it against one
provider. The old model had only the order, so a provider rejection had two bad options:
retry the same provider, or invent a second order pretending to be a second customer
request. The audit trail carried the lie.

#### Catalog — global reference data

Every tenant sees the same catalog, so scoping it per tenant would mean a thousand copies
that drift. These tables have **no `tenant_id` and no RLS**, and are documented exceptions
under `ARCHITECTURE.md` §7 rule 6.

```text
jurisdictions                 code, country_code, subdivision_code, name, status
entity_types                  jurisdiction_code, code, name, customer_label,
                              liability_model, tax_treatment, automation_level,
                              government_fee_minor, government_fee_currency,
                              typical_days_min/max, required_registrations,
                              notes, verified_at, verification_note
eligibility_rules             entity_type_id, code, predicate, effect, message_key, requires
formation_providers           code, name, status, features, reliability_score
formation_provider_coverage   provider_code, entity_type_id, automation_level,
                              supports_non_resident, wholesale_fee_*, typical_days_*,
                              verified, verified_at, verification_note
formation_provider_accounts   provider_code, environment, credentials_ref, status
```

Three columns carry the honesty rules and none of them has a permissive default:

| Column | Rule |
|---|---|
| `entity_types.automation_level` | **No default.** `automated`, `operator_assisted` or `unavailable`. The UI renders it. A customer is never told a filing is automatic when a human does it |
| `entity_types.verified_at` | Null means the fee and timeline have never been checked against the authority. Production quoting requires a value |
| `formation_provider_coverage.verified` | Defaults to **false**. The router excludes an unverified coverage rather than scoring it low |

`government_fee_*` is in the **authority's** currency, never the customer's — D15. A check
constraint forbids a fee without a currency, because that pair is how a wrong invoice
starts.

#### Tenant-owned

All of these carry `tenant_id`, have RLS enabled **and forced**, and appear in the
cross-tenant isolation matrix.

##### `companies`

```text
id
tenant_id
legal_name
jurisdiction_code         replaces `state`
entity_type_id            replaces the free-text `entity_type`
status                    CompanyStatus — pending → active → delinquent → dissolved
formation_date
registered_agent_until
origin                    formed_by_zerocorp | imported
external_ref
created_at
updated_at
```

`origin = 'imported'` is what `PRODUCT_SPEC.md` §29.3 block 4 requires: an existing
company enters at `status = 'active'` with **no formation order at all**, because a
formation order is the record of work ZeroCorp did.

##### `company_registrations`

```text
id · tenant_id · company_id
kind          tax_id | vat | payroll | state_registration
authority     "IRS", "HMRC", "Companies House"
identifier    the EIN, the UTR, the VAT number — sensitive, never logged
status        RegistrationStatus — not_started → requested → issued, rejected reparable
requested_at · issued_at
```

##### `formation_requests`

```text
id · tenant_id
entity_type_id · jurisdiction_code
proposed_names · founder_profile
status            draft → eligibility_checked → routed → executing → fulfilled
                  → unfulfillable (NOT terminal) · cancelled
eligibility       the findings, with their rule codes
routing_decision  every candidate, its score, its reasons, and why the losers lost
price_minor · price_currency
```

##### `formation_orders`

```text
id · tenant_id          ← tenant_id is NEW. The old model had only company_id,
                          so RLS had nothing to filter on
request_id · company_id
provider_code · provider_ref
status                  FormationOrderStatus — see packages/contracts/src/formation.ts
rejection_reason
cost_minor · cost_currency   what it costs US, in the provider's currency
submitted_at · completed_at
```

##### `formation_events` · `formation_documents` · `formation_rfis`

```text
formation_events     order_id, source, provider_code, external_event_id, kind,
                     payload, occurred_at              APPEND-ONLY
formation_documents  order_id, company_id, type, storage_key, issued_at, retention_until
formation_rfis       order_id, question, required_documents, status, due_at,
                     answered_at, answer
```

`formation_events` is uniquely indexed on `(provider_code, external_event_id)` where the
id is not null. That is what lets a webhook replay and a polling loop that see the same
transition write one row instead of two, and it is why a provider **without** webhooks can
be driven by polling with nothing upstream changing.

`formation_rfis.question` is **our** wording. A provider's own phrasing names them, uses
their internal vocabulary, and is written for a filing agent rather than a founder; it
lives in the event log.

### `company_documents`

```text
id
company_id
type
storage_key
issued_at
retention_until
created_at
```

### `signatures`

```text
id
tenant_id
document_id
signature_storage_key
signed_at
ip
user_agent
created_at
```

Identity documentation should use private object storage.

---

## 6. Website

### `sites`

```text
id
tenant_id
domain
subdomain
status
ssl_status
theme_id
created_at
updated_at
```

### `pages`

```text
id
site_id
slug
type
status
current_draft_version_id
published_version_id
created_at
updated_at
```

### `page_versions`

```text
id
page_id
version
content_json
created_by
created_at
published_at
```

Published versions should be immutable.

---

## 7. Website Block Registry

The actual block registry is code, not database data.

Database content stores:

```text
type
variant
version
props
```

Example:

```json
{
  "type": "hero",
  "variant": "split",
  "version": 2,
  "props": {}
}
```

The code registry determines whether this is renderable.

---

## 8. Blog

### `posts`

```text
id
site_id
slug
title
content_md
meta_json
status
scheduled_for
published_at
created_at
updated_at
```

Optional future tables:

```text
content_briefs
editorial_plans
content_reviews
```

---

## 9. Social

### `social_accounts`

```text
id
tenant_id
platform
external_id
access_token_enc
refresh_token_enc
expires_at
status
created_at
updated_at
```

### `content_items`

```text
id
tenant_id
type
payload_json
asset_urls
status
scheduled_for
published_at
created_at
updated_at
```

### `publish_attempts`

```text
id
content_item_id
platform
status
external_id
error
attempted_at
created_at
```

---

## 10. Prospecting

### `lead_lists`

```text
id
tenant_id
name
source
filters_json
count
created_at
updated_at
```

### `leads`

```text
id
tenant_id
list_id
company_name
domain
email
country
industry
enriched_json
consent_basis
status
created_at
updated_at
```

Note: the original source document used `list_id`; for strong tenancy safety the recommended schema also carries `tenant_id` directly on `leads`.

---

## 11. Email Infrastructure

### `email_domains`

```text
id
tenant_id
domain
dns_status
warmup_status
daily_limit
reputation_score
created_at
updated_at
```

### Future `mailboxes`

```text
id
tenant_id
email_domain_id
address
provider
status
daily_limit
created_at
updated_at
```

### Future `email_sequences`

```text
id
tenant_id
name
status
definition_json
created_at
updated_at
```

---

## 12. CRM

### `pipelines`

```text
id
tenant_id
name
created_at
updated_at
```

### `pipeline_stages`

```text
id
pipeline_id
name
position
created_at
updated_at
```

### `opportunities`

```text
id
tenant_id
lead_id
pipeline_stage_id
value_cents
currency
status
created_at
updated_at
```

Do not build unnecessary CRM tables before the product needs them.

---

## 13. Billing

### `subscriptions`

```text
id
tenant_id
stripe_customer_id
stripe_subscription_id
plan
status
current_period_end
currency
created_at
updated_at
```

### `payment_events`

```text
id
tenant_id
provider
external_event_id
event_type
payload_hash
status
processed_at
created_at
```

`external_event_id` must be unique per provider to guarantee idempotent webhook processing.

---

## 14. Credits

### `credit_ledger`

```text
id
tenant_id
delta
reason
ref_type
ref_id
created_at
```

Never store the balance as the authoritative value.

Balance is:

```text
SUM(delta)
```

or an independently maintained projection that can always be rebuilt from the ledger.

### `usage_events`

```text
id
tenant_id
feature
model
provider
units
cost_micros        REVISED 2026-09-01 — millionths of one unit of `currency`
currency
metadata_json
created_at
```

This allows internal gross-margin analysis.

> **`cost_micros`, not `cost_cents` — migration 0006.** One Business Architect run costs
> about 1.6 cents. Rounded to an integer cent that is a 25% error, and a *biased* one:
> rounding half-up across thousands of runs overstates cost consistently rather than
> averaging out. A margin table wrong by a quarter in a known direction is worse than no
> table, because it looks like data.
>
> This is COST accounting and is allowed its own precision. The customer-facing money
> model is unchanged: prices, invoices, refunds and the credit ledger stay in integer
> minor units of the customer's currency (D15).

---

## 15. Agents

### `agent_runs`

```text
id
tenant_id
agent_type
trigger
input_json
output_json
status
provider
model
cost_cents
duration_ms
error
created_at
completed_at
```

### Future `agent_configs`

```text
id
tenant_id
agent_type
enabled
configuration_json
daily_limit
approval_mode
created_at
updated_at
```

---

## 16. Notifications

### `notifications`

```text
id
tenant_id
type
title
body
severity
channel
source_event_id
read_at
created_at
```

### `notification_preferences`

```text
id
tenant_id
channel
notification_type
enabled
created_at
updated_at
```

---

## 17. Audit Logs

### `audit_logs`

```text
id
tenant_id
actor_user_id
actor_type
action
entity_type
entity_id
metadata_json
ip
user_agent
created_at
```

Do not put secrets or sensitive document contents in audit metadata.

Audit logs should favor immutable append-only records.

---

## 18. Files and Documents

Actual binary files live in private object storage.

Database records contain metadata.

Example:

### `stored_files`

```text
id
tenant_id
bucket
storage_key
file_type
size_bytes
checksum
purpose
created_at
retention_until
```

Identity files should use a dedicated private bucket and stricter access policy.

---

## 19. Domain / SSL

### `domains`

```text
id
tenant_id
hostname
status
cloudflare_identifier
ssl_status
dns_status
created_at
updated_at
```

This is separate from the `sites` table if multiple hostnames or domain lifecycle states are expected.

---

## 20. Usage and Activity

### `activity_events`

```text
id
tenant_id
event_type
actor_type
actor_id
payload_json
created_at
```

This table can feed:

- activity feed;
- daily summaries;
- analytics;
- notifications.

It should not replace audit logs. Product activity and security audit are separate concepts.

---

## 21. Indexing Principles

Index tenant-owned tables around actual query patterns.

Typical indexes:

```text
(tenant_id, created_at)
(tenant_id, status)
(tenant_id, updated_at)
```

For unique business keys:

```text
UNIQUE(tenant_id, slug)
UNIQUE(tenant_id, domain)
```

Do not create indexes blindly. Review query plans.

---

## 22. RLS Principles

Every tenant-owned table must have an RLS policy.

Policy model:

```text
current authenticated user
↓
membership
↓
tenant access
↓
row tenant_id
```

Privileged server operations should still perform explicit authorization checks.

---

## 23. Database Migration Rules

Every migration must be:

- reproducible;
- reviewed;
- tested;
- ordered;
- documented where destructive.

Never silently drop or rename customer data.

For destructive changes:

```text
backup
→ compatibility period
→ migrate
→ validate
→ remove deprecated field later
```

---

## 24. Soft Delete

Do not use soft delete everywhere.

Use it only where recovery or business requirements justify it.

For immutable/audit data, prefer append-only retention.

---

## 25. Data Retention

Retention periods must be explicitly defined for:

- identity documents;
- voice transcripts;
- application logs;
- audit logs;
- billing records;
- generated content;
- analytics events.

Retention requirements should be reviewed against applicable legal obligations before launch.

---

## 26. Future Extensions

Expected later tables/domains:

```text
invoices
expenses
accounting_connections
legal_tasks
compliance_tasks
partners
affiliate_attributions
experiments
feature_flags
```

Do not add these just to satisfy the future roadmap.

