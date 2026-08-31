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

### Primitive layer — RESOLVED 2026-08-31

**Base UI is the primitive layer.** This was flagged as a possible conflict with the
shadcn ecosystem; it is not.

Since **July 2026, Base UI is the default in shadcn/ui**. Radix is not deprecated — every
component ships for both — and registry items without a pinned library now initialise as
Base UI. Shadcn Studio publishes for both and documents migration between them.

Base UI is MIT, ~10.8k stars, and maintained by a team that includes the creators of
Radix. Choosing it aligns ZeroCorp with the ecosystem default rather than diverging from it.

**Rule:** Base UI primitives only. A component that exists solely on Radix requires an
explicit decision recorded here — never a silent second headless library.

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
| `--input` | `#949494` | Form control borders — see §4.4 |
| `--ring` | `#00786F` | Focus ring |
| `--destructive` | `#DC2626` | Destructive actions, errors |
| `--success` | `#15803D` | Completed, healthy, verified |
| `--warning` | `#B45309` | Needs attention, degraded, expiring |
| `--info` | `#2563EB` | Neutral information, guidance |
| `--processing` | `#00786F` | In progress, pending, running |

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
| `--input` | `#6B6B6B` | **PROPOSED** — 3.72:1. `#2E2E2E` reached only 1.46:1 |
| `--input-hover` | `#8F8F8F` | **PROPOSED** — 6.12:1. In dark, hover *lightens* |
| `--primary` | `#00786F` | **PROPOSED** — unchanged; see the contrast finding below |
| `--primary-foreground` | `#F0FDFA` | **PROPOSED** — unchanged |
| `--primary-emphasis` | `#2DD4BF` | **PROPOSED** — teal **text**, links and icons on dark only |
| `--destructive` | `#EF4444` | **PROPOSED** — `#DC2626` reaches only 4.10:1 on `#0A0A0A` |
| `--success` | `#22C55E` | **PROPOSED** — 8.69:1 · `#15803D` reaches only 3.95:1 |
| `--warning` | `#F59E0B` | **PROPOSED** — 9.22:1 · `#B45309` reaches only 3.94:1 |
| `--info` | `#3B82F6` | **PROPOSED** — 5.38:1 · `#2563EB` reaches only 3.83:1 |
| `--processing` | `#2DD4BF` | **PROPOSED** — 10.64:1 · same value as `--primary-emphasis` |

Every light-mode status colour lands between 3.69:1 and 4.10:1 on `#0A0A0A` — enough for a
filled badge (a UI component needs 3:1) but **not for status text or an icon on the page
ground**. The lighter set above is required wherever status is rendered as text on dark.

### 4.3 Semantic status colors — VALIDATED

```text
success      #15803D      completed · healthy · verified
warning      #B45309      needs attention · degraded · expiring
info         #2563EB      neutral information · guidance
processing   #00786F      in progress · pending · running
destructive  #DC2626      failed · error · destructive action
```

All five measure between **4.83:1 and 5.36:1** on white — a deliberately even set, so no
status reads as louder than another purely through contrast.

`--processing` intentionally reuses `--primary`. Work in progress *is* ZeroCorp working;
it should not introduce a sixth colour.

**One status system across the entire product** (§17): formation, payments, domains,
email, social, agents, content, CRM. A feature never invents its own status colour.

> **Colour is never the only carrier of meaning.** Every status pairs a colour with an
> icon and a label (`CLAUDE_CODE_RULES.md` §25).

Dark-mode equivalents are **PROPOSED** — see §4.2.

### 4.4 Measured contrast

Computed against WCAG 2.1. Recorded so nobody re-derives them.

#### Light mode — on `#FFFFFF`

| Pair | Ratio | Verdict |
|---|---:|---|
| `#00786F` primary | **5.36:1** | AA text ✓ |
| `#F0FDFA` on `#00786F` | **5.16:1** | AA text ✓ |
| `#2563EB` info | **5.17:1** | AA text ✓ |
| `#15803D` success | **5.02:1** | AA text ✓ |
| `#B45309` warning | **5.02:1** | AA text ✓ |
| `#DC2626` destructive | **4.83:1** | AA text ✓ |
| `#737373` muted-foreground | **4.74:1** | AA text ✓ (narrow margin) |
| `#949494` input border | **3.03:1** | non-text contrast ✓ |
| `#E5E5E5` border | **1.26:1** | dividers and card edges ✓ · never a control boundary |

#### Dark mode — on `#0A0A0A`

| Pair | Ratio | Verdict |
|---|---:|---|
| `#2DD4BF` processing | **10.64:1** | AA ✓ |
| `#F59E0B` warning | **9.22:1** | AA ✓ |
| `#22C55E` success | **8.69:1** | AA ✓ |
| `#3B82F6` info | **5.38:1** | AA ✓ |
| `#EF4444` destructive | **5.26:1** | AA ✓ |
| light-mode statuses | **3.69–4.10:1** | filled badge ✓ · **text ✗** |

### Form control boundaries — RESOLVED

**VALIDATED:**

```text
--border   #E5E5E5     dividers, card edges, table rules — decorative
--input    #949494     the boundary that identifies a form control
--ring     #00786F     focus indicator
```

Splitting `--border` from `--input` is the right call: it keeps the light Lyra look on
every decorative line while giving controls a boundary that can actually be perceived.
`--ring` at 5.36:1 against white is a strong focus indicator.

`--input` at **3.03:1** clears WCAG 2.1 SC 1.4.11 (3:1 for the boundary that identifies a
user interface component).

`#959595` was measured at **2.995:1** and rejected: 0.005 below the threshold is a
reported failure that no human can see, and one hex step fixes it at zero visual cost.
Recorded so the near-miss is not reintroduced later.

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

**Decorative borders** — dividers, card edges, table rules:

| State | Light | Dark |
|---|---|---|
| Default | `--border` `#E5E5E5` | `#262626` |
| Hover | `--border-hover` `#D4D4D4` | **TO VALIDATE** |

**Form control boundaries** — VALIDATED:

| State | Light | Ratio |
|---|---|---|
| Default | `--input` `#949494` | 3.03:1 ✓ |
| Hover | `--input-hover` `#737373` | 4.74:1 ✓ |
| Focus | `--ring` `#00786F` | 5.36:1 ✓ |
| Error | `--destructive` `#DC2626` | 4.83:1 ✓ |
| Success | `--success` `#15803D` | 5.02:1 ✓ |

> **Hover always strengthens the boundary; the direction depends on the ground.**
> In light mode that means darkening (`#949494` → `#737373`). In dark mode it means
> lightening (`#6B6B6B` → `#8F8F8F`), because contrast against a dark ground grows as the
> border gets lighter. `--border-hover #D4D4D4` is lighter than `--input #949494` and so
> can never serve a control in light mode — that is why `--input-hover` exists.
>
> **A control boundary must clear 3:1 in every theme.** The dark palette initially
> proposed `#2E2E2E`, which measured **1.46:1** — the same failure as `#E5E5E5` on white.
> Caught by visual review, not by a test.

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

