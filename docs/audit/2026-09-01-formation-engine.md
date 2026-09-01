> **STATUS: CURRENT**
>
> Audit, not a specification. It records what the repository assumes today, what the
> Business Formation Engine decision changes, and what must be decided before code.
> Once its recommendations are implemented, the owning documents carry them and this
> file becomes history.
>
> Written 2026-09-01.

---

# Audit — ZeroCorp Business Formation Engine

## The headline

**No provider is named anywhere in this repository.** Not in the documents, not in the
code, not even in the archive. The coupling is not to a vendor. It is to a **shape**: one
country, one subdivision, one filing, one text column called `provider`.

Two current documents already state the doctrine the new direction asks for:

> `PRODUCT_SPEC.md` §21 — *"Never expose provider-specific mechanics as permanent product
> architecture."* and *"The machine should be API-ready even when the first provider
> interaction is manual."*
>
> `ARCHITECTURE.md` §15 — lists `FormationProvider` among the provider abstractions.

So this is not a reversal. It is a principle that was written down and never modelled. The
work is to build what those two lines already promised, and to widen it from one country
to many.

---

## A. Documents affected

| Document | What is wrong | Severity |
|---|---|---|
| `DATABASE.md` §5 | `companies.state` is a US state. `ein`, `ein_status`, `ein_requested_at`, `ein_issued_at` are US columns on a generic table. `formation_orders.provider` is free text with no registry. No `formation_requests`, `entity_types`, `jurisdictions`, `eligibility_rules`, `formation_events`, `formation_rfis` | 🔴 structural |
| `DATABASE.md` §5 | `formation_orders` carries `company_id` but **no `tenant_id`**. §10 already flags the identical problem on `leads` and recommends carrying `tenant_id` directly | 🔴 tenancy |
| `ARCHITECTURE.md` §15 | `FormationProvider` is a name with no interface, no capability model, no router, no fallback | 🟠 |
| `ARCHITECTURE.md` §4 | The capability list has `formation` but not `jurisdiction` or `eligibility` | 🟡 |
| `PRODUCT_SPEC.md` §29.3 block 1 | Activation setup is `~$497`; the new direction says `$497–$697` | 🟠 commercial |
| `PRODUCT_SPEC.md` §29.3 block 4 | **Already correct.** "connect or import the existing company, never re-form what already exists", and an imported company enters at `active` with **no formation order at all** | ✅ keep |
| `PRODUCT_SPEC.md` §21, §29.3 | US-only throughout: state, EIN, IRS | 🟠 |
| `PRODUCT_SPEC.md` §26 | "international by architecture" is asserted; formation contradicts it | 🟠 |
| `contracts/src/formation.ts` | Three sound, provider-neutral machines. Missing: an RFI state, an "awaiting provider" state, jurisdiction, entity catalog, eligibility. `EIN_STATUSES` is a US concept at the top level of a generic contract | 🟠 |
| `contracts/src/assessment.ts` | *(written today)* `BUSINESS_KINDS = new \| existing` needs a third value. No question about where the founder wants to operate or sell, which is the input jurisdiction routing needs | 🟠 |
| `contracts/src/billing.ts` | *(written today)* `currency: z.literal("USD")`. UK government fees are GBP | 🔴 money |
| `config/src/pricing.ts` | *(written today)* Activation hard-coded at one value; no government-fee model at all | 🟠 |
| `V1_BUILD_PLAN.md` | Step 5 is US-shaped. Needs the engine, the catalog and the router | 🟠 |
| `OPEN_DECISIONS.md` | No entry for any of this | 🟠 |
| `DESIGN_SYSTEM.md` | **Nothing to change.** Formation status is already rendered from ZeroCorp tones, never a provider string | ✅ |

---

## B. Architecture changes

```text
                     Business Formation Engine          ← ZeroCorp's own concept
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   Catalog              Eligibility            Provider Router
   jurisdictions        rules per              scores candidates,
   entity types         entity + founder       records WHY it chose
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                     FormationProvider (port)          ← packages/application
                              │
        ┌──────────────┬──────┴───────┬──────────────┐
   US provider A   US provider B   UK partner    ManualOperator
```

