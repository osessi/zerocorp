> **STATUS: STUDY.** Not a specification. Nothing here is authoritative until it is
> adopted into `DESIGN_SYSTEM.md` by an explicit decision. It records what four
> reference products do, what ZeroCorp does instead, and what I propose we change.

# Visual architecture: reference study

Date: 2026-09-04
References read: Twenty, Macro, Midday, Dub
Deliverable: study, then a proposed architecture. No code written, no dependency added.

---

## 0. The verdict, first

You asked for judgement rather than agreement. Here it is.

**The token system is not the problem, with one exception that is real and that I will
name.** The contrast work, the every-ground rule, the audits: sound, unusually rigorous,
and better documented than anything in the four reference repositories. Twenty's light
theme is Radix grays with no recorded measurement. Midday's is four hand-picked HSL
triples. Neither could tell you what `--muted-foreground` measures on a sunken card.
Ours can. Keep all of it.

**The problem is that we have a token layer and a component layer and nothing in
between.** There is no composition layer. Seven screens share one skeleton because the
skeleton is the only thing on offer:

```text
Tabs
  └ mx-auto max-w-(--container-content)          1280px, on every screen
      └ flex flex-col gap-8 px-5 sm:px-8 py-8    identical padding, on every screen
          └ Panel  title=h3  count               identical header, on every screen
              └ Rows / FactGrid                  two shapes, on every screen
```

`Panel` has no size variants. `Row` is always `px-5 py-3.5` with a four-side border.
`FactGrid` is always 1/2/4 columns. `Empty` is one shape. A designer given those five
primitives cannot make two screens look different, however good the colours are. The
monotony is guaranteed by the primitives, not caused by the palette.

Measured: the byte-identical line

```text
mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8
```

appears **15 times across 5 files** (`company` 4, `content` 3, `email` 3, `leads` 3,
`website` 2), and `max-w-(--container-content)` appears **20 times** across the product
screens. That repetition is the visual monotony, literally. It is not a metaphor for the
problem; it is the problem, copied and pasted.

### The one thing in the token layer that is genuinely holding us back

In light mode:

```text
--background        #ffffff
--surface           #ffffff      identical
--surface-elevated  #ffffff      identical
--surface-sunken    #f0f0f0
--surface-focal     #14181b
```

Three of the five collapse to white. Light mode therefore has **one usable ground plus a
well**, and every hierarchy signal in the product has to be carried by a border. That is
exactly why the screens read as a stack of boxes: they are a stack of boxes, because a
box is the only tool available.

Dark mode does not have this problem. It has a real ladder: `#0a0a0a` page, `#141414`
surface, `#1c1c1c` elevated, `#080808` sunken. Four perceptible steps. **Our dark mode is
architecturally healthier than our light mode**, and I would expect it to look
noticeably better on the same screens. That asymmetry is the tell.

`tokens.css` records why: darkening `--background` to `#FCFCFB` was measured and rejected
because it pushed `success-`, `warning-` and `processing-subtle` to 1.07 to 1.10, under
the §4.5 perceptibility floor. That rejection is correct, and it rested on an assumption
the composition architecture I am proposing changes: **it assumed status tints sit on the
page.** In the architecture below they sit on cards, which sit on the page. If the page
recedes and the card stays white, the tints are measured against the card and are
unaffected.

Midday does exactly this and it is the single clearest difference between their light
mode and ours:

```text
Midday   --background  0 0% 100%     pure white page
         --card        45 18% 96%    warm off-white card
```

Their card is *warmer and darker* than the page. Ours is identical to it.

I am not asking to reopen the contrast work. I am asking to reopen **one measurement**,
narrowly, with the question restated: *given tints now sit on cards, can the page recede
to roughly `#FAFAF9` while `--surface` stays `#FFFFFF`?* If the answer is no, everything
else in this study still stands and we carry hierarchy on density and typography instead.
That is your call, not mine, and it is the only token question I am raising.

Everything else that follows is composition, motion, density and assets.

---

## 1. Screen composition

### What they do

**Midday is the important one, and it is the answer to your question directly.** Their
screens do not resemble each other because they use *structurally different
compositions*, not different content in the same frame:

| Screen | Composition |
|---|---|
| Overview | centred **768px** column (`max-w-3xl`), vertically centred in `min-h-[calc(100vh-120px)]`: greeting, a prose sentence, an input, quick actions, then four cards |
| Transactions | **full-bleed**, no max width, a virtualised table filling `calc(100vh-200px)` with internal scroll and sticky columns |
| Settings | narrow forms column |
| Vault | file grid |

Their app layout applies `md:ml-[70px]` and `px-4 md:px-8` and then **stops**. There is no
container. Each screen decides its own width. Overview chooses to be narrow. Transactions
chooses to be wide. That is a decision per screen, made once, and it is why they look
like different places.

**Dub** does put a container on analytics (`mx-auto grid max-w-screen-xl gap-5 px-3
lg:px-10`) but the analytics page is a 2-column card grid, and its events table is
full-bleed. Same principle: the container is a property of the screen, not of the shell.

**Macro** takes it furthest with a `Panel` that is a CSS grid of named areas:

```text
grid-template-areas:  "header" "toolbar" "body" "footer"
grid-template-rows:   auto     auto      minmax(0,1fr)  auto
```

The body is `minmax(0,1fr)` and scrolls **inside itself**. Header, toolbar and footer are
`auto` and never move. The page itself never scrolls. That is the difference between a
document and an application, and it is one CSS grid.

Macro also has a `Layer` primitive worth stealing outright. `<Layer depth={n}>` writes
`data-depth` on a wrapper, and CSS maps `data-depth` to `--layer-surface` and
`--layer-inset`. Nesting auto-increments. A panel inside a panel gets the next surface
step **without anyone choosing a colour**. Depth becomes contextual rather than
hand-assigned, which is precisely the thing that stops a card-in-a-card from reading flat.

**Twenty** keeps a fixed shell (resizable rail 180/220/350, collapsed 40, page bar min
32px) and varies the interior through a widget system: a page layout is data, and widget
types are `graph`, `record-table`, `notes`, `tasks`, `calendar`, `iframe`, `field`.
Different screens are different widget mixes.

### What we do

One container width (1280px) applied by every screen. One gutter. One vertical gap
(`gap-8`). The page scrolls; nothing scrolls internally except two panels on the
dashboard. `Panel` is a heading plus children with no structural slots.

