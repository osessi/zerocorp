> **STATUS: CURRENT**
>
> This document is part of the current ZeroCorp source of truth.
>
> **Owns:** runtime topology, monorepo layout, domain boundaries, API style, provider abstractions, events, CI/CD, deployment.
>
> When this document conflicts with anything under `docs/archive/`, **this document wins**.
> See [`docs/README.md`](./README.md) for the full documentation hierarchy and topic ownership map.
>
> Last reorganized: 2026-08-30

---

# ZeroCorp — Architecture Blueprint v1

> Status: Proposed architecture
>
> Purpose: give the product and engineering team a strong initial architecture to review and refine before implementation.
>
> Source basis: ZeroCorp Product Vision & Blueprint v1, plus the architecture decisions discussed during product review.
>
> Important: this document proposes structure where the source document leaves decisions open. Human/product approval is required before structural changes are considered final.

---

## 1. Architecture North Star

ZeroCorp is a multi-tenant business operating platform.

The architecture must support:

- one shared application serving many tenants;
- tenant-isolated business data;
- websites represented as structured data rather than per-customer code;
- reusable product and website components;
- asynchronous workflows;
- AI outputs validated before entering business systems;
- interchangeable external providers;
- observable and auditable operations;
- internationalization from day one;
- progressive expansion from Business Launch to Business Growth to Business Autopilot.

Core principle:

> **Build the system once. Represent customer-specific behavior as data, configuration, workflows and permissions.**

---

## 2. Runtime Architecture

> Decided in [ADR 0001](./adr/0001-runtime-topology.md) (Accepted, 2026-08-30), which
> resolves `OPEN_DECISIONS.md` D1. The earlier NestJS `apps/api` proposal was never a
> decision; it is preserved in the ADR with the reasoning for and against.

### Target Architecture

The end state. Its boundaries exist in the repository today.

```text
                    customer domains  /  zerocorp app
                                 |
                 +---------------+---------------+---------------+
                 |               |               |               |
            apps/sites       apps/app       apps/worker      apps/api
            tenant sites     back-office    jobs, agents     public API
            anonymous        + admin        workflows        mobile / partners
            edge-cached      authenticated                   ADDED ON TRIGGER
            DB read-only
                 |               |               |               |
                 +---------------+---------------+---------------+
                                 |
                        packages/application         use cases, ports
                                 |
                        packages/domain              rules, invariants
                                 |
        +--------+--------+------+------+--------+--------+---------+
        |        |        |             |        |        |         |
       db     tenancy   auth        billing     ai   integrations storage
     + RLS                                                     notifications
                                                                  security
```

### Initial Deployment / Current Topology

What is actually deployed today.

```text
apps/sites   ·   apps/app   ·   apps/worker

apps/api     NOT DEPLOYED — no extraction trigger has fired
```

**This distinction is binding across all ZeroCorp documentation.** The boundaries of the
target architecture exist now; components that carry no value yet are not built now. Any
component absent from the current topology must remain reachable by **addition**, never
by rewrite.

### Application responsibilities

#### `apps/sites`
Next.js App Router. The public multi-tenant website renderer.

Owns:

- host-based tenant resolution at the edge;
- rendering published page versions through `@zerocorp/site-renderer`;
- ISR with tag-based revalidation on publish;
- sitemaps, robots and the per-tenant SEO surface.

Runs against a **read-only** PostgreSQL role, and `withTenant()` additionally issues
`SET LOCAL TRANSACTION READ ONLY`. A write from this application fails at the database
regardless of what the code attempts.

Deployed independently: a failed back-office release cannot take customer websites down.

#### `apps/app`
Next.js App Router. Everything authenticated.

Owns:

- marketing site;
- onboarding UI;
- customer back-office;
- block editor;
- admin console;
- notification center UI;
- HTTP entry points (route handlers) and webhook ingestion.

Read-write. Calls `packages/application` directly — never through an HTTP API of our own.

#### `apps/worker`
Dedicated asynchronous execution process. Inngest is the workflow control plane.

Owns:

- long-running jobs and scheduled workflows;
- AI and content generation;
- social publishing, email workflows, domain provisioning;
- agent execution;
- retries, backoff and reconciliation.

#### `apps/api` — not deployed
The **public** API: mobile, partners, enterprise contracts. Versioned, rate-limited,
key-authenticated.

