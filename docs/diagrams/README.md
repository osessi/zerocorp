> **STATUS: CURRENT**
>
> Architecture diagrams. The `.json` specifications are the source of truth;
> the `.html` artifacts are generated and git-ignored.
>
> Governed by [`../CLAUDE_CODE_RULES.md`](../CLAUDE_CODE_RULES.md) §42.

---

# ZeroCorp — Architecture Diagrams

Rendered with [Archify](https://github.com/tt-a1i/archify) v2.16.0 (MIT), vendored at
`.claude/skills/archify/`.

**Archify does not decide the architecture.** It renders and verifies the architecture
the current documentation decides. If a diagram disagrees with a current document, the
document is right and the diagram is stale.

---

## Specifications

| File | Renders | Status |
|---|---|---|
| `zerocorp-runtime.architecture.json` | **The decided topology** — `apps/sites` + `apps/app` + `apps/worker` over a framework-free core | **CURRENT** |
| `adr-0001-rejected-option-a.architecture.json` | Option A — `web` + NestJS `api` + `worker` | Rejected, kept for comparison |
| `adr-0001-rejected-option-b.architecture.json` | Option B — `web` + `worker` | Rejected, kept for comparison |

All three validate at showcase quality (9/9 artifact checks, 0 errors, 0 warnings). The
rejected options are preserved so the trade-off in
[ADR 0001](../adr/0001-runtime-topology.md) stays inspectable rather than being an
assertion in prose.

---

## Regenerate

```bash
cd .claude/skills/archify

node bin/archify.mjs validate architecture \
  ../../../docs/diagrams/zerocorp-runtime.architecture.json --quality showcase --json

node bin/archify.mjs deliver architecture \
  ../../../docs/diagrams/zerocorp-runtime.architecture.json \
  ../../../docs/diagrams/zerocorp-runtime.architecture.html --quality showcase --json

node bin/archify.mjs visual-check \
  ../../../docs/diagrams/zerocorp-runtime.architecture.html --json
```

Open the HTML in a browser: theme switch, pan/zoom, search, focus, relationship tracing,
three guided views, and PNG/SVG/WebM export.

CI validates every `*.architecture.json` on each push — a diagram that no longer
validates is stale documentation and fails the build.

---

## Architecture Delta — verify a structural change

The reason Archify is in this repository. It compares two validated snapshots and emits
a machine receipt of exactly what changed.

```bash
node bin/archify.mjs compare architecture \
  ../../../docs/diagrams/adr-0001-rejected-option-b.architecture.json \
  ../../../docs/diagrams/zerocorp-runtime.architecture.json \
  ../../../docs/diagrams/topology.delta.html --quality showcase --json
```

Reports added / removed / changed / moved / rerouted facts. It infers **no** impact, risk
or merge safety — that judgement stays with the human.

Per `CLAUDE_CODE_RULES.md` §42, any structural proposal under §8 ships with a delta.

---

## Authoring a new diagram

```bash
node bin/archify.mjs guide "<describe the scenario>" --json
node bin/archify.mjs examples
```

Types: `architecture`, `workflow`, `sequence`, `dataflow`, `lifecycle`.

Read `.claude/skills/archify/SKILL.md` first. Write to
`docs/diagrams/<name>.<type>.json`, then validate → deliver → visual-check.

Useful next diagrams, none of which exist yet:

- `lifecycle` — the company-formation state machine (blocked on `OPEN_DECISIONS.md` D2,
  which still has three conflicting versions)
- `dataflow` — the content pipeline from Business Brain to published article
- `sequence` — voice onboarding: capture → transcription → extraction → approval
- `workflow` — publish a website version, with the revalidation path

---

## Known limitation

Archify's **repository evidence** feature — clickable, revision-pinned links from a node
to exact source lines — requires `meta.repository` with a **public** GitHub URL and a
40-character commit SHA. `osessi/zerocorp` is private and stays private, so `sources` are
omitted from every specification.
