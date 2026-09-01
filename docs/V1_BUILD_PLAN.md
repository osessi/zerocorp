> **STATUS: CURRENT**
>
> This document is part of the current ZeroCorp source of truth.
>
> **Owns:** the build order for V1, the surface inventory, and the definition of done
> for each step. It does not define product scope (`PRODUCT_SPEC.md` §29.3 owns that),
> architecture (`ARCHITECTURE.md`), schema (`DATABASE.md`) or UI (`DESIGN_SYSTEM.md`).
>
> Created 2026-09-01.

---

# ZeroCorp — V1 Build Plan

## 0. What V1 is, in one screen

A founder arrives with an idea or a struggling business. Ninety days later they have a US
company, a bank-ready EIN, a brand, a website on their own domain, a working email
infrastructure, a content engine publishing on a schedule, and a list of prospects.

They did not assemble it from twelve tools. They answered questions, approved a plan, and
watched a dashboard.

```text
Understand → Plan → Build → Launch → Find customers
```

The test is not "does it demo". The test is **would a founder pay $997 and get a business**.

---

## 1. The finished product — every surface

Three deployed applications, one database, one design system. Nothing here is a mock at
the end of V1.

### 1.1 Public funnel — `apps/app`, unauthenticated

| Route | What it is |
|---|---|
| `/` | Landing. One promise, one call to action |
| `/assessment` | The funnel. Five questions, `FocusedFlowLayout`, text with optional voice |
| `/assessment/[token]/analysis` | Where you are · Where you want to go · What is missing |
| `/assessment/[token]/plan` | The plan. Accept, edit, discuss, regenerate |
| `/assessment/[token]/pricing` | The recommended path and its price |
| `/assessment/[token]/checkout` | Hand-off to Stripe |
| `/welcome` | Post-payment. Create the account that owns the new tenant |

The whole funnel is anonymous. Authorization is a token, not a session. Nothing costly
runs before payment: one model call produces the analysis and the plan together.

### 1.2 The product — `apps/app`, authenticated

| Route | What it answers |
|---|---|
| `/dashboard` | **What is ZeroCorp doing for me?** Progress, tasks needing attention, activity, notifications |
| `/onboarding` | Deep onboarding. Identity, documents, brand assets, voice. Behind the paywall on purpose |
| `/brain` | The Business Brain. Editable, versioned, the upstream source for everything generated |
| `/plan` | The approved plan, with each step's real status |
| `/company` | Formation progress, documents, signature, EIN, deadlines |
| `/brand` | Name, positioning, ICP, value proposition, tone, logo, colours |
| `/website` | Pages, blocks, preview, publish |
| `/website/domains` | Domain, DNS, SSL |
| `/email` | Domain, SPF/DKIM/DMARC, mailboxes, warm-up, reputation |
| `/content` | Keyword strategy, editorial calendar, articles, approval, publication |
| `/leads` | Targets, discovery, enrichment, saved lists, CSV export |
| `/settings` | Billing, plan, credits, team, notifications |

### 1.3 Operator console — `apps/app/admin`

Required in V1, not later. Without it every formation, refund and support request is a
manual database edit.

```text
/admin                 the operator queue — what needs a human today
/admin/formations      formation orders, state transitions, rejection handling
/admin/documents       identity documents, accept / reject, signed URLs, access log
/admin/tenants         customers, plans, credits, impersonation
/admin/payments        payments, subscriptions, refunds, failed webhooks
/admin/jobs            failed jobs, retries, dead letters
```

Impersonation is scoped, time-boxed and audited. Every admin surface is subject to the
same tenant isolation tests as the product.

### 1.4 Customer websites — `apps/sites`

Anonymous, read-only against the database, one renderer, one block registry. Sites are
data. No per-customer application is ever generated.

### 1.5 Background work — `apps/worker`

```text
business.architect.run        the assessment analysis and plan
onboarding.brain.compile      deep onboarding into a Business Brain
formation.order.advance       state polling and operator notifications
website.generate              brain → page versions
email.warmup.tick             daily warm-up volume
content.plan · content.write · content.publish
leads.discover · leads.enrich
digest.daily
```

---

## 2. Build order

