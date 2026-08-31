> **STATUS: CURRENT**
>
> This document is the ZeroCorp decision register.
>
> It records contradictions between documents, decisions reversed since v0, and
> knowledge that still exists only in the archive.
>
> **No decision in Part A has been resolved.** Claude Code must not pick a side
> on an unresolved item — stop and ask.
>
> Created: 2026-08-30 (documentation reorganization audit)

---

# ZeroCorp — Open Decisions & Contradiction Register

## How to read this document

| Part | Meaning | Action |
|---|---|---|
| **A** | Two *current* documents contradict each other | **Blocked** — needs a human decision |
| **B** | The archive and current documents disagree | **Resolved** — current wins, recorded for traceability |
| **C** | Valid knowledge that exists **only** in the archive | **Transfer candidate** — needs human approval to promote |
| **D** | Gap present in **both** archive and current documents | **Missing** — nothing to arbitrate, something to write |

---

# PART A — Unresolved contradictions between current documents

These must be decided before the corresponding code is written.

---

## D1 — Runtime topology ✅ RESOLVED

**Resolved 2026-08-30 by [ADR 0001](./adr/0001-runtime-topology.md) (Accepted).**

Neither of the two documented options was chosen. The contradiction exposed a third
risk that both left open — tenant websites and the authenticated back-office sharing one
deployment, so a failed back-office release would take 500 customer sites down.

**Decision: `apps/sites` + `apps/app` + `apps/worker`**, split by trust boundary and
traffic profile rather than by frontend/backend. `apps/api` is added only when an
extraction trigger fires, and is the **public** API — never an internal BFF.

The full analysis, the rejected options, the negative consequences, the six
non-negotiables and the migration path are in the ADR. See also `ARCHITECTURE.md` §2,
§23 and §29.

---

## D8 — Component build order ✅ RESOLVED 2026-08-31

**Question.** `DESIGN_SYSTEM.md` §17 names 52 components. Are they built breadth-first, or
on demand?

**Decision.** On demand. A component is implemented when a real screen requires it, with
the full pipeline each time (source → ZeroCorp adaptation → accessibility → tests →
visual review → registry). One exception: six primitives no screen can exist without are
built up front. `DESIGN_SYSTEM.md` §17 carries the tiers.

**Why.** Breadth-first is ~43 more sessions ending in a component library and no product,
and §24.8 blocks screen assembly regardless until the twelve dashboard patterns are
approved. The design system was the only thing progressing while `packages/*` held 14
single-file stubs and no business logic existed.

**Consequence.** The remaining §17 components are **deferred, not rejected**, and are no
longer treated as blocking. The quality bar does not move.

---

## D9 — Design source policy ✅ RESOLVED 2026-08-31

**Question.** `DESIGN_SYSTEM.md` §18 names Shadcn Studio as the primary source, but §2
resolved the primitive layer to Base UI. Shadcn Studio ships Tailwind blocks built on
Radix. Which wins?

**Decision.** Both, in different roles.

```text
Base UI          the official technical primitive     code
shadcn / Studio  structure, density, hierarchy        reference only
```

Their code is **not copied when the underlying primitive differs** — a Radix block
rewired to Base UI is a rewrite wearing someone else's licence, and §18's licence gate
applies before anything enters the repository.

**Consequence.** An external library that is not a primitive (calendar, chart, table
engine) is an explicit exception, licence-checked, and recorded in the §19 registry.

---

## D10 — Calendar and date picker ✅ RESOLVED 2026-08-31

**Decision.** `react-day-picker` 10.0.1 (MIT) as the engine, with a ZeroCorp wrapper.

Base UI has no calendar primitive and §2 forbids a silent second headless library, so
this is a recorded exception. It is a **date engine, not a design**: the wrapper owns
every visual, and it consumes the `Field` shell like any other control.

---

## D11 — Charts ✅ RESOLVED (engine) 🟠 BLOCKED (tokens) 2026-08-31

**Decision.** `recharts` 3.10.1 (MIT) as the engine, with a ZeroCorp wrapper and token
system.