### The theme class goes on the root element — VALIDATED

```text
document.documentElement.classList.toggle("dark", isDark)
```

**Never on a wrapper element.** Portalled components — Select's popup, and later Dialog,
Drawer, Popover, Tooltip, Dropdown and Toast — mount on `document.body`, outside any
wrapper. A theme class on a `<div>` leaves every one of them rendering light-mode tokens
on a dark page.

Found by visual review on 2026-08-31: the Select popup rendered white
(`#FFFFFF` background, `#E5E5E5` border) in the middle of a dark page. The components
were correct; the theme was applied in the wrong place.

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

**RESOLVED 2026-08-31.** §4.3 gives colours to five of the six; `StatusBadge` is
implemented and in the registry (§19).

`neutral` is the exception: it has no status colour of its own and takes the muted pair
(`--muted-foreground`). That is deliberate — a sixth colour would compete with the five,
and "no status yet" is genuinely the absence of one. It is the only tone whose border is
not a status colour.

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

#### Form state — VALIDATED 2026-08-31

```text
State        Base UI Field / Form — native
             validity · touched · dirty · filled · focused · aria-invalid
Validation   packages/contracts (Zod) — the same schemas the use cases validate against
Submission   Next.js Server Actions
Dependencies added: none
```

**react-hook-form is not adopted.** Base UI already carries the field state ZeroCorp
needs, and the validation schemas exist in `packages/contracts` because NN-5 requires
everything crossing a boundary to be typed there. Reusing them means a form and its use
case can never drift apart.

This also means shadcn/ui's `Form` component — which is built on react-hook-form — is
**not** part of our system. Do not import it.

The decision is reversible and scoped: if a specific screen genuinely needs repeatable
fields, cross-field dependencies or multi-step state that Base UI cannot carry, propose
react-hook-form **for that screen**, with the reason. Do not adopt it globally by default.

#### Visual review — 2026-08-31

Reviewed in Chrome at 1440px, light and dark, all states. `apps/app/src/app/design-system`
is the review surface: the real components, not a mockup. Screenshots in
`docs/design-review/` (git-ignored — regenerate by running the route).

**Two defects the unit tests could not see:**

| | Defect | Cause | Fix |
|---|---|---|---|
| 1 | **The focus ring was invisible.** Width 2px and colour `#00786F` were applied, but nothing rendered | `outline-none` in the base class set `outline-style: none`. Tailwind's `outline-2` restores width, not style | `outline-none` removed and now **forbidden** in `packages/ui`, guarded by `tests/architecture/design-tokens.test.ts` |
| 2 | **Dark-mode control borders failed WCAG 1.4.11.** `--input: #2E2E2E` measured **1.46:1** on `#0A0A0A` | The same failure as `#E5E5E5` on white, reintroduced in the dark palette | `--input: #6B6B6B` (3.72:1), `--input-hover: #8F8F8F` (6.12:1) |

Both were invisible to typecheck, lint, boundaries and 41 unit tests. **A design system
needs a human looking at it.** Every component added to the registry gets this pass.

#### Visual review — Textarea, 2026-08-31

Reviewed at 1440px in both themes. **No defects.** The Input fixes hold on a different
element: focus ring `solid 2px #00786F` at 2px offset, control border `#6B6B6B` in dark
on both controls, `resize: vertical` and `resize: none` when disabled.

That is the return on extracting `control-styles.ts` — Textarea inherited two fixes it
never had to be told about.

#### Visual review — Select, 2026-08-31

Reviewed at 1440px and 375px, both themes, open and closed. Verified: open/close by
pointer and keyboard, focus ring on the trigger, highlight and selected indicator,
disabled trigger and disabled option, error and success, long labels and long options,
dark mode, and dropdown geometry (4px offset, left-aligned, at least trigger width).

**Three defects, none caught by 16 unit tests:**

| | Defect | Cause | Fix |
|---|---|---|---|
| 1 | **The popup rendered light-mode on a dark page** — white background, light border | Base UI portals mount on `document.body`, outside the wrapper carrying the theme class | Theme class moved to `document.documentElement`. Now a rule — see §13 |
| 2 | **A long option pushed the trigger past the viewport** on a 375px screen; `truncate` never fired | A flex child defaults to `min-width: auto` and refuses to shrink below its content | `min-w-0` on `Select.Value`, plus a regression test |
| 3 | **The popup width guard was inert** — `min-w` and `max-w` both set, popup stayed 471px on a 375px screen | CSS `min-width` always beats `max-width` | Root cause was defect 2; the guard works once the trigger behaves. Recorded so the pairing is not trusted blindly |

Defect 1 is the important one: **it will recur on every portalled component** — Dialog,
Drawer, Popover, Tooltip, Dropdown, Toast — and no component-level test can see it.

#### The field shell — IMPLEMENTED, the reference for every form control

```text
packages/design-system/src/tokens.css    every validated value, nowhere else
packages/ui/src/field/Field.tsx          the shell
packages/ui/src/field/Input.tsx          the text control
packages/ui/src/field/field-state.ts     the context controls read
```

Usage — the whole point is that a form needs no wiring:

```tsx
<Field label="Business name" description="Shown on your invoices" error={errors.name}>
  <Input placeholder="Acme LLC" />
</Field>
```

`Field` publishes `{ invalid, valid, loading, describedBy }` through React context;
`Input` reads it. **Textarea, Select, Combobox, DatePicker and FileUpload consume the same
context** rather than reimplementing labels, help text, error handling and aria wiring.
That is what makes the second control cheap and the sixth identical to the first.

Three decisions worth keeping:

- **`label` is a required prop.** A placeholder is not a label — it disappears on focus
  and is invisible to some assistive technology. The type system enforces it.
- **`loading` is not `disabled`.** Loading is busy but readable and focusable
  (`aria-busy`); disabled is inert. Conflating them traps keyboard users.
- **Type is 16px on mobile, 14px from `sm` up.** Below 16px, iOS Safari zooms the
  viewport on focus and the layout breaks.

Every form control in ZeroCorp is composed, never bare:

```text
Field.Root
├── Field.Label          always present — a placeholder is not a label
├── Field.Control        Input · Textarea · Select · Combobox · DatePicker · FileUpload
├── Field.Description    optional help text
└── Field.Error          validation message, wired via aria-describedby
```

