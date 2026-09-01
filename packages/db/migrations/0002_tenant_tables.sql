-- ZeroCorp 0002 — tenant-owned tables, row level security, and grants.
--
-- Every table here carries tenant_id and is protected by THREE independent things:
--
--   1. withTenant() pins app.tenant_id for the transaction, so the policy resolves.
--   2. The policy itself. A forgotten WHERE clause returns zero rows, not another
--      tenant's rows.
--   3. FORCE ROW LEVEL SECURITY, so even the table owner is subject to the policy.
--      Without FORCE, a migration run as the owner would quietly bypass all of it,
--      and so would anything else that happened to connect as the owner.
--
-- The policy reads nullif(current_setting('app.tenant_id', true), '')::uuid. The
-- nullif matters: an unset setting returns NULL and filters every row, but an EMPTY
-- setting would raise on the cast, turning a missing tenant context into a 500
-- instead of an empty result. Both are safe; only one is debuggable.
--
-- A transaction with no tenant context therefore sees NOTHING in these tables. The
-- absence of a tenant is enforced by the database, not by remembering to check.

create table if not exists business_profiles (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  business_name         text not null,
  description           text,
  industry              text,
  icp_description       text,
  positioning           text,
  tone_of_voice         text,
  target_keywords       jsonb not null default '[]'::jsonb,
  unique_selling_points jsonb not null default '[]'::jsonb,
  languages             jsonb not null default '["en"]'::jsonb,
  competitor_urls       jsonb not null default '[]'::jsonb,
  brand_colors          jsonb,
  logo_url              text,
  voice_transcript      text,
  source_assessment_id  uuid,
  version               integer not null default 1,
  status                text not null default 'draft'
);
create index if not exists business_profiles_tenant_created_idx on business_profiles (tenant_id, created_at);
create table if not exists business_plans (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source_plan_id       uuid,
  version              integer not null default 1,
  title                text not null,
  summary              text not null,
  setup_path           text not null,
  subscription_plan    text not null,
  status               text not null default 'approved',
  approved_at          timestamptz,
  approved_by_user_id  uuid
);
create index if not exists business_plans_tenant_created_idx on business_plans (tenant_id, created_at);
create table if not exists business_plan_steps (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  plan_id   uuid not null,
  step_key  text not null,
  position  integer not null,
  title     text not null,
  outcome   text not null,
  rationale text not null,
  phase     text not null,
  category  text not null,
  priority  integer not null default 2,
  included  boolean not null default true,
  status    text not null default 'pending'
);
create index if not exists business_plan_steps_tenant_created_idx on business_plan_steps (tenant_id, created_at);
create table if not exists subscriptions (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  stripe_customer_id     text,
  stripe_subscription_id text,
  plan                   text not null,
  status                 text not null,
  current_period_end     timestamptz,
  currency               text not null default 'USD'
);
create index if not exists subscriptions_tenant_created_idx on subscriptions (tenant_id, created_at);
create table if not exists payment_events (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  provider          text not null,
  external_event_id text not null,
  event_type        text not null,
  payload_hash      text not null,
  status            text not null,
  processed_at      timestamptz
);
create index if not exists payment_events_tenant_created_idx on payment_events (tenant_id, created_at);
create table if not exists credit_ledger (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  delta    integer not null,
  reason   text not null,
  ref_type text,
  ref_id   uuid
);
create index if not exists credit_ledger_tenant_created_idx on credit_ledger (tenant_id, created_at);
create table if not exists usage_events (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  feature    text not null,
  model      text,
  provider   text,
  units      integer not null default 1,
  cost_cents integer not null default 0,
  currency   text not null default 'USD',
  metadata   jsonb not null default '{}'::jsonb
);
create index if not exists usage_events_tenant_created_idx on usage_events (tenant_id, created_at);
create table if not exists agent_runs (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  agent_type   text not null,
  trigger      text not null,
  input        jsonb not null default '{}'::jsonb,
  output       jsonb,
  status       text not null,
  provider     text,
  model        text,
  cost_cents   integer not null default 0,
  duration_ms  integer,
  error        text,
  completed_at timestamptz
);
create index if not exists agent_runs_tenant_created_idx on agent_runs (tenant_id, created_at);
create table if not exists activity_events (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  event_type text not null,
  actor_type text not null,
  actor_id   uuid,
  payload    jsonb not null default '{}'::jsonb
);
create index if not exists activity_events_tenant_created_idx on activity_events (tenant_id, created_at);
create table if not exists audit_logs (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  actor_user_id uuid,
  actor_type    text not null,
  action        text not null,
  entity_type   text,
  entity_id     uuid,
  metadata      jsonb not null default '{}'::jsonb,
  ip            text,
  user_agent    text
);
create index if not exists audit_logs_tenant_created_idx on audit_logs (tenant_id, created_at);