**Still blocked.** `DESIGN_SYSTEM.md` §24.14 leaves series colours, axes, grid, empty and
loading states open. A chart library left to its own defaults decides the palette, which
is the inversion `CLAUDE_CODE_RULES.md` forbids. **Tokens first, then the wrapper.** No
chart ships before both.

---

## D12 — Data table ✅ RESOLVED 2026-08-31

**Decision.** `@tanstack/react-table` 9.2.4 (MIT) as the engine, ZeroCorp rendering.

Headless: it owns sorting, filtering, pagination, selection and column-sizing state and
renders nothing. The markup and every visual stay ours, which is why it does not conflict
with §18.

**Not settled by this.** §24.12 still owns row height, column widths, hover and click
target. The exploration pass measured sort buttons at 11px high — under WCAG 2.5.8.

---

## D13 — Drawer width ✅ RESOLVED 2026-08-31

**Decision.** Base UI `Drawer`. Width `min(40vw, 640px)` on desktop, `100vw` on mobile.

Closes the width half of `DESIGN_SYSTEM.md` §24.13. Motion is still open.

---

## D2 — Company formation state machine ✅ RESOLVED 2026-08-31

**The finding that unblocked it.** These were never three competing specifications.
`PRODUCT_VISION.md` §32 labels its own list *"Example formation"* and says *"the exact
state machine must reflect the actual provider and legal workflow; the principle is what
matters"*. So there was one spec (§21), one illustration (§32), and one archived
predecessor — and `DATABASE.md` declared **two** `status` columns while enumerating
neither.

**The real problem.** The nine-state list was one list trying to be two machines:
`draft → … → formed` describes the ORDER, `ein_issued → complete` describes the COMPANY.
Nobody could settle it because it had no single subject.

**Three gaps none of the three lists covered:**

| Gap | Why it matters |
|---|---|
| No rejected state | A state rejecting a filing is ordinary — a PO box as the agent address, a name already taken. A rejection had nowhere to go |
| EIN inside the order | An IRS filing, not a state filing, landing 2–6 weeks later and failing on its own. It held the order open for weeks after the company legally existed |
| No operator review | §21 says V1 is a manually assisted operator workflow. That review is where the work happens, and the state had been dropped |

**Decision — two machines plus a separate EIN track.**

```text
formation_orders.status   draft → collecting_documents → verifying_identity
                          → operator_review → ready_to_file → filed → formed
                          filed → rejected → collecting_documents    reparable
                          → cancelled, until filed                   terminal
companies.status          pending → active → delinquent → dissolved
ein_status                not_started → requested → issued
                          requested → rejected → requested           reparable
```

**Source of truth:** `packages/contracts/src/formation.ts` — the enums **and the allowed
transitions**. A union type stops a typo; it does not stop `formed → draft`.
`DATABASE.md` §5 documents the model. `PRODUCT_SPEC.md` §21 and `PRODUCT_VISION.md` §32
now reference it and keep their old lists marked as superseded, for traceability.

**Enforced mechanically.** 28 structural tests (no unreachable state, nothing leaves a
terminal state, no self-transition, the two enums share no name) plus a CI rule that
fails if any retired state string appears in the source.

> **That rule earned its place immediately.** The contradiction sweep found a fourth list
> hiding in a dashboard prototype and a screen filtering on `["complete", "ein_issued"]` —
> two states this decision retired. The count would have been silently wrong. Both now
> read from the contract.

---

## D3 — Website block taxonomy: three different lists 🟠

The block `type` field is a closed enum in the block registry
(`ARCHITECTURE.md` §9). It must have exactly one definition. It currently has three.

| Source | Count | Unique to this list |
|---|---|---|
| `PRODUCT_VISION.md` §10.1 | 20 | `About`, `Logos / trust strip`, `Results / statistics`, `Featured content`, `Lead capture / quote form` |
| `PRODUCT_SPEC.md` §12 | 16 | — (subset) |
| `DESIGN_SYSTEM.md` §38 | 20 | `Quote`, `Form`, `Article Highlight`, `Logo Cloud`, `Stats` |