Textarea, Select, Combobox, DatePicker and FileUpload reuse this shell. They do not each
invent their own label and error handling.

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
Field                          the form shell — THE REFERENCE IMPLEMENTATION
→ packages/ui/src/field/Field.tsx  ·  built on Base UI Field (@base-ui/react 1.7.0)
→ VALIDATED — implemented 2026-08-31, group mode added 2026-08-31
   as="control"  label above a full-width control
   as="group"    a <fieldset> with a <legend> — a <label> cannot label a set of radios
→ MIT · reviewed 2026-08-31
   label (required) · description · error · success · required · disabled · loading
   aria-describedby wired · role=alert on error · role=status on success

Input                          the single-line text control
→ packages/ui/src/field/Input.tsx  ·  Base UI Field.Control
→ VALIDATED — implemented and visually reviewed 2026-08-31
→ MIT · reviewed 2026-08-31
   default · hover · focus · loading · disabled · error · success
   16px type on mobile, 14px from sm — below 16px iOS Safari zooms on focus

Textarea                       the multi-line text control
→ packages/ui/src/field/Textarea.tsx  ·  Base UI Field.Control rendered as <textarea>
→ VALIDATED — implemented and visually reviewed 2026-08-31
→ MIT · reviewed 2026-08-31
   No new pattern: same Field shell, same context, same style fragments.
   rows default 4 · vertical resize only · resize disabled when the control is
   spinner sits at the top, because a tall control has no meaningful middle

Select                         the single-choice control
→ packages/ui/src/field/Select.tsx  ·  Base UI Select
→ VALIDATED — implemented and visually reviewed 2026-08-31
→ MIT · reviewed 2026-08-31
   No new pattern: same Field shell, same control contract.
   The trigger is a <button>, so it takes aria-labelledby from the Field context —
   <label for> cannot address a button. The empty state is data-placeholder, not
   ::placeholder.
   alignItemWithTrigger deliberately off: the default overlaps the trigger to line the
   selected item up under the cursor, which reads as macOS, not as a calm form control.
   Popup: at least trigger width, free to grow for a long option, capped at
   --available-width. Options are never truncated; they wrap when the popup runs out
   of room.

Choice                         the inline label row for choice controls
→ packages/ui/src/field/Choice.tsx
→ VALIDATED — implemented and visually reviewed 2026-08-31
→ MIT · reviewed 2026-08-31
   Not a second shell: same field-state context, same message layer as Field, only
   the arrangement differs. The label WRAPS the control, so the whole row is the
   click target. Standalone it opens a Field.Root and owns its own message; inside a
   group it opens a Field.Item and stays quiet — the group owns the message.

Checkbox                       square, --radius-none
→ packages/ui/src/field/Checkbox.tsx  ·  Base UI Checkbox
→ VALIDATED — implemented and visually reviewed 2026-08-31
→ MIT · reviewed 2026-08-31
   Supports indeterminate. Border uses --input, so it inherits the same WCAG 1.4.11
   guarantee as a text field. Unchecked fill is --muted, never --background: a control
   filled with the page colour reads as a hole on a dark ground (review, 2026-08-31).

Radio · RadioGroup             circle — the one deliberate exception to --radius-none
→ packages/ui/src/field/Radio.tsx  ·  Base UI Radio + RadioGroup
→ VALIDATED — implemented and visually reviewed 2026-08-31
→ MIT · reviewed 2026-08-31
   §7 already allows it: a circle is a component decision, not a scale value. Square
   means many, round means one — a forty-year-old signal. A square checkbox and a
   square radio in one form would be genuinely ambiguous.
   RadioGroup takes its accessible name from the surrounding Field's <legend>.

Switch                         labelled rectangle, 56×20, --radius-none
→ packages/ui/src/field/Switch.tsx  ·  Base UI Switch
→ VALIDATED — variant B chosen and visually reviewed 2026-08-31
→ MIT · reviewed 2026-08-31
   The state WORD sits inside the track: ON left when on, OFF right when off.
   Not decoration — §14 requires that colour never be the only carrier of meaning,
   and the first implementation read only through colour and thumb position. That
   failed for a colour-blind reader scanning a settings list, which is exactly where
   a toggle like Autopilot lives.
   OFF uses --foreground, not --muted-foreground: at 11px bold on --muted the muted
   token measures 4.35:1 and 11px bold is not large text, so AA needs 4.5:1.
   labelOn / labelOff are props with English defaults, so a caller supplies translated
   values once an i18n layer exists. The words are aria-hidden — role="switch" and
   aria-checked already announce the state.
   The thumb is the same ink as the state word: --foreground off, --primary-foreground
   on. Never --background — the page colour makes the thumb vanish in both themes.
   A switch applies immediately and stays immediately reversible. No confirmation.
   When a change is not reversible, use a Checkbox and a submit action instead.

StatusBadge                    one status system for the whole product
→ packages/ui/src/status-badge/StatusBadge.tsx
→ VALIDATED — A + C chosen and visually reviewed 2026-08-31
→ MIT · reviewed 2026-08-31
   ONE component, two emphases — never two components.
     default    outlined, the page shows through. Repeats eight times in a table
                without taking it over.
     prominent  solid fill. For the few places where the status is the point.
   Six tones: success · processing · warning · danger · info · neutral.
   Every tone carries a Phosphor glyph of a DIFFERENT SHAPE, Regular weight in both
   emphases. This is not decoration: §4.3 tuned the five colours to 4.83:1–5.36:1,
   a deliberately even set, so in greyscale they collapse to one grey. The glyph is
   the only thing a colour-blind reader gets.
   The label is a required prop. There is no icon-only badge and no way to build one.
   prominent inks with --background, which flips with the theme exactly as the status
   colours do. A theme-stable near-white measured 1.78:1–3.61:1 on the dark tones.
   neutral outlines with --muted-foreground, never --border (1.26:1 / 1.31:1).
   Always ONE line. A status that wraps reads as a paragraph in a box, not a status.
   This constrains the LABEL, not the layout: nothing truncates, nothing has a fixed
   width, and the badge widens with its text in every language. A label long enough to
   need a second line is not a status — it is a message, and belongs in a description,
   a tooltip or a row of its own. §5 is satisfied because the badge has no fixed width
   and no fixed height; the surfaces around it absorb the growth.

control-styles.ts              the shared visual contract
→ packages/ui/src/field/control-styles.ts
→ VALIDATED — extracted 2026-08-31 when Textarea arrived
   CONTROL_BASE · CONTROL_NEUTRAL · CONTROL_FOCUS · CONTROL_DISABLED
   CONTROL_INVALID · CONTROL_VALID · CONTROL_HEIGHT · controlTone()
   CHOICE_BOX · CHOICE_CHECKED · CHOICE_CIRCLE · SWITCH_TRACK · SWITCH_THUMB
   SWITCH_LABEL — the choice controls compose these the same way.
   Select, Combobox, DatePicker and FileUpload compose these. A control that
   restyles itself instead of composing them is a defect.

