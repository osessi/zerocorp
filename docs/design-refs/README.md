# Design references — slots waiting on an owned asset

> **STATUS: BRIEF.** Nothing in this folder ships. The `.svg` files are geometry studies
> drawn here to show the intent; they are not final art and are not referenced by any
> component.

Everything else in the 2026-09-04 visual architecture pass was rebuilt in code. These are
the four things that are **assets, not code**, and therefore cannot be. Each has a slot in
the product that is built around it and renders correctly while the slot is empty.

**Nothing is blocked on these.** The product ships without them today.

---

## Why there are only four

The illustration position, decided 2026-09-04 (`DESIGN_SYSTEM.md` §25.8): **we own none
for empty and loading states.** Those are the real thing at 20% opacity behind the
message, drawn from the product's own vocabulary. No asset, no licence, no attribution,
automatic dark mode, and a new state takes fifteen minutes instead of a commission.

The entire illustration budget is the four moments below, and it is spent there because
they are the only four points in the product where a founder deserves warmth rather than
information.

---

## The shared specification

Applies to all four. Written so the pieces can be produced without further design input.

```text
Format      SVG, 320 × 240 viewBox
Stroke      1.5px uniform, BUTT caps, MITRE joins, no rounded terminals anywhere
Fill        the page ground plus ONE tint at 12–20%. No gradients, no shadows
Geometry    orthogonal and 45° only. One arc per piece maximum. Radius 0 throughout
Subject     the ARTEFACT, never a metaphor
People      NONE. The product has no faces; adding them here would be the only place
Type        Geist Mono where a piece contains a number, at the size shown in the study
Motion      exactly one element per piece separable onto its own layer, for a ±2px
            cursor parallax at 300ms ease-out
Dark mode   line work → --surface-focal-foreground; tint → the dark wash of the same hue
Deliverable light.svg + dark.svg per piece, plus the parallax element as its own layer
Ownership   work-for-hire, assigned outright. No stock, no derivative of any existing
            illustration set, no AI-generated asset traced from a reference
```

### The parallax, and where it came from

Twenty's empty states are two raster plates: a background at max 160×160 and a smaller
foreground at max 130×130 that translates on a **±2px** offset driven by cursor position
across the viewport, `transition: transform 300ms ease-out`, returning to centre on
`mouseleave`.

The illustrations themselves are unremarkable. **The 2px cursor-linked offset is the
entire effect**, and it is what makes a static screen feel alive.

The mechanism is an idea and was taken. The 64 PNGs are **AGPL-3.0** (they live in
`twenty-front/public`, not in the MIT `twenty-ui`) and were not, and must not be, even
recoloured: a derivative of a copyleft asset carries the copyleft.

---

## The four slots

### 1. Company formed → [`company-formed.svg`](./company-formed.svg)

**Slot:** the milestone card shown once, when the formation order clears
`operator_review` and the entity legally exists.

A filed document with a seal. Two stacked sheets, the rear one offset 10px down and right
and filled with the Build tint at ~15%, the front one white with a folded top-right
corner drawn as two 45° strokes. Five rule lines suggest text without spelling any, and
the fourth line is deliberately full-width so the block does not read as a paragraph that
trails off. A seal at lower-left: an 18px-radius ring with a check inside it, in
`--journey-build-ink`, and this is the piece's only saturated element. **The seal is the
parallax layer.** The subject is the filing, not a building and not a handshake.

### 2. EIN issued → [`ein-issued.svg`](./ein-issued.svg)

**Slot:** the milestone card when the IRS number lands.

A number plate. Two stacked rectangles, rear offset 8px in the Build tint, front white,
with two horizontal rules in `--journey-build-edge` that make it read as a plate rather
than a card. The number is set in **Geist Mono at 26px with 4px letter-spacing**, in
`--figure-ink`, and it is the largest thing in the piece because it is the thing that
arrived. A small plus in `--journey-build-ink` sits lower-right as the parallax layer.
The digits shown in the study are a placeholder format, not a real EIN.

### 3. Site live → [`site-live.svg`](./site-live.svg)

**Slot:** the milestone card when DNS verifies and the site answers on the founder's own
domain.

A browser frame, Launch tint. Two stacked rectangles again, the rear offset 8px in
`--journey-launch-wash`, the front white with a chrome bar and three 8px dashes. Four
content rules inside, the second and third full-width. A cursor arrow in
`--journey-launch-ink`, drawn as a filled polygon with a 1.5px stroke, sitting over the
lower-right of the frame. **The cursor is the parallax layer**, and it is the piece's
whole point: the site is not just built, someone can be on it.

### 4. First customer → [`first-customer.svg`](./first-customer.svg)

**Slot:** the milestone card when a prospect first replies.

Two overlapping avatar rings, 44px radius, the left one in `--foreground` carrying an
abstract person, the right one in `--primary` carrying a check. Brand teal rather than a
journey tint, because this is the outcome the whole product exists to produce and it does
not belong to one stage. The overlap is 60px, so the rings read as two parties meeting
rather than as a stack. **The right ring is the parallax layer.** No faces: the left
figure is a circle and an arc, and it must stay that abstract.

---

## What Sêssi needs to bring back

Per piece: `light.svg`, `dark.svg`, and the parallax element as a separate `.svg` layer,
all four on the shared specification above, assigned outright.

When they land, each goes into `docs/licenses/README.md` as an owned asset with the
commission date, and the milestone card component gets its `graphic` prop wired.