Naming also diverges for what appear to be the same blocks
(`Logos / trust strip` vs `Logo Cloud`; `Results / statistics` vs `Stats`;
`Featured content` vs `Article Highlight`).

**Recommendation (not applied):** `DESIGN_SYSTEM.md` owns the block taxonomy per the
ownership map. Freeze the enum there, and reduce the other two documents to a
reference. Slugs should be code-shaped (`logo_cloud`, `stats`, `article_highlight`).

---

## D4 — Hero variant enum: two different lists 🟠

| Source | Variants |
|---|---|
| `PRODUCT_VISION.md` §10.2 | `centered, split image, split product, video, editorial, large type, dark cinematic, minimal, proof-first, conversion-first` |
| `DESIGN_SYSTEM.md` §39 | `centered, split, image-right, image-left, product, minimal, editorial, conversion, video, dark` |

Same problem as D3: `allowedVariants` is a validated enum in the registry
(`ARCHITECTURE.md` §9). Two lists means the schema cannot be written.

**Recommendation (not applied):** `DESIGN_SYSTEM.md` owns it.

---

## D5 — ARPA and ARR customer math disagree 🟡

| Source | Assumed ARPA | $100k ARR | $1M ARR |
|---|---|---|---|
| `PRODUCT_VISION.md` §6 (mixed scenario) | $259/mo | ~33 customers | ~322 customers |
| `PRODUCT_VISION.md` §6 (milestone table) | — | 30–50 | 300–500 |
| `PRODUCT_SPEC.md` §24 | ~$300/mo | ~28 customers | ~278 customers |

Three sets of numbers for the same milestones. These figures drive the whole plan
(how many customers, therefore what acquisition rate, therefore whether the 12-month
target is reachable).

**Recommendation (not applied):** compute this once in `PRODUCT_VISION.md` from a
single stated plan mix, and have `PRODUCT_SPEC.md` link to it rather than restate it.

---

## D6 — `sites` and `domains` both own the hostname 🟡

`DATABASE.md` §6 gives `sites` the columns `domain`, `subdomain`, `ssl_status`.
`DATABASE.md` §19 defines a separate `domains` table with `hostname`, `ssl_status`,
`dns_status`, `cloudflare_identifier`, and notes it "is separate from the `sites` table
if multiple hostnames … are expected".

Two tables own SSL state for the same hostname. This will drift in production.

**Recommendation (not applied):** `domains` owns hostname lifecycle and SSL/DNS state;
`sites` references a primary `domain_id`. Remove `domain`/`subdomain`/`ssl_status`
from `sites`.

---

## D7 — V1 scope: two incompatible definitions 🟠

| Source | V1 |
|---|---|
| `archive` §10 | **7 modules**, with per-module day estimates (2–5 days each, ~43 days total) |
| `PRODUCT_VISION.md` §47 | **17 "must ship" items**, no estimates |
| `PRODUCT_SPEC.md` | No explicit V1 must-ship list; §16 defines a V1 for leads that §47 does not include at all |

The current V1 is materially larger than the archived V1 and carries **no time
estimate of any kind**. There is no document in the repository from which the
feasibility of "$100k ARR as the first milestone" can be assessed.

**Recommendation (not applied):** `PRODUCT_SPEC.md` should own a single V1 scope table
with an owner and a rough estimate per line, and `PRODUCT_VISION.md` §47 should
reference it.

---

# PART B — Decisions reversed since v0 (current wins, recorded for traceability)

These are **not** open questions. They are recorded so the change is visible and
nobody re-litigates them from the archive.