Four rules, to be added to `CLAUDE_CODE_RULES.md`:

1. **ZeroCorp owns the formation abstraction. Providers are replaceable execution adapters.**
2. **Provider-specific detail must never reach the customer-facing model.** A customer
   never sees a provider name, a provider status string, or a provider error.
3. **Supporting a new jurisdiction must be additive.** A new country adds catalog rows and
   an adapter. It must not require a schema migration on the core tables.
4. **A capability is not real until it is verified.** An entity type is `automated` only
   when a provider has been confirmed technically *and* contractually. Everything else is
   `operator_assisted` or `unavailable`, and the UI says so.

`ManualOperator` is a first-class provider, not a fallback hack. It is how V1 ships any
jurisdiction before an adapter exists, and it makes §21's "manually assisted operator
workflow" a routing outcome rather than a special case.

---

## C. Database changes

New tables:

```text
jurisdictions        country_code, subdivision_code, name, status
entity_types         jurisdiction_id, code, name, customer_label, liability_model,
                     tax_treatment_note, automation_level, government_fee_cents,
                     government_fee_currency, typical_days_min, typical_days_max
eligibility_rules    entity_type_id, rule_kind, predicate_json, effect, message_key
formation_providers  code, name, status, capabilities_json, priority
formation_provider_accounts   provider_id, environment, credentials_ref, status
formation_requests   tenant_id, business_id, requested_entity_type_id, jurisdiction_id,
                     founder_profile_json, status, decision_json
formation_orders     tenant_id (ADDED), request_id, provider_id, provider_ref,
                     status, rejection_reason, cost_cents, price_cents, currency
formation_events     tenant_id, order_id, source, external_event_id, kind, payload_json
formation_documents  tenant_id, order_id, type, storage_key, issued_at, retention_until
formation_rfis       tenant_id, order_id, question, required_documents_json,
                     status, answered_at
company_registrations  tenant_id, company_id, kind, authority, identifier,
                       status, requested_at, issued_at
```

The last one replaces the four `ein_*` columns. An EIN becomes a row with
`kind = 'tax_id'`, `authority = 'IRS'`; a UK company gets `kind = 'tax_id'`,
`authority = 'HMRC'` for its UTR and a second row for VAT. **Adding a country stops being
a migration.**

`companies` changes:

```text
- state                    → jurisdiction_id
- entity_type (free text)  → entity_type_id
- ein, ein_status,         → company_registrations rows
  ein_requested_at,
  ein_issued_at
+ tenant_id                 (it needs one; see A)
```

`formation_requests` vs `formation_orders` is the split the current schema lacks: the
**request** is what the customer asked for and is provider-independent; the **order** is
one attempt to execute it against one provider. A rejected order can be retried against a
different provider without inventing a second request or losing the first attempt.

---

## D. Contract changes

New: `Jurisdiction` · `EntityType` · `EligibilityRule` · `EligibilityResult` ·
`FormationRequest` · `FormationProviderCapability` · `ProviderRoutingDecision` ·
`FormationEvent` · `FormationDocument` · `FormationRfi` · `CompanyRegistration`.

Changed:

- `formation.ts` — add `awaiting_provider` and `information_requested` to the order
  machine. Both exist today and have nowhere to go: an order sitting with a provider is
  not `filed`, and an RFI is not a rejection.
- `EIN_STATUSES` → `REGISTRATION_STATUSES`, applied per registration kind. The machine is
  identical; only the name was US-specific.
- `assessment.ts` — `BUSINESS_KINDS` becomes `new | existing | undecided`, plus a question
  on operating and selling markets.
- `billing.ts` — `Money.currency` stops being `literal("USD")`. **See decision 1.**
- `plan.ts` — add `PlanConstraint` (`"no Delaware"`, `"focus on France"`, `"skip
  branding"`) and `PlanDecision` (what the customer chose and why), so a constraint
  survives a regeneration instead of being re-argued each time.

---

## E. Domain and application changes

