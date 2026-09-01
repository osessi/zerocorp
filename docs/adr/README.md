> **STATUS: CURRENT**
>
> Architecture Decision Records. An ADR is the only place a structural decision
> becomes official.
>
> Required by `ARCHITECTURE.md` §26 and `CLAUDE_CODE_RULES.md` §8.

---

# ZeroCorp — Architecture Decision Records

## Why ADRs exist here

ZeroCorp already lost a structural decision once: NestJS appeared in
`ARCHITECTURE.md`, was hardened into `CLAUDE_CODE_RULES.md` §8, and became
effectively irreversible without ever having been decided. `docs/OPEN_DECISIONS.md`
D1 recorded that contradiction; ADR 0001 resolved it.

An ADR prevents that from happening again. A decision that is not in an ADR is not a
decision — it is a preference someone wrote down.

---

## Index

| # | Title | Status | Date | Resolves |
|---|---|---|---|---|
| [0001](./0001-runtime-topology.md) | Runtime topology — `sites` + `app` + `worker`, `api` on trigger | **Accepted** | 2026-08-30 | `OPEN_DECISIONS.md` D1 |
| [0002](./0002-business-architect-contract.md) | The Business Architect contract — closed input, validated output | **Accepted** | 2026-09-01 | — |

---

## When an ADR is required

Write one before making the change, not after:

- runtime topology, deployment boundaries, adding or removing an application
- the layering rules, or any change to the non-negotiables
- the tenancy or authorization model
- billing or credit semantics
- replacing a framework, an ORM, a database or a core provider
- the agent runtime and its permission model
- anything `CLAUDE_CODE_RULES.md` §8 lists as "do not change silently"

Routine work does not need an ADR: adding a feature, a table, a use case, a component,
or a provider implementation behind an existing port.

---

## Format

Copy the shape of ADR 0001:

```text
Title
Metadata      status · date · deciders · supersedes · resolves · applies to
Context       what forced the decision
Drivers       the criteria, stated before the options
Options       every option considered, including the rejected ones and why
Decision      what we chose
Consequences  positive and negative — the negative section is mandatory
Non-negotiables  what must stay true for the decision to remain valid
Migration path   how we would reverse it
Related       documents, diagrams, and the executable form of the rules
```

Two rules learned from ADR 0001:

1. **Record reasoning that turned out to be wrong.** ADR 0001 documents an argument
   that was overstated, so it is not reused.
2. **State the negative consequences explicitly.** An ADR with only benefits is a pitch,
   not a decision.

## Status values

```text
Proposed     written, not yet decided
Accepted     in force
Superseded   replaced by a later ADR, which must be named
Deprecated   no longer relevant, not replaced
```

An accepted ADR is never edited to change its decision. It is superseded by a new one.
Numbers are sequential and never reused.