**Never a BFF for `apps/app`** (ADR 0001, NN-6). Extraction triggers T1–T5 are in the
ADR. Its controllers will invoke the same use cases the route handlers invoke, which is
what makes it an addition rather than a migration.

---

## 3. Monorepo

### Package manager

Use **pnpm**.

Reasons:

- workspace support;
- efficient dependency installation;
- strong monorepo ergonomics;
- good disk efficiency;
- deterministic lockfile workflow;
- widely used in modern TypeScript repositories.

Do not claim that pnpm is automatically “more secure” than every alternative. Security comes from the complete dependency and CI policy. Use pnpm's strengths as part of that policy.

### Proposed tooling

```text
pnpm
Turborepo
TypeScript
ESLint
Prettier
Vitest
Playwright
```

### Repository layout

```text
/
├── apps/
│   ├── sites/                    tenant websites — anonymous, DB read-only
│   ├── app/                      back-office + admin — authenticated
│   ├── worker/                   jobs, workflows, agents
│   └── (api/)                    public API — added on trigger, NOT present
│
├── packages/
│   ├── contracts/                L0  Zod schemas for everything crossing a boundary
│   ├── config/                   L0  validated runtime configuration
│   ├── design-system/            L0  tokens and primitives
│   ├── domain/                   L1  entities, invariants, state machines
│   ├── application/              L2  use cases, ports, transaction boundaries
│   ├── db/                       L3  Drizzle, RLS, withTenant — the tenant choke point
│   ├── tenancy/                  L3  host → tenant resolution, context propagation
│   ├── auth/                     L3  sessions, identity, authorization policies
│   ├── billing/                  L3  subscriptions, credit ledger, entitlements
│   ├── ai/                       L3  LLM / image / transcription providers, routing
│   ├── integrations/             L3  formation, email, social, domains, payments
│   ├── storage/                  L3  private buckets, signed URLs
│   ├── notifications/            L3  in-app, email, Telegram dispatch
│   ├── security/                 L3  encryption, webhook signatures, rate limiting
│   ├── ui/                       L4  authenticated product components
│   └── site-renderer/            L4  block registry and tenant page renderer
│
├── docs/
│   ├── README.md                 documentation index and ownership map
│   ├── OPEN_DECISIONS.md         contradictions, reversals, gaps
│   ├── PRODUCT_VISION.md
│   ├── PRODUCT_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── DESIGN_SYSTEM.md
│   ├── CLAUDE_CODE_RULES.md
│   ├── adr/                      architecture decision records
│   ├── diagrams/                 Archify specifications (JSON IR)
│   └── archive/                  historical only, never a specification
│
├── tests/
│   ├── architecture/             NN-1, NN-2, NN-6 asserted structurally
│   └── tenant-isolation/         NN-3 — release-blocking
│
├── .dependency-cruiser.cjs       the executable form of the boundary rules
├── eslint.config.mjs
├── tsconfig.base.json            per-layer lib/types lockdown
├── tsconfig.json                 solution file — references mirror the layers
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── pnpm-lock.yaml
```

`observability/` and `i18n/` appeared in the earlier layout and are **not** created yet.
They have no home today — tracked in `OPEN_DECISIONS.md`.

### Boundary rule

Apps may import packages.

Packages should not import app internals.

```text
apps/web
   ↓
packages/*

apps/api
   ↓
packages/*

apps/worker
   ↓
packages/*
```

Never:

```text
web → api source internals
api → web components
worker → web internals
```

---

## 4. Domain Boundaries

Business capabilities are modules inside `packages/domain` and `packages/application`,
not modules inside a web framework. An application never owns a domain; it adapts to one.

```text
identity · tenancy · business · formation · brand · website · content
leads · email · social · crm · agents · notifications · billing · credits
domains · documents · admin · analytics
```

Each capability appears twice, with a strict division of labour:

```text
packages/domain/<capability>/          entities, value objects, invariants,
                                       state machines, domain events
                                       pure — no IO, no framework, no clock

packages/application/<capability>/     use cases, ports, transaction boundaries
                                       depends on domain and contracts only
```

Infrastructure implements the ports the application declares. Dependencies point inward:
`db`, `ai`, `integrations` and the other Layer 3 packages depend on `application`, never
the reverse.

```text
apps/*                    thin adapters
   ↓
packages/application      use cases + ports
   ↓
packages/domain           rules and invariants
   ↑
packages/db · ai · integrations · storage · …    implement the ports
```