Our dashboard is the exception that proves the rule: it is the only screen that composes
(a KPI row, a 3+1 chart row, a 2fr/1fr split, an activity section) and it is the only
screen anyone would describe as designed.

### What to change

1. **Delete the universal container.** Replace one width with three named widths chosen
   per screen: `reading` (768px, centred), `work` (1280px, centred), `full` (viewport,
   32px gutters). A screen declares which one it is.
2. **Give `Panel` real slots**: header, toolbar, body, footer, with the body owning its
   own scroll. Take Macro's grid verbatim as an idea.
3. **Make the app frame own the height.** The shell is `100vh`; panels scroll internally;
   the page does not scroll. This is the single largest perceived-quality change available
   and it costs almost nothing.
4. **Adopt a depth context.** Ours can be simpler than Macro's: a `Layer` wrapper writing
   `data-depth` that maps to `--surface-*`. It is the mechanism that makes nesting legible
   without anyone picking a colour.

---

## 2. Table and row density

### What they do

**Midday's transaction table is the density reference.** Row height **45px**, virtualised,
sticky first three columns, resizable and reorderable columns. Widths, measured:

| Column | size | min | max | resize |
|---|---|---|---|---|
| select | 50 | 50 | 50 | no |
| date | 110 | 110 | 110 | no |
| description | 320 | 200 | 600 | yes |
| amount | 170 | 100 | 400 | yes |
| category | 250 | 150 | 400 | yes |
| counterparty | 200 | 120 | 400 | yes |
| tags | 280 | 150 | 500 | yes |
| account | 250 | 150 | 400 | yes |
| method | 140 | 100 | 300 | yes |
| assigned | 220 | 150 | 400 | yes |
| status | 160 | 120 | — | yes |

The shape of that table: **identity columns are fixed and narrow, content columns are
wide and elastic, and nothing is under 100px.**

Three details worth more than the numbers:

- **Every cell is a typed, memoised component.** `DateCell`, `DescriptionCell`,
  `AmountCell`, `TagsCell`, and inline editors `InlineSelectCategory`,
  `InlineAssignUser`, `InlineSelectTags`. A row is composed of cell *types*, not of
  ad-hoc spans. This is why their rows carry seven things without looking crowded: each
  cell type has one rendering rule, everywhere.
- **The overflowing tag row gets a gradient fade mask that disappears on `group-hover`.**
  Overflow is hidden at rest and scrollable on hover. No truncation ellipsis, no growth.
- **Sticky cells carry the hover colour explicitly** (`group-hover:bg-[#F2F1EF]`) so the
  hover band is unbroken across the sticky boundary. Easy to miss, very visible when wrong.

**Twenty goes further and it is the most important single finding in this section.** Their
resting table has **no row borders at all.** Row height 32px, cell padding 8px, min column
width 104px, checkbox column 28px, drag handle 12px. Borders appear **only** on hover,
focus or active, drawn into a **portal** overlay with `outline: 1px solid` and
`outline-offset: -1px`, so the outline never shifts layout.

They separate four independent states that we collapse into one:

```text
hovered    the cursor is here                portal overlay, subtle outline
focused    the keyboard is here (soft)       accent-quaternary fill + medium border
active     this cell is being edited         the edit input, in a portal
selected   this row is in the selection      checkbox state, separate from all of the above
```

**Dub's `BarList`** is the cheapest density device in the whole study. A row is
`px-4 py-1` with `h-8` content (≈40px), and behind the content sits a `motion.div` at
`z-index: -10` whose width is `value / maxValue` as a percentage, `origin-left`,
`rounded-md`, animated over **0.3s easeOut**. The title container is
`max-w-[calc(100%-2rem)]` and shrinks to `calc(100%-5rem)` on `group-hover` over 300ms,
which reveals the row action **without any layout shift**. The number uses NumberFlow so
it counts up.

A ranked list with a bar behind each row reads as populated at ten rows. The same ten rows
without it read as empty.

### What we do

`Row` is `px-5 py-3.5` with a four-side border and a hover that changes background and
border. Roughly 52px. Every row on every screen is that row. There is no cell type
system: `leads/page.tsx` writes six raw `<span>` elements with hard-coded widths
(`w-52`, `w-44`, `w-12`) inline in the page.

`DESIGN_SYSTEM.md` §24 item 12 already records "Table row height, column widths, hover and
click target" as an open question. This study answers it.

### What to change

1. **Two densities, not one.** `compact` at 36px for scanning lists, `comfortable` at
   48px for lists with avatars or two-line cells. Not 52px for everything.
2. **Typed cells.** `<Cell.Text>`, `<Cell.Number>`, `<Cell.Status>`, `<Cell.Avatar>`,
   `<Cell.Meter>`, `<Cell.Action>`. Column widths declared once, not per screen.
3. **Reconsider the four-side border on rows in a list.** This is the one place I think
   the standing "no single-side borders" rule is fighting us, and I want to be candid
   rather than quietly work around it. The rule exists because seams welded rows into a
   slab, which was correct. But the reference answer is not "border every row" and it is
   not "border-bottom every row" either. It is **no border at rest, a border on hover**,
   which satisfies the rule's intent (nothing is welded) while removing the boxes. A row
   that has no edge cannot be welded to its neighbour.
   I would not change this without your explicit agreement, because it touches a standing
   rule.
4. **Take the bar-behind-row device** for anything ranked or proportional: plan steps by
   area, keywords by volume, leads by stage.
5. **Take the hover-reveals-action trick.** Reserve the space by shrinking the title's max
   width on hover, never by mounting a button that pushes layout.

---

## 3. Navigation architecture

### What they do

**Midday's sidebar is 70px and expands to 240px on hover**, over 200ms
`cubic-bezier(0.4, 0, 0.2, 1)`. The mechanics are worth copying exactly:

- The icon sits in a fixed 40x40 box at `left: 15px` and **never moves**.
- The active background is a separate element that grows from `40px` to
  `calc(100% - 30px)`.
- The label fades in at `left: 55px`.
- Sub-items appear with a stagger: `transitionDelay: 40 + index * 20` ms entering,
  `index * 20` ms leaving. The container animates `max-h-0` to `max-h-96` over 300ms.
- Row height 40px, child row 32px, icons 20px.
- Active = `#f7f7f7` background with a `#e6e6e6` border on all four sides.

The result: the rail costs 70px of screen at rest and gives full labels and sub-navigation
on hover. **Their content area is 170px wider than ours on every screen.**

