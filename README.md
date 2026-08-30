# ZeroCorp

**Business Launch & Operating System** for founders and non-resident entrepreneurs.

> Tell us about your business. We build the foundation for you — then ZeroCorp helps run it.

A customer describes their business once. ZeroCorp creates the US company, builds the
digital foundation, keeps it running, and progressively automates its operations.

English-first · USD-first · international market · bootstrapped.

---

## This repository

Documentation only. **No application code exists yet.**

```text
CLAUDE.md                    instructions for Claude Code — read this first
docs/
├── README.md                documentation index and topic ownership map
├── OPEN_DECISIONS.md        contradictions, reversals, gaps — read before deciding
├── PRODUCT_VISION.md        vision, business model, pricing, ARR milestones
├── PRODUCT_SPEC.md          product scope, plans, journeys, V1 boundary
├── ARCHITECTURE.md          runtime, monorepo, providers, events, CI/CD
├── DATABASE.md              schema, tenancy, RLS, migrations, retention
├── DESIGN_SYSTEM.md         tokens, components, blocks, AI visual restrictions
├── CLAUDE_CODE_RULES.md     engineering constitution
├── diagrams/                architecture diagrams (Archify JSON IR)
└── archive/                 historical documents — never a specification
.claude/skills/archify/      Archify v2.16.0 (MIT) — diagram rendering and validation
```

---

## Documentation hierarchy

```text
CURRENT DOCUMENTATION   →  source of truth  →  implement this
ARCHIVED DOCUMENTATION  →  history only     →  never implement this
```

**When current documentation conflicts with archived documentation, current wins.**

Every document declares its status in a banner on line 1. Start at
[`docs/README.md`](docs/README.md).

---

## Before writing any code

Two decisions are still open and block implementation:

| | |
|---|---|
| **D1** | Runtime topology — NestJS API, or Next.js `web` + `worker` only? |
| **D-G6** | `DESIGN_SYSTEM.md` contains no token values, so the design rules are unenforceable |

Both are tracked in [`docs/OPEN_DECISIONS.md`](docs/OPEN_DECISIONS.md).

---

## Architecture diagrams

Rendered with [Archify](https://github.com/tt-a1i/archify) (MIT), vendored at
`.claude/skills/archify/`. The `.json` specifications are the source of truth; HTML
artifacts are generated and git-ignored.

```bash
cd .claude/skills/archify
node bin/archify.mjs deliver architecture \
  ../../../docs/diagrams/zerocorp-runtime.architecture.json \
  ../../../docs/diagrams/zerocorp-runtime.architecture.html --quality showcase --json
```

See [`docs/diagrams/README.md`](docs/diagrams/README.md).

Archify represents and verifies the architecture. It never decides it.
