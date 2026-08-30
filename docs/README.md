> **STATUS: CURRENT**
>
> This document is the index of the ZeroCorp documentation.
> It defines which documents are authoritative and which are historical.
>
> Last reorganized: 2026-08-30

---

# ZeroCorp — Documentation Index

## Documentation hierarchy

```text
CURRENT DOCUMENTATION
        ↓
   source of truth
        ↓
   implement this

ARCHIVED DOCUMENTATION
        ↓
 historical reference only
        ↓
   never implement this
```

**Rule:** when current documentation conflicts with archived documentation,
**current documentation always wins.**

---

## 1. Current source of truth

These six documents are the authoritative specification of ZeroCorp.

| Document | Owns |
|---|---|
| [`PRODUCT_VISION.md`](./PRODUCT_VISION.md) | Vision, positioning, business model, pricing strategy, ARR milestones, roadmap phases, moat, success metrics |
| [`PRODUCT_SPEC.md`](./PRODUCT_SPEC.md) | Product scope, plan contents, customer journeys, module behaviour, V1 boundary, product metrics |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Runtime topology, monorepo layout, domain boundaries, API style, provider abstractions, events, CI/CD, deployment |
| [`DATABASE.md`](./DATABASE.md) | Schema, tenancy and RLS, identifiers, indexing, migrations, retention |
| [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) | Design tokens, foundations, product components, layout patterns, website block and variant system, AI visual restrictions |
| [`CLAUDE_CODE_RULES.md`](./CLAUDE_CODE_RULES.md) | Engineering constitution for Claude Code: process, guardrails, regression strategy, decision protocol |

### Precedence between current documents

`PRODUCT_VISION.md` is the master blueprint. The other five documents were derived
from it and are **more detailed and more recent** in their own domain.

Therefore:

```text
For a topic in the "Owns" column above
        ↓
the document that owns it wins
        ↓
even against PRODUCT_VISION.md
```

Example: `PRODUCT_VISION.md` and `ARCHITECTURE.md` describe the runtime differently.
`ARCHITECTURE.md` owns runtime topology, so it wins — but the divergence is
**material and unresolved**, and is recorded in [`OPEN_DECISIONS.md`](./OPEN_DECISIONS.md#d1).

---

## 2. Decision register

| Document | Purpose |
|---|---|
| [`OPEN_DECISIONS.md`](./OPEN_DECISIONS.md) | Contradictions between documents, decisions reversed since v0, and knowledge that still exists only in the archive. **Read before making a structural decision.** |

---

## 3. Archived documents

Everything under [`archive/`](./archive/) is **historical reference only**.

| Document | Status | Superseded by |
|---|---|---|
| [`archive/v0/CARTOGRAPHIE_PRODUIT_ARCHIVE.md`](./archive/v0/CARTOGRAPHIE_PRODUIT_ARCHIVE.md) | SUPERSEDED (2026-08-30) | The six current documents above |

Archived documents must **never** be treated as current product, architecture,
database, pricing or engineering specifications.

They remain valuable for:

- understanding *why* a past decision was made;
- recovering rationale that was not carried forward;
- auditing how the product thinking evolved.

They are **not** valid inputs to implementation.

---

## 4. Documents not yet written

`PRODUCT_VISION.md` §75 calls for the following additional documents.
They do **not** exist yet. Their absence is a known gap, not an oversight.

```text
docs/EVENTS.md
docs/API_CONTRACTS.md
docs/SECURITY.md
docs/AI_ARCHITECTURE.md
docs/AGENTS.md
docs/BILLING_AND_USAGE.md
docs/I18N.md
docs/CONTENT_ENGINE.md
docs/LICENSING.md
docs/adr/            (architecture decision records — see ARCHITECTURE.md §26)
```

Until a document exists, its topic is owned by the closest current document,
and open questions belong in [`OPEN_DECISIONS.md`](./OPEN_DECISIONS.md).

---

## 5. How to use this documentation

### Before implementing anything

```text
1. Read CLAUDE.md at the repository root.
2. Read OPEN_DECISIONS.md — check the topic is not disputed.
3. Read the current document that owns the topic.
4. Read CLAUDE_CODE_RULES.md.
5. Only then write code.
```

### Before changing a documented decision

A decision recorded in a current document may not be changed silently.
Follow the protocol in [`CLAUDE_CODE_RULES.md`](./CLAUDE_CODE_RULES.md) §8 and §35:
present problem, current state, proposal, alternatives, trade-offs, impact,
migration plan — then obtain human approval.

### When a document changes

Update the document, `OPEN_DECISIONS.md` if a dispute is resolved, and any
affected tests and code together. Never leave documentation describing a system
that no longer exists (`CLAUDE_CODE_RULES.md` §31).

---

## 6. Language

The product, platform and all customer-facing surfaces are **English-first, USD-first**
(`PRODUCT_VISION.md` §38, `PRODUCT_SPEC.md` §26).

All current documentation is written in English.
The archived v0 document is in French and is preserved in its original language.
