/**
 * Shared visual contract for every ZeroCorp form control.
 *
 * Input, Textarea, Select, Combobox, DatePicker and FileUpload all compose these
 * fragments. A control that restyles itself instead of composing them is a defect:
 * the borders, focus ring, disabled treatment and error/success tones would drift
 * apart one control at a time.
 *
 * Every value here is a token. docs/DESIGN_SYSTEM.md §17.
 */

/**
 * Shared by every control.
 *
 *   px-3          12px horizontal padding (§6)
 *   rounded-none  0px — the signature (§7)
 *   text-body     16px on mobile, 14px from sm. Below 16px, iOS Safari zooms the
 *                 viewport on focus and the layout breaks.
 *
 * NEVER add `outline-none`. It sets outline-style: none, which leaves the focus ring
 * with a width and a colour but no style — invisible. Found by visual review on
 * 2026-08-31 and guarded by tests/architecture/design-tokens.test.ts.
 */
export const CONTROL_BASE = [
  "w-full px-3",
  "rounded-none border bg-background",
  "text-body sm:text-body-sm text-foreground",
  "placeholder:text-muted-foreground",
  "transition-colors duration-normal ease-out",
].join(" ");

/**
 * Default and hover.
 *
 * `--input` clears WCAG 1.4.11 (3:1) in both themes. Hover always strengthens the
 * boundary — darker on a light ground, lighter on a dark one — which is why
 * `--input-hover` exists rather than reusing `--border-hover`. §9.
 */
export const CONTROL_NEUTRAL = "border-input hover:border-input-hover";

/** Focus. Drawn outside the border so focusing never shifts layout. §14. */
export const CONTROL_FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Disabled — inert. Deliberately distinct from loading, which is busy but readable. */
export const CONTROL_DISABLED = [
  "disabled:cursor-not-allowed",
  "disabled:bg-muted disabled:text-muted-foreground",
  "disabled:border-border disabled:hover:border-border",
  "data-disabled:cursor-not-allowed data-disabled:bg-muted",
].join(" ");

export const CONTROL_INVALID = "border-destructive hover:border-destructive";
export const CONTROL_VALID = "border-success hover:border-success";

/** Single-line control height: 40px, 10 × the 4px spacing unit (§6). */
export const CONTROL_HEIGHT = "h-10";

/** Resolves the border tone from the surrounding Field's state. */
export function controlTone(state: { invalid: boolean; valid: boolean }): string {
  if (state.invalid) return CONTROL_INVALID;
  if (state.valid) return CONTROL_VALID;
  return CONTROL_NEUTRAL;
}

/** Joins class fragments, dropping empties. */
export function cx(...parts: Array<string | false | undefined>): string {
  return parts.filter(Boolean).join(" ");
}

/* ──────────────────────────────────────────────────────────────────────────────
   Choice controls — Checkbox, Radio, Switch.
   ────────────────────────────────────────────────────────────────────────────── */

/**
 * The 16px control surface.
 *
 * A checkbox border is a control boundary, so it uses `--input` and inherits the same
 * WCAG 1.4.11 guarantee as a text field. Using `--border` here would reintroduce the
 * 1.26:1 failure §4.4 fixed.
 *
 * 16px pairs with the 14px label and its 20px line box. The 24×24 target required by
 * WCAG 2.5.8 comes from the label row wrapping the control, not from the box itself.
 */
export const CHOICE_BOX = [
  "relative inline-flex size-4 shrink-0 items-center justify-center",
  // --muted, not --background. On a dark page a control filled with the page colour
  // reads as a hole rather than as something to hit; only the border says it exists.
  // The Switch already used --muted for its off track and never had the problem, so
  // this also makes all three choice controls agree. Reported in review 2026-08-31.
  "border bg-muted",
  "transition-colors duration-normal ease-out",
].join(" ");

/** Checked: filled with the accent. Teal marks the chosen state. */
export const CHOICE_CHECKED =
  "data-checked:bg-primary data-checked:border-primary data-checked:text-primary-foreground";

/** Radio only — the semantic exception to --radius-none, decided 2026-08-31. */
export const CHOICE_CIRCLE = "rounded-full";

/**
 * Switch track — a labelled rectangle, not a pill.
 *
 * Unlike the radio, a rectangular switch creates no semantic ambiguity: a switch is
 * still a switch. It is one of the few places where radius 0 produces something
 * distinctive rather than merely restrained.
 *
 * 56×20 makes room for the state word. The extra 20px over an unlabelled track buys
 * the one thing colour cannot: a state that survives greyscale, a colour-blind reader
 * and a screenshot pasted into a ticket. DESIGN_SYSTEM.md §14 — colour is never the
 * only carrier of meaning.
 */
export const SWITCH_TRACK = [
  "relative inline-flex h-5 w-14 shrink-0 items-center",
  "border bg-muted",
  "transition-colors duration-normal ease-out",
  "data-checked:bg-primary data-checked:border-primary",
].join(" ");

/** Switch thumb — square, and it slides. Motion communicates the state change (§10). */
export const SWITCH_THUMB = [
  "block size-4 bg-background",
  "transition-transform duration-normal ease-out",
  "translate-x-0.5 data-checked:translate-x-9",
].join(" ");

/**
 * The state word inside the track.
 *
 * OFF uses --foreground, not --muted-foreground: at 11px bold on --muted the muted
 * token measures 4.35:1, and 11px bold is not "large text", so the AA threshold is
 * 4.5:1 and it fails. Measured 2026-08-31.
 *
 * A disabled control is exempt from contrast requirements (WCAG 1.4.3, incidental
 * text in an inactive component), so it may drop to --muted-foreground.
 */
export const SWITCH_LABEL = [
  "text-overline absolute uppercase select-none",
  "pointer-events-none",
].join(" ");