```text
domain/formation      EntityCatalog · EligibilityPolicy · FormationRequest aggregate
                      ProviderRoutingPolicy (pure scoring, no IO)
application/formation  determineEntity · evaluateEligibility · createFormationRequest
                       selectFormationProvider · submitFormation
                       uploadFormationDocument · respondToFormationRfi
                       getFormationStatus · getFormationDocuments
                       importExistingCompany
application/assessment assessBusiness · generateBusinessPlan · reviseBusinessPlan
                       approveBusinessPlan
```

The scoring policy is **pure** and lives in the domain, so "why did we route to provider
B" is a unit test, not a production mystery. The adapters live in
`packages/integrations`. The domain imports no SDK, which the existing dependency-cruiser
rule already enforces.

---

## F. Provider abstraction

```ts
interface FormationProvider {
  readonly code: string;
  getCapabilities(): Promise<ProviderCapabilities>;
  getEligibleEntities(f: FounderProfile): Promise<EntityTypeRef[]>;
  getPackages(e: EntityTypeRef): Promise<ProviderPackage[]>;
  createFormation(r: FormationRequest): Promise<ProviderFormationRef>;
  submitFormation(ref: ProviderFormationRef): Promise<void>;
  getFormationStatus(ref: ProviderFormationRef): Promise<ProviderStatus>;
  uploadDocument(ref: ProviderFormationRef, d: DocumentUpload): Promise<void>;
  getDocuments(ref: ProviderFormationRef): Promise<ProviderDocument[]>;
  handleRfi(ref: ProviderFormationRef, answer: RfiAnswer): Promise<void>;
  cancelFormation(ref: ProviderFormationRef, reason: string): Promise<void>;
  getEvents(since: Date): Promise<ProviderEvent[]>;
}
```

`ProviderStatus` is **translated** into a ZeroCorp status by a mapping the adapter owns.
A provider's own string never crosses the port. That single rule is what makes the four
architecture rules above enforceable rather than aspirational.

---

## G. Provider capability matrix

Researched 2026-09-01. **Nothing here is contracted.** Every row is what a public page
says, which is a starting point for diligence, not a commitment.

### United States

| | doola Formation API | CorpNet API |
|---|---|---|
| Entities | LLC, C-Corp | Formation filings, 50 states + DC |
| States | All 50 | All 50 + DC |
| Non-resident | Stated: 175+ countries, no SSN required | Not stated on the API pages |
| EIN | Included | Employer tax registration API, all 50 states |
| Registered agent | Included | Offered |
| Documents | Returned via API | Document retrieval endpoint |
| Status | Real-time, partner portal | Status tracking endpoint |
| Webhooks | Yes (filed, completed, agent assigned) | Not stated |
| Sandbox | Yes | Yes (staging) |
| White label | Yes, partner sets own price | Partner program |
| Contract | Agreement required before production keys | Partnership agreement + one-time implementation fee |
| Time to live | Not stated | Stated 4 to 6 weeks |

Both are credible. **Neither is verified by us.** Recommendation: integrate one first
behind the port, keep the second as the fallback the router is built for.

### United Kingdom — the finding that changes the plan

**Companies House does not offer incorporation through its modern REST API.** The API
Filing service exposes Transactions, Registered Office Address, Insolvency and Registered
Email Address. Incorporation is described as a future use case. It requires OAuth 2.0, not
an API key, and it has a sandbox.

Incorporation is available through the **legacy XML Gateway** (form IN01), which Companies
House has said it will deprecate once the REST API covers the functionality. Filing that
way needs a Presenter account, and there is an active developer forum around IN01 schema
validation, so it works today.

Two further constraints, and they are not technical:

- **Identity verification is mandatory.** Under ECCTA, verification has been required for
  newly appointed directors and PSCs since 18 November 2025. The transitional window for
  existing directors closes in November 2026, and from spring 2026 filings without a
  personal code can be rejected.
- **Filing on someone's behalf points at ACSP registration.** An Authorised Corporate
  Service Provider is AML-supervised and authorised by Companies House. Reporting
  indicates agents filing for clients need to be registered as an ACSP from spring 2026.