Phosphor icons                 CircleNotch used for the loading state
→ @phosphor-icons/react 2.1.10
→ Approved
→ MIT · reviewed 2026-08-31

Button
→ handled separately by the product owner — registry reference pending
→ Approved
```

**Considered and deferred, with the reason on record:**

```text
Shadcn Studio input (46 variants)
→ Deferred, not rejected
→ Three inputs are needed today: text, password, search. Importing 46 variants at V1
  is the "dozens of low-quality components" failure PRODUCT_SPEC 27 forbids.
  Individual variants will be pulled on concrete need, one at a time.

shadcn/ui input
→ Reference only, not a source
→ It is a styled <input> with no label, description or error. DESIGN_SYSTEM 17 requires
  all of them. Adopting it would mean deleting its radius and shadow defaults, then
  building the field shell anyway.

react-hook-form
→ Not adopted — see "Form state" below
```

The registry grows one component at a time. It is never pre-populated to look complete.

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

## 21. ZeroCorp Dashboard Visual Language

Derived from reference screenshots adopted 2026-08-31 as the official structural
reference for ZeroCorp's dashboard.

### 21.0 What we take and what we refuse

> **The reference is a source of STRUCTURE, DENSITY, HIERARCHY, NAVIGATION and
> COMPOSITION. It is never a source of brand, copy, colour or shape.**

**Taken:** shell topology · navigation organisation · page anatomy · information density ·
column and panel proportions · the rhythm of sections · where actions live.

**Refused, explicitly:**

| The reference does | ZeroCorp does | Why |
|---|---|---|
| Rounded search pill, ~6px buttons, ~8px cards | `--radius-none` everywhere | Radius 0 is our signature (§7). This is the single most visible divergence — do not import the rounding |
| Soft-tinted pastel status badges (lavender, mint, butter, rose) | The five validated status colours (§4.3) | We have no subtle/tint scale. Inventing one is forbidden — see §21.18 |
| Its wordmark, product names, loan-domain copy | ZeroCorp identity and copy | Never copied |
| Coloured square action buttons (blue Mail, green Call) | Neutral controls, teal reserved for primary | One accent (§2) |

Everything below is marked **VALIDATED** (already our system, confirmed by the
reference), **PROPOSED** (clearly observable, needs your decision) or **TO VALIDATE**
(not determinable from a screenshot — do not guess).

### 21.1 Philosophy — VALIDATED

> **Structured, sharp, dense, calm, premium, operational.**

Hierarchy comes from **typography, spacing, borders, alignment and density**. Never from
heavy shadows, gradients, rounded cards or decorative effects. The reference confirms the
direction already set in §1: large white surfaces, thin rules, almost no shadow, and a
lot of information held together by alignment rather than by containers.

---

### 21.2 `DashboardShell` — PROPOSED

```text
┌────────────┬──────────────────────────────────────────────┐
│            │  TopCommandBar                               │
│  Sidebar   ├──────────────────────────────────────────────┤
│  fixed     │                                              │
│  240px     │  Content — fluid, scrolls independently      │
│            │                                              │
│  ────────  │                                              │
│  Settings  │                                              │
│  Help      │                                              │
└────────────┴──────────────────────────────────────────────┘
```

- Sidebar **fixed**, full height, does not scroll with content.
- **The top bar spans the content column only** — it does not cross the sidebar. The
  sidebar carries its own logo header at the same height. This is a deliberate
  observation from the reference and it differs from the more common full-width top bar.
- A single vertical 1px `--border` rule separates sidebar from content. No shadow, no
  elevation change.
- Content column is fluid and owns its own scroll.

**Sidebar width:** the reference sits at roughly 18.5% of the application width,
consistently across every screenshot — about 265px at a 1440px viewport. Our validated
`--spacing-sidebar: 240px` (§12) sits inside that band and **is not changed**.

---

### 21.3 `SidebarNavigation` — PROPOSED

```text
  ▸ Logo                      brand mark, generous top padding
  ────────────────────────    (no rule in the reference; the gap does the work)
  ▪ Overview                  icon 20px + label, single line
  ▪ Contacts            ⌄     expandable group
      Leads                   sub-item, indented
      Referral Partners
  ▪ Deals               ⌃     expanded group
      └ Active Deals          active sub-item
        Closed Deals
  ▪ Integration
  ▪ Tasks
  ────────────────────────    1px --border rule, pushed to the bottom
  ▪ Settings
  ▪ Help & Support      [8]   badge
```

| Element | Rule |
|---|---|
| Item | Phosphor icon at 20px (§11 standard size) + label at `text-label`. Left-aligned, one line, never wrapping |
| Group | Expandable, chevron right-aligned, rotates on open |
| Sub-item | Indented under its parent, no icon |
| Active item | Filled block using `--accent`. Text goes to `--foreground`; weight does not change |
| Active sub-item | Same fill, text at `--foreground`; its siblings stay at `--muted-foreground` |
| Bottom zone | Settings and Help pinned to the bottom, separated by a full-width `--border` rule |
| Badge | Count on Help & Support. **The reference shows it in two different colours across screenshots — badge colour is TO VALIDATE.** Use `--muted` until decided |
| Collapse | A circular chevron control sits on the sidebar's right edge, vertically near the top, straddling the rule |

**TO VALIDATE:** the collapsed width and what it shows (icons only? tooltips?). No
screenshot shows the collapsed state. Do not invent it.

**PROPOSED, flagged:** the reference draws a small `└` tree connector before the first
active sub-item. It is a decorative device that appears inconsistently across the
screenshots. Recommend **omitting it** — indentation already carries the relationship,
and a glyph that appears on some items and not others reads as a bug.

---

### 21.4 `TopCommandBar` — PROPOSED

```text
[ ⌕  Search or type a command          ]        ⚡•  ⊕  ⌂  │  ⬤ ⌄
```

- **Left:** a single wide search input, `⌕` icon inside, placeholder naming both
  behaviours — *"Search or type a command"*. This is a command palette, not a filter.
  It is the first element in the bar and takes roughly a third of the content width.
- **Right cluster:** icon actions in a fixed order — quick action (carrying a dot when
  something is pending), add-record, notifications — then a vertical `--border` rule,
  then the account avatar with a chevron.
- The dot on an icon is a state indicator, never a count. Counts go in badges.
- Height matches the sidebar's logo header so the two align across the rule.

**Divergence:** the reference's search field is a pill. Ours is `--radius-none` with a
`--input` border like every other control (§9). Do not import the pill.

**TO VALIDATE:** mobile behaviour. No narrow screenshot exists.

---

### 21.5 `PageHeader` — PROPOSED

Two stacked rows, then a rule.

```text
←  Active Deals  ›  Ronald Richards              ● Last Activity 2 Nov 2024, 09:00
────────────────────────────────────────────────────────────────────────────────
⬤  Ronald Richards                          ⬤⬤+2  │  [ Mail ] [ Call ] [ ⋯ More ]
    Created On: 2 Mar, 2025
