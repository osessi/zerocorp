# ADR 0001 — Runtime topology

| | |
|---|---|
| **Status** | **Accepted** |
| **Date** | 2026-08-30 |
| **Deciders** | Olivier Kakpo (product owner) |
| **Supersedes** | The implicit NestJS decision in `ARCHITECTURE.md` §2 (never formally decided) |
| **Resolves** | `OPEN_DECISIONS.md` D1 |
| **Applies to** | Repository structure, deployment topology, layer boundaries |

---

## Context

`ARCHITECTURE.md` §2 specified three runtimes — `apps/web` (Next.js), `apps/api`
(NestJS + Fastify) and `apps/worker`. `PRODUCT_VISION.md` §34 specified two —
`apps/web` and `apps/worker` — and never mentions NestJS anywhere in its 3,177 lines.
`CLAUDE_CODE_RULES.md` §8 then locked NestJS in ("do not silently replace NestJS").

A structural decision had become irreversible without ever having been made.

The decision criterion set by the product owner was explicit and is not "time to V1":

> A long-term target architecture that avoids a structural rewrite in V2/V3.

---

## Decision drivers

Three causes produce a structural rewrite. Everything else is an addition.

| | Cause | Meaning |
|---|---|---|
| **C1** | Layer erosion | Business logic ended up inside adapters |
| **C2** | God-service | One application absorbed incompatible responsibilities |
| **C3** | Blast radius | Two workloads with opposite profiles share a deployment |

---

## Options considered

### Option A — `web` + `api` (NestJS) + `worker`

Rejected.

- **C2 is a real risk.** `apps/api` at V1 would be ~90% a BFF for ZeroCorp's own
  back-office. Its claimed readiness for a public API is largely illusory: an internal
  BFF and a public API are different products — one is shaped by our screens and
  changes with every UI release, the other is resource-oriented, versioned,
  rate-limited and key-authenticated. Conflating them either contaminates the internal
  API or forces a second application later, at which point the "readiness" bought
  nothing.
- Costs a third runtime, a duplicated authentication surface, and an HTTP contract
  between two of our own applications.
- Contradicts `PRODUCT_VISION.md` §34 (modular monolith first) and §65 (do not
  prematurely build microservices or custom infrastructure).
- **C3 remains unaddressed.**

### Option B — `web` + `worker`

Rejected.

- Sound and fast, and correctly avoids C2.
- **C3 remains unaddressed**: tenant websites and the authenticated back-office would
  share one deployment.

### Option C — `sites` + `app` + `worker` — **ACCEPTED**

Splits by trust boundary and traffic profile rather than by frontend/backend.

---

## Decision

```text
apps/sites     Next.js  ·  tenant websites  ·  anonymous  ·  edge-cached  ·  DB read-only
apps/app       Next.js  ·  back-office + admin console  ·  authenticated
apps/worker    Inngest  ·  jobs, workflows, agents

apps/api       public API / mobile / partners  ·  ADDED ON TRIGGER, never as an internal BFF
```

All business logic lives in `packages/domain` and `packages/application`, which depend
on no framework. Every application is a thin adapter over the same use cases.

### Why C

1. **It is the only starting point whose path to the V3 target contains no structural
   rewrite** — only additions.
2. **It addresses C3**, the most probable and most expensive rewrite, which both A and B
   leave open. Today a failed back-office deploy would take down 500 customer websites.
3. **It avoids C2** by refusing to conflate an internal BFF with a public API.
4. **It costs the same number of runtimes as A** without A's costs: no internal HTTP
   hop, no duplicated authentication, no internal contract to maintain.
5. **It adds a security property neither alternative offers**: `apps/sites` runs against
   a read-only PostgreSQL role, and `withTenant()` issues
   `SET LOCAL TRANSACTION READ ONLY`. A write from the public renderer fails at the
   database, structurally, regardless of what the code attempts.

### What was explicitly reconsidered

An earlier argument — "an HTTP hop on every page render of every customer site" —
**was wrong** and is recorded here so it is not reused. Tenant sites render with ISR and
tag-based revalidation, not per-request SSR. Cache hit rate exceeds 99%; the database is
reached on cache miss only. Multi-tenant rendering performance does **not** distinguish
these options.

---

## Consequences

### Positive

