> **STATUS: CURRENT**
>
> This document is part of the current ZeroCorp source of truth.
>
> **Owns:** design tokens, foundations, product components, layout patterns, website block and variant system, component selection policy, AI visual restrictions.
>
> When this document conflicts with anything under `docs/archive/`, **this document wins**.
> See [`docs/README.md`](./README.md) for the full documentation hierarchy and topic ownership map.
>
> Last updated: 2026-08-31 — visual direction locked

---

# ZeroCorp — Design System v2

## How to read this document

Every value carries a status. Nothing is ambiguous.

| Marker | Meaning |
|---|---|
| **VALIDATED** | Decided by the product/design owner. Implement exactly. Changing it needs approval. |
| **PROPOSED** | Claude Code's coherent proposal, derived from validated values. Usable, but flag it. |
| **TO VALIDATE** | Open. Do not guess — ask. |

A value with no marker inherits the status of its section heading.

---

## 1. Design philosophy

ZeroCorp must look like one intentional product.

**Target attributes** — VALIDATED

```text
Premium · Clear · Calm · Modern · Operational · Trustworthy · Intelligent · Human · Fast
```

**Explicitly avoided** — VALIDATED

```text
Noisy · Over-decorated · Generic AI SaaS · Dashboard clutter
Unnecessary gradients · Random glass effects · Visual inconsistency
```

The design system exists to prevent inconsistent screens, random component choices,
arbitrary spacing, duplicated patterns, AI-invented UI and visual drift.

> **Claude Code implements the approved system. It does not become the art director.**

### The hierarchy device

ZeroCorp builds hierarchy with **borders, spacing and typography** — not with shadows,
gradients or color washes. Sharp, clean, premium. A screen that needs a shadow to read
correctly is a screen with a spacing problem.

---

## 2. Visual direction — VALIDATED

```text
Style              Lyra
Component base     Base UI
Icon library       Phosphor
Type               Geist Sans · Geist Mono
Default radius     0px
Signature color    Teal #00786F
```

The visual signature is **sharp corners, a single teal accent, generous whitespace and
a neutral greyscale**. Nothing else competes for attention.

> ⚠️ **Base UI vs Radix — TO VALIDATE.** `Base UI` is the declared primitive base, while
> most shadcn distributions ship on Radix primitives. Before the first component is
> integrated, confirm which primitive layer the chosen Shadcn Studio components actually
> use. Mixing both is acceptable only if deliberate and recorded here — two headless
> libraries doing the same job is exactly the drift this document exists to prevent.

---

## 3. Source of truth — the five layers

```text
Tokens
  ↓
Foundations           buttons, inputs, overlays, feedback
  ↓
Product Components    the ZeroCorp-specific ones
  ↓
Patterns / Layouts
```

A fifth, **separate** layer governs public customer websites:

```text
Website Block System
```

Layers 1–4 are the **ZeroCorp Product UI**. Layer 5 is the **Customer Website** system.
They share the token *architecture*, never the token *values*. See §15 and §16.

---

## 4. Color tokens

### 4.1 Light mode — VALIDATED

| Token | Value | Use |
|---|---|---|
| `--background` | `#FFFFFF` | Page ground |
| `--foreground` | `#0A0A0A` | Primary text |
| `--primary` | `#00786F` | Primary actions, active state, brand |
| `--primary-foreground` | `#F0FDFA` | Text and icons on `--primary` |
| `--secondary` | `#F4F4F5` | Secondary surfaces and buttons |
| `--secondary-foreground` | `#18181B` | Text on `--secondary` |
| `--muted` | `#F5F5F5` | Low-emphasis surfaces |
| `--muted-foreground` | `#737373` | Low-emphasis text, help, placeholders |
| `--accent` | `#F5F5F5` | Hover surfaces, selected rows |
| `--border` | `#E5E5E5` | Dividers, card edges |
| `--input` | `#E5E5E5` | Form control borders |
| `--ring` | `#00786F` | Focus ring |
| `--destructive` | `#DC2626` | Destructive actions, errors |

> **Note — `--muted` and `--accent` are the same value (`#F5F5F5`).** That is workable but
> means the two roles are visually indistinguishable. If a hover state ever needs to read
> against a muted surface, `--accent` must diverge. Recorded, not changed.