────────────────────────────────────────────────────────────────────────────────
```

| Row | Contents |
|---|---|
| **Breadcrumb row** | Back arrow + breadcrumb trail, `text-body-sm`. Right-aligned contextual metadata (last activity, status) with a small status dot |
| **Object row** | Avatar, object name at `text-h3`/`text-h2`, a secondary metadata line at `text-body-sm text-muted-foreground` beneath. Right: participant avatar stack, then primary actions |
| **Rule** | Full-width `--border`, separating header from content |

- **Actions are right-aligned and ordered least-to-most destructive**, ending in an
  overflow `⋯ More`.
- The avatar stack shows up to three faces then a `+N` counter.
- The back arrow is part of the breadcrumb, not a separate button.

---

### 21.6 `SectionHeader` — PROPOSED

```text
Upcoming Tasks                                        [ + Create Task ]
```

Section title at `text-h4` on the left, its single primary action right-aligned on the
same baseline. Nothing between them. A subtitle, when present, sits under the title at
`text-caption text-muted-foreground` (the reference uses this for a date grouping:
*Task History / 12th November, 2024*).

Small section labels inside panels use `text-overline`, uppercase, `--muted-foreground` —
observed as `RECENT ACTIVITY`, `DEAL INFO`, `LOAN REQUESTED`.

---

### 21.7 `TabbedDetailView` — PROPOSED

- Underline tabs. Active tab: `--foreground` text with a 2px underline. Inactive:
  `--muted-foreground`, no underline.
- A tab may carry a count as a **filled dark circle with white text**, immediately after
  the label (`Tasks ⑦`).
- The tab strip sits directly above its content with a full-width rule beneath.
- **Two independent tab strips may coexist on one screen** — one for the context column,
  one for the main column. They are separate navigations and must not be visually merged.

---

### 21.8 `DataTableLayout` — PROPOSED

```text
Contacts                                       [ Settings ] [ Export All ]
My Leads  (29 Leads)
────────────────────────────────────────────────────────────────────────
Leads | Referral Partners                                     ← view tabs
────────────────────────────────────────────────────────────────────────
[ ⌕ Search…                          ]   ⧩1  ▤ ▦ ▤   [ Options ⌄ ]
────────────────────────────────────────────────────────────────────────
☐ │ NAME │ CONTACTS │ PURPOSE │ AMOUNT │ LEAD OWNER │ PROGRESS │ STAGES
────────────────────────────────────────────────────────────────────────
☐ │ ⬤ Jenny Wilson │ email      │ Home Loan │ $978,878 │ ⬤⬤ │ ▬▬▬ 70% │ [New]
  │                │ (603) 555… │           │          │    │         │
────────────────────────────────────────────────────────────────────────
                    ‹ Previous   1  [2]  …  8  9   Next ›
```

**Toolbar** — one row above the table: search input taking the full remaining width on
the left; on the right, view-mode toggles, a filter control **carrying its active count**,
and an `Options ⌄` menu. This order is fixed.

**Header row** — `text-overline`, uppercase, `--muted-foreground`, left-aligned. Not bold.

**Rows**

| Property | Rule |
|---|---|
| Selection | Checkbox as the first column, plus one in the header for select-all |
| Height | Tall. Rows carry an avatar plus up to two lines of content |
| Identity cell | Avatar + name, always the first data column |
| Multi-value cell | Primary value on line one, secondary at `text-caption text-muted-foreground` on line two (email over phone) |
| Numeric cell | **Geist Mono** (§5). Amounts and percentages are comparable values |
| People cell | Overlapping avatar stack, newest first |
| Progress cell | Thin horizontal bar + numeric percentage to its right. Bar height is hairline, not a chunky meter |
| Status cell | `StatusBadge` (§17), one system across the whole product |
| Separators | Full-width 1px `--border` between rows. **No zebra striping, no card per row** |

**Pagination** — centred beneath the table: `‹ Previous`, page numbers with ellipsis for
gaps, `Next ›`. The active page is a **filled dark square**, not an underline.

**TO VALIDATE:** exact row height, column widths and minimum column widths. Screenshots
give proportions, not pixels. Also: row hover treatment, and whether rows are clickable
in full or only on the identity cell.

---

### 21.9 `DetailLayout` and `SplitDetailLayout` — PROPOSED

Two variants observed.

**`SplitDetailLayout`** — a context column beside a working column.

```text
│ Context column (~30%)      │ Main column (~70%)                      │
│ ── tabs: Deal Info | Activity                                        │
│ Activity timeline          │ ── tabs: Details | Documents | Tasks …  │
│ ────────────               │                                         │
│ DEAL INFO                  │ Section content                         │
│ ▪ Loan Purpose             │                                         │
│ ▪ Loan Amount              │                                         │
```

- Context column ≈ **30%** of the content area, consistently across screenshots.
- A vertical `--border` rule separates the two. No background change, no elevation.
- The context column holds: its own tab strip, an activity timeline, and a labelled
  metadata list. It is a summary, never a form.
- **Metadata list item**: a small square icon tile, then a label at
  `text-caption text-muted-foreground` above a value at `text-body`.

**`DetailLayout`** — a third column variant appears when the record is a person: a narrow
profile column between the sidebar and the main column, carrying avatar, name, an
identifier line, a row of icon actions, last-activity, then the same tabs and timeline.

**TO VALIDATE:** the breakpoint at which the context column collapses, and where it goes
— above the main content, or into a drawer.

---

### 21.10 `ActivityPanel` — PROPOSED

```text
RECENT ACTIVITY

⬤──  Andrew tagged you in a comment
 │    Today 12:00 PM
 │    [ ✓ Accepted ]
 │
⬤──  Jenny Cook shared deal progress
 │    Today 14:30 PM
 │    [New] → [In progress]
 │
◆──  Eleanor Pena commented on Documents update
      Today 12:00 PM
```

- A vertical connector line runs between events. The last event has no trailing line.
- The node is an **avatar** when a person acted, an **icon badge** when the system did.
- Line one: actor name at `--foreground`, the rest of the sentence at
  `--muted-foreground`. The object of the action is emphasised.
- Line two: timestamp at `text-caption text-muted-foreground`.
- Optional payload beneath: a status chip, or a state transition rendered as
  `[from] → [to]`.
- Header uses `text-overline` uppercase; a count badge and a `View All Activity` link may
  sit on the same row.

---

### 21.11 `MetricGrid` — PROPOSED

```text
┌──────────────────┬──────────────────────┬──────────────────────┐
│ ⓘ Docs Owed      │ ⏱ Docs Pending       │ 🗎 Docs Accepted     │
│ 5                │ 4                    │ 12 /13               │
└──────────────────┴──────────────────────┴──────────────────────┘
  Go To Deals ›