-- Business keys and hot paths — DATABASE.md §21.
create index if not exists business_plan_steps_plan_idx on business_plan_steps (tenant_id, plan_id, position);
create unique index if not exists payment_events_provider_event_key on payment_events (provider, external_event_id);
create index if not exists agent_runs_tenant_status_idx on agent_runs (tenant_id, status, created_at);
create index if not exists credit_ledger_tenant_idx on credit_ledger (tenant_id, created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- Row level security.
-- ─────────────────────────────────────────────────────────────────────────────

alter table business_profiles enable row level security;
alter table business_profiles force  row level security;
drop policy if exists business_profiles_tenant_isolation on business_profiles;
create policy business_profiles_tenant_isolation on business_profiles
  for all
  using       (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check  (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table business_plans enable row level security;
alter table business_plans force  row level security;
drop policy if exists business_plans_tenant_isolation on business_plans;
create policy business_plans_tenant_isolation on business_plans
  for all
  using       (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check  (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table business_plan_steps enable row level security;
alter table business_plan_steps force  row level security;
drop policy if exists business_plan_steps_tenant_isolation on business_plan_steps;
create policy business_plan_steps_tenant_isolation on business_plan_steps
  for all
  using       (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check  (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table subscriptions enable row level security;
alter table subscriptions force  row level security;
drop policy if exists subscriptions_tenant_isolation on subscriptions;
create policy subscriptions_tenant_isolation on subscriptions
  for all
  using       (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check  (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table payment_events enable row level security;
alter table payment_events force  row level security;
drop policy if exists payment_events_tenant_isolation on payment_events;
create policy payment_events_tenant_isolation on payment_events
  for all
  using       (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check  (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table credit_ledger enable row level security;
alter table credit_ledger force  row level security;
drop policy if exists credit_ledger_tenant_isolation on credit_ledger;
create policy credit_ledger_tenant_isolation on credit_ledger
  for all
  using       (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check  (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table usage_events enable row level security;
alter table usage_events force  row level security;
drop policy if exists usage_events_tenant_isolation on usage_events;
create policy usage_events_tenant_isolation on usage_events
  for all
  using       (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check  (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table agent_runs enable row level security;
alter table agent_runs force  row level security;
drop policy if exists agent_runs_tenant_isolation on agent_runs;
create policy agent_runs_tenant_isolation on agent_runs
  for all
  using       (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check  (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table activity_events enable row level security;
alter table activity_events force  row level security;
drop policy if exists activity_events_tenant_isolation on activity_events;
create policy activity_events_tenant_isolation on activity_events
  for all
  using       (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check  (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

alter table audit_logs enable row level security;
alter table audit_logs force  row level security;
drop policy if exists audit_logs_tenant_isolation on audit_logs;
create policy audit_logs_tenant_isolation on audit_logs
  for all
  using       (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid)
  with check  (tenant_id = nullif(current_setting('app.tenant_id', true), '')::uuid);

-- ─────────────────────────────────────────────────────────────────────────────
-- Grants. ARCHITECTURE.md §23 — database roles are a security boundary.
--
-- zerocorp_sites gets SELECT and nothing else, on top of
-- SET LOCAL TRANSACTION READ ONLY in withTenant(). Two independent barriers: a
-- bug in one does not remove the other.
-- ─────────────────────────────────────────────────────────────────────────────

grant usage on schema public to zerocorp_app, zerocorp_sites;
grant select, insert, update, delete on business_profiles to zerocorp_app;
grant select, insert, update, delete on business_plans to zerocorp_app;
grant select, insert, update, delete on business_plan_steps to zerocorp_app;
grant select, insert, update, delete on subscriptions to zerocorp_app;
grant select, insert, update, delete on payment_events to zerocorp_app;
grant select, insert, update, delete on credit_ledger to zerocorp_app;
grant select, insert, update, delete on usage_events to zerocorp_app;
grant select, insert, update, delete on agent_runs to zerocorp_app;
grant select, insert, update, delete on activity_events to zerocorp_app;
grant select, insert, update, delete on audit_logs to zerocorp_app;
grant select, insert, update, delete on tenants to zerocorp_app;
grant select, insert, update, delete on users to zerocorp_app;
grant select, insert, update, delete on memberships to zerocorp_app;
grant select, insert, update, delete on sessions to zerocorp_app;
grant select, insert, update, delete on assessments to zerocorp_app;
grant select, insert, update, delete on plans to zerocorp_app;
grant select, insert, update, delete on plan_messages to zerocorp_app;
grant select, insert, update, delete on checkout_sessions to zerocorp_app;
grant select, insert, update, delete on webhook_events to zerocorp_app;

grant select on business_profiles to zerocorp_sites;
grant select on business_plans to zerocorp_sites;
grant select on business_plan_steps to zerocorp_sites;
grant select on subscriptions to zerocorp_sites;
grant select on payment_events to zerocorp_sites;
grant select on credit_ledger to zerocorp_sites;
grant select on usage_events to zerocorp_sites;
grant select on agent_runs to zerocorp_sites;
grant select on activity_events to zerocorp_sites;
grant select on audit_logs to zerocorp_sites;
grant select on tenants to zerocorp_sites;
grant select on users to zerocorp_sites;
grant select on memberships to zerocorp_sites;
grant select on sessions to zerocorp_sites;
grant select on assessments to zerocorp_sites;
grant select on plans to zerocorp_sites;
grant select on plan_messages to zerocorp_sites;
grant select on checkout_sessions to zerocorp_sites;
grant select on webhook_events to zerocorp_sites;

-- ─────────────────────────────────────────────────────────────────────────────
-- Append-only tables — DATABASE.md §14, §17 and the money invariant.
--
-- The credit balance is SUM(delta) and is never stored. That only holds if the
-- ledger cannot be edited, so the ledger is made uneditable HERE rather than in a
-- code review. An UPDATE raises insufficient privilege, SQLSTATE 42501.
-- ─────────────────────────────────────────────────────────────────────────────
revoke update, delete on credit_ledger from zerocorp_app;
revoke update, delete on usage_events from zerocorp_app;
revoke update, delete on payment_events from zerocorp_app;
revoke update, delete on audit_logs from zerocorp_app;
revoke update, delete on activity_events from zerocorp_app;

-- webhook_events is the one global table the app must be able to UPDATE, because
-- processing a webhook marks it processed. Its append-only property is the unique
-- constraint on (provider, external_event_id), not a revocation.