### 4.2 Dark mode — PARTIALLY VALIDATED

| Token | Value | Status |
|---|---|---|
| `--border` | `#262626` | **VALIDATED** |
| `--ring` | `#00786F` | **VALIDATED** |
| `--background` | `#0A0A0A` | **PROPOSED** — mirrors the light `--foreground` |
| `--foreground` | `#FAFAFA` | **PROPOSED** |
| `--surface` | `#141414` | **PROPOSED** — cards |
| `--surface-elevated` | `#1C1C1C` | **PROPOSED** — popovers, dropdowns |
| `--secondary` | `#262626` | **PROPOSED** |
| `--secondary-foreground` | `#FAFAFA` | **PROPOSED** |
| `--muted` | `#262626` | **PROPOSED** |
| `--muted-foreground` | `#A3A3A3` | **PROPOSED** |
| `--accent` | `#262626` | **PROPOSED** |
| `--input` | `#2E2E2E` | **PROPOSED** |
| `--primary` | `#00786F` | **PROPOSED** — unchanged; see the contrast finding below |
| `--primary-foreground` | `#F0FDFA` | **PROPOSED** — unchanged |
| `--primary-emphasis` | `#2DD4BF` | **PROPOSED** — teal **text**, links and icons on dark only |
| `--destructive` | `#EF4444` | **PROPOSED** — `#DC2626` is too dark on `#0A0A0A` |

### 4.3 Semantic status colors — TO VALIDATE

`success`, `warning`, `info` and `processing` have no values yet. `--destructive` covers
danger. A status system spanning formation, payments, domains, email, social, agents,
content and CRM (§17) cannot be built without them.

**Do not invent these. Ask.**

### 4.4 Measured contrast

Computed against WCAG 2.1. Recorded so nobody re-derives them.

| Pair | Ratio | Verdict |
|---|---:|---|
| `#00786F` on `#FFFFFF` | **5.36:1** | AA normal text ✓ · AAA ✗ |
| `#F0FDFA` on `#00786F` | **5.16:1** | AA normal text ✓ |
| `#737373` on `#FFFFFF` | **4.74:1** | AA normal text ✓ (narrow margin) |
| `#DC2626` on `#FFFFFF` | **4.83:1** | AA normal text ✓ |
| `#E5E5E5` on `#FFFFFF` | **1.26:1** | dividers ✓ · **form control boundaries ✗** |
| `#00786F` on `#0A0A0A` | **3.69:1** | UI component ✓ · **text ✗** |
| `#DC2626` on `#0A0A0A` | **4.10:1** | UI component ✓ · **text ✗** |
| `#EF4444` on `#0A0A0A` | **5.26:1** | AA normal text ✓ |

#### 🔴 Finding — form control borders fail WCAG 1.4.11 — TO VALIDATE

`--input: #E5E5E5` on `#FFFFFF` measures **1.26:1**. WCAG 2.1 SC 1.4.11 (Non-text
Contrast) requires **3:1** for the visual boundary that identifies a user interface
component. A grey reaching 3:1 on white is approximately **`#959595`** — visually far
heavier than `#E5E5E5`, which would change the aesthetic.

Three honest options:

| | Option | Consequence |
|---|---|---|
| **A** | Darken `--input` to ≥ `#959595` for form controls only; keep `--border: #E5E5E5` for dividers and card edges | Compliant. Inputs read heavier — a real change to the Lyra look |
| **B** | Keep `#E5E5E5` and give inputs a filled ground (`#FAFAFA`) plus a persistent visible label | Preserves the aesthetic. `#FAFAFA` on `#FFFFFF` is ~1.05:1, so the fill alone does **not** satisfy 1.4.11 either |
| **C** | Accept the deviation and record it as a known accessibility debt |

**Recommendation: A, scoped to form controls only.** `--border` and `--input` are already
separate tokens precisely so they can diverge. This needs your decision — it visibly
changes every form in the product.

---

## 5. Typography — VALIDATED

```text
UI / Product     Geist Sans
Numbers / Data   Geist Mono
```

Geist ships under SIL OFL 1.1. **Geist Mono is mandatory** for any number a user might
compare or scan: amounts, credits, usage, IDs, dates in tables, token counts, costs.

