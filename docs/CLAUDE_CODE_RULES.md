> **STATUS: CURRENT**
>
> This document is part of the current ZeroCorp source of truth.
>
> **Owns:** engineering constitution for Claude Code: process, guardrails, regression strategy, decision protocol.
>
> When this document conflicts with anything under `docs/archive/`, **this document wins**.
> See [`docs/README.md`](./README.md) for the full documentation hierarchy and topic ownership map.
>
> Last reorganized: 2026-08-30

---

# ZeroCorp — Claude Code Rules v1

> This document is the engineering constitution for Claude Code working on ZeroCorp.
>
> The goal is not to make Claude Code slow. The goal is to prevent silent architectural drift, regressions, inconsistent UI, insecure changes and accidental destruction of previous work.

---

## 1. Mission

Claude Code is the implementation and engineering partner of ZeroCorp.

Claude Code must:

- understand before modifying;
- preserve existing work;
- follow approved architecture;
- follow the design system;
- reuse existing components;
- validate changes;
- detect regressions;
- surface uncertainty;
- propose structural changes before applying them.

Core rule:

> **Build the system we designed, not the system you imagine.**

---

## 2. Read Before Code

Before implementing a non-trivial task:

1. Read `CLAUDE.md`.
2. Read the relevant documentation.
3. Identify affected modules.
4. Inspect existing implementations.
5. Inspect related tests.
6. Determine dependencies and impact.
7. Only then modify code.

Do not start by creating new files because a new file “seems cleaner”.

---

## 3. Never Destroy Previous Work

Before changing a file:

- inspect its current contents;
- inspect recent changes when relevant;
- understand why existing code exists;
- preserve working behavior unless the specification explicitly changes it.

Never:

- overwrite large files blindly;
- replace an implementation with a simpler one without checking its dependencies;
- delete unrelated code;
- reset other work;
- remove a feature because it is inconvenient to implement the new feature.

Before concluding:

```text
git diff
```

must be inspected.

---

## 4. Change Impact Analysis

Whenever a file, component, database object or domain service changes, determine:

```text
Who imports it?
Who calls it?
Which routes use it?
Which workflows depend on it?
Which UI renders it?
Which data models depend on it?
Which tests cover it?
```

Then test the affected surface.

Do not assume a successful TypeScript compile proves a safe change.

---

## 5. Automated Guardrails

ZeroCorp must maintain an automated verification layer.

At minimum:

```text
TypeScript typecheck
ESLint
Unit tests
Integration tests
Build
Database migration validation
API contract validation
Tenant isolation tests
End-to-end smoke tests
```

CI should fail on meaningful regressions.

---

## 6. Regression Strategy

### Layer 1 — Fast checks

Run after small changes:

```text
typecheck
lint
targeted unit tests
```

### Layer 2 — Feature checks

Run after a feature:

```text
affected unit tests
integration tests
API contract tests
targeted E2E tests
```

### Layer 3 — Release checks

Run before merge/release:

```text
full test suite
full build
migration validation
security checks
critical E2E flows
```

---

## 7. Protected Critical Journeys

Maintain automated coverage for:

```text
Signup
Payment
Tenant creation
Authentication
Onboarding
Business Brain creation
Website generation
Website publishing
Domain connection
Billing
Credits
Notifications
Admin operations
```

A regression in these flows is release-blocking.

---

## 8. Architecture Integrity

Do not silently:

- introduce microservices;
- add or remove an application under `apps/`;
- change the domain / application / infrastructure layering;
- replace Next.js;
- replace the worker runtime;
- replace Drizzle;
- replace the database model;
- bypass provider abstractions;
- bypass tenancy safeguards;
- change the event architecture;
- change billing semantics.

For structural proposals:

```text
Problem
Current architecture
Proposed change
Alternatives
Trade-offs
Impact
Migration plan
```

Then obtain human approval.

---

## 9. Design Integrity

Never invent a new visual language.

Before creating a UI component:

```text
1. Search existing approved component.
2. Search design-system primitives.
3. Search approved variants.
4. Reuse them if possible.
5. Create a new component only when necessary.
```

Never introduce arbitrary:

- colors;
- typography;
- spacing;
- radius;
- shadows;
- icons;
- animations.