**Twenty** has a resizable rail (min 180, default 220, max 350, collapsed 40, resize edge
8px, drag threshold 5px), nav rows of 28px with 2px between siblings, active state a
transparent light background with **no border**, and a command menu that slides a 500px
side panel from `x: 100%` to `x: 0` over 300ms.

Their `TabList` is worth taking: 40px high, 4px gaps, a 1px `::after` underline across the
full width, an option to **centre the tabs**, and it measures tab widths and overflows the
remainder into a "more" dropdown rather than scrolling. The centring option validates the
standing rule that our sub-tabs are centred in the workspace.

### What we do

240px fixed rail, journey-tinted blocks, icon tiles, counts. Sub-navigation is our `Tabs`
component holding local state, with a `hashchange` listener so a tab can be linked.

The rail is genuinely good and the journey tints are a real idea that none of the four
references have. I would not touch it except for width.

### What to change

1. **Make the rail 72px at rest, 240px on hover.** Keep the journey tints; they become the
   tint on the icon tile when collapsed and the tint on the block when expanded. This buys
   168px of content width on every screen at zero design cost.
2. **Keep the hash-driven tabs.** They are better than Twenty's, because they are
   linkable.
3. **Add the overflow-to-dropdown behaviour** to `Tabs`, so a screen with seven
   sub-sections does not scroll horizontally.
4. **The command menu is the missing piece.** We have `CommandMenu.tsx` in
   `packages/ui/src/overlay`. It is not wired into the shell. Twenty's is the spine of
   their whole product. This is a large perceived-quality win for a small amount of work.

---

## 4. Data display, and what makes a screen look populated

This is where the gap is widest and where the cheapest wins are.

### What they do

**Midday's charts are monochrome by design**, and they declare it in tokens:

```text
--chart-actual-line     #000000     the real series is black
--chart-forecast-line   #666666     the projection is grey
--chart-bar-fill        #000000
--chart-bar-fill-secondary  #6666664d
--chart-grid-stroke     #e6e6e6
--chart-axis-text       #707070
--chart-pattern-bg      white       a HATCHED fill for the secondary series
--chart-pattern-stroke  #707070
```

The secondary series is distinguished by **pattern**, not by hue. That is the same
reasoning as our §14 shape-not-colour rule, applied to charts, and it is better than what
we do.

**Twenty's chart constants**: grid lines dashed at 4 on, 4 off; bar max width 32px; inner
padding 4; outer padding 4; hover brightness 0.85; tick font 11px; tick size 0; max 6
value ticks, min 2; minimum 100px per tick; animation easing exponent 3 (cubic ease-out);
tooltip min 160 / max 300 / scroll cap 120.

Their aggregate (KPI) widget: value at the largest type size, trend percentage at the
smallest size in muted, a 20px trend arrow, turquoise up and red down, laid out
`justify-content: space-between` across the full width.

**Midday's KPI card**: `min-h-[110px]`, `p-5`, label at `text-xs` muted pinned to the top,
value at `text-xl` at the bottom, detail at `text-xs` muted **inline after the value**,
and **the whole card is a link** to the screen that acts on it, with a hover that changes
both background and border over 300ms.

**Dub's small data primitives**, all pure SVG, no dependency:

- `ProgressCircle`: a 100x100 viewBox, `strokeWidth={16}`, `strokeDasharray` for the arc,
  rotated -90deg, rendered at `size-3` (**12px**). A donut small enough to sit inline in a
  table cell next to text.
- `ProgressBar`: animates `width: 0` to `n%` with a spring over 0.5s at 0.2s delay.
- `MiniAreaChart`: visx, `curveNatural`, padding `{top: 8, right: 2, bottom: 2, left: 2}`,
  gradient fill. Padding of 2px means the sparkline fills its box entirely.
- `NumberFlow` for animated counters.

**And the single best composition idea in the study**, from Midday's Overview: the KPI
grid is preceded by **a prose sentence built from real data**, where the actionable noun
is a link with a **dashed underline** (`border-b border-dashed border-[#878787]/30`):

> You have **3 invoices outstanding**, totaling $12,400.

It rotates through insights with a y-slide plus opacity plus `blur(4px)` to `blur(0px)`,
0.32s, ease `[0.16, 1, 0.3, 1]`.

### What we do

Three chart types (`PublishingChart`, `WorkloadChart`, `PipelineChart`), a four-up KPI
row, an activity panel, an avatar stack, a segmented progress bar. Better than I expected.
The `Kpi` component is close to Midday's already.

What we have none of: sparklines, in-row bars, in-row donuts, animated counters, hatched
fills, or prose summaries.

### What to change

1. **Add the four small primitives**: `Meter` (12px inline donut), `Bar` (in-row
   proportional fill), `Sparkline` (24px trend), `Counter` (animated number). All four are
   under 40 lines of SVG each. They are what makes a row carry seven things.
2. **Make the KPI card a link.** It is one line and it converts four dead numbers into
   four entry points.
3. **Add the prose summary to Overview.** We already compute `outcomeFor` and `waitingFor`
   per step; the data exists. "ZeroCorp filed your company on 12 August and is waiting on
   your EIN" is worth more than four numbers, and it is the voice the product should have.
4. **Take the hatched secondary fill.** It fits §14 and it means a two-series chart works
   in greyscale.
5. **Take Twenty's chart constants wholesale**: dashed 4/4 grid, bar max 32px, tick font
   11, tick size 0, six ticks maximum. They match the "charts are dashed regions" rule
   already in force.

---

## 5. Vertical rhythm

### What they do

| | Twenty | Midday | Macro |
|---|---|---|---|
| base unit | 4px | 4px | 4px |
| between siblings | **2px** | 4px | 4px |
| table row | 32 | 45 | — |
| nav row | 28 | 40 | ~32 |
| nav child row | — | 32 | — |
| panel/tab header | 32 / 40 | 70 (logo) | 40 |
| section gap | 12 to 16 | 20 | 12 to 16 |

Twenty's `betweenSiblingsGap: 2px` is the striking one. Items inside one group are 2px
apart. Groups are 16px apart. **The ratio is 8:1**, so the grouping is unmistakable.

Ours is `gap-2` (8px) between rows and `gap-8` (32px) between sections: a 4:1 ratio. And
`gap-4` (16px) inside `Panel`. Three gaps that are all within one doubling of each other,
which is why the page reads as evenly spaced mush.

### What to change

Widen the ratio. Proposed:

```text
2px    between rows in one list        the list is one object
16px   between blocks in one section   the blocks are siblings
40px   between sections                the sections are different subjects
```

