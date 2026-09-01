-- ZeroCorp 0003 — the Business Formation Engine.
--
-- D14: ZeroCorp owns the formation abstraction; providers are replaceable execution
-- adapters. This migration is where that stops being a sentence.
--
-- The catalog (jurisdictions, entity types, eligibility rules, providers) is GLOBAL
-- reference data, not tenant-owned. Every tenant sees the same catalog, so scoping it
-- per tenant would mean copying it a thousand times and letting the copies drift.
--
-- Everything a customer OWNS — the request, the orders, the events, the documents, the
-- registrations — is tenant-owned, carries tenant_id, and is protected by RLS with
-- FORCE, exactly like every other tenant table.
--
-- The property to preserve: adding a country adds ROWS. It does not add columns and it
-- does not touch these tables.

-- ─────────────────────────────────────────────────────────────────────────────
-- Catalog. Global reference data.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists jurisdictions (
  code             text primary key,
  country_code     char(2) not null,
  -- NULL for a country that forms nationally, which is most of the world. The US is
  -- the unusual case and the model must not be shaped around it.
  subdivision_code text,
  name             text not null,
  status           text not null default 'available',
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  constraint jurisdictions_status_check check (status in ('available', 'coming_soon', 'unavailable'))
);

create table if not exists entity_types (
  id                   uuid primary key default gen_random_uuid(),
  jurisdiction_code    text not null references jurisdictions (code) on delete restrict,
  code                 text not null,
  name                 text not null,
  customer_label       text not null,
  liability_model      text not null,
  tax_treatment        text not null,
  -- The honesty field. NO DEFAULT, on purpose: the failure mode is selling automation
  -- that does not exist, and a default lets a row be added without anyone deciding.
  automation_level     text not null,
  -- In the AUTHORITY's currency, not the customer's. D15. NULL means "we have not
  -- verified this fee", and a quote that needs it must fail loudly rather than guess.
  government_fee_minor integer,
  government_fee_currency text,
  typical_days_min     integer not null,
  typical_days_max     integer not null,
  required_registrations jsonb not null default '[]'::jsonb,
  notes                jsonb not null default '[]'::jsonb,
  -- When a human last checked the fee and the timeline against the authority. NULL
  -- means never. Production quoting requires a non-null value.
  verified_at          timestamptz,
  verification_note    text,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now(),
  constraint entity_types_liability_check check (liability_model in ('limited', 'limited_partnership', 'unlimited')),
  constraint entity_types_tax_check check (tax_treatment in ('pass_through', 'corporate', 'partnership', 'elective')),
  constraint entity_types_automation_check check (automation_level in ('automated', 'operator_assisted', 'unavailable')),
  constraint entity_types_days_check check (typical_days_max >= typical_days_min),
  -- A fee without a currency, or a currency without a fee, is a bug waiting to be a
  -- wrong invoice.
  constraint entity_types_fee_pair_check check (
    (government_fee_minor is null and government_fee_currency is null)
    or (government_fee_minor is not null and government_fee_currency is not null)
  )
);
create unique index if not exists entity_types_jurisdiction_code_key on entity_types (jurisdiction_code, code);

create table if not exists eligibility_rules (
  id             uuid primary key default gen_random_uuid(),
  code           text not null,
  entity_type_id uuid not null references entity_types (id) on delete cascade,
  -- A CLOSED predicate, validated by eligibilityPredicateSchema before it lands here.
  -- The evaluator is a discriminated union: a rule that parses is a rule that runs.
  predicate      jsonb not null,
  effect         text not null,
  message_key    text not null,
  requires       jsonb,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint eligibility_rules_effect_check check (effect in ('deny', 'warn', 'require'))
);
create unique index if not exists eligibility_rules_code_key on eligibility_rules (entity_type_id, code);

create table if not exists formation_providers (
  code               text primary key,
  name               text not null,
  status             text not null default 'active',
  features           jsonb not null default '{}'::jsonb,
  reliability_score  numeric(3,2) not null default 0.50,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint formation_providers_status_check check (status in ('active', 'degraded', 'disabled')),
  constraint formation_providers_reliability_check check (reliability_score between 0 and 1)
);