Composition happens in each application's `src/server/container.ts`. That file is the
only place in an application allowed to import `@zerocorp/db`, and it is where
`apps/sites` receives a read-only unit of work while `apps/app` and `apps/worker`
receive a read-write one.

---

## 5. API Style

### Internal — `apps/app` and `apps/worker`

There is no internal HTTP API. `apps/app` route handlers and `apps/worker` jobs invoke
use cases from `packages/application` directly, in process.

An HTTP handler stays thin: **parse, authenticate, authorize, invoke a use case, and
serialize the result. Business logic must never live in an HTTP handler, a Server
Component or a Server Action.**

Every entry point must define:

- authentication requirements;
- tenant scope;
- role and permission requirements;
- request schema (Zod, from `packages/contracts`);
- response schema;
- error contract;
- idempotency expectations where applicable.

### External — webhooks

Inbound provider webhooks are route handlers in `apps/app`. They verify the signature,
enforce idempotency on the provider event id, and hand off to a use case. They never
process inline.

### Public — `apps/api`, when a trigger fires

**REST + OpenAPI, versioned from its first release**, generated from
`packages/contracts`. It is a product with a stability contract, a deprecation policy,
rate limiting and key-based authentication — deliberately not the same surface as the
internal use-case layer (ADR 0001, NN-6).

---

## 6. Contracts

Create a dedicated `packages/contracts`.

It contains:

- Zod schemas;
- API-level types;
- event contracts;
- AI output schemas;
- webhook schemas;
- shared enums;
- pagination contracts;
- common error shapes.

The contract package is the source of truth for data crossing boundaries.

---

## 7. Multi-Tenancy

Architecture:

```text
Postgres
  ↓
tenant_id on tenant-owned tables
  ↓
Row Level Security
  ↓
application-level tenant context
  ↓
authorized query
```

Rules:

1. Tenant-owned rows carry `tenant_id`.
2. Tenant context is resolved at request/workflow boundaries.
3. Application queries must be tenant-scoped.
4. RLS remains a second barrier.
5. Tests must explicitly attempt cross-tenant access.
6. System/global tables are explicitly documented as exceptions.

Never rely on “the developer will remember the filter”.

---

## 8. Tenant Context

Create a request/workflow context abstraction:

```ts
interface TenantContext {
  tenantId: string;
  userId?: string;
  role?: string;
  requestId: string;
}
```

Jobs must persist enough context to reconstruct authorization and audit state.

Never pass a naked customer-controlled tenant ID into a privileged operation without server-side authorization.

---

## 9. Website Architecture

The public website engine is data-driven.

```text
Site
  ↓
Page
  ↓
Block[]
  ↓
Validated Block JSON
  ↓
Block Registry
  ↓
Approved React component
  ↓
Design System
```

LLM output:

```text
structured JSON only
```

Never:

```text
LLM → arbitrary HTML
LLM → arbitrary React
LLM → arbitrary CSS
```

### Block registry

Conceptually:

```ts
type BlockDefinition = {
  type: string;
  version: number;
  schema: ZodSchema;
  component: React.ComponentType<any>;
  allowedVariants: string[];
};
```

The registry is controlled code.

Customer data selects from approved building blocks.

---

## 10. Website Versioning

Do not mutate published content blindly.

Use drafts and immutable published versions.

Proposed lifecycle:

```text
draft
  ↓
validation
  ↓
preview
  ↓
publish
  ↓
published_version
```

Support rollback to a prior valid version.

This is an important operational guardrail because website changes are customer-visible.

---

## 11. Business Brain

Treat the business profile as a first-class domain object.

Proposed conceptual layers:

```text
Business Identity
Positioning
ICP
Offer
Brand Voice
Proof
Competitors
Keywords
Channels
Goals
Legal/company facts
Source material
```

All major AI systems should read from an approved business context instead of independently inventing facts.

The Business Brain becomes the upstream source of truth for:

- website generation;
- blog content;
- social posts;
- prospecting;
- email;
- agent context.

---

## 12. AI Architecture

```text
Domain service
   ↓
AI orchestration layer
   ↓
provider abstraction
   ↓
LLM/image/transcription provider
```

Proposed interfaces:

```text
AITextProvider
AIImageProvider
AITranscriptionProvider
AIEmbeddingProvider
AgentRuntime
```

The product must not couple domain logic directly to a single model vendor or agent runtime.

### Structured generation

