# ZeroCorp — Design System Framework v1

> Status: Framework / co-design document
>
> This document is intentionally incomplete by design.
>
> It defines what must be decided and how the design system must be governed. Concrete values and approved component implementations should be selected progressively by the product/design owner and Claude Code.

---

## 1. Purpose

ZeroCorp must look like one intentional product.

The design system exists to prevent:

- inconsistent screens;
- random component choices;
- arbitrary spacing;
- duplicated patterns;
- AI-invented UI;
- visual drift.

Claude Code must implement the approved system rather than inventing visual decisions screen by screen.

---

## 2. Design Philosophy

Target attributes:

```text
Premium
Clear
Calm
Modern
Operational
Trustworthy
Intelligent
Human
Fast
```

Avoid:

```text
Noisy
Over-decorated
Generic AI SaaS
Dashboard clutter
Unnecessary gradients
Random glass effects
Visual inconsistency
```

Final visual style is intentionally left open for co-design.

---

## 3. Source of Truth

The design system has four layers:

```text
Tokens
  ↓
Foundations
  ↓
Product Components
  ↓
Patterns / Layouts
```

A fifth layer governs public customer websites:

```text
Website Block System
```

---

## 4. Token System

The following categories must be explicitly defined.

### Color

```text
Brand
Primary
Secondary
Accent
Background
Surface
Surface elevated
Text primary
Text secondary
Text muted
Border
Success
Warning
Danger
Info
```

Also define states:

```text
hover
active
focus
disabled
selected
loading
```

Colors must support light/dark mode where the product requires it.

---

## 5. Typography

Define:

```text
Font families
Display scale
Heading scale
Body scale
Label scale
Caption scale
Line heights
Letter spacing
Font weights
```

Typography must be tokenized.

No arbitrary font size should appear in product code unless explicitly justified.

---

## 6. Spacing

Define a spacing scale.

Example structure:

```text
space-1
space-2
space-3
space-4
space-5
...
```

Exact values to be selected during design-system work.

---

## 7. Radius

Define:

```text
small
medium
large
pill
modal
card
```

Do not mix arbitrary radii.

---

## 8. Elevation

Define levels such as:

```text
none
subtle
card
floating
modal
```

Avoid excessive shadow usage.

---

## 9. Motion

Define:

```text
instant
fast
normal
slow
```

Use motion to communicate:

- state change;
- hierarchy;
- progress;
- feedback.

Avoid animation for decoration when it hurts clarity.

---

## 10. Icons

Define:

- icon library;
- icon sizing;
- stroke/fill behavior;
- alignment;
- semantic meanings.

One approved icon family should be the default.

---

## 11. Grid and Layout

Define:

```text
max content widths
page gutters
dashboard columns
editor widths
mobile gutters
breakpoints
```

---

# FOUNDATIONS

## 12. Buttons

Define variants:

```text
primary
secondary
tertiary
ghost
danger
icon
```

States:

```text
default
hover
active
focus
loading
disabled
```

---

## 13. Inputs

Define:

```text
text
textarea
select
combobox
date
number
search
password
file
```

With:

```text
label
description
error
success
disabled
loading
```

---

## 14. Forms

Define:

- field spacing;
- section hierarchy;
- inline validation;
- submission behavior;
- error summary;
- success feedback.

---

## 15. Avatar

Define:

- sizes;
- initials fallback;
- status indicator;
- image behavior;
- accessibility.

---

## 16. Badge / Status

Use a centralized status system.

Example:

```text
success
warning
danger
info
neutral
processing
```

Status meaning must be consistent across:

```text
company formation
payments
domains
email
social
agents
content
CRM
```

---

## 17. Feedback

Define:

```text
Toast
Alert
Banner
Inline error
Empty state
Success state
Loading state
Skeleton
```

---

## 18. Overlay

Define:

```text
Modal
Drawer
Popover
Tooltip
Command menu
Dropdown
Context menu
```

---

# PRODUCT COMPONENTS

## 19. Data Table

Must define:

- pagination;
- sorting;
- filtering;
- column density;
- selection;
- bulk actions;
- loading;
- empty;
- error;
- mobile behavior.

---

## 20. Timeline

Use for:

- formation progress;
- workflow history;
- activity;
- onboarding.

---

## 21. Activity Feed

Must support:

```text
event
actor
time
status
action
```

---

## 22. Progress / Stepper

Primary use:

> Launch Your Business.

Should support:

- completed;
- current;
- locked;
- optional;
- failed;
- in-progress.

---

## 23. Credit Meter

Must communicate:

```text
included
used
remaining
reset
additional usage
```

Without making the billing model confusing.

---

## 24. Agent Activity

