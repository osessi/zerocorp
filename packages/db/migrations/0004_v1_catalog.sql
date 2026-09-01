-- ZeroCorp 0004 — the V1 entity catalog.
--
-- US LLC · US C-Corp · UK Ltd · UK LLP, per the direction set on 2026-09-01.
--
-- ON FEES AND VERIFICATION
--
-- `verified_at` is NULL for every row where a human has not confirmed the fee and the
-- timeline against the authority itself. That is not a placeholder to fill in later
-- and forget: production quoting requires a non-null value, so an unverified row can
-- be shown and sold at a ZeroCorp price but cannot be used to compute margin.
--
-- The ONE fee verified here is the UK digital incorporation fee, which research on
-- 2026-09-01 put at £100 from 1 February 2026. Everything else carries a NULL fee and
-- says so, because a fee I remember is not a fee I checked.
--
-- ON AUTOMATION
--
-- Every row ships as `operator_assisted`. Not one provider integration has been
-- contracted, so not one entity is automated. D17 for the UK; the same discipline for
-- the US. A row becomes `automated` when a provider coverage row is verified, and not
-- before.

insert into jurisdictions (code, country_code, subdivision_code, name, status) values
  ('us-wy', 'US', 'WY', 'Wyoming, United States', 'available'),
  ('us-de', 'US', 'DE', 'Delaware, United States', 'available'),
  ('gb',    'GB', null, 'United Kingdom',          'available')
on conflict (code) do nothing;

insert into entity_types (
  jurisdiction_code, code, name, customer_label, liability_model, tax_treatment,
  automation_level, government_fee_minor, government_fee_currency,
  typical_days_min, typical_days_max, required_registrations, notes,
  verified_at, verification_note
) values
  ('us-wy', 'us_llc', 'Limited Liability Company', 'LLC',
   'limited', 'elective', 'operator_assisted',
   null, null, 1, 10,
   '[{"kind":"tax_id","authority":"IRS","required":true,"typicalDaysMin":14,"typicalDaysMax":45}]'::jsonb,
   '["Taxed as a pass-through by default; other treatments can be elected.","A registered agent with a physical address in the state is required."]'::jsonb,
   null, 'Filing fee and timeline not yet verified against the Wyoming Secretary of State.'),

  ('us-de', 'us_c_corp', 'C Corporation', 'C-Corp',
   'limited', 'corporate', 'operator_assisted',
   null, null, 1, 10,
   '[{"kind":"tax_id","authority":"IRS","required":true,"typicalDaysMin":14,"typicalDaysMax":45}]'::jsonb,
   '["The usual structure for taking outside investment.","Profits are taxed at the company and again on distribution.","Delaware charges an annual franchise tax separate from the filing fee."]'::jsonb,
   null, 'Filing fee, franchise tax and timeline not yet verified against the Delaware Division of Corporations.'),

  ('gb', 'gb_ltd', 'Private Limited Company', 'Ltd',
   'limited', 'corporate', 'operator_assisted',
   10000, 'GBP', 1, 10,
   '[{"kind":"tax_id","authority":"HMRC","required":true,"typicalDaysMin":5,"typicalDaysMax":20},
     {"kind":"vat","authority":"HMRC","required":false,"typicalDaysMin":10,"typicalDaysMax":40}]'::jsonb,
   '["Every director and person with significant control must verify their identity with Companies House.","Filed by a ZeroCorp operator through a partner. No automated filing route exists today."]'::jsonb,
   '2026-09-01T00:00:00Z',
   'Digital incorporation fee GBP 100 from 1 February 2026, per research on 2026-09-01. Companies House exposes NO incorporation endpoint on its REST API Filing service; incorporation runs through the legacy XML Gateway (IN01) or a partner.'),

  ('gb', 'gb_llp', 'Limited Liability Partnership', 'LLP',
   'limited_partnership', 'partnership', 'operator_assisted',
   null, null, 1, 10,
   '[{"kind":"tax_id","authority":"HMRC","required":true,"typicalDaysMin":5,"typicalDaysMax":20}]'::jsonb,
   '["Requires at least two members.","Profits are taxed on the members, not on the partnership.","Filed by a ZeroCorp operator through a partner."]'::jsonb,
   null, 'LLP incorporation fee differs from the Ltd fee and has not been verified.')