The Design System is the visual source of truth. See §43 for the full
discipline: locked identity, component selection policy, licence gate, and the
separation between the ZeroCorp product UI and customer website themes.

---

## 10. Component Reuse

Prefer:

```text
existing component
>
approved primitive + variant
>
new component
```

If an approved `StatusBadge` exists, do not create a one-off badge.

If an approved `EmptyState` exists, reuse it.

If a pattern repeats, promote it into a reusable component.

---

## 11. No Arbitrary UI Hardcoding

Avoid:

```tsx
className="mt-[17px] bg-[#...]"
```

when the value should come from a token or component.

Use design tokens and approved variants.

---

## 12. Multi-Tenancy Is Non-Negotiable

Every tenant-owned data access must be tenant-scoped.

The code must never depend on RLS alone.

Rules:

```text
tenant context
→ authorization
→ tenant-scoped query
→ RLS
```

Tests must prove that Tenant A cannot read or mutate Tenant B data.

---

## 13. Security

Always apply least privilege.

Protect:

- identity documents;
- OAuth tokens;
- API keys;
- billing information;
- private files;
- admin functions.

Never log:

- passports;
- identity-document contents;
- access tokens;
- refresh tokens;
- API keys;
- passwords;
- secrets.

Use signed short-lived URLs for private files.

---

## 14. Input Validation

Every external boundary is untrusted.

Validate:

```text
HTTP requests
webhooks
query parameters
uploaded metadata
LLM outputs
third-party API responses
environment configuration
```

Use runtime schemas, preferably Zod where appropriate.

---

## 15. AI Safety and Reliability

Never trust an LLM as a database writer.

Required pipeline:

```text
LLM
↓
structured output
↓
schema validation
↓
business validation
↓
domain service
↓
database
```

AI cannot invent critical company facts.

Important business facts should come from approved Business Brain sources.

---

## 16. AI UI Safety

The model can select from:

```text
approved block types
approved variants
approved layouts
approved components
```

It cannot generate arbitrary frontend code.

---

## 17. Agent Permissions

Agents must use explicit tools.

Never give agents direct unrestricted access to the database.

Use:

```text
Agent
→ Tool
→ Domain service
→ Authorized operation
```

Each tool must define:

- input schema;
- permission requirements;
- tenant scope;
- side effects;
- audit behavior;
- usage/cost accounting.

---

## 18. External Providers

Do not scatter provider SDK calls throughout the codebase.

Use provider abstractions:

```text
BillingProvider
FormationProvider
EmailProvider
SocialProvider
DomainProvider
AIProvider
ImageProvider
IdentityProvider
StorageProvider
```

Provider implementations belong near integration boundaries.

---

## 19. Database Rules

Before changing the schema:

```text
Inspect usage
→ create migration
→ review RLS
→ review indexes
→ test
```

Never alter production schema manually.

Never introduce a mutable billing balance as authoritative state.

---

## 20. Money Rules

Never use floating-point numbers for money.

Use:

```text
integer minor units
+
currency
```

Billing events must be idempotent.

Credit ledger entries must be append-only.

---

## 21. Async Work

Do not perform long-running jobs inside normal HTTP requests when they can be asynchronous.

Use workflows/jobs for:

- AI generation;
- publication;
- email sequences;
- domain operations;
- company formation updates;
- heavy imports;
- agent runs.

All long-running workflows need:

- retries;
- backoff;
- idempotency;
- timeouts;
- observability;
- failure states.

---

## 22. Error Handling

Every important operation should model:

```text
loading
success
partial success
failure
retry
timeout
permission denied
```

Do not hide failures behind generic “done” UI.

Never fake success.

---

## 23. No Fake Implementations

Do not ship:

- fake integrations;
- hardcoded successful API results;
- placeholder production data;
- simulated Stripe success;
- pretend agent actions;
- fake lead delivery.

Mocks are acceptable in tests or explicitly defined development-only modes.

---

## 24. Internationalization

All user-facing strings must use i18n.

Default:

```text
en-US
USD
```

Do not hardcode English strings throughout the UI.

Do not hardcode US timezone/date formatting into business logic.

---

## 25. Accessibility

New UI must support:

- keyboard navigation;
- semantic HTML;
- focus states;
- accessible names;
- usable contrast;
- form labels;
- screen-reader-friendly status where relevant.

Accessibility regressions are real regressions.

---

## 26. Performance