```text
prompt
  ↓
model
  ↓
structured output
  ↓
Zod validation
  ↓
business validation
  ↓
persistence
```

Invalid outputs must be rejected or quarantined.

---

## 13. Agent Architecture

Agents are not allowed direct unrestricted access to the database.

Use:

```text
Agent
  ↓
Agent capability
  ↓
Approved tool
  ↓
Domain service
  ↓
Database / provider
```

Every agent run records:

- tenant;
- agent type;
- trigger;
- tool usage;
- model/provider;
- token/usage data where available;
- cost;
- duration;
- status;
- errors;
- outputs;
- limits applied.

The runtime remains replaceable.

Hermes may be used as an implementation option, but ZeroCorp owns the abstraction.

---

## 14. Events

Introduce domain events early.

Examples:

```text
TenantCreated
PaymentSucceeded
OnboardingStarted
BusinessProfileCompleted
WebsiteGenerated
WebsitePublished
DomainConnected
EmailDomainVerified
FormationSubmitted
FormationStatusChanged
SocialAccountConnected
ContentGenerated
ContentPublished
LeadImported
AgentRunCompleted
CreditsConsumed
SubscriptionChanged
NotificationCreated
```

Events should be:

- versioned;
- idempotently handled;
- traceable to tenant;
- observable.

---

## 15. Provider Abstractions

```text
BillingProvider
FormationProvider     ← elaborated below; the others follow the same shape
EmailProvider
SocialProvider
DomainProvider
StorageProvider
AIProvider
ImageProvider
IdentityProvider
```

External SDK usage must be concentrated inside provider implementations.

Do not scatter Stripe, Cloudflare, OpenRouter, fal.ai or social API calls throughout the domain modules.

### The Business Formation Engine — RESOLVED 2026-09-01 (D14)

> **ZeroCorp owns the formation abstraction. Providers are replaceable execution
> adapters.** The four binding rules are in `CLAUDE_CODE_RULES.md` §44.

This section previously named `FormationProvider` and stopped there, while
`PRODUCT_SPEC.md` §21 already required that provider mechanics never become product
architecture. The doctrine was written and never modelled.

```text
                     Business Formation Engine          ZeroCorp's own concept
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
   Catalog              Eligibility            Provider Router
   jurisdictions        pure rules,            pure scoring,
   entity types         three-valued           records WHY
        │                     │                     │
        └─────────────────────┴─────────────────────┘
                              │
                     FormationProvider (port)          packages/application
                              │
        ┌──────────────┬──────┴───────┬──────────────┐
   US adapter      US adapter     UK partner    ManualOperator
```

**The operator is a provider, not a special case.** `ManualOperatorProvider` implements
the same port, which is what lets any jurisdiction ship the day its catalog row exists:
routing, orders, events, RFIs and documents all work, and only the execution is human.
It makes §21's "manually assisted operator workflow" a routing outcome rather than a
branch in the code.

**Eligibility is three-valued.** True, false, or unknown. A founder may not have given
us their nationality, and two-valued logic has no honest answer: unknown reading as
false makes a `deny` rule silently allow, unknown reading as true blocks everyone who
skipped an optional question. Unknown produces a warning naming the missing input.

**Routing excludes before it scores.** A provider that cannot legally or technically do
the work is excluded with a reason, never scored low, because a low score still wins
when it is the only candidate.

**The request/order split.** A `formation_request` is what the customer asked for and is
provider-independent. A `formation_order` is one attempt to execute it against one
provider. Without the split, a rejection had to either retry the same provider or invent
a second request that pretended to be a second customer ask.

Where each part lives:

```text
packages/contracts/src/jurisdiction.ts       catalog vocabulary
packages/contracts/src/eligibility.ts        closed predicate language
packages/contracts/src/provider.ts           capabilities, routing decision
packages/contracts/src/formation-request.ts  request, events, RFIs, documents
packages/domain/src/formation/               eligibility + routing, pure
packages/application/src/formation/ports.ts  the FormationProvider port
packages/integrations/src/formation/         the adapters
packages/db/migrations/0003, 0004            schema and the V1 catalog
```

---

## 16. Billing and Credits

Money:

```text
integer minor units + ISO currency
```

Never floating point for monetary storage.

Credits:

```text
credit_ledger
```

append-only.

Usage:

```text
usage_events
```

immutable event records.

A billable operation should be traceable to:

```text
tenant
feature
provider
usage
cost
credits
```