on conflict (jurisdiction_code, code) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Eligibility. Every rule here is defensible from a stated source or from the
-- definition of the entity. Nothing is invented to look thorough.
-- ─────────────────────────────────────────────────────────────────────────────

insert into eligibility_rules (code, entity_type_id, predicate, effect, message_key, requires)
select r.code, e.id, r.predicate::jsonb, r.effect, r.message_key, r.requires::jsonb
from entity_types e
join (values
  -- An LLP is defined as having two or more members. Below that it is not an LLP.
  ('gb', 'gb_llp', 'llp_needs_two_members', '{"kind":"owner_count_max","value":1}', 'deny',
   'eligibility.gb_llp.needs_two_members', null),

  -- ECCTA: identity verification has been mandatory for newly appointed directors and
  -- PSCs since 18 November 2025, and filings without a personal code can be rejected
  -- from spring 2026. Verified by research on 2026-09-01.
  ('gb', 'gb_ltd', 'uk_identity_verification', '{"kind":"residency_not_in","countries":["GB"]}', 'require',
   'eligibility.gb.identity_verification', '{"identityVerification":true}'),
  ('gb', 'gb_llp', 'uk_identity_verification', '{"kind":"residency_not_in","countries":["GB"]}', 'require',
   'eligibility.gb.identity_verification', '{"identityVerification":true}'),

  -- A US entity needs a federal tax id before it can bank or be paid properly.
  ('us-wy', 'us_llc', 'us_requires_ein', '{"kind":"residency_not_in","countries":["US"]}', 'require',
   'eligibility.us.ein_required', '{"registration":"tax_id"}'),
  ('us-de', 'us_c_corp', 'us_requires_ein', '{"kind":"residency_not_in","countries":["US"]}', 'require',
   'eligibility.us.ein_required', '{"registration":"tax_id"}'),

  -- A C-Corp taxes profit twice. For a founder not raising outside money that is a
  -- cost with no matching benefit, so they are warned rather than blocked.
  ('us-de', 'us_c_corp', 'c_corp_double_taxation', '{"kind":"owner_count_max","value":1}', 'warn',
   'eligibility.us_c_corp.double_taxation', null),

  -- A single-member LLC and a multi-member LLC are taxed differently by default.
  ('us-wy', 'us_llc', 'llc_multi_member_tax', '{"kind":"owner_count_min","value":2}', 'warn',
   'eligibility.us_llc.multi_member_tax', null)
) as r(jurisdiction_code, entity_code, code, predicate, effect, message_key, requires)
  on r.jurisdiction_code = e.jurisdiction_code and r.entity_code = e.code
on conflict (entity_type_id, code) do nothing;

-- ─────────────────────────────────────────────────────────────────────────────
-- Providers.
--
-- The operator is a FIRST-CLASS provider, not a fallback hack. It is how any
-- jurisdiction ships before an adapter exists, and it turns PRODUCT_SPEC.md §21's
-- "manually assisted operator workflow" into a routing outcome rather than a special
-- case in the code.
--
-- It is also, today, the only VERIFIED provider — because it is the only one whose
-- capabilities we can confirm without a contract.
-- ─────────────────────────────────────────────────────────────────────────────

insert into formation_providers (code, name, status, features, reliability_score) values
  ('manual_operator', 'ZeroCorp operator', 'active',
   '{"webhooks":false,"sandbox":false,"statusPolling":false,"documentRetrieval":true,
     "rfi":true,"cancellation":true,"registeredAgent":false,"taxIdFiling":true,
     "identityVerification":false}'::jsonb,
   1.00)
on conflict (code) do nothing;

insert into formation_provider_coverage (
  provider_code, entity_type_id, automation_level, supports_non_resident,
  typical_days_min, typical_days_max, verified, verified_at, verification_note
)
select 'manual_operator', e.id, 'operator_assisted', true, 2, 15, true,
       '2026-09-01T00:00:00Z',
       'A ZeroCorp operator files this. Verified because it depends on nobody else.'
from entity_types e
on conflict (provider_code, entity_type_id) do nothing;
