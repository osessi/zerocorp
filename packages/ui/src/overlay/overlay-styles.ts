/**
 * Shared visual contract for every floating layer — Dialog, DropdownMenu, Popover,
 * Tooltip and the Select popup.
 *
 * Same discipline as control-styles.ts and button-styles.ts: compose these, never
 * restyle. An overlay that draws its own surface drifts away from the others one
 * dialog at a time.
 *
 * docs/DESIGN_SYSTEM.md §8, §10, §19.
 */

/**
 * The floating surface.
 *
 * --input, NOT --border. A popup edge separates a floating layer from the page, so it is
 * a meaningful graphical object and owes WCAG 1.4.11 its 3:1. --border measures 1.26:1
 * light and 1.31:1 dark and made the Select popup read as edgeless — reported in review
 * 2026-08-31, the third recurrence of that same failure.
 *
 * One shadow. §8 has exactly one elevation; hierarchy comes from borders.
 */
export const OVERLAY_SURFACE = "bg-surface-elevated border-input shadow-floating border";

/**
 * The backdrop.
 *
 * --foreground at 40%, so it flips with the theme: a dark scrim on a light page, a light
 * one on a dark page. A fixed black scrim washes out to nothing in dark mode.
 */
export const OVERLAY_BACKDROP = [
  "bg-foreground/40 fixed inset-0 z-50",
  "transition-opacity duration-emphasis ease-out",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
].join(" ");

/** Enter and exit. 200ms, no bounce — §10. */
export const OVERLAY_MOTION = [
  "transition-[opacity,transform] duration-emphasis ease-out",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
  "origin-(--transform-origin)",
].join(" ");

/**
 * A row in any popup list — menu item, option, command.
 *
 * Identical to the Select's ITEM, and deliberately so: a menu and a select popup that
 * highlight differently teach the user two rules for one gesture.
 *
 * SELECTION AND CURSOR ARE DIFFERENT THINGS. `data-highlighted` is where the cursor is,
 * keyboard and pointer unified by Base UI. `data-checked` is what is actually chosen. The
 * Select shipped for a day with only the first, and the grey cursor band read as
 * "selected" — the louder visual on the less important meaning.
 *
 * The border is always present and transparent when unchecked, so choosing shifts nothing.
 */
export const OVERLAY_ITEM = [
  "relative flex cursor-default items-center gap-2",
  "border border-transparent",
  "py-2 pr-3 pl-8",
  "text-body sm:text-body-sm text-foreground",
  "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
  /*
    BOTH attributes, deliberately.

    Base UI does not name the chosen state consistently across primitives: Select.Item
    sets `data-selected`, while Menu and Combobox items set `data-checked`. A contract
    carrying only one silently stops marking the choice on the other two — which is the
    defect the Select shipped with for a day, arriving by a different route.
  */
  "data-selected:border-primary data-selected:font-medium",
  "data-checked:border-primary data-checked:font-medium",
  "data-disabled:text-muted-foreground data-disabled:cursor-not-allowed",
  "outline-hidden",
].join(" ");

/**
 * The chosen-item marker: a filled badge, not a bare tick.
 *
 * --primary-foreground on --primary measures 5.14:1 in both themes, and the badge is a
 * SHAPE, so selection survives greyscale without the label needing a colour.
 */
export const OVERLAY_ITEM_INDICATOR =
  "bg-primary text-primary-foreground absolute left-2 flex size-4 items-center justify-center";

/** A rule between groups. Decorative, so --border is correct here. */
export const OVERLAY_SEPARATOR = "bg-border my-1 h-px";

/** A group heading inside a popup. */
export const OVERLAY_GROUP_LABEL = "text-overline text-muted-foreground px-3 py-2 uppercase";