| # | Topic | v0 (archive) | Current | Where |
|---|---|---|---|---|
| B1 | **Pricing** | $997 + **$99/mo, single tier** | $997 + **$99 / $399 / $799** three tiers + usage credits | `PRODUCT_VISION.md` §0, §5 · `PRODUCT_SPEC.md` §3 |
| B2 | **Business framing** | "OS d'entreprise" whose site is one output | **Three layers**: Business Launch → Growth → Autopilot, optimized for ARPA | `PRODUCT_VISION.md` §3, §0 |
| B3 | **Agent runtime** | **Hermes Agent retenu**, one container per tenant | Hermes is *one candidate* behind a `AgentRuntime` abstraction; runtime is an **open decision** | `ARCHITECTURE.md` §13, §28 · `PRODUCT_VISION.md` §27 |
| B4 | **Email sending stack** | **Postal (MIT) chosen**; Listmonk and Mautic evaluated and rejected | No provider named; "exact email infrastructure" is an **open decision** | `ARCHITECTURE.md` §28 |
| B5 | **Block system** | ~20 blocks, **no variant concept** | Blocks **+ approved variants** (~10 per mature block); start with 12 at high quality | `PRODUCT_VISION.md` §10 · `DESIGN_SYSTEM.md` §39 |
| B6 | **Business profile** | `brand_profiles`, flat table | **Business Brain**, first-class entity with `source_value` / `inferred_value` / `approved_value` / `confidence`, versioned and approval-gated | `PRODUCT_VISION.md` §8.2 · `DATABASE.md` §4 |
| B7 | **Content volume** | "N articles/day", publication automatic | High volume is **generation capacity, not a publishing target**; quality gates decide publication | `PRODUCT_VISION.md` §19 · `PRODUCT_SPEC.md` §14 |
| B8 | **`leads` tenancy** | `leads` keyed by `list_id` only | `leads` carries `tenant_id` directly | `DATABASE.md` §10 *(already documented in-place)* |
| B9 | **Website publishing** | `pages.content_json` mutated in place | Draft + **immutable published versions** (`page_versions`) with rollback | `ARCHITECTURE.md` §10 · `DATABASE.md` §6 |
| B10 | **Repository shape** | Single Next.js repo | **pnpm + Turborepo monorepo**, `apps/*` + `packages/*` | `ARCHITECTURE.md` §3 |
| B11 | **Runtime topology** | `apps/web` + `apps/worker` (v0) · then `apps/api` NestJS (never decided) | **`apps/sites` + `apps/app` + `apps/worker`**; `apps/api` is the public API, added on trigger | [ADR 0001](./adr/0001-runtime-topology.md) |
| B12 | **Business capability packages** | one top-level package per capability | capabilities are **modules inside** `packages/domain` and `packages/application` | `ARCHITECTURE.md` §4 |

---

# PART C — Knowledge that exists ONLY in the archive and is still valid

This is operational knowledge that was **not carried forward**. It is still correct and
still useful. Nothing has been moved — each item needs an explicit decision to promote.

## C1 — Cloudflare for SaaS operational gotchas 🔴 high value

`archive` §2 documents two facts that no current document mentions:

1. **Custom-hostname status webhooks are Enterprise-only** → poll every 30 s during
   onboarding.
2. **If the customer's domain is on Cloudflare and they enable the orange cloud, TLS
   breaks.** The archive calls this *"le bug de support numéro un"* and says to build
   detection and an explicit error message for it.

→ Belongs in `ARCHITECTURE.md` §39-equivalent, or a future `docs/DOMAINS.md`.

## C2 — Lead-generation compliance doctrine 🔴 high value

`archive` §6.8 states two rules that remove most of the legal exposure:

1. **Generic mailboxes only** (`contact@`, `info@`) in the delivered database — not
   personal data.
2. **Sending always originates from the customer's own domain**, never ZeroCorp's —
   ZeroCorp is processor, not controller.

Plus the analysis that this design holds under GDPR, CAN-SPAM and CASL simultaneously
because it is calibrated to the strictest regime.

Current documents have a `leads.consent_basis` column (`DATABASE.md` §10) and mention
"unsubscribe mechanisms" (`PRODUCT_SPEC.md` §17) — **but not the doctrine that makes
them coherent.**

→ Belongs in `PRODUCT_SPEC.md` §16 and a future `docs/SECURITY.md` or `docs/LEGAL.md`.

## C3 — Fraud posture and the Stripe existential risk 🔴 high value

`archive` §8 contains a full risk analysis absent from current documents:

- ZeroCorp has **no legal KYC obligation** (not a financial institution; the formation
  provider carries its own requirements).