Do not optimize blindly.

Prefer:

- correct server/client boundaries;
- caching;
- pagination;
- indexed queries;
- lazy loading;
- optimized images;
- async processing.

Measure before major optimization.

---

## 27. Dependency Discipline

Before adding a dependency:

1. Search existing packages.
2. Check whether native platform functionality is enough.
3. Check maintenance status.
4. Check license.
5. Check bundle/runtime impact.
6. Check security history where appropriate.

Avoid adding a dependency for trivial functionality.

---

## 28. Open Source License Rules

Do not copy AGPL code into the core proprietary application without explicit legal review.

For external packages, record:

```text
package
version
license
purpose
usage model
review date
```

Licenses must be rechecked at integration time.

---

## 29. Notifications

Notifications should derive from explicit events or activity.

Do not duplicate product logic inside email/Telegram templates.

A daily digest should consume recorded activity.

---

## 30. Logging and Observability

Important operations should be traceable by:

```text
request_id
tenant_id
actor
operation
duration
provider
cost
result
error
```

Do not put sensitive data in logs.

---

## 31. Documentation Synchronization

If architecture changes:

```text
code
+
docs
+
tests
```

must evolve together.

Never leave architecture documentation describing code that no longer exists.

---

## 32. Tests Must Protect Existing Functionality

When adding a feature:

```text
new tests
+
existing related tests
```

When changing a shared component:

```text
component tests
+
all affected product surface tests
```

When changing a shared database service:

```text
service tests
+
tenant isolation tests
+
affected feature tests
```

---

## 33. Pre-Change and Post-Change Checkpoints

For meaningful changes:

### Before

Record:

```text
Current behavior
Files/modules affected
Tests that should remain green
Potential risk
```

### After

Verify:

```text
Behavior still works
No unrelated regressions
Diff is intentional
Tests pass
Build passes
```

---

## 34. Safe Refactoring

Refactor incrementally.

Avoid:

```text
large rewrite
+
new feature
+
schema migration
+
provider change
```

in one uncontrolled change.

Separate architectural changes from feature behavior where possible.

---

## 35. Claude Code Decision Protocol

When ambiguity exists:

### Low-risk local decision

Claude may proceed if:

- it follows existing patterns;
- no product behavior changes;
- no architecture changes;
- no security implications.

### Medium-risk decision

Claude should explain the choice and proceed only if the project rules already define the pattern.

### High-risk decision

Claude must stop and present:

```text
issue
options
recommended choice
trade-offs
impact
```

High-risk examples:

- architecture;
- security;
- tenancy;
- billing;
- database destruction;
- provider replacement;
- permission model;
- major UX behavior;
- legal/compliance behavior.

---

## 36. Never Silently Remove Features

Before deleting something, verify:

```text
Is it referenced?
Is it documented?
Is it user-facing?
Is it required by a previous feature?
Is it part of a migration?
```

Deletions require explicit justification.

---

## 37. Git Discipline

Before meaningful modifications:

```text
git status
```

After:

```text
git diff
git status
```

Never:

- reset unrelated work;
- force overwrite user work;
- remove uncommitted changes without explicit instruction.

---

## 38. Definition of Done

A feature is not done because it compiles.

Definition of done:

```text
Implemented
+
typed
+
tested
+
validated
+
tenant-safe
+
accessible
+
design-system compliant
+
observable
+
documented where necessary
+
no unintended regressions
```

---

## 39. Documentation Hierarchy — CURRENT vs ARCHIVED

The repository contains two classes of documentation. They are not equal.

```text
CURRENT DOCUMENTATION          →  source of truth  →  implement this
ARCHIVED DOCUMENTATION         →  history only     →  never implement this
```

### Current source of truth

```text
docs/PRODUCT_VISION.md
docs/PRODUCT_SPEC.md
docs/ARCHITECTURE.md
docs/DATABASE.md
docs/DESIGN_SYSTEM.md
docs/CLAUDE_CODE_RULES.md
```

### Archived

```text
docs/archive/**
```

### Non-negotiable rules

> **Archived documentation must never be treated as current product, architecture,
> database or engineering specifications.**

> **When current documentation conflicts with archived documentation,
> current documentation always wins.**

Archived documents may be read to understand *why* a past decision was made.
They may **never** be cited to justify what to build.

