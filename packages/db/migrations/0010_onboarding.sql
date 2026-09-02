-- Launch your business: the deep onboarding.
--
-- The profile already holds every ANSWER the onboarding collects; what it could not say
-- was whether the founder had finished. Inferring completion from "all eight columns are
-- non-null" would be wrong twice: the assessment seeds two of them, so a fresh tenant
-- would look half-onboarded, and a founder who deliberately left a field thin could never
-- reach the end.
--
-- Completion is its own fact, so it gets its own column.

alter table business_profiles
  add column if not exists onboarding_completed_at timestamptz;

-- Which steps have been answered BY THE FOUNDER, as opposed to seeded from the
-- assessment. Without this the resume point is a guess.
alter table business_profiles
  add column if not exists onboarding_answered jsonb not null default '[]'::jsonb;
