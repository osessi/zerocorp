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

### `companies`

```text
id
tenant_id
legal_name
entity_type
state
status
ein
formation_date
registered_agent_until
provider
external_ref
created_at
updated_at
```

### `formation_orders`

```text
id
company_id
provider
provider_ref
status
cost_cents
price_cents
currency
submitted_at
completed_at
created_at
updated_at
```

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
cost_cents
currency
metadata_json
created_at
```

This allows internal gross-margin analysis.

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