### Scale

| Token | Size / Line height / Weight | Letter spacing |
|---|---|---|
| `display-xl` | 48 / 56 / 700 | −0.02em |
| `display-l` | 40 / 48 / 700 | −0.02em |
| `h1` | 36 / 44 / 700 | −0.02em |
| `h2` | 30 / 38 / 600 | −0.015em |
| `h3` | 24 / 32 / 600 | −0.015em |
| `h4` | 20 / 28 / 600 | 0 |
| `body-lg` | 18 / 28 / 400 | 0 |
| `body` | 16 / 24 / 400 | 0 |
| `body-sm` | 14 / 20 / 400 | 0 |
| `label` | 14 / 20 / 500 | 0 |
| `caption` | 12 / 16 / 500 | 0 |
| `overline` | 11 / 14 / 600 | 0.04em |

**No arbitrary font size may appear in product code.** Every size comes from this scale.

`display-xl` and `display-l` are marketing-surface sizes. Product screens start at `h1`.

> **i18n constraint.** French runs roughly 25% longer than English and German longer still.
> No layout may depend on a specific string length, and no fixed-height container may hold
> translatable text. This applies from the first component.

---

## 6. Spacing — VALIDATED

4px-based scale. `16px` is the central unit.

```text
4 · 8 · 12 · 16 · 20 · 24 · 32 · 40 · 48 · 64 · 80 · 96 · 128
```

| Range | Use |
|---|---|
| 2–4px | Micro adjustments only |
| 4–16px | Inside a component |
| 20–32px | Between groups and sections |
| 40–64px | Significant separation |
| 80–128px | Large marketing sections |

Always through tokens. Never invented per screen. `className="mt-[17px]"` is a defect.

---

## 7. Radius — VALIDATED

```text
--radius-none   0px      DEFAULT — everything, unless justified
--radius-xs     2px      exception
--radius-sm     4px      exception
```

**0px is the default and the signature.** 2px and 4px exist only where a control genuinely
needs to read as rounded — a pill-shaped status badge, an avatar, a circular icon button.

There is no `md`, `lg`, `pill` or `full` radius token. If something needs to be a circle,
it is a circle (`border-radius: 50%`) and that is a component decision, not a scale value.

Mixing radii inside one screen is a defect.

---

## 8. Shadows and elevation — VALIDATED

Default shadow:

```text
0px 1px 3px rgba(0, 0, 0, 0.10)
```

**The rule matters more than the value:**

- normal elements get **no shadow**;
- hierarchy comes from borders, spacing and typography;
- a subtle shadow for genuinely floating elements — dropdowns, popovers, tooltips;
- a stronger shadow **only** for modal overlays, if needed at all.

**Do not build five elevation levels.** Two is the target: `none` and `floating`. A third,
`overlay`, may exist for modals — **PROPOSED**, value not yet set.

---

## 9. Borders — VALIDATED

| State | Light | Dark |
|---|---|---|
| Default | `#E5E5E5` | `#262626` |
| Hover | `#D4D4D4` | **TO VALIDATE** |
| Focus | `#00786F` | `#00786F` |
| Destructive | `#DC2626` | `#EF4444` (PROPOSED) |

```text
Width  1px
Style  solid
```

Borders are the primary hierarchy device. There is no dashed or double border in this
system.

See the §4.4 finding before using `--input` on a form control.

---

## 10. Motion — VALIDATED

> **Use motion generously where it improves comprehension or feedback, but keep it subtle,
> fast and intentional. No decorative bounce.**

### Durations

```text
fast       100ms    hover, focus, small state changes
normal     150ms    default
emphasis   200ms    something the user should notice
modal      250ms    dialogs and drawers
```

### Easing

```text
ease-out       appearing, opening
ease-in-out    moving, changing state
linear         loaders only
```

Bounce is not functionally forbidden, but it must never be decorative. A bounce that
celebrates a real milestone is allowed (§18). A bounce on a Save button is not.

`prefers-reduced-motion: reduce` must be honoured by every animated component. Not
optional.

---

## 11. Icons — VALIDATED

**Phosphor** is the official icon system.

### Sizes

```text
12px  XS      16px  SM      20px  MD  ← standard UI size
24px  LG      32px  XL      40px  2XL
```