Every document declares its status in a banner on line 1:

```text
> **STATUS: CURRENT**                 → authoritative
> **STATUS: SUPERSEDED / ARCHIVED**   → historical only
```

A file with no status banner is **not authoritative**. Ask before relying on it.

### Topic ownership

Each current document owns specific topics, and the owning document wins on its own
topic — even against `PRODUCT_VISION.md`. The ownership map is in `docs/README.md`.

### Disputed decisions

`docs/OPEN_DECISIONS.md` records contradictions between current documents, decisions
reversed since v0, and knowledge that exists only in the archive.

> **Before making a structural decision, check `docs/OPEN_DECISIONS.md`.
> If the topic is listed as unresolved in Part A, stop and ask. Do not pick a side.**

---

## 40. Documentation Maintenance — the docs are living, not frozen

Preserving content does **not** mean freezing it. Out-of-date documentation is worse
than no documentation, because Claude Code will implement it.

The archive is frozen. **The current documents are maintained.**

### When a documented decision changes

Whenever a decision changes — in conversation, in code, or because reality proved the
document wrong — the owning document must be updated. Never leave a current document
describing a decision that is no longer true (`CLAUDE_CODE_RULES.md` §31).

### Detection duty

Claude Code must actively notice drift, not wait to be told. Raise it when:

- an implementation decision differs from what the owning document says;
- the human approves something in conversation that contradicts a current document;
- code is written that a current document does not describe;
- a Part A contradiction in `OPEN_DECISIONS.md` gets resolved;
- a Part C item is promoted out of the archive;
- a vendor fact in `PRODUCT_VISION.md` §76 turns out to be stale.

### Update protocol

```text
1. Detect the drift.
2. Report it: what the document says, what is now true, why it changed.
3. Propose the exact edit — quote the current text and the replacement.
4. Ask for approval.
5. On approval, edit ONLY that section. Nothing else in the file.
6. Record the change in the document's change log where one exists,
   and in docs/OPEN_DECISIONS.md when it resolves or creates a decision.
7. Show the diff.
```

### Rules for the edit itself

- **Surgical only.** Change the section that is wrong. Never rewrite or reflow a
  document to apply one decision.
- **Never silently.** No documentation edit without explicit approval, with one
  exception below.
- **Never destructive.** Superseded reasoning that still has value moves to
  `docs/archive/` or `docs/OPEN_DECISIONS.md` Part B. It is not deleted.
- **Propagate.** If the change affects more than one document, list every affected
  document in the same proposal. Do not fix one and leave the others contradicting it.

### The one exception — no approval needed

Purely mechanical corrections that change no decision: a broken relative link, a wrong
section number in a cross-reference, a typo, a stale file path after a move. Make these
directly and mention them in the summary.

### Documentation and code evolve together

```text
code  +  docs  +  tests
```

A feature that contradicts its own specification is not done.

---
## 41. Layer Discipline

Decided in [ADR 0001](./adr/0001-runtime-topology.md). These six rules are what make the
architecture survive to V2/V3 without a structural rewrite. **None of them relies on you
remembering.** Each is enforced by the compiler, by module resolution, or by CI.

### The layering

```text
apps/sites · apps/app · apps/worker        thin adapters, framework-bound
        ↓
packages/application                        use cases, ports, transactions
        ↓
packages/domain                             entities, invariants, state machines
        ↑
packages/db · ai · integrations · storage · …   implement the ports
```

Dependencies point inward. Infrastructure depends on application; application never
depends on infrastructure.

### NN-1 — domain and application are framework-free

`packages/domain` and `packages/application` import no framework, no Node built-in and no
infrastructure package. Anything non-deterministic — a clock, an id, a repository, an
HTTP call — is injected as a port.

Enforced by: pnpm isolated `node_modules` · `tsconfig` `lib: ["ES2022"]`, `types: []` ·
`dependency-cruiser` · ESLint · `tests/architecture/framework-freedom.test.ts`.

### NN-2 — one door to tenant data

`packages/db` exposes only `withTenant()`. The raw Drizzle client never leaves the
package. An application reaches it only from `src/server/container.ts`.

Enforced by: package.json `exports` mapping only `"."` · `dependency-cruiser` · ESLint.

### NN-3 — cross-tenant isolation is release-blocking

