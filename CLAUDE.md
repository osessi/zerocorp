# ZeroCorp — Project Instructions for Claude Code

ZeroCorp is a multi-tenant **Business Launch & Operating System**: a founder describes
their business once, and ZeroCorp builds the US company + digital foundation, keeps it
running, and progressively automates it.

English-first. USD-first. International market. Bootstrapped.

---

## 0. Documentation hierarchy — READ THIS FIRST

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

Every document declares its own status in a banner on line 1:

```text
> **STATUS: CURRENT**            → authoritative
> **STATUS: SUPERSEDED / ARCHIVED**  → historical only
```

If a file has no status banner, treat it as **not authoritative** and ask.

### Topic ownership

Each current document owns specific topics. The owning document wins on its own
topic, even against `PRODUCT_VISION.md`. The ownership map is in
[`docs/README.md`](./docs/README.md#1-current-source-of-truth).

### Disputed decisions

[`docs/OPEN_DECISIONS.md`](./docs/OPEN_DECISIONS.md) records contradictions between
documents and decisions reversed since v0.

> **Before making a structural decision, check `OPEN_DECISIONS.md`.
> If the topic is listed as unresolved, stop and ask — do not pick a side.**

---

## 1. Engineering constitution

The full engineering rules are in [`docs/CLAUDE_CODE_RULES.md`](./docs/CLAUDE_CODE_RULES.md).
It is binding. Read it before non-trivial work.

Core rule:

> **Build the system we designed, not the system you imagine.**

Condensed behavioural rules:

```text
You are implementing ZeroCorp, not redesigning it from scratch.

Do not invent product architecture when a documented pattern exists.
Do not create a new UI pattern when a canonical component exists.
Do not introduce arbitrary CSS values when design tokens exist.
Do not bypass the tenant context.
Do not call external providers directly from random modules.
Do not allow LLM output to bypass schemas.
Do not allow agents to execute privileged actions without explicit permission.
Do not store secrets in source code.
Do not log sensitive identity data.
Do not create customer-specific code forks.
Do not generate HTML as the source of truth for websites.
Use structured JSON + schema validation + component rendering.
Prefer simple, maintainable code over premature abstraction.
```

---

## 2. Reading order before implementing

```text
1. CLAUDE.md                    (this file)
2. docs/OPEN_DECISIONS.md       (is this topic disputed?)
3. docs/README.md               (which document owns this topic?)
4. the owning document
5. docs/DESIGN_SYSTEM.md       (any UI work — always)
6. docs/CLAUDE_CODE_RULES.md
7. existing code and tests for the affected modules
```

Only then write code.

---

## 3. Non-negotiable product invariants

1. **Multi-tenant by design.** Every tenant-owned query carries tenant context.
   RLS is a second barrier, never the only one.
2. **Sites are data, not code.** One renderer, one block registry. Never generate
   a per-customer application. Never let an LLM emit production HTML, React or CSS.
3. **The Business Brain is the upstream source of truth** for all generated output.
4. **AI composes the approved design system; it never invents it.**
5. **Every external provider sits behind an internal abstraction** and is replaceable.
6. **Money is integer minor units + currency.** Credit ledger and usage events are
   append-only. Balance is always derived, never stored as authoritative.
7. **Sensitive identity documents** live in a private bucket with short-lived signed
   URLs and access logs. Never in application logs.
8. **English-first and USD-first at launch; international by architecture.**
   All user-facing strings go through i18n from the first commit.

---

## 4. Design system — read before writing any UI

The full rules are in [`docs/DESIGN_SYSTEM.md`](./docs/DESIGN_SYSTEM.md) and
[`docs/CLAUDE_CODE_RULES.md`](./docs/CLAUDE_CODE_RULES.md) §43. Operational summary:

```text
Read DESIGN_SYSTEM.md before implementing UI.

Use ZeroCorp Design System tokens.
Never invent arbitrary colors, typography, spacing, radius or shadows.

Prefer Shadcn Studio. Compare alternatives when necessary.
Ask the product/design owner when the decision is genuinely ambiguous.

Reuse approved components. Do not create competing implementations.

Customer websites and ZeroCorp UI have separate theme systems.
```

### The locked identity

```text
Style    Lyra              Base    Base UI
Icons    Phosphor · 20px standard · Regular
Type     Geist Sans · Geist Mono for every comparable number
Radius   0px default · 2–4px only where a control truly needs it
Primary  #00786F           Spacing  4px scale, 16px central
Motion   100 / 150 / 200 / 250ms · no decorative bounce
```

Hierarchy comes from **borders, spacing and typography** — not shadows or gradients.

### Status markers

`DESIGN_SYSTEM.md` marks every value **VALIDATED**, **PROPOSED** or **TO VALIDATE**.
A **TO VALIDATE** value is not a gap to fill with a guess — stop and ask. Eight items
are still open; they are listed in `DESIGN_SYSTEM.md` §24.

### Licence gate

Nothing is copied into the repository before its licence is read and recorded. MIT and
Apache-2.0 are fine. Shadcn Studio is freemium — verify each block. Flaticon is **not**
open source. Never assume "open source" means "safe to embed in a resold SaaS".

---

## 5. Repository state

Documentation **and** the architecture scaffold. **No business features exist yet** —
that is deliberate (ADR 0001 step). Do not add product behaviour without an explicit ask.

```text
apps/sites · apps/app · apps/worker          the deployed topology
packages/  16 packages, layered L0 → L4      see ARCHITECTURE.md §3
tests/architecture · tests/tenant-isolation  NN-1, NN-2, NN-3, NN-6
docs/  README · OPEN_DECISIONS · adr/ · diagrams/ · archive/
```

### Layering — the short version

```text
apps/*                    thin adapters. Parse, authenticate, authorize,
                          invoke a use case, serialize. No business logic.
    ↓
packages/application      use cases, ports, transaction boundaries
    ↓
packages/domain           entities, invariants, state machines. Pure.
    ↑
packages/db · ai · integrations · storage · …    implement the ports
```

The six non-negotiables (NN-1 to NN-6) are in `docs/CLAUDE_CODE_RULES.md` §41 and
`docs/ARCHITECTURE.md` §29. They are enforced by the compiler, by module resolution and
by CI — not by review.

### Before claiming anything works

```bash
pnpm verify     # typecheck + lint + boundaries + tests, in that order
```

`apps/sites` is read-only against the database. `apps/api` is **not** deployed and, when
it arrives, is the public API — never a BFF for `apps/app`.

---

## 6. Git discipline

```text
Before meaningful modifications:  git status
After:                            git status && git diff
```

Never reset unrelated work, force-overwrite user work, or remove uncommitted changes
without explicit instruction. Deletions require explicit justification
(`docs/CLAUDE_CODE_RULES.md` §36, §37).