Use idempotency keys for payment/webhook processing.

---

## 17. Notifications

Notifications are first-class product objects.

Channels:

```text
In-app
Email
Telegram
```

Potential notification classes:

```text
Operational
Business milestone
Agent activity
Content publication
Lead activity
Billing
Security
Formation status
```

Each notification should have:

- type;
- tenant;
- severity;
- read/unread state;
- created_at;
- source event;
- optional action.

Daily summary emails should be built from recorded activity rather than reconstructed ad hoc.

---

## 18. Observability

Use:

```text
Sentry
PostHog
structured application logs
audit logs
```

Every significant workflow should expose:

```text
request_id
tenant_id
operation
duration
status
error
cost
provider
```

Never log secrets or identity documents.

---

## 19. Security

Security principles:

- least privilege;
- defense in depth;
- private identity-document storage;
- signed URLs with short expiration;
- encrypted secrets;
- encrypted OAuth tokens;
- admin MFA;
- audit logs;
- rate limiting;
- input validation;
- output validation;
- secure cookies/session handling;
- webhook signature verification;
- idempotency;
- dependency monitoring;
- secret scanning;
- static analysis.

Customer passports and identity documents must never appear in application logs.

---

## 20. CI/CD and Anti-Regression System

This is a required architecture component, not an afterthought.

### Every pull request / meaningful change should run

```text
1. Dependency lock check
2. Typecheck
3. Lint
4. Unit tests
5. Integration tests
6. Build
7. Database migration validation
8. Contract validation
9. Tenant-isolation tests
10. E2E smoke tests
```

### Change impact verification

When Claude Code modifies a file or feature, it must first determine:

```text
Which modules import this?
Which routes use this?
Which components render this?
Which workflows depend on this?
Which database objects depend on this?
Which tests cover this?
```

Then run targeted tests plus the appropriate full regression suite.

### Protected core flows

Maintain explicit smoke coverage for:

```text
Signup
Payment
Tenant creation
Login
Onboarding
Website generation
Website publishing
Domain connection
Billing
Credits
Notifications
Admin support
```

A change is not “done” because a local page looks correct.

---

## 21. Database Changes

Every schema change requires:

```text
migration
↓
RLS policy review
↓
index review
↓
rollback consideration
↓
test
```

No ad hoc production schema edits.

---

## 22. Deployment Environments

At minimum:

```text
local
preview
staging
production
```

Production secrets must never be used locally.

Preview environments should use isolated data.

---

## 23. Deployment Topology

### Initial Deployment / Current Topology

```text
Cloudflare for SaaS          custom hostnames, SSL, CDN
        ↓
   +----+--------------------+
   |                         |
apps/sites              apps/app                apps/worker
tenant websites         back-office + admin     Inngest workflows
anonymous               authenticated           bursty
edge-cached (ISR)       no cache                long-running
DB role: READ-ONLY      DB role: read-write     DB role: read-write
   |                         |                        |
   +-------------+-----------+------------------------+
                 |
          Supabase Postgres + RLS   ·   Redis   ·   private object storage
```

Three deployments, three blast radii, three cache strategies. A failed `apps/app`
release cannot take customer websites down.

### Target Architecture adds

```text
apps/api    public API — added when an extraction trigger fires (ADR 0001, T1–T5)
```

### Database roles — a security boundary, not a convention

```sql
-- apps/sites
CREATE ROLE zerocorp_sites LOGIN;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO zerocorp_sites;
```

`apps/sites` receives `SITES_DATABASE_URL` and never `DATABASE_URL`, and `withTenant()`
issues `SET LOCAL TRANSACTION READ ONLY`. A write from the public renderer fails at the
database with SQLSTATE 25006. Asserted in `tests/architecture/framework-freedom.test.ts`.

The exact hosting provider remains a deployment decision, not a domain-architecture
dependency.

---

## 24. Scalability Philosophy

Do not begin with microservices.

Start with:

> modular monolith + dedicated worker.

Split services only when a measurable constraint justifies it.

Triggers for reconsideration may include:

- independently scaling workload;
- security isolation;
- deployment isolation;
- cost optimization;
- team ownership boundaries;
- provider limits.

---

## 25. Performance Rules

Priorities:

1. fast perceived UI;
2. server-side rendering where beneficial;
3. cache stable data;
4. paginate large datasets;
5. index query paths;
6. move long-running work out of request/response;
7. optimize images;
8. avoid unnecessary client-side JavaScript.