Every tenant-owned table gets a case proving tenant A cannot read, update or delete
tenant B's rows, and that a read-only context cannot write. The suite announces loudly
when it is skipped rather than passing silently.

### NN-4 — HTTP handlers stay thin

> **HTTP handlers must remain thin: parse, authenticate, authorize, invoke a use case,
> and serialize the result. Business logic must never live in HTTP handlers.**

This applies equally to route handlers, Server Components and Server Actions.

### NN-5 — contracts first

Everything crossing a boundary is typed in `packages/contracts`. This is what allows
`apps/api` to be generated later without reinventing a single contract.

### NN-6 — `apps/api` is the public API

When it arrives it serves mobile, partners and enterprise contracts, versioned and
rate-limited. It is **never** a BFF for `apps/app`, which calls `packages/application`
directly, for life.

### Before changing a boundary rule

Editing `.dependency-cruiser.cjs`, `eslint.config.mjs`, a package's `exports` field, or a
`tsconfig` `lib`/`types` entry is a structural change. It requires an ADR and human
approval — and afterwards, re-run the deliberate-violation check documented in
`ARCHITECTURE.md` §29. A guardrail nobody has seen fail is a guardrail nobody knows works.

---

## 42. Architecture Visualization — Archify

Archify is the official tool for **representing and verifying** ZeroCorp's architecture.

> **Archify never decides the architecture. It renders the architecture the current
> documentation decides.**

If a diagram and a current document disagree, the document is right and the diagram is
stale. Fix the diagram, never the decision.

### Where it lives

```text
.claude/skills/archify/     the skill (v2.16.0, MIT, project-level, committed)
docs/diagrams/*.json        typed JSON IR — the source of truth, committed
docs/diagrams/*.html        generated artifacts — git-ignored, regenerate on demand
```

### Rules

1. **The JSON IR is the source.** Never hand-edit generated HTML, and never commit it.
2. **A diagram is derived, never authoritative.** Every node, edge and boundary must
   trace to a current document. Do not draw a component that no document specifies.
3. **Mark disputed topology.** When a diagram renders something listed in
   `docs/OPEN_DECISIONS.md` Part A, say so on the artifact — a `tag` on the node and a
   card naming the decision ID.
4. **Structural proposals ship with a delta.** Before proposing a change covered by
   `CLAUDE_CODE_RULES.md` §8, produce an Architecture Delta so the human sees exactly
   what is added, removed, changed, moved and rerouted:

   ```bash
   node .claude/skills/archify/bin/archify.mjs compare architecture \
     docs/diagrams/<base>.json docs/diagrams/<head>.json \
     docs/diagrams/<name>.delta.html --quality showcase --json
   ```

5. **Showcase acceptance or nothing.** A delivered diagram must report 9/9 artifact
   checks, 0 composition errors and 0 warnings. Never describe a non-zero exit as success.
6. **Repair by diagnosis.** Fix only the diagnosed `subject` using `supportedFixes`.
   Prefer spacing and copy repairs over geometry overrides. Never delete a meaningful
   relationship label to satisfy geometry.
7. **Keep diagrams current.** When an architecture decision changes, the affected
   diagram is stale work — update it in the same change as the document
   (see §40).

### Commands

```bash
cd .claude/skills/archify
node bin/archify.mjs doctor                                   # health check
node bin/archify.mjs validate architecture <spec.json> --quality showcase --json
node bin/archify.mjs deliver  architecture <spec.json> <out.html> --quality showcase --json
node bin/archify.mjs visual-check <out.html> --json           # desktop containment evidence
node bin/archify.mjs guide "<scenario>" --json                # pick the diagram type
```

Types: `architecture`, `workflow`, `sequence`, `dataflow`, `lifecycle`.

---

## 43. Design System Discipline

`DESIGN_SYSTEM.md` owns every visual decision. This section is how Claude Code applies it.

> **Claude Code must never invent a visual language.**

### Read before writing UI

No component, screen or style is written before reading `DESIGN_SYSTEM.md`. Every value
there carries a status — **VALIDATED**, **PROPOSED** or **TO VALIDATE**. A **TO VALIDATE**
value is not a gap to fill with a guess. Stop and ask.

### The locked identity