- **The real risk is Stripe account closure**, not regulation. High ticket +
  international + monitored sector.
- Concrete dispositif: Radar always on; custom rule *card country ≠ IP country → review*;
  block after 3 failed attempts; **Stripe Identity (~$1.50) only on flagged orders**;
  manual review on country divergence. No separate KYC vendor in V1.
- Being able to *show this dispositif to Stripe* is what protects the account under review.

Current documents have `IdentityProvider` (`ARCHITECTURE.md` §15), "flagged payments"
in the admin console (`PRODUCT_VISION.md` §37) and "payment processor review" as an
external dependency (§49) — **but none of the reasoning or the concrete rules.**

→ Belongs in a future `docs/SECURITY.md`.

## C4 — Domain strategy: delegate, do not resell 🟠

`archive` §6.9: the customer buys the domain wherever they want, then **delegates
nameservers to ZeroCorp's Cloudflare account**. Zero integration, full DNS control.

Explicitly **do not resell domains**: ~$9–10 wholesale, $19–25 retail, and you inherit
renewal support. *"Le DNS est ce qui compte, parce que c'est lui qui décide de la
délivrabilité."* Registrar affiliate revenue is the no-work alternative.
Cloudflare Registrar sells at cost and forbids resale.

→ Belongs in `ARCHITECTURE.md` or a future `docs/DOMAINS.md`.

## C5 — Image model routing table 🟠

`archive` §4 gives concrete routing rules, not just "use cheaper models for simple tasks":

| Model class | Price/image | When |
|---|---|---|
| SDXL Turbo / FLUX Schnell | $0.0002–0.003 | daily volume |
| Z-Image Turbo / Qwen-Image | ~$0.01 | intermediate |
| Seedream 4.0 | $0.03 | polished visuals, **no faces** |
| Nano Banana Pro | $0.15 | **whenever people are depicted** |

Key rule: **Seedream is weak on faces — always route people to Nano Banana.** A few
cents more on ~10% of volume avoids the failed images that cause cancellations.
Also: do not self-host GPUs before 100 customers.

*(Vendor prices are launch-time verification items per `PRODUCT_VISION.md` §76.)*

→ Belongs in a future `docs/AI_ARCHITECTURE.md`.

## C6 — Signature approach and its legal rationale 🟠

`archive` §6.3: formation in practice needs checkboxes plus a **signature image**, not a
qualified electronic signature. Therefore: capture a finger/mouse-drawn signature during
onboarding, apply it to the required documents, and retain timestamp + IP + user-agent
as proof of consent. This keeps the entire journey on ZeroCorp's brand instead of
depending on the provider's email flow.

`DATABASE.md` §5 has the `signatures` table — **the rationale and the "no qualified
e-signature needed" analysis exist only in the archive.**

## C7 — Rejected-option rationale (why *not* X) 🟡

The archive records why alternatives were rejected. Current documents record only the
conclusion. Losing the reasoning means these get re-proposed:

| Rejected | Why (archive) |
|---|---|
| **Postiz** for social | AGPL network clause → copying its backend makes ZeroCorp a derivative work. Running it unmodified as a separate service is legally clean but adds a service to maintain for limited gain. (§6.6) |
| **Payload CMS** | Good MIT headless CMS, but its admin is built for *you*, not your customers — and you need a customer-facing block editor anyway. (§6.4) |
| **Twenty** CRM | Read it for the data model, do not integrate — AGPL + weight not worth it for a simple pipeline. (§6.11) |
| **Mautic** | GPL-3.0 and too heavy for V1. (§6.9) |
| **n8n** | Sustainable Use License restricts serving third parties — never put it at the core of a resold product. (§9) |
| **Prisma** (vs Drizzle) | Decisive reason: Drizzle queries read like SQL, so Claude Code produces correct code more often and a human can review it. With Prisma you debug an abstraction. (§4) |
| **Existing AI site generators** | None are multi-tenant in the required way; adapting costs more than building. (§6.4) |
| **Schema-per-tenant / DB-per-tenant** | Every future migration runs N times. Row + RLS provisions a tenant with one `INSERT`. (§3) |
| **Cron** (vs queue) | Collapses with 500 tenants publishing on their own schedules, with retries and rate limits. (§4) |

