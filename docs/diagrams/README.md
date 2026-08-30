> **STATUS: CURRENT**
>
> Architecture diagrams. The `.json` specifications are the source of truth;
> the `.html` artifacts are generated and git-ignored.
>
> Governed by [`../CLAUDE_CODE_RULES.md`](../CLAUDE_CODE_RULES.md) §41.

---

# ZeroCorp — Architecture Diagrams

Rendered with [Archify](https://github.com/tt-a1i/archify) v2.16.0 (MIT), installed at
`.claude/skills/archify/`.

**Archify does not decide the architecture.** It renders and verifies the architecture
that the current documentation decides. If a diagram disagrees with a current document,
the document is right and the diagram is stale.

---

## Diagrams

| Specification | Renders | Source documents |
|---|---|---|
| `zerocorp-runtime.architecture.json` | Runtime topology **as documented today** | `ARCHITECTURE.md` §2, §7, §15, §23 · `DATABASE.md` §1 |
| `zerocorp-runtime.base.architecture.json` | The alternative topology in `PRODUCT_VISION.md` §34 | `PRODUCT_VISION.md` §34 |

Both exist because the runtime topology is **disputed** — see
[`../OPEN_DECISIONS.md`](../OPEN_DECISIONS.md) **D1**. Neither diagram resolves it.

---

## Regenerate

Everything below is generated. Nothing here is hand-edited.

```bash
cd .claude/skills/archify

# 1. Validate the specification (must be 9/9 checks, 0 errors, 0 warnings)
node bin/archify.mjs validate architecture \
  ../../../docs/diagrams/zerocorp-runtime.architecture.json --quality showcase --json

# 2. Deliver the artifact (freezes the spec, renders, checks, reports SHA-256)
node bin/archify.mjs deliver architecture \
  ../../../docs/diagrams/zerocorp-runtime.architecture.json \
  ../../../docs/diagrams/zerocorp-runtime.architecture.html --quality showcase --json

# 3. Collect desktop containment evidence (needs Chrome)
node bin/archify.mjs visual-check \
  ../../../docs/diagrams/zerocorp-runtime.architecture.html --json
```

Open `docs/diagrams/zerocorp-runtime.architecture.html` in a browser. It is a
self-contained page: theme switch, pan/zoom, search, focus, relationship tracing,
guided views, and PNG/SVG/WebM export.

---

## Architecture Delta — verify a structural change

This is the reason Archify is in the repository. It compares two validated snapshots and
emits a machine receipt of exactly what changed.

```bash
cd .claude/skills/archify
node bin/archify.mjs compare architecture \
  ../../../docs/diagrams/zerocorp-runtime.base.architecture.json \
  ../../../docs/diagrams/zerocorp-runtime.architecture.json \
  ../../../docs/diagrams/D1-runtime-topology.delta.html \
  --quality showcase --json
```

It reports added / removed / changed / moved / rerouted facts. It infers **no** impact,
risk or merge safety — that judgement stays with the human.

Per `CLAUDE_CODE_RULES.md` §41, any structural proposal under §8 ships with a delta.

---

## Authoring a new diagram

```bash
cd .claude/skills/archify
node bin/archify.mjs guide "<describe the scenario>" --json   # pick the type
node bin/archify.mjs examples                                  # see reference specs
```

Types: `architecture`, `workflow`, `sequence`, `dataflow`, `lifecycle`.

Read `.claude/skills/archify/SKILL.md` before authoring. Write the specification to
`docs/diagrams/<name>.<type>.json`, then validate → deliver → visual-check.

---

## Known limitation

Archify's **repository evidence** feature — clickable, revision-pinned links from a node
to the exact source lines — requires `meta.repository` with a public GitHub URL and a
40-character commit SHA. ZeroCorp has no GitHub remote yet, and the repository is
intended to be private, so `sources` are currently omitted from every specification.

Revisit if a public mirror ever exists.
