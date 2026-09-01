-- ZeroCorp 0009 — the remaining V1 blocks.
--
-- Every table PRODUCT_SPEC.md §29.3 needs and DATABASE.md already describes: brand,
-- domains, sites and pages, email and warm-up, content, leads, notifications.
--
-- They arrive empty and they arrive NOW rather than one at a time, for one reason: a
-- screen with nothing to read is a screen that gets built against invented data, and
-- invented data is the thing this repository refuses everywhere else. An empty table is
-- a real answer; a mock is not.
--
-- All tenant-owned, all with RLS enabled AND forced, all in the isolation matrix.

create table if not exists brand_identities (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  business_profile_id uuid,
  name                text,
  positioning         text,
  icp                 text,
  value_proposition   text,
  tone_of_voice       text,
  colors              jsonb not null default '[]'::jsonb,
  logo_storage_key    text,
  status              text not null default 'draft'
);
create index if not exists brand_identities_tenant_created_idx on brand_identities (tenant_id, created_at);
create table if not exists domains (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  hostname            text not null,
  status              text not null default 'pending',
  dns_status          text not null default 'pending',
  ssl_status          text not null default 'pending',
  provider_identifier text,
  verified_at         timestamptz
);
create index if not exists domains_tenant_created_idx on domains (tenant_id, created_at);
create table if not exists sites (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  domain_id  uuid,
  subdomain  text,
  status     text not null default 'draft',
  theme_id   text,
  published_at timestamptz
);
create index if not exists sites_tenant_created_idx on sites (tenant_id, created_at);
create table if not exists pages (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id                  uuid not null,
  slug                     text not null,
  type                     text not null default 'page',
  title                    text not null,
  status                   text not null default 'draft',
  current_draft_version_id uuid,
  published_version_id     uuid
);
create index if not exists pages_tenant_created_idx on pages (tenant_id, created_at);
create table if not exists page_versions (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  page_id      uuid not null,
  version      integer not null,
  content      jsonb not null default '[]'::jsonb,
  created_by   uuid,
  published_at timestamptz
);
create index if not exists page_versions_tenant_created_idx on page_versions (tenant_id, created_at);
create table if not exists email_domains (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  domain_id        uuid,
  hostname         text not null,
  spf_status       text not null default 'pending',
  dkim_status      text not null default 'pending',
  dmarc_status     text not null default 'pending',
  warmup_status    text not null default 'not_started',
  warmup_day       integer not null default 0,
  daily_limit      integer not null default 0,
  reputation_score integer
);
create index if not exists email_domains_tenant_created_idx on email_domains (tenant_id, created_at);
create table if not exists mailboxes (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  email_domain_id uuid,
  address         text not null,
  display_name    text,
  provider        text,
  status          text not null default 'pending',
  daily_limit     integer not null default 0
);
create index if not exists mailboxes_tenant_created_idx on mailboxes (tenant_id, created_at);
create table if not exists content_keywords (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  keyword       text not null,
  intent        text,
  volume        integer,
  difficulty    integer,
  status        text not null default 'proposed'
);
create index if not exists content_keywords_tenant_created_idx on content_keywords (tenant_id, created_at);
create table if not exists posts (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  site_id      uuid,
  slug         text not null,
  title        text not null,
  content_md   text,
  meta         jsonb not null default '{}'::jsonb,
  status       text not null default 'draft',
  scheduled_for timestamptz,
  published_at timestamptz
);
create index if not exists posts_tenant_created_idx on posts (tenant_id, created_at);
create table if not exists lead_lists (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name       text not null,
  source     text,
  filters    jsonb not null default '{}'::jsonb,
  lead_count integer not null default 0
);
create index if not exists lead_lists_tenant_created_idx on lead_lists (tenant_id, created_at);
create table if not exists leads (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  list_id       uuid,
  company_name  text not null,
  domain        text,
  email         text,
  phone         text,
  country       char(2),
  industry      text,
  enriched      jsonb not null default '{}'::jsonb,
  consent_basis text,
  status        text not null default 'discovered'
);
create index if not exists leads_tenant_created_idx on leads (tenant_id, created_at);
create table if not exists notifications (
  id         uuid primary key default gen_random_uuid(),
  tenant_id  uuid not null references tenants (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  type            text not null,
  title           text not null,
  body            text,
  severity        text not null default 'info',
  channel         text not null default 'in_app',
  source_event_id uuid,
  read_at         timestamptz
);
create index if not exists notifications_tenant_created_idx on notifications (tenant_id, created_at);

-- Business keys. Unique per TENANT, never globally: two customers may both want the
-- slug "about", and a global unique index would give it to whoever signed up first.
create unique index if not exists pages_site_slug_key on pages (tenant_id, site_id, slug);
create unique index if not exists page_versions_page_version_key on page_versions (tenant_id, page_id, version);
create unique index if not exists posts_slug_key on posts (tenant_id, slug);
create unique index if not exists domains_hostname_key on domains (hostname);
create unique index if not exists mailboxes_address_key on mailboxes (tenant_id, address);
create index if not exists leads_list_idx on leads (tenant_id, list_id);
create index if not exists notifications_unread_idx on notifications (tenant_id, read_at, created_at);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS and grants, identical to every other tenant-owned table.
-- ─────────────────────────────────────────────────────────────────────────────

do $$
declare t text;
begin
  foreach t in array array[
    'brand_identities', 'domains', 'sites', 'pages', 'page_versions', 'email_domains', 'mailboxes', 'content_keywords', 'posts', 'lead_lists', 'leads', 'notifications'
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

-- A published page version is immutable — DATABASE.md §6. Enforced by the grant rather
-- than by remembering: the renderer reads it for years, and a page that changes under a
-- published URL is a page nobody can reason about.
revoke update, delete on page_versions from zerocorp_app;
