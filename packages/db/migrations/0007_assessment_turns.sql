-- ZeroCorp 0007 — the interview's turns.
--
-- D18: the assessment becomes an adaptive interview. The five slots do not change and
-- `assessments.answers` still holds them, so the Business Architect contract is
-- untouched (ADR 0002). What is new is the conversation that filled them.
--
-- Each row is one question asked and the answer given. The question is stored WHOLE,
-- as the validated QuestionCard it was, rather than as its text: replaying an interview
-- needs to know it was a three-option single choice, and a string cannot say that.
--
-- `patch` is what the answer wrote into the slots. Keeping it beside the turn is what
-- makes going back exact: drop or replace an entry and recompute, instead of guessing
-- which later turn touched which slot.

create table if not exists assessment_turns (
  id             uuid primary key default gen_random_uuid(),
  assessment_id  uuid not null references assessments (id) on delete cascade,
  position       integer not null,
  -- The validated QuestionCard. Parsed back through questionCardSchema on read.
  question       jsonb not null,
  answer         text not null,
  -- What this answer wrote into the slots, and which of those we inferred rather than
  -- were told. An inferred slot is confirmed in one click instead of asked again.
  patch          jsonb not null default '{}'::jsonb,
  stated_slot    text,
  inferred_slots jsonb not null default '[]'::jsonb,
  -- What choosing the NEXT question cost. Null for the fixed opening question, which
  -- costs nothing by design, and for a turn answered from the rules fallback.
  cost_micros    bigint,
  model          text,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create unique index if not exists assessment_turns_position_key
  on assessment_turns (assessment_id, position);

grant select, insert, update, delete on assessment_turns to zerocorp_app;
grant select on assessment_turns to zerocorp_sites;

-- What the interview picked up beyond the five required slots: business type, what they
-- want ZeroCorp to do, what stage they are at. The architect may use it; it never
-- depends on it, which is what keeps ADR 0002 intact.
alter table assessments add column if not exists enrichment jsonb not null default '{}'::jsonb;

-- Where the interview has got to. Derived state would be recomputed on every read from
-- a table that only grows; a counter here is one integer and is what the turn cap is
-- checked against.
alter table assessments add column if not exists turns_used integer not null default 0;