- Zero structural rewrites projected to V3.
- Independent blast radius, cache strategy and deploy cadence for customer sites.
- Physical read-only enforcement on the public renderer.
- `apps/api` can be added later by importing the same use cases.
- Domain and application layers survive a Next.js replacement untouched.

### Negative — accepted knowingly

- Three deployments from day one instead of two (~2–3 days of extra setup).
- Two Next.js applications to keep coherent — mitigated by shared `packages/ui` and
  `packages/design-system`.
- **No process-level security boundary between the applications and the database.**
  This is the one thing Option A would have given for free. It is replaced by NN-1 to
  NN-6 below, which are compiler and module-resolution guarantees rather than
  conventions — but they are guarantees we maintain, not guarantees we inherit.
- A backend engineer joining later onboards onto a layered monorepo rather than onto a
  conventional NestJS service.

---

## Non-negotiables

Option C is only valid while all six hold. They replace the wall NestJS would have
provided. Each is mechanically enforced; none relies on review.

| | Rule | Enforced by |
|---|---|---|
| **NN-1** | `packages/domain` and `packages/application` import no framework, no Node built-in and no infrastructure package | pnpm isolated `node_modules` (undeclared ⇒ unresolvable) · `tsconfig` `lib: ["ES2022"]`, `types: []` · `dependency-cruiser` · ESLint · `tests/architecture` |
| **NN-2** | `packages/db` exposes only `withTenant()`. The raw Drizzle client never leaves the package. Apps reach it only from `src/server/container.ts` | package.json `exports` maps only `"."` ⇒ subpaths unresolvable · `dependency-cruiser` · ESLint |
| **NN-3** | Cross-tenant isolation tests are release-blocking | `pnpm test` in CI; the suite reports loudly when skipped |
| **NN-4** | HTTP handlers stay thin: parse, authenticate, authorize, invoke a use case, serialize the result. Business logic never lives in an HTTP handler, a Server Component or a Server Action | `dependency-cruiser` (no db outside composition roots) · review |
| **NN-5** | `packages/contracts` exists from the first commit; everything crossing a boundary is typed there | present since this commit |
| **NN-6** | `apps/api`, when it arrives, is the **public API**. Never a BFF for `apps/app`. `apps/app` calls `packages/application` directly, for life | `dependency-cruiser` (`apps-never-import-each-other`) · this ADR |

---

## Extraction triggers for `apps/api`

`apps/api` is added when **any one** of these becomes true — not before.

| | Trigger |
|---|---|
| T1 | A mobile application is decided |
| T2 | A public API or a partner integration is sold |
| T3 | An enterprise client requires a programmatic contract |
| T4 | A second backend engineer joins |
| T5 | A function must scale independently for a measured reason |

### Procedure — addition, not migration

1. Create `apps/api`.
2. Each controller invokes the **same** use case from `packages/application` that the
   Next.js route handler invokes.
3. Generate the client from `packages/contracts`.
4. Version the public contract from day one; never reuse internal shapes verbatim.

`packages/domain`, `packages/application`, `packages/db`, `packages/contracts`, the
tests and the workflows do not change.

### Reverting to Option A

If a backend team later justifies a process boundary, the same procedure applies:
`apps/api` becomes NestJS, `apps/app` migrates route by route, both paths live side by
side during the cut-over. Estimated 2–4 weeks. Still an addition.

---

## Target Architecture vs Initial Deployment

This distinction is binding across all ZeroCorp documentation.

### Target Architecture

```text
apps/sites · apps/app · apps/worker · apps/api
packages/domain · application · contracts · db · tenancy · auth · billing · ai
         integrations · storage · notifications · security · config
         ui · design-system · site-renderer
```

### Initial Deployment / Current Topology

```text
apps/sites · apps/app · apps/worker
(apps/api NOT deployed — no trigger has fired)
```

The boundaries of the target architecture exist **now**. The components that carry no
value yet are **not** built now. A component absent from the current topology must still
be reachable by addition, never by rewrite.

---

## Related

- `docs/ARCHITECTURE.md` — Boundary enforcement, runtime topology
- `docs/CLAUDE_CODE_RULES.md` §8, Layer discipline
- `docs/OPEN_DECISIONS.md` — D1 (resolved by this ADR)
- `docs/diagrams/zerocorp-runtime.architecture.json` — the rendered topology
- `.dependency-cruiser.cjs` — the executable form of NN-1, NN-2 and NN-6