That is a 1:8:20 ratio and it does the work that `gap-8` everywhere cannot.

Row heights, proposed: 36 compact, 48 comfortable, 40 nav, 32 nav child, 44 tab strip.

---

## 6. Empty and loading states

This is the highest-value section relative to effort, and the answer needs no assets at
all.

### What they do

**Midday has three different empty states for one table**, distinguished by *cause*:

| State | Cause | Action offered |
|---|---|---|
| `NoResults` | filters matched nothing | "Clear filters" |
| `NoTransactions` | there has never been data | "Connect bank account" |
| `ReviewComplete` | the queue is finished | **none** ("All done") |

Three different messages, three different actions, one of which is deliberately no action
because finishing is not a failure.

**And the mechanism underneath is the best trick in the study.** The empty state renders
**the real table skeleton behind it**, at:

```text
opacity-20  blur-[7px]  pointer-events-none
```

with the message floating over it. The screen is never blank. It shows you the shape of
what will be there.

The skeleton is **derived from the column definitions** through `meta.skeleton`:

```text
meta: { skeleton: { type: "text",     width: "w-16" } }   date
meta: { skeleton: { type: "text",     width: "w-40" } }   description
meta: { skeleton: { type: "checkbox"              } }     select
```

So the loading skeleton automatically has the same column widths, the same sticky columns
and the same shape as the real table. Skeleton-to-content has no jank because the skeleton
*is* the table.

**Macro's `EmptyStatePanel`** solves a different problem: a **fixed 28% top spacer**
(`basis-[28%]`, `mobile:basis-[8%]`) and a **fixed-height graphic box** (`h-48`, 192px), so
that the title lands on **the same baseline in every empty state in the product**,
regardless of how much text is below it. Left-aligned by default; centred only for trivial
"no results" cases.

**Dub's `EmptyState`** proves you need no illustration at all: a 64px bordered tile
holding a 24px icon, a title, a balanced description, an optional "Learn more ↗", then the
action. That is the whole component and it looks finished.

**Twenty's** is the one that needs assets, and I cover it in §8.

### What we do

One `Empty`: dashed border, sunken ground, title, body, optional action. Used identically
for "no pages yet", "no lists yet", "nothing found yet", "no keywords". The copy varies;
the shape never does. And there is no distinction between never-had-data and
filtered-to-nothing.

Loading: `Skeleton.tsx` exists but is not composed from column definitions, so a skeleton
does not match the table it precedes.

### What to change

1. **Three empty states, by cause**: `first-run` (never had data, offers the primary
   action), `filtered` (offers "clear filters"), `complete` (offers nothing, says well
   done). This alone will make the product feel considered.
2. **The ghost skeleton behind the empty message.** `opacity-20 blur-[7px]
   pointer-events-none`. Zero assets, zero licence, very large effect.
3. **Derive skeletons from column definitions.** Once we have typed cells (§2) this is
   nearly free.
4. **Fix the empty-state baseline** with Macro's fixed top spacer, so every empty state in
   the product aligns.

---

## 7. Motion

You are right that this is a large part of why the product feels dead. We have five
durations and three easings defined and almost nothing that uses them for anything except
hover colour.

### What they do, measured

**Twenty**

```text
instant   75ms
fast     150ms
normal   300ms
slow    1500ms
clickable background transition:  100ms ease
side panel open:  x 100% → 0, width 500px, 300ms
expand/collapse:  Base UI Collapsible, height + opacity, 300ms ease-in-out,
                  via --collapsible-panel-height and data-starting-style / data-ending-style
```

**Macro**

```text
menu open              120ms  cubic-bezier(0.16, 1, 0.3, 1)
dialog overlay         120ms  ease-out
dialog content         160ms  cubic-bezier(0.16, 1, 0.3, 1)
slide in               150ms  cubic-bezier(0.16, 1, 0.3, 1)
accordion up/down      150ms  ease-out
swipe out              100ms  ease-out
press (transform)      100ms  cubic-bezier(0.34, 1.56, 0.64, 1)   overshoot
indeterminate bar      1.1s   ease-in-out infinite
```

**Midday**

```text
sidebar expand         200ms  cubic-bezier(0.4, 0, 0.2, 1)
nav child stagger      40 + index*20 ms in, index*20 ms out
nav children container 300ms  ease-out  (max-h 0 → 96)
insight rotation       320ms  ease [0.16, 1, 0.3, 1], y-slide + opacity + blur(4px)→(0)
card hover             300ms
```

**Dub**

```text
bar fill               300ms  easeOut
progress bar           500ms  spring, 200ms delay
list item              spring, scale 0.8 → 1
stagger child          400ms  spring, y 20 → 0
tab item               200ms, y -10 → 0
hover reveal action    300ms  (max-width transition)
```

Three things are consistent across all four:

1. **`cubic-bezier(0.16, 1, 0.3, 1)` appears in Macro, Midday and Dub.** It is the
   expo-out curve: leaves instantly, settles long. It is the house curve of this entire
   category of product. Our `--ease-glide` is `cubic-bezier(0.32, 0.72, 0, 1)`, which is
   the same family and, if anything, slightly better.
2. **Overlays are fast (100 to 160ms) and content is slower (200 to 320ms).** Chrome
   should arrive; content should settle.
3. **Macro's `hover-transition-bg` is the detail I like most in the study:**

   ```text
   transition: background-color var(--transition);
   &:hover { transition: none; }
   ```

   The hover applies **instantly** and fades **out** on leave. A hover that fades in feels
   laggy; a hover that fades out feels smooth. We currently fade in both directions at
   260ms, which is why our rows feel slightly unresponsive.

### What we do

`COLOR_TRANSITION` and `CONTROL_TRANSITION` are correct and well-reasoned. `ENTER`,
`staggerStyle` and the keyframes (`zc-rise`, `zc-fade`, `zc-pop`, `zc-slide-in`,
`zc-highlight`) exist. They are used on the dashboard step list and essentially nowhere
else. Nothing animates on route change, panel open, tab switch, row expansion,
skeleton-to-content or optimistic update.

### What to change

Define a motion **vocabulary** with named jobs, not just durations:

```text
press        100ms   ease-glide      1px, on every control            already have this
hover-in       0ms                   instant                          CHANGE: currently 260ms
hover-out    150ms   ease-out        fades away
tab-switch   150ms   ease-out        y -8 → 0, opacity                 NEW
panel-open   200ms   ease-glide      x 100% → 0                        NEW
row-expand   200ms   ease-out        height + opacity, Base UI         NEW
enter        250ms   ease-out        y 8 → 0, opacity                  have it, unused
stagger       40ms   per item, cap 8 items                             have it
value-change 320ms   ease-glide      counter roll, blur 4 → 0          NEW
skeleton     150ms   ease-out        crossfade to content              NEW
optimistic     0ms                   apply instantly, revert at 150ms  NEW
```

Two mechanical notes:

- **Row expansion should use Base UI Collapsible**, which we already have as our only
  headless dependency. Twenty uses the same primitive, and the mechanism is
  `--collapsible-panel-height` plus `data-starting-style` / `data-ending-style` in CSS. No
  new dependency, no JS height measurement.
- **Stagger must cap.** Twenty and Midday both cap; an eighty-row list staggered at 40ms
  takes 3.2 seconds to appear. Cap at 8.

---

## 8. Interaction detail

### What they do

**Twenty separates four row states that most products collapse into two.** Repeating it
here because it is the core of why their tables feel alive:

```text
hovered   cursor is here          portal overlay, 1px outline, offset -1px
focused   keyboard is here        accent-quaternary fill, medium border, "soft focus"
active    this cell is editing    edit input rendered in a portal
selected  in the selection        checkbox, orthogonal to all three above
```

The portal is the clever part: the hover and focus chrome is rendered **outside the cell's
box**, so it can be larger than the cell without changing row height and without
`overflow` clipping it.

They also ship `useRecordTableCellFocusHotkeys`, `useMoveHoverToCurrentCell`,
`RecordTableRowArrowKeysEffect`: arrow keys move focus, Enter opens the editor, Escape
closes it. Keyboard navigation is a first-class mode, not an afterthought.

**Midday** has bulk selection with a floating `BulkEditBar` and `ExportBar`, shift-click
range selection on the checkbox cell, column reorder by drag (dnd-kit), and column resize.

**Macro's** press feedback is `transform 100ms cubic-bezier(0.34, 1.56, 0.64, 1)`, which
overshoots slightly. Their hover values are subtle: `content-0 at 3%` for hover, `6%` for
active, `accent at 8%` for selected. Ours uses solid `--accent` (`#efefef`), which is
roughly 6% and about right, but it is a fixed colour rather than a mix, so it behaves
differently on different grounds.

### What we do

Hover changes background and border over 260ms. Focus is a 2px outline, correctly
implemented and correctly excluded from transitions (that fix in `motion.ts` is good work).
There is no soft focus, no keyboard row navigation, no inline editing, no selection, no
drag.

### What to change

Ordered by value per unit of work:

1. **Hover in at 0ms, out at 150ms.** One-line change, felt everywhere.
2. **Soft focus.** A row the keyboard is on, distinct from a row the mouse is over.
   Required for keyboard navigation to be legible.
3. **Arrow-key navigation on lists.** Up, down, Enter to open, Escape to close.
4. **Express hover as a mix** (`color-mix(in oklch, var(--foreground) 6%, transparent)`)
   rather than a fixed grey, so it behaves correctly on every ground. This is consistent
   with the every-ground rule rather than an exception to it.
5. Selection, bulk actions, column resize: real, but later. They need a table engine
   decision first.

---

# Asset ledger

Every asset found, its bucket, its licence.

## Licence position of each repository

| Repository | Path | Licence | Consequence |
|---|---|---|---|
| Twenty | `packages/twenty-ui` | **MIT** | assets here are Bucket 1 |
| Twenty | `packages/twenty-shared`, `twenty-sdk`, `twenty-client-sdk`, `create-twenty-app`, `twenty-apps` | **MIT** | Bucket 1 |
| Twenty | `packages/twenty-front` | **no licence field → root AGPL-3.0** | Bucket 2 |
| Twenty | everything else | AGPL-3.0, with an "Enterprise" commercial carve-out on files marked `/* @license Enterprise */` | Bucket 2 |
| Macro | root | AGPL-3.0 | Bucket 2 |
| Macro | **`apps/web`** | **"Copyright 2023 CoParse, Inc. All rights reserved."** | **Bucket 2, proprietary.** The entire web UI |
| Midday | whole repository | AGPL-3.0 | Bucket 2 |
| Dub | `apps/web` | AGPL-3.0-or-later | Bucket 2 |
| Dub | `apps/web/app/(ee)` and `.../[slug]/(ee)` | proprietary (`ee/LICENSE.md`) | Bucket 2 |
| Dub | `packages/ui`, `packages/utils`, `packages/email` | no licence field → root AGPL | Bucket 2 |
| Dub | `packages/cli`, `packages/tsconfig`, `packages/hubspot-app` | MIT | Bucket 1, but nothing visual in them |

Two findings deserve emphasis:

- **Macro's `apps/web` carries its own one-line all-rights-reserved licence** that
  overrides the repository's AGPL. Every one of its 134 SVG icons, its fonts directory and
  its CSS is proprietary. The repository being on GitHub under an AGPL root file does not
  make the web app open source. I would have got this wrong if I had read only the root
  `LICENSE.txt`.
- **Twenty's split is per-package and only `twenty-ui` is MIT.** The illustrations everyone
  admires are not in `twenty-ui`. They are in `twenty-front/public`, which is AGPL.

## Bucket 1: free to take

| Asset | Source | Licence | Notes |
|---|---|---|---|
| Tabler Icons | upstream `tabler/tabler-icons` | MIT | ~5,900 stroke icons. Twenty pins `@tabler/icons-react ^3.31.0`. Take from upstream, not from Twenty |
| Phosphor Icons | upstream `phosphor-icons/react` | MIT (expected; **verify at import**) | What we already use, `^2.1.10` |
| `light-noise.png` (9.6 KB), `dark-noise.jpg` (26 KB) | `twenty-ui/src/assets/themes/` | MIT | Their `--t-background-noisy` texture. See the caveat below |
| Radix Colors | `@radix-ui/colors` | MIT | Twenty's grey ramps. We do not need it; ours is measured |
| visx | `@visx/*` | BSD-3-Clause | Dub's chart primitives. Not proposed as a dependency |
| NumberFlow | `@number-flow/react` | MIT (**verify at import**) | Animated counters. Roughly 60 lines to write ourselves instead |

**Caveat on the noise textures.** They are MIT and therefore legally takeable. I do not
recommend taking them. A noise texture is a *style signature*, and Twenty's is
recognisable. If we want tactility we should generate our own with an SVG
`feTurbulence` filter, which is a Bucket 3 idea, costs nothing, and is ours. Listed in
Bucket 1 for accuracy, recommended against on identity grounds.