→ These belong in `docs/adr/` (`ARCHITECTURE.md` §26 already calls for ADRs).

## C8 — External clocks with concrete durations 🟠

`archive` §12 gives **durations**; `PRODUCT_VISION.md` §49 lists the same dependencies
**without durations**:

| Action | Lead time |
|---|---|
| Meta and TikTok OAuth app review | **2–6 weeks** |
| Stripe account verification | days to weeks |
| Buy sending domains + start warm-up | **2–3 weeks** |
| Prospect database construction | continuous |
| Formation-provider reseller account | **1–2 weeks** |

Also: **EIN for a non-resident takes weeks** (archive §7 says J+15 to J+45), and social
account creation is *"le point d'abandon le plus probable de tout le parcours."*

Without the durations, `PRODUCT_VISION.md` §49's rule — "never let engineering progress
hide a non-engineering dependency" — cannot actually be scheduled against.

## C9 — The six expensive mistakes 🟡

`archive` §13 is a compact checklist that has no current equivalent:

1. Generating code per customer. 2. Fixed templates instead of blocks.
3. Treating the brand profile as a text field. 4. Copying AGPL code into the app.
5. Launching agents without spend caps. 6. Filing OAuth requests late.

Items 1–5 are covered by current principles; **item 6 is only covered as a list, never
as a warning with consequences.**

---

# PART D — Gaps present in BOTH the archive and current documents

Nothing to arbitrate here. These are simply missing.

## D-G1 — Form 5472 / pro forma 1120 🔴 highest impact

A **US LLC owned by a non-resident** must file **Form 5472 plus a pro forma 1120**
annually. **Failure to file carries a $25,000 penalty.**

**This obligation appears nowhere in any ZeroCorp document.**

Two separate consequences:

1. **Liability** — selling US LLCs to non-residents without surfacing a $25k-penalty
   obligation is a reputational and legal exposure.
2. **Missed revenue** — this is the highest-willingness-to-pay recurring product in the
   category (competitors sell it at ~$500–1,500/year) and it has near-zero churn
   because it is mandatory, annually, for the life of the entity.

Adding an annual compliance package materially changes the ARR math in D5: it reduces
the number of customers needed for $1M ARR by roughly a third.

Current documents get close — `PRODUCT_VISION.md` §22 proposes a "compliance calendar"
and `PRODUCT_SPEC.md` §22 lists "annual report workflows / franchise-tax reminders" as
future — but the specific federal filing obligation is absent.

**Requires a US CPA partner, not code.**

## D-G2 — Abuse *through* the platform 🔴

Both documents analyse fraud *against* ZeroCorp (chargebacks). Neither analyses fraud
*through* ZeroCorp.

What the product bundles is, functionally, a fraud stack: an anonymous US entity + a
credible website + a domain + warmed outbound email infrastructure + a prospect
database + agents that write autonomously.

A handful of abusive tenants can trigger: Stripe account closure (already identified as
existential), **Cloudflare for SaaS suspension — which drops every customer site
simultaneously**, formation-provider termination, and blacklisted sending IPs that
destroy deliverability for every tenant at once.

Missing: an acceptable-use policy, prohibited-sector screening, human review of the
first published site, multi-account pattern detection, and a per-tenant kill switch.

## D-G3 — No acquisition plan, no CAC, no payback model 🔴

`PRODUCT_VISION.md` §20 defines content clusters and §56 names distribution as a moat
layer. But there is no acquisition channel plan, no CAC assumption, no payback period
model, and no affiliate/partner system in V1 — despite partnerships being named as a
moat and `DATABASE.md` §26 deferring `affiliate_attributions` to "future".

For a bootstrapped solo founder targeting $1M ARR in 12 months, the acquisition engine
is the binding constraint, not the code.

## D-G4 — No dates anywhere 🟠