### Weights

```text
Regular   primary usage
Light     exceptional
Bold      strong states and actions
Fill      specific semantic uses
```

One icon may not appear in two different weights for the same meaning.

### Animated icons — CONDITIONAL

**Default approach:** animate Phosphor icons with Motion or CSS. One icon language,
properly licensed, no second visual vocabulary.

A secondary animated library (e.g. Flaticon Animated Icons) is permitted only for
exceptional, meaningful moments — and never mixed across styles.

> 🔴 **License gate — Flaticon is NOT open source.** Flaticon assets ship under Flaticon's
> own stock licence: the free tier requires visible attribution, and the terms restrict
> redistribution and use where the asset is a core part of the product. That is
> incompatible with `CLAUDE_CODE_RULES.md` §28 as it stands, and with a resold SaaS.
>
> **No Flaticon asset enters the repository until the licence is read and the applicable
> tier is recorded here.** Until then, Motion + Phosphor is the only approved path for
> animated iconography.

---

## 12. Layout and responsive — VALIDATED

```text
Max content width   1280px

Gutters             desktop 32px · tablet 24px · mobile 16px

Breakpoints         mobile   < 640px
                    tablet   640–1023px
                    desktop  1024–1279px
                    large    ≥ 1280px

Dashboard           sidebar 240px · main fluid
```

**TO VALIDATE** — two widths from Design System v1 still have no value:

```text
dashboard columns    the grid inside the main area
editor widths        canvas vs properties panel in the block editor
```

No arbitrary width or gutter per screen.

Every component defines its desktop, tablet and mobile behaviour. Responsive is not a
final patch.

---

## 13. Light and dark mode

Both modes are first-class for the ZeroCorp Product UI.

Rules:

1. Define the complete light palette on `:root`.
2. Redefine **only the tokens that change** under dark mode.
3. Never give a colour its only definition inside a dark-mode block.
4. Every token pair must be contrast-checked before use. §4.4 holds the measurements.
5. A theme switch never changes layout, spacing or type — only colour.

Dark mode values are **PROPOSED** (§4.2) and need one review pass before the first screen
ships.

---

## 14. Accessibility — VALIDATED as a requirement

Non-negotiable for every component:

- visible focus state using `--ring`, never `outline: none` without a replacement;
- full keyboard operation, logical tab order, escape closes overlays;
- semantic HTML before ARIA;
- accessible names on every control, including icon-only buttons;
- status changes announced where a sighted user would notice them;
- **AA contrast minimum** on every token pair actually used together;
- `prefers-reduced-motion` honoured;
- no meaning carried by colour alone — status needs an icon or a label as well.

**Accessibility regressions are real regressions** and block a release.

Open item: §4.4 form control borders.

---

## 15. ZeroCorp Product UI rules

Applies to `apps/app` — back-office, admin console — and the ZeroCorp marketing surface.

```text
The customer NEVER chooses ZeroCorp's interface colours.
```

The tokens in §4 through §12 are ZeroCorp's identity. They are fixed for every tenant.
There is no white-labelling of the product UI, no per-tenant theming of the back-office,
no customer-supplied brand colour in the dashboard.

A tenant's brand appears in the product only where it is *content*: a logo preview inside
the site editor, a colour swatch in the brand profile, a rendered preview of their site.
Never as chrome.

---

## 16. Customer website theme rules

Applies to `apps/sites` and `packages/site-renderer`.

Customer sites have their **own** theme system, structurally separate:

```text
theme
├── typography
├── colors
├── radii
├── spacing
├── buttons
├── cards
└── surfaces
```

Rules:

1. A customer theme **never** touches the ZeroCorp product design system. Separate token
   namespaces, separate packages (`site-renderer` vs `ui`), enforced by the layer
   boundaries in `ARCHITECTURE.md` §29.
2. Customer theme values come from **approved art directions**, not from free input. A
   customer picks a direction and adjusts within its bounds.
3. `--radius: 0px` is a **ZeroCorp** signature, not a customer constraint. Customer sites
   may be rounded — that is their brand, not ours.
4. The renderer owns the visual implementation. The theme supplies values, never CSS.