**Icon set: my recommendation differs from the brief, and here is why.**

You asked to adopt Tabler. Both Tabler and Phosphor are MIT, so licence is not the
deciding factor. The deciding factors are:

- Tabler is drawn on a **24px grid with a 2px stroke**. At our locked 20px standard, that
  stroke renders at 2.4px effective weight, which is heavy. Twenty renders Tabler at
  **16px** with strokes tuned to 1.6 / 2 / 2.5. To adopt Tabler properly we would move our
  icon standard from 20px to 16px, which changes every control's optical balance.
- Phosphor is drawn on a **256px grid** and scales cleanly to 20px. It is already the
  locked identity in `DESIGN_SYSTEM.md`, already a dependency, and already used across all
  seven screens.
- **Our icon inconsistency is not caused by Phosphor, and it is worse than it looks.**
  Counted across the seven product screens:

  ```text
  13 ×  size={17}      not on the scale
   6 ×  size={18}      not on the scale
   3 ×  size={16}
   2 ×  size={12}
   1 ×  size={20}      the locked standard
  ```

  **The locked 20px standard is used once. The dominant icon size in the product is 17px,
  which does not exist in the scale at all.** The `IconSize` union in
  `packages/ui/src/icon.ts` allows 12/16/20/24/32/40, so `17` and `18` are only reachable
  because those 19 call sites pass the size straight to the Phosphor component rather than
  through a wrapper that would type-check it. The union is real and it guards nothing,
  because nothing is required to go through it.

  Swapping to Tabler would not fix a single one of those 19 call sites. It would carry the
  same inconsistency into a new icon set, at the cost of rewriting every import.

**What actually fixes it is Twenty's idea, not Twenty's icon set: the Icon Dictionary.**
A typed manifest mapping product concepts to canonical icons, with "use when" and "avoid
when" columns, generated into markdown, plus the lint rule *do not import from the icon
package directly, import from our wrapper*. That is Bucket 3, free, and it is the actual
cure.

My recommendation: **keep Phosphor, build the dictionary, enforce the size union at the
wrapper.** If you want Tabler for its look rather than its licence, that is a legitimate
identity decision and I will take it, but it should be made as an identity decision with
the 20px-to-16px consequence understood, not as a licence-driven one. Your call.

## Bucket 2: not free, and a derivative does not free it

Described so we can commission or generate an equivalent we own. No file is to be lifted,
traced, recoloured or auto-converted.

### B2.1 Twenty's animated placeholder set (AGPL-3.0)

**64 PNGs** in `twenty-front/public/images/placeholders/`, in four folders:
`background/`, `dark-background/`, `moving-image/`, `dark-moving-image/`. Seventeen named
states: `no_file`, `no_note`, `no_record`, `no_match_record`, `no_task`, `error_index`,
`empty_timeline`, `loading_messages`, `loading_accounts`, `empty_functions`,
`empty_inbox`, `404`, `500`, `no_deleted_record`, `no_widgets`, `not_shared`,
`no_call_recording`.

**Specification of what they do**, so we can build an equivalent:

- Each state is **two raster layers**: a background plate and a smaller foreground
  element.
- Background renders at max **160x160** (245x245 for the two error states). Foreground at
  max **130x130** (185x185 for errors).
- The foreground translates on a **±2px parallax** driven by cursor position across the
  viewport, with `transition: transform 300ms ease-out`, returning to centre on
  `mouseleave`.
- Style: soft isometric-ish objects, desaturated, low contrast, matched light and dark
  variants, no human figures, no outlines, subject is always **the object the screen is
  missing** (a file, a note, an inbox) rather than a metaphor.
- The parallax is the entire effect. The illustrations are static and unremarkable on
  their own; the 2px cursor-linked offset is what reads as alive.

**The mechanism is Bucket 3 and I recommend taking it. The images are Bucket 2 and must
not be.**

### B2.2 Twenty's illustration icons (AGPL-3.0)

Roughly 20 `illustration-*.svg` in `twenty-ui/src/assets/icons/`: `illustration-mail`,
`-user`, `-file`, `-json`, `-array`, `-currency`, `-phone`, `-link`, `-map`, `-tag`,
`-tags`, `-star`, `-toggle`, `-uid`, `-text`, `-numbers`, `-setting`, `-calendar-event`,
`-calendar-time`, `-one-to-one`, `-one-to-many`, `-many-to-many`.

**Correction against my own table above:** these sit inside `twenty-ui`, which *is* MIT.
They are therefore legally Bucket 1. I am placing them in Bucket 2 anyway, for a
non-licence reason: they are field-type glyphs for a CRM data model (`json`, `array`,
`uid`), a vocabulary we do not have and will not have. Taking them buys nothing. Recorded
here so the reasoning is on the record rather than a silent omission.

### B2.3 Third-party brand marks, Bucket 2 regardless of repository licence

`twenty-ui/src/assets/icons/` contains `google.svg`, `gmail.svg`, `google-calendar.svg`,
`microsoft.svg`, `microsoft-outlook.svg`, `microsoft-calendar.svg`, `openai.svg`,
`anthropic.svg`, `claude.svg`, `gemini.svg`, `xai.svg`, `mistral.svg`, `groq.svg`.
Macro's has `macro-google.svg`, `mcp-slack.svg`, `mcp-github.svg`, `mcp-posthog.svg`.

**The MIT licence on `twenty-ui` does not grant trademark rights.** A repository owner can
license their code under MIT and cannot license Google's logo to anyone. Each of these
must come from the owner's own brand guidelines under that owner's terms, per integration.
This is worth stating explicitly because it is the most common way a permissive-licence
assumption goes wrong.

### B2.4 Macro's icon set and assets (proprietary)

**134 SVG icons** in `apps/web/src/components/icon/`, plus `apps/web/public/` (`icon.png`,
`logo192.png`, `logo512.png`, `macro-favicon.svg`, `macro-logo-orange.png`,
`crosshair-cursor.svg`, three team portraits, a `sounds/` directory) and
`apps/web/src/asset/fonts/`.

All "All rights reserved". None may be used.