No premature micro-optimization.

Measure before changing architecture for performance.

---

## 26. Architecture Decision Record (ADR)

Every structural decision that may matter later should be documented.

Example:

```text
docs/adr/0001-monorepo.md
docs/adr/0002-multi-tenancy.md
docs/adr/0003-site-renderer.md
docs/adr/0004-agent-abstraction.md
```

Each ADR should contain:

- context;
- decision;
- alternatives;
- consequences;
- date;
- status.

---

## 27. Non-Negotiable Architecture Principles

1. Multi-tenant by design.
2. Data over customer-specific code.
3. Modular monolith before microservices.
4. API contracts before ad hoc integrations.
5. Provider abstractions at external boundaries.
6. Structured AI outputs.
7. Business Brain as shared source of truth.
8. Immutable billing/usage records.
9. Auditable workflows.
10. Automated regression protection.
11. Design system controls visual output.
12. Claude Code may propose architecture changes but must not silently make structural decisions.

---

## 28. Open Decisions To Validate

Resolved since the first draft:

- **runtime topology and web/API separation** — [ADR 0001](./adr/0001-runtime-topology.md);
- **Fastify vs Express adapter** — moot; no NestJS application is deployed.

Still open, tracked in `OPEN_DECISIONS.md`:

- hosting topology and the exact Redis provider;
- the exact Supabase deployment model;
- the exact email infrastructure;
- the exact company-formation provider (and a mandatory second one);
- the exact agent runtime;
- identity verification strategy;
- data retention periods and backup/recovery policy;
- final production observability stack — and whether it needs a `packages/observability`;
- where i18n lives, given that all user-facing strings must be localizable;
- design-system token values, which block all UI work.

---

## 29. Boundary Enforcement

The non-negotiables from [ADR 0001](./adr/0001-runtime-topology.md), and the mechanism
that enforces each. **None of these relies on review.** They are the reason Option C
survives to V2/V3 without a structural rewrite.

| | Rule | Mechanism |
|---|---|---|
| **NN-1** | `packages/domain` and `packages/application` import no framework, no Node built-in, no infrastructure package | pnpm isolated `node_modules` — an undeclared dependency is unresolvable · `tsconfig` `lib: ["ES2022"]`, `types: []` · `dependency-cruiser` · ESLint `no-restricted-imports` · `tests/architecture` |
| **NN-2** | `packages/db` exposes only `withTenant()`. Apps reach it only from `src/server/container.ts` | package.json `exports` maps only `"."`, so subpaths are unresolvable · `dependency-cruiser` `db-is-reached-only-from-composition-roots` · ESLint |
| **NN-3** | Cross-tenant isolation tests are release-blocking | `pnpm test` in CI; the suite prints a loud warning when `TEST_DATABASE_URL` is absent rather than passing silently |
| **NN-4** | HTTP handlers stay thin: parse, authenticate, authorize, invoke a use case, serialize. Business logic never lives in an HTTP handler, a Server Component or a Server Action | `dependency-cruiser` · ESLint · review |
| **NN-5** | `packages/contracts` types everything crossing a boundary | present since the scaffold commit |
| **NN-6** | `apps/api` is the public API, never a BFF for `apps/app` | `dependency-cruiser` `apps-never-import-each-other` · ADR 0001 |

### Commands

```bash
pnpm typecheck     # 19 projects, layered via tsconfig references
pnpm lint          # ESLint, second net over the module graph
pnpm boundaries    # dependency-cruiser — the executable form of NN-1, NN-2, NN-6
pnpm test          # includes the tenant-isolation gate (NN-3)
pnpm verify        # all four, in order — what CI runs
```

### Verifying the guardrails themselves

The rules were validated by introducing four deliberate violations and confirming each
was rejected:

| Violation | Rejected by |
|---|---|
| `packages/domain` imports `next/server` | TypeScript (unresolvable) · dependency-cruiser · ESLint |
| `packages/application` imports `@zerocorp/db` | pnpm (undeclared) · dependency-cruiser · ESLint |
| `apps/app/src/app/*` imports `@zerocorp/db` | dependency-cruiser · ESLint |
| any module imports `@zerocorp/db/internal/client` | package `exports` (unresolvable) · dependency-cruiser |

Re-run that check whenever a boundary rule is edited. A guardrail nobody has seen fail is
a guardrail nobody knows works.

---