```

- Equal-width cells inside **one bordered container**, divided by internal rules — not
  three separate floating cards.
- Each cell: a small icon + label at `text-body-sm text-muted-foreground` on one line,
  the value beneath at `text-h3`/`text-h2` in **Geist Mono**.
- A ratio renders the denominator smaller and muted (`12 /13`).
- An optional text link sits below the container, left-aligned, with a `›` chevron.

Three cells is the observed default. **TO VALIDATE:** behaviour at 4+ metrics and on
narrow viewports.

---

### 21.12 `RecordCardList` — PROPOSED

Used for tasks and documents. Distinct from `DataTableLayout`: **each record is its own
bordered box with a gap between them**, because each carries multiple lines and its own
actions.

```text
┌────────────────────────────────────────────────────────────────┐
│ ○  Confirmation of income tax payment      Due Date: Today 12:00│
│    Confirmation of property tax payment made up to date         │
│    ⬤ Created by Wade Warren        [ • Important ] [ ⏱ Reminder ]│
└────────────────────────────────────────────────────────────────┘
```

| Row zone | Contents |
|---|---|
| Leading | Status control — a circle, filled with a check when complete |
| Title | `text-body`, `--foreground`. Right-aligned metadata on the same line (due date) |
| Description | `text-body-sm text-muted-foreground`, one line |
| Footer | Attribution (avatar + name) left; contextual action chips right |

- A completed record fills its whole box with `--muted` and keeps a filled check.
- Document rows use the same anatomy with a file icon, a `filename • size • date` meta
  line, and trailing accept / reject / overflow controls.
- Above the list: a segmented control for scope (`All Documents | Portal Milestones`) with
  right-aligned bulk actions.

---

### 21.13 `RightDrawer` — PROPOSED

```text
                    ┌──────────────────────────────────┐
   page, veiled     │ ✕  Lead Detail   [ View Details ]│
                    ├──────────────────────────────────┤
                    │ ⬤ Dorthy Halloway   ⌂ ✉ ☏ ⋯     │
                    │ ┌────────┬────────┬──────┬─────┐ │
                    │ │ Owner  │Location│Partner│Income│ │
                    │ └────────┴────────┴──────┴─────┘ │
                    │ ┌──────────────────────────────┐ │
                    │ │ Progress            76%      │ │
                    │ └──────────────────────────────┘ │
                    ├──────────────────────────────────┤
                    │ Latest Activities ③   View All › │
                    │ …timeline…                       │
                    ├──────────────────────────────────┤
                    │ Notes ④              + Add Note  │
```

- Enters **from the right**, roughly **40%** of the application width.
- The page behind is covered by a **white veil**, not a dark scrim — content stays faintly
  legible so the user keeps their place. This matches "calm" better than a dark overlay.
- **Header:** `✕` close on the left, title beside it, single filled primary action on the
  right. The close control is on the left, opposite the action.
- **Body scrolls**; the header does not.
- Sections are divided by full-width rules, each introduced by a `SectionHeader` with an
  optional count badge and a right-aligned link.
- **Metadata grid:** equal cells in one bordered box, label above value — the same device
  as `MetricGrid`, at a smaller scale.

**TO VALIDATE:** minimum and maximum width, behaviour below the `lg` breakpoint (full
screen? bottom sheet?), and the enter/exit motion. Durations must come from §10.

> ⚠️ **The theme class must be on `document.documentElement`** (§13). A drawer or popup
> rendered through a portal escapes any wrapper and will render light-mode tokens on a
> dark page. Verified failure, 2026-08-31.

---

### 21.14 Overview composition — TO VALIDATE

The overview screen is only visible in a perspective composite, so it is described at low
confidence and **nothing here is a rule yet**.

Observed: a page title with a period label; a headline metric pair (total amount, total
count) with the amount dominant; a large time-series chart with a legend of state chips,
a Line/Bar toggle and a period toggle; a secondary revenue metric; and a recent-records
table beneath.

**Do not build the overview from this description.** Charts need their own token work —
series colours, axes, grid, empty and loading states — none of which is derivable from a
screenshot at an angle.

---

### 21.15 Rhythm, width and density — PROPOSED

| | Rule |
|---|---|
| Content max width | `--container-content` 1280px, centred (§12, VALIDATED) |
| Page padding | Desktop gutter 32px (§12, VALIDATED) |
| Between major sections | 32px |
| Between a section header and its content | 16px |
| Inside a card or row | 12–16px |
| Between sibling cards in a list | 16px |
| Containers | 1px `--border`, `--radius-none`, no shadow. `--shadow-floating` only for portalled surfaces (§8) |

**Density** is high but never cramped: rows are tall enough for two lines and an avatar,
while margins stay tight. The whitespace lives *between* sections, not inside rows.

---

### 21.16 Responsive — TO VALIDATE

No narrow-viewport reference exists. Nothing about mobile behaviour may be inferred from
these screenshots.

What is already binding from §12 and §14 regardless: breakpoints 640 / 1024 / 1280,
gutters 16 / 24 / 32, controls at 16px type below `sm` so iOS does not zoom, and every
component defining its desktop, tablet and mobile behaviour.

Open questions: sidebar behaviour below `lg`; where the context column of
`SplitDetailLayout` goes; whether `DataTableLayout` becomes cards or scrolls
horizontally; whether `RightDrawer` becomes full-screen.

---

### 21.17 Canonical layouts

Defined before individual screens. Do not invent a page architecture per feature.

**Marketing site** — header · hero · content sections · social proof · CTA · footer

**Authenticated product** — `DashboardShell`: sidebar 240px · `TopCommandBar` · content

**Command Center** — business health · activity · pending actions · automation · metrics.
Reads as *"Your business is running."*

**Onboarding** — focused or full-screen, minimal distraction. The primary experience is
*Launch Your Business*.

**Editor** — canvas · block navigation · properties panel · preview · publish · undo/redo.
**Never expose raw JSON to a normal customer.**

**Settings** — section navigation · settings panel · save states · danger zone.

---

#### Switch — variant review, 2026-08-31

The first Switch read its state from colour and thumb position alone. Three variants
were prototyped in the review surface and compared side by side, in both states,
disabled, inside a settings list, and under a greyscale filter — the test colour cannot
pass.

| Variant | Width | Second signal | Greyscale |
|---|---|---|---|
| Original | 36px | none | weak — only fill density changes |
| A — iconic thumb | 36px | check / minus | good |
| **B — labelled track** | **56px** | **the word** | **excellent** |
| C — two-cell track | 40px | hairline + filled cell | fails in dark |

**B chosen.** It is the only one that survives greyscale, a screenshot pasted into a
ticket, and a printed page. Its costs are 20px of width and two translatable strings.

Measured, not assumed, during the comparison:

- B's OFF label at `--muted-foreground` measured **4.35:1** — a fail, since 11px bold is
  not large text. Shipped with `--foreground`.
- B's disabled-on state rendered the word invisible (`--primary-foreground` on a muted
  track). Fixed before the comparison so the judgement was fair.
- C loses almost all separation in dark greyscale: both cells read as dark grey. The
  most visually "Lyra" option was the weakest on the criterion that prompted the work.

---

#### Visual review — Choice, Checkbox, Radio, Switch, 2026-08-31

Reviewed at 1440px and 375px, both themes. Geometry measured in Chrome: checkbox 16×16
radius 0, radio 16×16 round, switch 36×20 radius 0, control border `#949494` light and
`#6B6B6B` dark — the same boundary token as every text control. The switch was later
widened to 56×20 by the variant review above; the rest of this record still holds.