**Style specification, for reference only:** two families. A `wide-*` family (roughly 30
icons: `wide-star`, `wide-email`, `wide-calendar`, `wide-chat`, `wide-csv`, `wide-file-md`,
`wide-video-slash`, `wide-microphone`) drawn on a wider-than-tall box for use in dense
horizontal rows, and a `square-*` family (`square-task-done-circle`, `square-edit`,
`square-reply`, `square-command-k`) on a square box for buttons and keycaps. Uniform thin
stroke, no fills, no rounded terminals. The `square-command-k` glyph is a keyboard-shortcut
badge rendered as an icon rather than as text, which is a nice idea and is Bucket 3.

### B2.5 Midday and Dub icon sets

Midday's `@midday/ui` `Icons` object and Dub's `packages/ui/src/icons/nucleo/*` are both
under AGPL. Dub's directory name indicates these derive from **Nucleo**, a commercial icon
library, which would put them under Nucleo's licence irrespective of Dub's AGPL. **Any
asset whose provenance is a commercial library re-published under a copyleft licence is a
licence I cannot verify from the repository alone**, which by your rule puts it in Bucket 2
and it stays there.

### B2.6 Fonts

None of the four ship a font we would want. Midday and Dub load theirs at runtime. Our
Geist Sans and Geist Mono are already SIL OFL 1.1 and already locked. Nothing to do.

## Bucket 3: not assets, just ideas. Taken freely.

Everything below is layout, spacing, timing, information architecture or interaction
design. Not copyrightable as such, and taken deliberately.

| Idea | From | Where it lands |
|---|---|---|
| Per-screen composition instead of one container | Midday | §1 |
| Panel as a 4-area CSS grid with an internally scrolling body | Macro | §1 |
| Depth as inherited context (`data-depth`) | Macro | §1 |
| A page that never scrolls; panels that do | Macro, Midday | §1 |
| No row borders at rest; border on hover, drawn in a portal | Twenty | §2 |
| Typed cell components with declared widths | Midday | §2 |
| Fixed identity columns, elastic content columns, 100px floor | Midday | §2 |
| Gradient overflow mask that lifts on hover | Midday | §2 |
| Sticky cells carrying the hover colour | Midday | §2 |
| Bar behind the row for proportional lists | Dub | §2, §4 |
| Hover reveals the action by shrinking max-width | Dub | §2 |
| Icon rail that expands on hover with a fixed icon position | Midday | §3 |
| Staggered sub-item reveal (`40 + i*20` ms) | Midday | §3, §7 |
| Tabs that measure and overflow into a dropdown; centred option | Twenty | §3 |
| Command menu as the product's spine | Twenty | §3 |
| Monochrome charts, secondary series by hatch pattern | Midday | §4 |
| Dashed 4/4 grid, 32px bar cap, tick size 0, six ticks | Twenty | §4 |
| KPI card as a link to the screen that acts on it | Midday | §4 |
| Prose insight with the actionable noun dash-underlined | Midday | §4 |
| 12px inline donut from a 100-unit viewBox | Dub | §4 |
| 2px sibling gap against a 16px group gap | Twenty | §5 |
| Three empty states by cause, one offering no action | Midday | §6 |
| Ghost skeleton behind the empty message (`opacity-20 blur-[7px]`) | Midday | §6 |
| Skeletons derived from column definitions | Midday | §6 |
| Fixed top spacer so every empty title shares a baseline | Macro | §6 |
| Hover in at 0ms, out at 150ms | Macro | §7, §8 |
| Overlay fast (120 to 160ms), content slower (200 to 320ms) | all four | §7 |
| Base UI Collapsible with `--collapsible-panel-height` | Twenty | §7 |
| Slide + fade + blur for a value that changes | Midday | §7 |
| Four orthogonal row states (hover / soft focus / active / selected) | Twenty | §8 |
| Hover as a `color-mix` percentage rather than a fixed grey | Macro | §8 |
| A typed icon dictionary with "use when" and "avoid when" | Twenty | Icons |
| SVG `feTurbulence` for texture instead of a noise bitmap | derived | §1 |
| Crediting a borrowed CSS idea in a code comment | Macro | process |

That last one is worth a sentence. Macro's `index.css` carries:

```text
/* Ported from opencode's `--animate-pulse-scale` (github.com/sst/opencode, MIT © 2025 opencode). */
```

A one-line comment at the point of use, naming the source, the licence and the year. It is
a good habit and I propose we adopt it alongside `/docs/licenses/`.

---

# Illustration direction

You asked for a direction we can own. Three candidates, then my recommendation.

**Option A, a generated set.** Commission or generate 12 to 16 pieces in a fixed style,
export as SVG, own the copyright outright. Ownership is total. Cost is real, and generated
illustration has a recognisable look with a short shelf life.

**Option B, an open library.** The genuinely permissive options are unDraw (its own
licence, no attribution required, commercial use allowed), Open Peeps (CC0), Croods (MIT),
and Humaaans (CC BY 4.0, attribution required). The Freepik-family sets (Storyset, and
Flaticon, which you have already correctly excluded) are **not** safe for a resold
multi-tenant SaaS regardless of how they are marketed. The problem with all of them is
identity: unDraw's single-accent flat style is the most recognisable illustration style on
the internet and would immediately make ZeroCorp look like a template.

**Option C, system-native. My recommendation.**

Draw the empty states from the product's own vocabulary rather than from an illustration
style at all. We already have the pieces:

- the dashed region (the standing rule for charts)
- the step marker circles (filled disc with check, filled ring, empty outline)
- the four-side border
- the journey tints (Build green, Launch blue, Grow violet)
- Geist Mono figures

