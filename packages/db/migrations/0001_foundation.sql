-- ZeroCorp 0001 — foundation.
--
-- Hand written rather than generated, because the security properties of this
-- schema are not expressible in a table definition: row level security, FORCE
-- on every tenant-owned table, and the append-only revocations. A generated
-- migration would carry the columns and silently drop the guarantees.
--
-- DATABASE.md §22 and §23. Ordered, reproducible, and verified afterwards by
-- packages/db/src/schema/drift.test.ts, which reads the live catalog rather
-- than trusting this file.

-- ─────────────────────────────────────────────────────────────────────────────
-- Roles. A security boundary, not a convention — ARCHITECTURE.md §23.
--
-- zerocorp_app    read-write, subject to RLS
-- zerocorp_sites  SELECT only, subject to RLS
--
-- Neither owns a table and neither is superuser, so neither can turn RLS off.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
begin
  if not exists (select 1 from pg_roles where rolname = 'zerocorp_app') then
    create role zerocorp_app nologin;
  end if;
  if not exists (select 1 from pg_roles where rolname = 'zerocorp_sites') then
    create role zerocorp_sites nologin;
  end if;
end $$;

create extension if not exists "pgcrypto";
create extension if not exists "citext";

-- ─────────────────────────────────────────────────────────────────────────────
-- Global tables. Documented exceptions to tenancy — ARCHITECTURE.md §7 rule 6.
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists tenants (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  slug        text not null,
  status      text not null default 'active',
  plan        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create unique index if not exists tenants_slug_key on tenants (slug);

create table if not exists users (
  id                uuid primary key default gen_random_uuid(),
  email             citext not null,
  name              text,
  auth_provider     text not null default 'password',
  password_hash     text,
  email_verified_at timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
-- citext, so "Ana@x.com" and "ana@x.com" cannot become two accounts holding one
-- company's identity documents.
create unique index if not exists users_email_key on users (email);

create table if not exists memberships (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references users (id) on delete cascade,
  tenant_id  uuid not null references tenants (id) on delete cascade,
  role       text not null,
  status     text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint memberships_role_check check (role in ('owner', 'admin', 'member', 'viewer'))
);
create unique index if not exists memberships_user_tenant_key on memberships (user_id, tenant_id);
create index if not exists memberships_tenant_idx on memberships (tenant_id);

create table if not exists sessions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users (id) on delete cascade,
  token_hash       text not null,
  active_tenant_id uuid references tenants (id) on delete set null,
  expires_at       timestamptz not null,
  created_at       timestamptz not null default now(),
  last_seen_at     timestamptz not null default now()
);
create unique index if not exists sessions_token_hash_key on sessions (token_hash);
create index if not exists sessions_user_idx on sessions (user_id);

create table if not exists assessments (
  id                  uuid primary key default gen_random_uuid(),
  token_hash          text not null,
  status              text not null default 'draft',
  business_kind       text,
  answers             jsonb not null default '{}'::jsonb,
  analysis            jsonb,
  contact_email       text,
  locale              text not null default 'en',
  converted_tenant_id uuid references tenants (id) on delete set null,
  failure_reason      text,
  expires_at          timestamptz not null,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint assessments_status_check check (status in
    ('draft', 'analyzing', 'analyzed', 'failed', 'approved', 'converted', 'abandoned')),
  constraint assessments_business_kind_check check (business_kind is null or business_kind in ('new', 'existing'))
);
create unique index if not exists assessments_token_hash_key on assessments (token_hash);
create index if not exists assessments_status_idx on assessments (status, created_at);

create table if not exists plans (
  id                            uuid primary key default gen_random_uuid(),
  assessment_id                 uuid not null references assessments (id) on delete cascade,
  version                       integer not null,
  status                        text not null default 'proposed',
  title                         text not null,
  summary                       text not null,
  recommended_setup_path        text not null,
  recommended_subscription_plan text not null,
  recommendation_reason         text not null,
  steps                         jsonb not null,
  approved_at                   timestamptz,
  created_at                    timestamptz not null default now(),
  updated_at                    timestamptz not null default now(),
  constraint plans_status_check check (status in ('proposed', 'approved', 'superseded')),
  constraint plans_setup_path_check check (recommended_setup_path in ('launch', 'activation')),
  constraint plans_subscription_check check (recommended_subscription_plan in ('launch', 'growth', 'autopilot'))
);
create unique index if not exists plans_assessment_version_key on plans (assessment_id, version);

create table if not exists plan_messages (
  id            uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references assessments (id) on delete cascade,
  role          text not null,
  content       text not null,
  created_at    timestamptz not null default now(),
  constraint plan_messages_role_check check (role in ('customer', 'architect'))
);
create index if not exists plan_messages_assessment_idx on plan_messages (assessment_id, created_at);

create table if not exists checkout_sessions (
  id                        uuid primary key default gen_random_uuid(),
  assessment_id             uuid not null references assessments (id) on delete cascade,
  plan_id                   uuid not null references plans (id) on delete restrict,
  provider                  text not null default 'stripe',
  provider_ref              text,
  status                    text not null default 'pending',
  setup_path                text not null,
  subscription_plan         text not null,
  -- Copied in at creation. A price change between "show the price" and "take the
  -- money" must never change what the customer is charged.
  setup_amount_cents        integer not null check (setup_amount_cents >= 0),
  subscription_amount_cents integer not null check (subscription_amount_cents >= 0),
  currency                  text not null default 'USD',
  contact_email             text not null,
  completed_at              timestamptz,
  expires_at                timestamptz not null,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint checkout_sessions_status_check check (status in ('pending', 'completed', 'expired', 'failed'))
);
create index if not exists checkout_sessions_assessment_idx on checkout_sessions (assessment_id);
create unique index if not exists checkout_sessions_provider_ref_key on checkout_sessions (provider, provider_ref);

create table if not exists webhook_events (
  id                uuid primary key default gen_random_uuid(),
  provider          text not null,
  external_event_id text not null,
  event_type        text not null,
  payload_hash      text not null,
  status            text not null default 'received',
  error             text,
  received_at       timestamptz not null default now(),
  processed_at      timestamptz
);
-- What makes replay harmless — DATABASE.md §13.
create unique index if not exists webhook_events_provider_event_key
  on webhook_events (provider, external_event_id);
