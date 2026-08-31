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