create table if not exists formation_provider_coverage (
  id                    uuid primary key default gen_random_uuid(),
  provider_code         text not null references formation_providers (code) on delete cascade,
  entity_type_id        uuid not null references entity_types (id) on delete cascade,
  automation_level      text not null,
  supports_non_resident boolean not null default false,
  wholesale_fee_minor   integer,
  wholesale_fee_currency text,
  typical_days_min      integer not null,
  typical_days_max      integer not null,
  -- The fourth architecture rule, as a column: a capability is not real until it has
  -- been confirmed TECHNICALLY and CONTRACTUALLY. A marketing page is not verification.
  -- The router refuses to select an unverified coverage.
  verified              boolean not null default false,
  verified_at           timestamptz,
  verification_note     text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint fpc_automation_check check (automation_level in ('automated', 'operator_assisted', 'unavailable')),
  constraint fpc_verified_pair_check check (verified = false or verified_at is not null)
);
create unique index if not exists fpc_provider_entity_key on formation_provider_coverage (provider_code, entity_type_id);

-- Credentials live in a secret manager. This table holds only a REFERENCE to them.
create table if not exists formation_provider_accounts (
  id              uuid primary key default gen_random_uuid(),
  provider_code   text not null references formation_providers (code) on delete cascade,
  environment     text not null,
  credentials_ref text not null,
  status          text not null default 'active',
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  constraint fpa_environment_check check (environment in ('sandbox', 'production'))
);
create unique index if not exists fpa_provider_env_key on formation_provider_accounts (provider_code, environment);

grant select on jurisdictions, entity_types, eligibility_rules, formation_providers,
                formation_provider_coverage to zerocorp_app, zerocorp_sites;
grant select on formation_provider_accounts to zerocorp_app;

-- ─────────────────────────────────────────────────────────────────────────────
-- Tenant-owned. What a customer owns.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists companies (
  id                     uuid primary key default gen_random_uuid(),
  tenant_id              uuid not null references tenants (id) on delete cascade,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now(),
  legal_name             text not null,
  -- Replaces the old `state` column, which could only ever hold a US state.
  jurisdiction_code      text not null references jurisdictions (code) on delete restrict,
  entity_type_id         uuid references entity_types (id) on delete restrict,
  status                 text not null default 'pending',
  formation_date         date,
  registered_agent_until date,
  -- An imported company. PRODUCT_SPEC.md §29.3 block 4: it enters at `active` with NO
  -- formation order at all, because inventing one would put a fiction in the audit trail.
  origin                 text not null default 'formed_by_zerocorp',
  external_ref           text,
  constraint companies_status_check check (status in ('pending', 'active', 'delinquent', 'dissolved')),
  constraint companies_origin_check check (origin in ('formed_by_zerocorp', 'imported'))
);
create index if not exists companies_tenant_created_idx on companies (tenant_id, created_at);

-- Replaces companies.ein / ein_status / ein_requested_at / ein_issued_at.
-- An EIN is one row with kind='tax_id', authority='IRS'. A UK company gets a UTR row
-- and, when relevant, a VAT row. Adding a country stops being a migration.
create table if not exists company_registrations (
  id           uuid primary key default gen_random_uuid(),
  tenant_id    uuid not null references tenants (id) on delete cascade,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  company_id   uuid not null,
  kind         text not null,
  authority    text not null,
  -- The EIN, the UTR, the VAT number. Sensitive: never logged, never in audit metadata.
  identifier   text,
  status       text not null default 'not_started',
  requested_at timestamptz,
  issued_at    timestamptz,
  constraint company_registrations_kind_check check (kind in ('tax_id', 'vat', 'payroll', 'state_registration')),
  constraint company_registrations_status_check check (status in ('not_started', 'requested', 'issued', 'rejected'))
);
create index if not exists company_registrations_tenant_created_idx on company_registrations (tenant_id, created_at);
create unique index if not exists company_registrations_company_kind_key
  on company_registrations (tenant_id, company_id, kind, authority);

-- The customer's ask. Provider-independent, and it survives every attempt to fulfil it.
create table if not exists formation_requests (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants (id) on delete cascade,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  entity_type_id     uuid not null references entity_types (id) on delete restrict,
  jurisdiction_code  text not null references jurisdictions (code) on delete restrict,
  proposed_names     jsonb not null default '[]'::jsonb,
  founder_profile    jsonb not null default '{}'::jsonb,
  status             text not null default 'draft',
  eligibility        jsonb not null default '[]'::jsonb,
  -- Why we routed where we routed, kept so the decision can be read back months later.
  routing_decision   jsonb,
  price_minor        integer,
  price_currency     text,
  constraint formation_requests_status_check check (status in
    ('draft', 'eligibility_checked', 'routed', 'executing', 'fulfilled', 'unfulfillable', 'cancelled'))
);
create index if not exists formation_requests_tenant_created_idx on formation_requests (tenant_id, created_at);

