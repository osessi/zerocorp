-- The operator console.
--
-- A ZeroCorp operator is NOT a tenant role. `memberships.role` says what someone may do
-- inside one customer's business; this says someone works for ZeroCorp and may see the
-- formation queue across all of them. Conflating the two would mean granting a customer's
-- "admin" visibility into other customers, which is the failure the whole tenancy model
-- exists to prevent.
--
-- Deliberately a separate table rather than a boolean on `users`, so that granting and
-- revoking operator access is a row appearing and disappearing, with a timestamp, rather
-- than a flag flipping with no history.

create table if not exists platform_operators (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  user_id    uuid not null references users (id) on delete cascade,
  -- 'operator' files and answers RFIs. 'admin' can also grant operator access.
  role       text not null default 'operator',
  granted_by uuid references users (id) on delete set null,
  revoked_at timestamptz,
  constraint platform_operators_role_check check (role in ('operator', 'admin'))
);

create unique index if not exists platform_operators_active_idx
  on platform_operators (user_id) where revoked_at is null;

-- Every operator action against a customer's data, recorded.
--
-- The formation queue is the one place a ZeroCorp employee reads across tenants, and
-- reading a founder's identity documents is exactly the access that must leave a trail.
-- Append-only: a log an operator can edit is not a log.
create table if not exists operator_actions (
  id          uuid primary key default gen_random_uuid(),
  created_at  timestamptz not null default now(),
  operator_id uuid not null references users (id) on delete restrict,
  tenant_id   uuid not null references tenants (id) on delete cascade,
  action      text not null,
  subject_id  uuid,
  detail      text
);

create index if not exists operator_actions_tenant_idx on operator_actions (tenant_id, created_at desc);
create index if not exists operator_actions_operator_idx on operator_actions (operator_id, created_at desc);

revoke update, delete on operator_actions from public;