An empty Content screen is a dashed region containing three ghosted article rows and one
step marker. An empty Leads screen is a dashed region with four ghosted company rows. They
are drawn with the same tokens as the real thing, because **they are the real thing at
20% opacity** (Midday's trick, §6), plus one 24px Phosphor icon in a 64px bordered tile
(Dub's, §6).

This gives us:

- zero licence exposure, zero `/docs/licenses/` entries, zero attribution
- perfect coherence, because the empty state is made of the product
- automatic dark mode
- the ability to add a state in fifteen minutes rather than commissioning one

**Where I would spend real illustration budget: milestones only.** Company formed, EIN
issued, site live, first customer. Four moments in the entire product where a founder
deserves something with warmth. Those four are worth a commissioned set that we own
outright, and only those four.

**Onboarding** sits between the two: no illustration, but the eight steps deserve the
two-layer parallax mechanism (Twenty's idea, our own geometry) applied to the step marker,
so the current step has a small cursor-linked life to it.

**Written specification for the four milestone pieces**, so they can be commissioned
without further design input:

```text
Format      SVG, 320 x 240 viewBox, two colour stops maximum plus the page ground
Palette     one journey tint per piece (Build green, Launch blue, Grow violet,
            plus --primary teal for the customer milestone), --foreground for line work
Line        1.5px uniform stroke, butt caps, no rounded terminals, no fills except
            the single tint at 12% to 20%
Geometry    orthogonal and 45 degrees only, no freehand curves except a single arc
            per piece; radius 0 to match the product
Subject     the artefact, not a metaphor and not a person:
              company formed  → a filed document with a seal
              EIN issued      → a number plate set in Geist Mono
              site live       → a browser frame with a live cursor
              first customer  → two overlapping avatar rings
People      none. The product has no faces and adding them here would be the only
            place in it that does
Motion      one element per piece is separable for a ±2px cursor parallax
Dark mode   line work switches to --surface-focal-foreground; tint switches to the
            dark wash of the same journey hue
Deliverable light and dark SVG per piece, plus the separable element as its own layer
```

---

# Proposed visual architecture

Concrete enough to build from, in our tokens. Nothing here is decided.

## A. Page composition rules

**Rule 1. Every screen declares its width.** One of three, and the choice is part of the
screen's design:

```text
reading   768px   centred   forms, onboarding, a single subject, the Overview summary
work     1280px   centred   panels and grids, most screens
full     100vw    32px gutters   tables, calendars, anything scanned
```

**Rule 2. The shell owns the height. Panels own their scroll.** The frame is `100vh`. The
page does not scroll. A `Panel` body is `minmax(0, 1fr)` and scrolls inside itself.

**Rule 3. `Panel` gets four slots.**

```text
Panel        grid-template-areas: "header" "toolbar" "body" "footer"
             grid-template-rows:  auto auto minmax(0,1fr) auto
Panel.Header 40px, title + count, optional border-b within the panel's own box
Panel.Toolbar  auto, filters and search
Panel.Body   scrolls
Panel.Footer auto, pagination and totals
```

**Rule 4. Depth is inherited, not chosen.** A `<Layer>` wrapper writes `data-depth`;
`data-depth` maps to the `--surface-*` ladder. Nesting increments. Subject to the light-mode
question in §0: with one light ground, depth 1 and depth 2 are currently the same colour and
this rule only pays off in dark mode until that is resolved.

**Rule 5. A screen names its patterns before it is built.** Already the rule in
`DESIGN_SYSTEM.md` §21. It has not been followed on the seven screens, which is the other
half of why they look alike.

## B. Row anatomy

```text
Density        compact 36px       scanning
               comfortable 48px   avatars, two-line cells

Border         none at rest
               1px --border-hover on hover, drawn as an inset outline so nothing shifts
               (subject to your decision on the standing single-side-border rule, §2.3)

Gap            2px between rows in one list
               the list is one object; the rows are not separate cards

Columns        leading marker   20 to 24px   status shape, never colour alone
               identity         fixed, 110 to 200, never elastic
               content          elastic, min 104
               numeric          fixed, right-aligned, Geist Mono, tabular-nums
               meter            12px inline donut or a proportional bar behind the row
               status           fixed 160
               action           reserved by shrinking identity max-width on hover

Muting         a de-emphasised row loses weight and colour, never gains opacity below 0.6

States         hover     background at 0ms, out at 150ms
               focus     soft focus, distinct from hover, keyboard-driven
               active    the row is expanded or editing
               selected  orthogonal to all three
```

## C. Navigation

```text
Rail        72px at rest, 240px on hover, 200ms ease-glide
            icon fixed in a 40x40 box, background grows behind it, label fades in
            journey tint on the tile when collapsed, on the block when expanded
            row 40px, child row 32px, child stagger 40 + i*20 ms

Sub-tabs    44px strip, centred in the workspace, full-bleed band
            counts in Geist Mono; attention marks the tab, not the count
            measure and overflow into a "more" dropdown

Command     Cmd-K, 500px panel from the right, 200ms
            the spine: every action reachable, nothing requires knowing where it lives

Breadcrumb  only where there is genuine depth (a record inside a list). Not on top-level
            screens, where it repeats the rail
```

## D. Motion vocabulary

The table in §7. The principle in one line: **chrome arrives, content settles, hover is
instant on and gentle off, and nothing bounces.**

## E. Icons

Phosphor, kept. 20px standard, Regular weight. The `IconSize` union enforced at the wrapper
so `17` and `18` become compile errors rather than review comments. An icon dictionary:
concept, component, use when, avoid when, keywords. Generated to markdown. A lint rule that
forbids importing from `@phosphor-icons/react` outside `packages/ui`.

Open for your decision: Tabler instead, as an identity choice, with the 20px-to-16px
consequence accepted.

## F. Illustration

System-native for empty states and loading (zero assets). Parallax on the onboarding step
marker (our geometry, their mechanism). Four commissioned milestone pieces to the written
spec above, owned outright.

---

# What I would build, and in what order

Yours to decide. My ranking is by perceived quality gained per unit of work.

**First, and cheap.**

1. Hover in at 0ms, out at 150ms. One change in `motion.ts`.
2. Three empty states by cause, replacing the single `Empty`.
3. The ghost skeleton behind the empty message.
4. KPI cards become links.
5. The vertical rhythm ratio: 2 / 16 / 40.

**Second, and structural.**

6. The three container widths; delete the universal 1280px.
7. `Panel` with four slots and an internally scrolling body.
8. The shell owns the height; the page stops scrolling.
9. The rail goes to 72px with hover expansion.

**Third, and the largest visible change.**

10. Row anatomy: two densities, typed cells, no border at rest.
11. The four small data primitives: meter, bar, sparkline, counter.
12. The prose insight on Overview.
13. The motion vocabulary applied: tab switch, panel open, row expand, value change.

**Fourth, and needing a decision first.**

14. The light-mode ground question from §0.
15. The single-side-border rule question from §2.3.
16. Phosphor versus Tabler.
17. Wiring the command menu into the shell.

**Fifth.**

18. Icon dictionary and the lint rule.
19. Milestone illustrations, commissioned.
20. Selection, bulk actions, column resize.

---

# Housekeeping

- `/tmp/ref` is deleted.
- `/docs/licenses/` does not exist yet. Nothing in this study requires it, because
  **nothing is proposed for import**. It should be created with its first entry, whenever
  that is, and the entry should carry licence, version, source URL, retrieval date and
  attribution.
- No code was written. No dependency was added. No token was changed.
