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

## 2. Proposed Runtime Architecture

```text
                           ZERO CORP
                               |
            +------------------+------------------+
            |                  |                  |
         Next.js            NestJS API          Worker
        Web + SSR           Business API       Async jobs
            |                  |                  |
            +------------------+------------------+
                               |
                         Shared packages
                               |
        +----------+------------+------------+-------------+
        |          |            |            |             |
      Postgres   Redis        Storage      AI layer     Integrations
      + RLS                   private      providers      providers
                               |
                         Supabase / S3-like
```

### Application responsibilities

#### `apps/web`
Next.js App Router.

Owns:

- marketing site;
- authenticated customer application;
- onboarding UI;
- client back-office;
- block editor;
- public multi-tenant website rendering;
- notification center UI.

Next.js is the frontend framework. It is not the NestJS API.

#### `apps/api`
NestJS + TypeScript, preferably using the Fastify adapter.

Owns:

- authentication integration;
- authorization;
- tenant resolution;
- business-domain logic;
- CRUD and commands;
- provider orchestration;
- webhook ingestion;
- API validation;
- audit logging;
- billing/credit operations;
- generation requests;
- admin operations.

NestJS is explicitly a server-side application framework and is designed around modules, providers, guards, pipes, interceptors and testing. The official documentation supports Express and Fastify adapters.

#### `apps/worker`
Dedicated asynchronous execution process.

Owns:

- long-running jobs;
- scheduled workflows;
- AI generation;
- content generation;
- social publishing;
- email workflows;
- domain provisioning;
- website generation;
- agent execution;
- retries and backoff;
- reconciliation jobs.

Use Inngest as the workflow/job control plane rather than building a custom queue system first.

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
│   ├── web/
│   ├── api/
│   └── worker/
│
├── packages/
│   ├── ui/
│   ├── design-system/
│   ├── db/
│   ├── auth/
│   ├── config/
│   ├── contracts/
│   ├── i18n/
│   ├── domain/
│   ├── ai/
│   ├── billing/
│   ├── tenancy/
│   ├── observability/
│   ├── security/
│   ├── storage/
│   └── integrations/
│
├── docs/
│   ├── PRODUCT_VISION.md
│   ├── PRODUCT_SPEC.md
│   ├── ARCHITECTURE.md
│   ├── DATABASE.md
│   ├── DESIGN_SYSTEM.md
│   └── CLAUDE_CODE_RULES.md
│
├── tooling/
│   ├── scripts/
│   └── generators/
│
├── pnpm-workspace.yaml
├── turbo.json
├── package.json
└── pnpm-lock.yaml
```

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

Proposed domain modules:

```text
Identity
Tenancy
Business
CompanyFormation
Brand
Website
Content
Leads
Email
Social
CRM
Agents
Notifications
Billing
Credits
Domains
Documents
Admin
Analytics
```

The NestJS application should be structured with feature modules.

Example:

```text
apps/api/src/
├── app.module.ts
├── common/
├── modules/
│   ├── auth/
│   ├── tenants/
│   ├── business/
│   ├── formation/
│   ├── websites/
│   ├── content/
│   ├── leads/
│   ├── email/
│   ├── social/
│   ├── agents/
│   ├── notifications/
│   ├── billing/
│   ├── credits/
│   ├── domains/
│   ├── documents/
│   └── admin/
└── main.ts
```

NestJS recommends multiple modules to encapsulate related capabilities; each module should expose a deliberate public interface.

---

## 5. API Style

Use **REST + OpenAPI** for the initial API.

Reasons:

- clear contracts;
- easy debugging;
- external integration friendliness;
- strong tooling;
- simple browser/server boundary;
- easier future public API.

Every endpoint must define:

- authentication requirements;
- tenant scope;
- role/permission requirements;
- request schema;
- response schema;
- error contract;
- idempotency expectations where applicable.

Use DTOs and runtime validation at API boundaries.

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

Proposed:

```text
BillingProvider
FormationProvider
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

Suggested bootstrap topology:

```text
Cloudflare
   ↓
public domains / DNS / edge

Next.js
   ↓
web runtime

NestJS
   ↓
API runtime

Worker
   ↓
Inngest workflows

Supabase
   ├── Postgres
   ├── Auth
   └── Storage

Redis
   ↓
cache / rate limiting / ephemeral coordination
```

The exact hosting provider should remain a deployment decision, not a domain-architecture dependency.

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

Before implementation, explicitly review:

- hosting topology;
- exact Redis provider;
- exact Supabase deployment model;
- whether web/API domains are separated;
- REST client generation strategy;
- Fastify vs Express adapter;
- exact email infrastructure;
- exact company-formation provider;
- exact agent runtime;
- identity verification strategy;
- data retention periods;
- backup/recovery policy;
- final production observability stack.