**Five findings — the last two from a second pass in dark mode.**

| | Finding | Fix |
|---|---|---|
| 1 | **The click target was 20px tall, under the WCAG 2.5.8 minimum of 24×24.** Wrapping the label gave the target its width, not its height: a 14px/20px line box is a 20px row | `py-1` on the label row takes it to 28px. All 19 rows now measure ≥24px. Load-bearing padding, commented as such |
| 2 | **A group's description rendered after its options.** It explains the choice, so it has to arrive before the choices do | In group mode the description sits under the legend; the error still comes last |
| 3 | **happy-dom reported that no key toggles a checkbox.** Space, Enter, every variant — all false | **Not a defect.** Chrome confirms Space toggles false → true → false, the switch toggles, and ArrowDown moves the radio selection. happy-dom does not run Base UI's key handling on a `span[role=checkbox]`. The unit test now asserts what happy-dom can observe — Tab reachability — and records that actuation is browser-verified |
| 4 | **In dark mode an unchecked checkbox and radio were unreadable.** `CHOICE_BOX` filled the control with `--background` — the page colour. On white that is invisible-by-accident and harmless; on `#0A0A0A` the control became a hole, and only a thin `#6B6B6B` border said anything was there at all | `bg-background` → `bg-muted`. The control now sits on `#262626` in dark and `#F5F5F5` in light, so it reads as a surface to hit in both. The Switch already used `--muted` for its off track and never had the problem — the fix also makes all three choice controls agree |
| 5 | **The switch thumb was still the page colour.** Fixing the box did not fix the toggle: `SWITCH_THUMB` kept `bg-background`, so the thumb measured **1.31:1** against its off track in dark and **1.05:1** in light. It is the one element that carries the position signal | The thumb takes the same ink as the state word beside it: `--foreground` off, `--primary-foreground` on. Now 14.5:1 off in dark, 18.2:1 off in light, 5.14:1 on in both. Guarded by a unit test |

Finding 3 is the one worth keeping. **A simulated DOM reporting a missing behaviour is
not evidence that the behaviour is missing.** Asserting the negative would have recorded
an accessibility bug that does not exist, and someone would have "fixed" it later.

Finding 5 is the sharper lesson: **fixing the rule is not the same as fixing every place
the rule was broken.** Finding 4 changed `CHOICE_BOX` and stopped there. `SWITCH_THUMB`
carried the identical mistake, one constant lower in the same file, and shipped. The user
had to report the same defect twice.

Finding 4 is the reason the review is done twice. Every contrast rule in §4 was satisfied:
the border cleared WCAG 1.4.11 at 3.72:1 in dark, and 1.4.11 says nothing about the fill.
The control was compliant and still unusable, because what a user looks for is not a
boundary but *something to hit*. **A rule can pass while the thing it exists to protect
fails.** Only a dark screen and a real cursor showed it.

---

### 21.19 Prototype review — 2026-08-31

Five screens were built on invented ZeroCorp content — formation states, plans, identity
documents, agent activity — to test whether §21 is precise enough to build from.

```text
apps/app/src/app/design-system/screens/   overview · businesses · business · documents · drawer
apps/app/src/app/design-system/_prototype/ the pattern implementations
```

**These are prototypes.** They live in the review surface, not in `@zerocorp/ui`, and are
not in the registry. They are promoted only once the patterns are approved.

Verified at 1440px and 375px, light and dark: sidebar 240px on all five, no horizontal
overflow anywhere, every colour resolving from tokens in both themes.

**Four findings.**

| | Finding | Status |
|---|---|---|
| 1 | **Overlapping avatar stacks clip initials.** The reference overlaps photos, which reads fine. With two-letter initials at 24px, a `-8px` overlap hides the first letter — "AO" renders as "AC" | **Fixed.** Initials never overlap. Overlap may return when real photographs replace initials — as a deliberate decision, on that condition |
| 2 | **The drawer covered only the content column**, starting beneath the top bar and stopping short of the bottom | **Fixed.** `fixed inset-0` — the veil and the drawer cover the whole window, sidebar and top bar included, as the reference does. Escape now closes it |
| 3 | **Status badges** are rendered outlined with a square marker, using the five validated colours as border and text — because pastel fills were refused and no subtle scale exists (§21.0) | **PROPOSED.** This is an interpretation, not an observation |
| 4 | **Two token rules were too broad** and fired on correct code — see below | **Fixed** |

**The rules that were wrong, and why it matters**

Extending the token-discipline test to `apps/*` immediately failed on the prototypes:

- `no hard-coded hex` fired on the review page's own **documentation labels**
  (`border --input #949494 · 3.03:1`). Narrowed to `className` and inline `style` only:
  the rule is about styling, not about copy.
- `no arbitrary bracket value` fired on `w-[30%]`, `w-[40%]`, `grid-cols-[1fr_20rem]` —
  the very proportions §21 specifies. Narrowed to **colours and pixel values**, which are
  what the token scales govern. A proportion is not a design token.

One real violation was also caught: `focus:outline-none` on the search inputs, now
`focus:outline-hidden` — the wrapper draws the focus ring, so the inner input must not
draw a second one, but it must still stay visible in forced-colors mode.

> A rule that fires on correct code gets ignored, and then it stops catching the
> incorrect code too. Both narrowings made the rules **stricter in intent** and quieter
> in practice.

**Three more fixed on review, 2026-08-31**

| | Finding | Fix |
|---|---|---|
| 5 | **The split layout stopped mid-air.** The vertical rule between the context and main columns ended wherever the taller column's content happened to end, leaving dead space beneath | `flex-1` on the split fills the remaining viewport height; each column scrolls on its own. §21.9 |
| 6 | **A navigation item lit up for the wrong screen** — the drawer prototype activated "Integrations" | Routes now map to the record they actually show. An active state that lies about where you are is worse than no active state |
| 7 | **The review theme toggle covered page content** | Bottom padding on the content column; the toggle sits below the drawer in the stacking order |

