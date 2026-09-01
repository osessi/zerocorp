-- ZeroCorp 0006 — usage_events records cost in MICRO-dollars, not cents.
--
-- DATABASE.md §14 specified cost_cents. That unit cannot represent what this table
-- exists to measure.
--
-- One Business Architect run on Haiku 4.5 costs about 1.6 cents. Rounded to an integer
-- cent that is 2, a 25% error, and it is a BIASED error: rounding half-up on thousands
-- of runs overstates cost consistently rather than averaging out. A gross-margin table
-- that is wrong by a quarter in a known direction is worse than no table, because it
-- looks like data.
--
-- Micro-dollars (1e-6 USD) hold a fraction of a cent exactly. bigint, so the unit never
-- has to be reconsidered.
--
-- The customer-facing money model is unchanged: prices, invoices, refunds and the
-- credit ledger stay in integer minor units of the customer's currency. This is COST
-- accounting, which is a different question and is allowed a different precision.

alter table usage_events rename column cost_cents to cost_micros;
alter table usage_events alter column cost_micros type bigint;
alter table usage_events alter column cost_micros set default 0;

comment on column usage_events.cost_micros is
  'What this usage cost ZeroCorp, in millionths of one unit of `currency`. Not cents: a single model call costs a fraction of a cent and rounding it to cents biases the margin.';