Thirteen steps. Each one ends with something demonstrable and `pnpm verify` green.

Three deviations from the obvious order, each with a reason:

> **The admin console splits.** A minimal operator surface ships with step 5, because
> `PRODUCT_SPEC.md` §21 makes V1 formation a manually assisted operator workflow. The
> first paying customer needs someone able to see and advance their order. The full
> console (impersonation, refunds, support) stays at step 12.

> **Observability ships with step 3, not step 13.** The moment money moves, a payment
> nobody can trace is a dispute nobody can win.

> **The domain starts at step 7, not step 8.** Email warm-up takes two to three weeks of
> calendar time. Registering and delegating the domain with the website means warm-up runs
> while content is being built, instead of after it.

---

### Step 1 — Technical foundation

**Packages:** `config` · `db` · `tenancy` · `auth` · `billing` · `storage` · `integrations`

```text
config       per-app Zod env schemas. apps/sites cannot read the read-write URL
db           schema, hand-written ordered migrations, RLS with FORCE, roles,
             append-only revocations, withTenant, withSystem
tenancy      host → tenant resolution, TenantContext construction
auth         Argon2id passwords, hashed session tokens, membership checks, MFA for admin
billing      Stripe behind a port, subscriptions, credit ledger, entitlements
storage      private buckets, short-lived signed URLs, access log
integrations the provider ports V1 will need, with one real adapter each
```

**Done when**
- every tenant-owned table has RLS enabled AND forced AND a policy, verified by reading
  the live catalog rather than the migration file
- cross-tenant reads return zero rows, cross-tenant writes affect zero rows, a read-only
  context raises SQLSTATE 25006 — all against a real PostgreSQL, no skipped test
- append-only tables refuse UPDATE and DELETE at the database
- a schema-drift test compares the Drizzle definitions to the live catalog

---

### Step 2 — Free Business Assessment

**The first sellable surface.** Landing, five questions, one Business Architect run,
three panels, a plan.

```text
domain/assessment       the state machine and its invariants
application/assessment  start · answer · analyze · regenerate · approve
ai                      AITextProvider, structured output, Zod validation, agent_runs
apps/app                the funnel in FocusedFlowLayout
```

**Done when** a stranger can answer five questions and receive an analysis and a plan they
recognise as their own business, with every model output schema-validated and every run
costed in `agent_runs`.

---

### Step 3 — Checkout

```text
plan → approve → price → Stripe → webhook → tenant + user + membership + Business Brain seed
```

The webhook is the only thing that creates a tenant. It is idempotent by unique
`(provider, external_event_id)`, and it is replay-safe because the whole conversion runs in
one transaction.

**Done when** a test payment produces a tenant, a user, an owner membership, a
`business_profiles` row seeded from the assessment, a `business_plans` row copied from the
approved plan, a subscription, and an audit trail — and replaying the webhook changes
nothing.

**Observability arrives here:** structured logs with tenant and request id, error tracking,
and an alert on a failed conversion.

---

### Step 4 — Deep onboarding

Behind the paywall, where the real cost sits.

```text
identity · current situation · goals · documents · existing website · brand assets · voice
→ follow-up questions ONLY where the brain is thin
→ Business Brain
```

Documents go to a private bucket with short-lived signed URLs and an access log. Identity
data never reaches an application log. Voice is transcribed; the transcript is the answer
and the audio is a document with a retention period.

**Done when** the Business Brain is complete enough that step 6 and step 7 need no further
questions.

---

### Step 5 — Company

```text
new business      structure · state · formation · documents · identity · signature
                  · tracking · EIN · deadlines
existing business connect or import — never re-form what already exists
```

State machines are decided (D2) and live in `packages/contracts/src/formation.ts`. An
imported company enters at `companies.status = active` with **no formation order at all**.

**5b — Minimal operator console.** The formation queue, the document vault, and the state
transitions an operator performs. Ships with this step, not at step 12.

---

### Step 6 — Brand

Name, positioning, ICP, value proposition, tone, logo, colours. Generated from the Business
Brain, approved by the customer, and written back to the brain as approved facts.

Customer brand tokens and the ZeroCorp UI theme are separate systems and never share a
token (`DESIGN_SYSTEM.md` §16).

