-- ZeroCorp 0005 — payment_events uniqueness is tenant-scoped.
--
-- Found by the cross-tenant isolation suite on 2026-09-01.
--
-- `payment_events_provider_event_key` was UNIQUE (provider, external_event_id) with no
-- tenant_id, which is a cross-tenant signal: tenant A inserting an event id that tenant
-- B already processed gets a unique-violation instead of a row. RLS hides B's ROW, but
-- the constraint still answers the question "does this row exist somewhere". It is a
-- narrow leak — the ids are opaque and known only to Stripe and to us — and it is still
-- a channel that crosses a boundary the whole schema exists to hold.
--
-- Global deduplication has a home already: `webhook_events`, which is a global table and
-- is UNIQUE (provider, external_event_id) precisely so a replay is harmless. The
-- tenant-owned table records what happened to THAT tenant, and is scoped like everything
-- else tenant-owned.

drop index if exists payment_events_provider_event_key;
create unique index if not exists payment_events_tenant_provider_event_key
  on payment_events (tenant_id, provider, external_event_id);