```text
Style      Lyra
Base       Base UI
Icons      Phosphor · 20px standard · Regular weight
Type       Geist Sans · Geist Mono for all comparable numbers
Radius     0px default · 2–4px only where a control genuinely needs it
Primary    #00786F
Spacing    4px scale, 16px central
Motion     100 / 150 / 200 / 250ms · no decorative bounce
```

Never introduce an arbitrary colour, font size, spacing value, radius, shadow, icon set or
animation duration. If the value is not a token, it is a defect.

### Component selection — choose, do not obey a fixed list

The rule is not "always use component X". It is:

> **Choose the most appropriate implementation among the best available sources, while
> strictly respecting ZeroCorp's identity and constraints.**

Search order: **Shadcn Studio** → shadcn/ui official → a high-quality specialised registry
→ another serious source → a custom ZeroCorp component, only if nothing existing is good
enough.

**Search the approved sources before creating a new component.** Writing a bespoke
component when a good one exists is the failure this rule prevents.

Compare against the criteria in `DESIGN_SYSTEM.md` §18 before choosing: design quality,
accessibility, responsive behaviour, API ergonomics, customizability, performance, project
health, licence, stack compatibility, and consistency with Lyra and this system.

The chosen component may come from any registry, **but it must be adapted to ZeroCorp
tokens, spacing, typography, radius, iconography and motion before it is registered.**

### Licence gate — hard, before any code enters the repository

Record `name · source · version · licence · attribution requirement · modifications ·
owner · review date` (`PRODUCT_VISION.md` §12).

MIT and Apache-2.0 may be copied. Shadcn Studio is freemium — verify each block, not the
platform. Unverified registries stay unverified until read. Flaticon is **not** open
source; see `DESIGN_SYSTEM.md` §11. Never assume "open source" means "safe to embed in a
resold SaaS".

### No competing implementations

**Do not silently introduce a second implementation of an approved component.** If a
`StatusBadge` exists, every status uses it. If an approved component is genuinely
inadequate, say so and propose replacing it — do not add a rival beside it.

Repeated patterns get promoted into the shared component, not copied.

### Ask when the decision is genuinely ambiguous

Claude Code decides alone when one option is clearly superior. It **stops and asks** when
two or more options are genuinely equivalent, when the choice materially affects the
visual identity, when it creates a new important pattern, when nothing available is good
enough, when the component is exceptionally visible or structural, or when torn between
custom and third-party.

Format: `Option A / Option B / Option C`, then `Pros`, `Cons`, `Recommendation` — then wait.

### Pages are compositions, never copies

Full pages and dashboards are **not** lifted from a component library. References inspire;
the result is assembled from ZeroCorp layout, ZeroCorp tokens and approved components.
Copying another product's design mechanically is forbidden.

### Two systems, never merged

```text
ZeroCorp Product UI          apps/app  · packages/ui
Customer Website System      apps/sites · packages/site-renderer
```

**A customer website theme must never alter the ZeroCorp product UI design system.** The
customer never chooses ZeroCorp's interface colours. A tenant's brand appears in the
product only as content — a logo preview, a swatch, a site preview — never as chrome.

Conversely, `--radius: 0px` is a ZeroCorp signature, not a customer constraint. Customer
sites may be rounded.

The separation is enforced by the layer boundaries in `ARCHITECTURE.md` §29: `ui` and
`site-renderer` are separate packages and neither imports the other.

### Every component ships complete

```text
loading · empty · error · success · partial
desktop · tablet · mobile
visible focus · keyboard operation · accessible name · AA contrast
prefers-reduced-motion honoured
```

A component missing a state or a breakpoint is not done. Accessibility regressions are
release-blocking.

### Changing a VALIDATED value

Treated like an architecture change: problem, current value, proposal, alternatives,
trade-offs, impact — then approval. Never silently. §40 governs how the document is kept
current.

---

## 44. Golden Rules

> **Build the system we designed, not the system you imagine.**

> **Reuse before inventing.**

> **Validate before trusting.**

> **Isolate before scaling.**

> **Measure before optimizing.**

> **Protect previous work.**

> **Never silently change architecture.**

> **Never trade security for speed without an explicit decision.**

> **A green build is necessary, not sufficient.**

> **Current documentation wins. Archived documentation is history, never a spec.**

> **Keep the documentation true — propose the update, never let it drift silently.**

> **Never invent a visual language. Compose the approved one.**

> **Search the approved sources before writing a new component.**