---

### Step 7 — Website

```text
brain → structured page JSON → block registry → renderer → preview → publish
```

Sites are data, not code. The LLM emits **validated block JSON**, never HTML, React or
CSS. Published versions are immutable. `apps/sites` renders them read-only.

Domain and DNS start here so warm-up can begin during step 8.

> **Blocked on D3 and D4** — the block taxonomy and the hero variant enum are still
> disputed. They must be resolved before this step starts.

---

### Step 8 — Email

Domain, SPF, DKIM, DMARC, mailboxes, forwarding, warm-up, reputation. Warm-up is a
calendar process, not a feature flag: it runs for weeks and its schedule is a state machine.

---

### Step 9 — Content

SEO research, keyword strategy, content plan, editorial calendar, generation, editing,
approval, publication, images, metadata.

Five articles a day is a **publication** ceiling the customer can move, not a generation
limit. Publication is governed by quality and SEO rules.

---

### Step 10 — Get Customers, Lite

```text
target definition · discovery · basic enrichment · search · filters · saved lists · CSV
```

V1 finds. It does not contact. No campaigns, no sequences, no automated follow-up.

> **Blocked on C2** — the lead-generation compliance doctrine is knowledge that currently
> lives only in the archive. It must be promoted before this step starts. A prospecting
> feature built without a lawful-basis model is a liability, not a feature.

---

### Step 11 — Dashboard

The Command Center. One question: **what is ZeroCorp doing for me?**

Launch progress, tasks requiring attention, activity timeline, notifications. In-app plus
an email digest. Telegram is deliberately V2.

This is late on purpose. A dashboard is a view over things that exist; building it first
means building it twice.

---

### Step 12 — Admin console, complete

Everything 5b left out: customers, tenants, payments, subscriptions, credits, support,
secure impersonation, audit, failed jobs, retries.

---

### Step 13 — Hardening

E2E on the protected journeys, a security pass, the RLS matrix re-run against the final
schema, responsive behaviour on every screen, and the load profile.

Protected journeys, from `CLAUDE_CODE_RULES.md` §7:

```text
assessment → plan → checkout → tenant
onboarding → Business Brain
formation order → filed → formed
website generate → publish
document upload → private bucket → signed URL
```

---

## 3. What blocks what

```text
Step 1  ────────────────────────────────────────────────►  everything
Step 2  ──►  Step 3  ──►  Step 4  ──►  Steps 5, 6, 7
Step 6  ──►  Step 7  ──►  Steps 8, 9
Step 7  ──►  Step 8  (domain must exist before warm-up)
Step 5  ──►  Step 5b  (an operator queue needs orders to hold)
```

Open items that must be resolved **before** the step that needs them:

| Blocker | Blocks | Status |
|---|---|---|
| D3 · website block taxonomy | Step 7 | 🟠 unresolved |
| D4 · hero variant enum | Step 7 | 🟠 unresolved |
| C1 · Cloudflare for SaaS gotchas | Step 7 domains | 🔴 in archive only |
| C2 · lead-generation compliance | Step 10 | 🔴 in archive only |
| C3 · fraud posture, Stripe risk | Step 3 | 🔴 in archive only |
| C6 · signature approach | Step 5 | 🟠 in archive only |
| D-G1 · Form 5472 obligation | Step 5 | 🔴 highest impact |
| §24.12 · table density | Steps 10, 11, 12 | 🟠 unresolved |
| Nine PROPOSED dashboard patterns | the step that first needs each | by design |

---

## 4. What V1 is not

From `PRODUCT_SPEC.md` §27 and §29.4, restated here so no step quietly grows:

```text
no campaigns, sequences or automated outreach       V2
no full CRM                                          V2
no Telegram                                          V2 / V3
no autonomous agents acting without approval         V3
no accounting or tax filing                          V4
no public API, no marketplace, no white label        V5
```

---

## 5. How this document is used

Each step is finished when its "done when" clause is true and `pnpm verify` is green. A
step is never marked done because its screens render.

When a step changes what a current document says, the current document is updated in the
same change — `CLAUDE_CODE_RULES.md` §31 and §40. This plan is not exempt: when reality
diverges from it, this file is edited, not ignored.