Companies House also raised the digital incorporation fee to £100 from 1 February 2026 —
a **GBP** fee, which is what breaks the USD-only money model.

**Conclusion for the UK.** Three routes, in descending order of soundness:

```text
1. Contract a UK formation partner who is already an ACSP, behind our port
2. Become an ACSP and file via the XML Gateway (a legal and AML commitment,
   not an engineering task), accepting the gateway is deprecated
3. Operator-assisted: catalog-visible, filed by a human, no automation claimed
```

Browser automation of the government site is **not** proposed, and the new direction
already forbids it as a first solution.

---

## H. New product flow

```text
Landing
  → what do you do? · where are you today? · do you already have a company?
    · where do you want to go? · where do you want to operate and sell?
  → optional voice
  → AI analysis: where you are · where you want to go · what is missing · what we recommend
  → recommended plan, with a jurisdiction and entity recommendation ONLY where one is needed
  → pricing tied to the recommended path
  → checkout → tenant
  → deep onboarding → Business Brain
  → EITHER  formation request → eligibility → router → provider → tracking
    OR      existing company → digital audit → activation
```

The branch is the point. **Recommending a new LLC to everyone is forbidden as default
product logic**, and the Business Architect must be able to conclude *"no new company is
needed"*. That conclusion has to be a first-class output of the plan schema, not an absent
step.

---

## I. Decisions requiring your arbitration

Four. Everything else I can decide.

1. **Currency.** UK government fees are GBP. Either we quote the customer in USD and
   absorb the FX on the government fee, or the product becomes multi-currency (pricing,
   Stripe, ledger, invoices). This is commercial, and it is load-bearing for the money
   invariant.
2. **Activation setup price.** You said $497–$697. I need one default to configure. It
   stays a hypothesis and stays configurable either way.
3. **How honest is the UK in V1?** Catalog-visible and operator-executed, catalog-visible
   as a waitlist, or hidden until a partner is contracted.
4. **ACSP.** Do we pursue Authorised Corporate Service Provider registration ourselves, or
   route every UK filing through a partner who already holds it? This is an AML supervision
   commitment, not an engineering choice.

---

## J. Migration risks

| Risk | Why it bites | Mitigation |
|---|---|---|
| `companies.state` → `jurisdiction_id` | Every US company row must map to a real jurisdiction | Seed the catalog first, backfill, then drop. No data exists yet, so this is free **today** and expensive in three months |
| `ein_*` columns → `company_registrations` | Four columns become rows | Same window. Do it before the first customer |
| `formation_orders` gains `tenant_id` | RLS cannot protect a table without it | Add now. There is no data to backfill |
| `Money.currency` widening | Touches the ledger, Stripe and every price | Decide 1 before writing billing, not after |
| Claiming automation we do not have | A customer buys a UK Ltd we cannot file | `automation_level` is a required field with no default, and the UI renders it |
| The catalog becoming a second source of truth | Two places defining entity types | Catalog rows are **data**; the enum of *kinds* stays in `contracts` |

---

## K. Recommended implementation order

```text
 0  Decide 1 to 4                                     blocking, ~10 minutes
 1  Contracts: jurisdiction, entity type, eligibility, provider capability,
    routing decision, registration. Widen Money. Fix BUSINESS_KINDS
 2  Schema + migration 0003, with the catalog seeded for US-LLC, US-C-Corp,
    UK-Ltd, UK-LLP. RLS on every new tenant-owned table
 3  Domain: EntityCatalog, EligibilityPolicy, ProviderRoutingPolicy — pure, tested
 4  Application: the twelve use cases
 5  ManualOperatorProvider — the first real adapter, and the one that lets any
    jurisdiction ship before an API exists
 6  Resume the funnel: assessment → analysis → plan → checkout
 7  One real US adapter behind the port, once a provider is contracted
 8  UK, per decision 3
```

Steps 1 to 4 are pure and need no provider contract, so **nothing here waits on a
commercial negotiation.** That is the property the abstraction buys.