> **TO VALIDATE — the art directions do not exist yet.** 6–8 curated directions
> (token set + type pairing + spacing rhythm + motion rules each) still have to be
> designed. Until then no customer site can be themed. This is the remaining half of
> `OPEN_DECISIONS.md` D-G6.

---

## 17. Foundations and product components

Nothing here is implemented yet. This is the required surface, not a registry.

### Foundations

```text
Button · IconButton · Input · Textarea · Select · Combobox · Checkbox · Radio
Switch · Slider · DatePicker · FileUpload · Avatar · Badge · Tooltip · Popover
Dialog · Drawer · Dropdown · Tabs · Breadcrumbs · Separator · Skeleton
Spinner · Toast · Alert
```

### Product components — ZeroCorp-specific

```text
DataTable · StatusBadge · StatusTimeline · ActivityFeed · ProgressStepper
BusinessStatusCard · CreditMeter · AgentRunCard · AIApprovalPanel
ContentCalendar · BlockEditor · WebsitePreview · DomainStatusCard
EmailWarmupStatus · FormationStatus · DocumentVault · DocumentViewer
FileUploader · ProspectTable · LeadPipeline · WorkflowBuilder
NotificationCenter · UsageBreakdown · BillingCard · DailySummary · CommandMenu
```

### One status system across the whole product

A single `StatusBadge` serves formation, payments, domains, email, social, agents,
content and CRM. Status meaning is consistent everywhere:

```text
success · warning · danger · info · neutral · processing
```

Blocked on §4.3 — these have no colour values yet.

### Every component defines five states

```text
loading · empty · error · success · partial
```

This is part of the component, not an afterthought.

### Per-component requirements

Carried forward from Design System v1. These are the minimum surfaces each component must
cover — not implementations, and not a claim that any of them is chosen yet.

**Button** — variants `primary · secondary · tertiary · ghost · danger · icon`;
states `default · hover · active · focus · loading · disabled`.

**Inputs** — types `text · textarea · select · combobox · date · number · search ·
password · file`; each with `label · description · error · success · disabled · loading`.

**Avatar** — sizes, initials fallback, status indicator, image loading behaviour,
accessible name.

**Badge / Status** — the single centralised status system: `success · warning · danger ·
info · neutral · processing`, consistent across formation, payments, domains, email,
social, agents, content and CRM.

**Feedback** — `Toast · Alert · Banner · Inline error · Empty state · Success state ·
Loading state · Skeleton`.

**Overlay** — `Modal · Drawer · Popover · Tooltip · Command menu · Dropdown ·
Context menu`.

**DataTable** — pagination, sorting, filtering, column density, selection, bulk actions,
loading, empty, error, mobile behaviour.

**Timeline** — formation progress, workflow history, activity, onboarding.

**ActivityFeed** — `event · actor · time · status · action`.

**ProgressStepper** — primary use is *Launch Your Business*. States
`completed · current · locked · optional · failed · in-progress`.

**CreditMeter** — `included · used · remaining · reset · additional usage`, without making
the billing model confusing.

**AgentRunCard** — `agent · action · time · status · cost/usage where useful · result`.

**BusinessStatusCard** — reusable for Company, Website, Domain, Email, Marketing, Leads,
Automation.

**DocumentViewer** — preview, metadata, secure access, download permissions, audit context.

**FileUploader** — upload progress, validation, size limits, type validation, error,
retry, success.

**Billing** — `Plan card · Usage summary · Credit balance · Invoice list · Payment status ·
Upgrade/downgrade`.

**Lead** — `Lead table · Lead profile · Lead timeline · Lead status · Opportunity card ·
Campaign status`.

**NotificationCenter** — unread count, grouped notifications, filtering, mark read,
notification preferences, actionable notifications.

### Specific component rules

**Forms** — field spacing from the §6 scale, inline validation, error summary on submit,
explicit success feedback, never a silent save.

**Tables** — pagination, sorting, filtering, one density, selection, bulk actions, and
all five states. Numbers in Geist Mono, right-aligned.

**Dashboards** — the Command Center must answer *what happened, what is happening, what
needs attention, what happens next*. It is not a spreadsheet.

**AI states** — generating, awaiting approval, approved, rejected, failed. AI output is
always visually distinguishable from human-entered content before approval.

---

## 18. Component selection policy

The rule is **not** "always use component X". It is:

> **Claude Code chooses the most appropriate implementation among the best available
> sources, while strictly respecting ZeroCorp's identity and constraints.**

### Search order

```text
1. Shadcn Studio          ← primary source
2. shadcn/ui official
3. a high-quality specialised registry
4. another serious source
5. a custom ZeroCorp component — only if nothing existing is good enough
```

### Comparison criteria — evaluate before choosing

```text
Design quality · Accessibility · Responsive behaviour · API ergonomics
Customizability · Performance · Maintenance and project health · License
Stack compatibility · Consistency with Lyra · Consistency with this document
```

### What must survive adaptation

Whatever the source, the integrated component must carry:

```text
Lyra · 0px radius · Teal #00786F · Geist · Phosphor
approved spacing · approved motion · sharp / clean / premium
```

A component that cannot be adapted to these is the wrong component.

### 🔴 License gate — mandatory, before any code enters the repository

Per `CLAUDE_CODE_RULES.md` §28 and `PRODUCT_VISION.md` §12, record for every external
component:

```text
name · source · version · license · attribution requirement
modifications · owner · review date
```

- **MIT / Apache-2.0** — may be copied and adapted freely.
- **Shadcn Studio** is freemium; some blocks are commercial. **Verify the licence of each
  block**, not of the platform.
- **Specialised registries** (Evil Buttons and similar) are unverified until read.
- **Flaticon** — see §11.
- Anything **AGPL or source-available** — do not copy into the application.

*Never assume "open source" means "safe to embed in a resold SaaS."*

### When Claude Code must ask instead of deciding

Claude Code decides alone when one option is clearly superior. It **stops and asks** when:

- two or more options are genuinely equivalent;
- the choice materially affects the visual identity;
- the choice creates a new important pattern;
- no available solution is good enough;
- the component is exceptionally visible or structural;
- it is torn between building custom and integrating a library.

Presentation format:

```text
Option A / Option B / Option C
Pros
Cons
Recommendation
```

Then wait.

### Pages and dashboards are never copied

Full pages must **not** be lifted from a component library.

```text
inspiration (Dribbble, Mobbin, references)
        +
ZeroCorp layout
        +
ZeroCorp Design System
        +
approved components
        ↓
a ZeroCorp composition
```

A reference is a reference. Copying another product's design mechanically is forbidden.

### Special-purpose components

A component with unusual UX value (an animated or celebratory button, for example) is
allowed **where the context justifies it**, never as a default.

```text
Save                          → normal button
Submit                        → normal button
Delete                        → destructive button
"Your company is live"        → celebration is legitimate here
```

---

## 19. Approved component registry

Format:

```text
<Component>
→ <source identifier>
→ Approved | Proposed | Rejected
→ <license> · <review date>
```

### Current registry

```text
(empty)
```

**Nothing is approved yet.** The registry grows one component at a time, as each is
actually chosen and integrated. It is not pre-populated to look complete.

---

## 20. Website block system

Applies to `packages/site-renderer`. Structurally independent from §17.

### Philosophy

Website AI is not a freeform designer. It chooses from:

```text
approved block types · approved variants · approved themes · approved content structures
```

The renderer owns the visual implementation.

### The generation contract

The model emits **content and choices**, never layout:

```text
{ blockType: enum,   // closed list
  variant:   enum,   // hand-designed variants
  content:   { … }   // text and asset references only
}
```

Validated with Zod against strict enums in `packages/contracts`. **An output outside the
enum is rejected and regenerated.** Design is decided once, by a human; the model only
fills shells that are already good.

### Targets

```text
~12–20 block types
~10 approved variants per mature block
```

Start with 12 excellent blocks. Quality over count.

### The Design System v1 lists — preserved, not frozen

These are the lists this document carried in v1. They are **one of three** block lists and
**one of two** hero variant lists currently in circulation. Preserved verbatim so nothing
is lost while D3 and D4 are settled.

**Block families (v1, 20)**

```text
Hero · Logo Cloud · Features · Services · Stats · Testimonials · Process · Pricing
FAQ · Team · CTA · Contact · Gallery · Case Study · Comparison · Announcement
Article Highlight · Quote · Form · Before/After
```

**Hero variants (v1, 10)**