Show:

```text
agent
action
time
status
cost/usage where useful
result
```

---

## 25. Business Status Card

Reusable for:

```text
Company
Website
Domain
Email
Marketing
Leads
Automation
```

---

## 26. Document Viewer

Support:

- preview;
- metadata;
- secure access;
- download permissions;
- audit context.

---

## 27. File Uploader

Must support:

- upload progress;
- validation;
- size limits;
- type validation;
- error;
- retry;
- success.

---

## 28. Billing Components

Define:

```text
Plan card
Usage summary
Credit balance
Invoice list
Payment status
Upgrade/downgrade
```

---

## 29. Lead Components

Define:

```text
Lead table
Lead profile
Lead timeline
Lead status
Opportunity card
Campaign status
```

---

## 30. Notification Center

Define:

```text
Unread count
Grouped notifications
Filtering
Mark read
Notification preferences
Actionable notifications
```

---

# LAYOUT PATTERNS

## 31. Marketing Site

Define:

```text
Header
Hero
Content sections
Social proof
CTA
Footer
```

---

## 32. Authenticated Product

Base shell:

```text
Sidebar / navigation
Top bar
Content
Contextual actions
```

---

## 33. Command Center

The main dashboard should feel like:

> “Your business is running.”

Use:

```text
business health
activity
pending actions
automation
metrics
```

---

## 34. Onboarding

Full-screen or focused layout.

Primary experience:

```text
Launch Your Business
```

Should minimize distractions.

---

## 35. Editor

The website/editor experience must have:

```text
canvas
block navigation
properties panel
preview
publish
undo/redo
```

Avoid exposing raw JSON to normal customers.

---

## 36. Settings

Consistent settings pattern:

```text
section navigation
settings panel
save states
danger zone
```

---

# WEBSITE BLOCK SYSTEM

## 37. Block Philosophy

Website AI is not a freeform designer.

The AI chooses from:

```text
approved block types
approved variants
approved themes
approved content structures
```

The renderer owns visual implementation.

---

## 38. Initial Block Families

Target:

```text
Hero
Logo Cloud
Features
Services
Stats
Testimonials
Process
Pricing
FAQ
Team
CTA
Contact
Gallery
Case Study
Comparison
Announcement
Article Highlight
Quote
Form
Before/After
```

Not every block must be implemented at once.

Quality over quantity.

---

## 39. Variant Strategy

A mature block may have approximately 10 approved variants.

Example:

```text
Hero
├── centered
├── split
├── image-right
├── image-left
├── product
├── minimal
├── editorial
├── conversion
├── video
└── dark
```

Variants should share the same design-system foundations.

---

## 40. Combination Rules

Unique websites come from:

```text
block selection
+
variant selection
+
content
+
theme
+
spacing composition
```

Not from allowing the AI to invent CSS.

Add guardrails such as:

- max consecutive heavy sections;
- hero variant compatibility;
- CTA hierarchy;
- typography rhythm;
- mobile behavior;
- repeated component avoidance.

---

## 41. Website Theme System

Themes should be data-driven.

Example conceptual model:

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

Theme values must come from approved tokens.

---

## 42. AI Design Restrictions

AI may:

- choose a block;
- choose a variant;
- choose content;
- choose from approved theme tokens;
- reorder approved blocks.

AI may not:

- invent CSS architecture;
- invent arbitrary components;
- invent unsupported variants;
- introduce random fonts;
- introduce random colors;
- create uncontrolled layout behavior.

---

## 43. Empty / Loading / Error States

Every screen and reusable component must define:

```text
loading
empty
error
success
partial
```

This is part of the design system, not an afterthought.

---

## 44. Accessibility

The design system must include:

- focus visibility;
- keyboard interaction;
- semantic structure;
- accessible labels;
- status announcements where needed;
- sufficient contrast.

---

## 45. Responsive Behavior

Every component must define:

```text
desktop
tablet
mobile
```

Do not treat responsive design as a final patch.

---

## 46. Component Acquisition Workflow

For each important component:

```text
1. Find candidate component.
2. Check license.
3. Check maintenance/maturity.
4. Review accessibility.
5. Review API ergonomics.
6. Adapt to ZeroCorp tokens.
7. Add to approved component registry.
8. Document usage.
9. Reuse everywhere.
```

The selected implementation becomes the official project pattern unless deliberately replaced.

---

## 47. Design Review Workflow

For each component family:

```text
Product/design owner
+
Claude Code
→
select
→
adapt
→
implement
→
document
→
reuse
```

Claude Code may propose improvements, but must not silently replace approved components.

---

## 48. Final Design-System Rule

> **The AI can compose the language. It cannot invent the language.**