-- One attempt to execute one request against ONE provider.
create table if not exists formation_orders (
  id                 uuid primary key default gen_random_uuid(),
  -- ADDED. The previous model carried only company_id, so RLS had nothing to filter on.
  tenant_id          uuid not null references tenants (id) on delete cascade,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  request_id         uuid not null,
  company_id         uuid,
  provider_code      text not null references formation_providers (code) on delete restrict,
  provider_ref       text,
  status             text not null default 'draft',
  rejection_reason   text,
  -- What it costs us, in the currency the provider or authority bills. D15.
  cost_minor         integer,
  cost_currency      text,
  submitted_at       timestamptz,
  completed_at       timestamptz,
  constraint formation_orders_status_check check (status in
    ('draft', 'collecting_documents', 'verifying_identity', 'operator_review', 'ready_to_file',
     'awaiting_provider', 'information_requested', 'filed', 'formed', 'rejected', 'cancelled'))
);
create index if not exists formation_orders_tenant_created_idx on formation_orders (tenant_id, created_at);
create index if not exists formation_orders_request_idx on formation_orders (tenant_id, request_id);

-- Append-only. Everything that happened to an order, from any source.
create table if not exists formation_events (
  id                uuid primary key default gen_random_uuid(),
  tenant_id         uuid not null references tenants (id) on delete cascade,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  order_id          uuid not null,
  source            text not null,
  provider_code     text,
  external_event_id text,
  kind              text not null,
  -- The provider's raw payload, kept for diagnosis. Never rendered to a customer and
  -- never used to derive a customer-facing status.
  payload           jsonb not null default '{}'::jsonb,
  occurred_at       timestamptz not null default now(),
  constraint formation_events_source_check check (source in ('provider', 'operator', 'system', 'authority'))
);
create index if not exists formation_events_tenant_created_idx on formation_events (tenant_id, created_at);
create index if not exists formation_events_order_idx on formation_events (tenant_id, order_id, occurred_at);
-- A webhook replay and a polling loop that see the same transition write ONE row.
-- This is what lets a provider with no webhooks be driven by polling, unchanged upstream.
create unique index if not exists formation_events_dedup_key
  on formation_events (provider_code, external_event_id)
  where external_event_id is not null;

create table if not exists formation_documents (
  id              uuid primary key default gen_random_uuid(),
  tenant_id       uuid not null references tenants (id) on delete cascade,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  order_id        uuid,
  company_id      uuid,
  type            text not null,
  -- A key in a PRIVATE bucket. Never a public URL, never a signed URL at rest.
  storage_key     text not null,
  issued_at       timestamptz,
  retention_until timestamptz,
  constraint formation_documents_type_check check (type in
    ('certificate_of_formation', 'governing_document', 'registration_certificate',
     'identity_document', 'proof_of_address', 'signature', 'authority_correspondence'))
);
create index if not exists formation_documents_tenant_created_idx on formation_documents (tenant_id, created_at);

create table if not exists formation_rfis (
  id                 uuid primary key default gen_random_uuid(),
  tenant_id          uuid not null references tenants (id) on delete cascade,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  order_id           uuid not null,
  -- OUR question, not the provider's wording. Their phrasing names them, uses their
  -- internal vocabulary, and is written for a filing agent rather than a founder.
  question           text not null,
  required_documents jsonb not null default '[]'::jsonb,
  status             text not null default 'open',
  due_at             timestamptz,
  answered_at        timestamptz,
  answer             text,
  constraint formation_rfis_status_check check (status in ('open', 'answered', 'withdrawn', 'expired'))
);
create index if not exists formation_rfis_tenant_created_idx on formation_rfis (tenant_id, created_at);

-- Link business_profiles to the company it belongs to, now that companies exist.
alter table business_profiles add column if not exists company_id uuid;

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS on every new tenant-owned table. Same three barriers as 0002.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'companies', 'company_registrations', 'formation_requests', 'formation_orders',
    'formation_events', 'formation_documents', 'formation_rfis'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('alter table %I force  row level security', t);
    execute format('drop policy if exists %I on %I', t || '_tenant_isolation', t);
    execute format(
      'create policy %I on %I for all
         using      (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)
         with check (tenant_id = nullif(current_setting(''app.tenant_id'', true), '''')::uuid)',
      t || '_tenant_isolation', t);
    execute format('grant select, insert, update, delete on %I to zerocorp_app', t);
    execute format('grant select on %I to zerocorp_sites', t);
  end loop;
end $$;

-- formation_events is a log. A log that can be edited is not a log.
revoke update, delete on formation_events from zerocorp_app;