The archive had per-module day estimates. Current documents have `PRODUCT_VISION.md`
§48 Phase 0–5 with **no durations at all**. Combined with D7, there is no artefact in
the repository against which the 12-month ambition can be tested.

## D-G5 — Single points of failure with no fallback 🟠

Three vendors can stop the business on any given day, and no document names a plan B:

- **Stripe** — no qualified backup processor (a merchant-of-record such as Paddle would
  also change VAT/sales-tax exposure).
- **The formation provider** — if it drops ZeroCorp, delivery stops entirely.
- **Cloudflare for SaaS** — one abuse incident and every customer domain goes down together.

`ARCHITECTURE.md` §15 gives provider *abstractions*, which is the right foundation, but
an abstraction with one implementation is not a fallback.

## D-G6 — Design system values 🟠 PARTIALLY RESOLVED

**Resolved 2026-08-31 for the ZeroCorp Product UI.** `DESIGN_SYSTEM.md` v2 now carries
concrete, marked values: visual direction (Lyra · Base UI · Phosphor · Geist), the full
light palette, the type scale, the 4px spacing scale, radius 0px, borders, motion
durations, icon sizes, layout and breakpoints. Every value is marked **VALIDATED**,
**PROPOSED** or **TO VALIDATE**, and a component selection policy plus a licence gate now
exist.

**Still open** — tracked in `DESIGN_SYSTEM.md` §24, and blocking:

**Resolved 2026-08-31:**

- **Semantic status colours** — `success #15803D · warning #B45309 · info #2563EB ·
  processing #00786F · destructive #DC2626`. All five measure 4.83–5.36:1 on white.
  One status system for the whole product.
- **Form control boundaries** — `--border #E5E5E5` stays decorative, `--input #949494` (3.03:1)
  identifies controls, `--ring #00786F` is the focus indicator.
- **Primitive layer** — Base UI. Not a conflict with shadcn: since July 2026 Base UI is
  shadcn/ui's default, Radix is not deprecated, and Shadcn Studio ships for both.

**Still open:**

| | Item | Blocks |
|---|---|---|
| 1 | **Dark mode values** — PROPOSED, need one review pass. Includes the four dark status variants | Dark mode |
| 2 | **Customer website art directions** — 6–8 curated directions do not exist | Every customer site. The remaining half of D-G6 |
| 3 | **Flaticon licence** — stock-licensed, not open source | Animated icons. Motion + Phosphor approved meanwhile |
| 4 | **Border hover in dark mode** — no value | Dark mode components |
| 5 | **`dashboard columns` and `editor widths`** — carried from v1, still without values | Dashboard grid, block editor |

---

## D-G7 — `docs/` documents promised but not written 🟡

`PRODUCT_VISION.md` §75 calls for 15 documents. Six exist. Missing:

```text
EVENTS.md · API_CONTRACTS.md · SECURITY.md · AI_ARCHITECTURE.md · AGENTS.md
BILLING_AND_USAGE.md · I18N.md · CONTENT_ENGINE.md · LICENSING.md · adr/
```

Several Part C items above have no home until these exist.

---

# Change log

| Date | Change |
|---|---|
| 2026-08-30 | Register created during documentation reorganization. 7 unresolved contradictions (Part A), 10 recorded reversals (Part B), 9 archive-only knowledge items (Part C), 7 gaps (Part D). No decision was changed. |
| 2026-08-30 | **D1 resolved** by ADR 0001 (Option C). Part A now holds 6 open contradictions. Part B gains B11 and B12. D-G6 (design-system token values) becomes the top remaining blocker. |
| 2026-08-31 | Status colours and form control boundaries **VALIDATED**. D-G6 open sub-items drop from 7 to 7 (two resolved, `--input` residual and layout widths added). |
| 2026-08-31 | **D-G6 partially resolved.** ZeroCorp Product UI tokens are now concrete in `DESIGN_SYSTEM.md` v2; seven sub-items remain open, including a WCAG 1.4.11 contrast finding on form controls and the Flaticon licence gate. **D3 and D4 remain open** — the new document restates the block and variant *counts* but does not freeze the canonical lists. |