```text
centered · split · image-right · image-left · product
minimal · editorial · conversion · video · dark
```

> 🔴 **TO VALIDATE — the canonical lists do not exist.** Three different block lists and
> two different hero variant lists are in circulation across the current documents. This
> document owns the taxonomy, and it has not been frozen. See `OPEN_DECISIONS.md` **D3**
> and **D4**. The block registry cannot be written until this is settled — the `type` and
> `variant` fields are closed enums in code.

### Composition rules

Unique sites come from `block + variant + content + theme + spacing composition` — never
from letting the model invent CSS.

Guardrails to define: maximum consecutive heavy sections, hero variant compatibility, CTA
hierarchy, typographic rhythm, mobile behaviour, repeated-component avoidance.

### AI restrictions

**AI may:** choose a block, choose a variant, choose content, choose from approved theme
tokens, reorder approved blocks.

**AI may not:** invent a CSS architecture, invent components, invent unsupported variants,
introduce fonts, introduce colours, create uncontrolled layout behaviour.

---

## 21. Layout patterns

Canonical layouts are defined before individual screens. Do not invent a page architecture
per feature.

**Marketing site** — header · hero · content sections · social proof · CTA · footer

**Authenticated product** — sidebar (240px) · top bar · content · contextual actions

**Command Center** — business health · activity · pending actions · automation · metrics.
Reads as *"Your business is running."*

**Onboarding** — focused or full-screen, minimal distraction. The primary experience is
*Launch Your Business*.

**Editor** — canvas · block navigation · properties panel · preview · publish · undo/redo.
**Never expose raw JSON to a normal customer.**

**Settings** — section navigation · settings panel · save states · danger zone.

---

## 22. Design review process

### Adding a component

```text
1. Identify the required component.
2. Find candidate implementations, in the §18 search order.
3. Check the license.                      ← hard gate
4. Check maintenance and maturity.
5. Review accessibility.
6. Review API ergonomics.
7. Adapt to ZeroCorp design tokens.
8. Add to the approved component registry (§19).
9. Document usage, then reuse everywhere.
```

The selected implementation becomes the official project pattern unless deliberately
replaced.

### Before creating anything custom

```text
Does an approved component already solve this?
Does an approved primitive plus a variant solve it?
Is the pattern likely to recur?
Is the interaction genuinely different?
Have responsive behaviour, all five states and accessibility been defined?
```

Only then does it become canonical.

### Changing a validated value

A **VALIDATED** value is changed the way an architecture decision is changed: present the
problem, the current value, the proposal, the alternatives, the trade-offs and the impact
— then obtain approval. Never silently.

`CLAUDE_CODE_RULES.md` §40 governs how this document is kept current.

---

## 23. Do / Don't

| ✅ Do | ❌ Don't |
|---|---|
| `--radius-none` everywhere by default | Round something because it "looks softer" |
| Borders and spacing for hierarchy | Add a shadow to separate two blocks |
| Geist Mono for every comparable number | Proportional digits in a table |
| One `StatusBadge` across all domains | A bespoke badge per feature |
| Phosphor at 20px, Regular | A second icon set for one screen |
| Tokens for every value | `className="mt-[17px] bg-[#00786F]"` |
| Teal as the single accent | A second accent colour |
| Ask when two options are equivalent | Pick silently and create a precedent |
| Check the licence before copying | Assume a registry is MIT |

---

## 24. Open items

| # | Item | Blocks |
|---|---|---|
| 1 | **Semantic status colours** (§4.3) — success, warning, info, processing | `StatusBadge`, every status surface |
| 2 | **Form control contrast** (§4.4) — `--input` at 1.26:1 fails WCAG 1.4.11 | Every form |
| 3 | **Dark mode values** (§4.2) — PROPOSED, need one review pass | Dark mode |
| 4 | **Base UI vs Radix** (§2) — which primitive layer do the chosen components use | The first component |
| 5 | **Block taxonomy and variants** (§20) — D3 / D4 | The block registry |
| 6 | **Customer art directions** (§16) — 6–8 curated directions | Every customer site |
| 7 | **Flaticon licence** (§11) | Animated icons |
| 8 | **Border hover in dark mode** (§9) | Dark mode components |

---

> **The AI can compose the language. It cannot invent the language.**