#### Two rules this settles

**A panel that overlays the page covers the whole window** — sidebar and top bar
included — and closes on Escape. Anchoring an overlay to the content column leaves it
starting under the top bar and cut off at the bottom. §21.13.

**A split layout fills the viewport height.** Its dividing rule is a structural line, not
a content boundary; stopping it where content ends reads as a rendering bug.

---

### 21.18 Building a new screen

```text
ZeroCorp Design System  (tokens §4–§14)
        +
Approved components     (registry §19)
        +
Dashboard Visual Language  (this section)
        +
ZeroCorp product requirements
        ↓
a ZeroCorp composition
```

**Never a pixel-for-pixel copy.** The reference settles *where things go and how tight
they are*. It never settles what they look like — that is §4 to §14, and it is already
decided.

Three refusals worth repeating, because they are the easiest to import by accident:

1. **No rounding.** The reference rounds almost everything. We do not.
2. **No pastel status tints.** We have five status colours (§4.3) and no subtle scale.
   Creating one is a token decision, not a screen decision — raise it, do not invent it.
3. **No colour on utility controls.** The reference paints Mail blue and Call green. Teal
   is our only accent and it marks the primary action, nothing else.

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

### 21.20 StatusBadge — treatment review, 2026-08-31

Three treatments of the same six tones, compared on a dense eight-row table, a detail
header and a greyscale panel. Only the container varied — same labels, same icons.

| | Treatment | Outcome |
|---|---|---|
| A | **Outlined chip** — border and label in the status colour | **Chosen as `default`.** Repeats without taking a table over |
| B | **Bare line** — icon in colour, label at `--foreground` | **Not built.** Best label contrast by far (19.8:1 against 4.74–5.36:1) and the calmest table, but too light beside an `h3`. Kept on record; it is the natural third emphasis if a denser surface ever needs one |
| C | **Solid fill** — the container is the colour | **Chosen as `prominent`** |

**What the comparison actually settled.**

*Greyscale is not a side test — it is the test.* §4.3 tuned the five status colours to
sit between 4.83:1 and 5.36:1, a deliberately even set so no status shouts louder than
another. Even contrast has a consequence nobody had written down: **in greyscale all six
tones collapse to nearly the same grey, in every treatment.** Colour separates nothing
for a colour-blind reader. The glyph is the whole system. §14's "colour is never the only
carrier" is not a precaution here — remove the icon and the component stops working.

*A fixed ink cannot sit on a flipping fill.* C was first built with `--primary-foreground`,
the only theme-stable near-white. Measured on the dark-mode tones it gave **1.78:1 to
3.61:1 — all six below the 4.5:1 floor.** The status colours flip with the theme, so the
ink has to flip with them. `--background` already does, and needed no new token:

```text
prominent, ink = --background      light  4.74 – 5.36:1      dark  5.26 – 10.64:1
```

*The review prototype carried a live accessibility defect.* Its `neutral` tone outlined
with `--border` — **1.26:1 light, 1.31:1 dark**, the same WCAG 1.4.11 failure §4.4 had
already fixed for form controls. It had been copied forward before that fix. `neutral`
now outlines with `--muted-foreground` (4.74:1 / 7.85:1), which also makes it consistent
with the other five, where border and label are the same colour.

**Verified in Chrome.** 24 combinations — 2 emphases × 6 tones × 2 themes — all clear
4.5:1 for the label and 3:1 for the border. At 1280px and at 375px every badge measures
22px — one line — and the page has no horizontal overflow at either width. No badge is
focusable, none claims a role, every icon is `aria-hidden`, and a table cell reads
"Status: Active".

**A follow-up correction, same day.** The first build let the label wrap, reasoning from
§5 that a badge must never overflow a narrow column. Review rejected it on sight: a
status on three lines stops reading as a status. The reasoning had been checked against
the wrong thing — the demo that "proved" the wrap worked used a 128px column invented for
the purpose and a whole sentence as a label, neither of which occurs in the product.

The rule is now the other way round, and it is a rule about labels: **a badge is one
line, and a status label is one to three words.** Nothing truncates and nothing has a
fixed width, so no text is ever hidden; the badge simply widens, and the surfaces around
it absorb that — `DataTableLayout` scrolls horizontally, a detail row uses `flex-wrap` so
whole badges move down instead of breaking inside one. Re-checked with the six statuses
in French, the longest 44% longer than its English original: 22px, one line, at 375px.

**The lesson worth keeping: a demo built to prove a behaviour will prove it.** The 128px
column and the sentence-as-label were chosen because they made the wrap visible, which is
exactly why they were not evidence of anything.

---

## 24. Open items

Resolved 2026-08-31: semantic status colours (§4.3), form control boundaries (§4.4, now `#949494` at 3.03:1),
the primitive layer (§2 — Base UI, now the shadcn/ui default), and the status badge treatment
(was item 15 — outlined default plus a solid prominent variant, §19 and §21.20).

Added 2026-08-31: the Dashboard Visual Language (§21). Adopting a structural reference
raises seven questions a screenshot cannot answer — they are items 8 to 14 below.

| # | Item | Blocks |
|---|---|---|
| 1 | **Styling engine — Tailwind v4** — adopted during the Field implementation because Shadcn Studio, the declared primary source (§18), ships Tailwind. Structural: it is not trivially reversible | Recorded for confirmation, not blocking |
| 2 | **Dark mode values** (§4.2) — PROPOSED, need one review pass | Dark mode |
| 3 | **Block taxonomy and hero variants** (§20) — D3 / D4 | The block registry |
| 4 | **Customer art directions** (§16) — 6–8 curated directions | Every customer site |
| 5 | **Flaticon licence** (§11) | Animated icons |
| 6 | **Border hover in dark mode** (§9) | Dark mode components |
| 7 | **`dashboard columns` and `editor widths`** (§12) | Dashboard grid, block editor |
| 8 | **The twelve PROPOSED dashboard patterns** (§21.2–21.13) | Every new screen. None may be built until approved |
| 9 | **Sidebar collapsed state** (§21.3) — width and contents; no reference shows it | The collapse control |
| 10 | **Status badge tints** (§21.0) — the reference fills badges with pastels; we have five solid colours and no subtle scale | `StatusBadge`, table stage cells |
| 11 | **Responsive behaviour of the dashboard patterns** (§21.16) — no narrow reference exists | Sidebar, split detail, tables and drawer below `lg` |
| 12 | **Table row height, column widths, hover and click target** (§21.8) | `DataTableLayout` |
| 13 | **Drawer min/max width and motion** (§21.13) | `RightDrawer` |
| 14 | **Overview and chart tokens** (§21.14) — series colours, axes, grid, empty and loading states | The Overview screen |

---

> **The AI can compose the language. It cannot invent the language.**
