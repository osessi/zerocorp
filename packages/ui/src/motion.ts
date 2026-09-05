/**
 * Motion fragments shared by every ZeroCorp control.
 *
 * docs/DESIGN_SYSTEM.md §10 and §10b.
 *
 * The vocabulary is NAMED BY JOB, not by duration. "150ms ease-out" is not a decision
 * anyone can review; "a tab body arrives" is. Every export below is a job, and the
 * durations are tokens so a job can be retimed in one place.
 */

/**
 * The colour transition. Use this, never Tailwind's `transition-colors`.
 *
 * `transition-colors` includes **outline-color** in Tailwind v4, so the focus ring
 * animates. Measured in Chrome on 2026-08-31 on a primary Button: the outline carried
 * `rgb(240,253,250)` — the label colour — at 0ms, half-teal at 75ms, and only reached
 * `--ring` at ~150ms. It was always visible, so not a WCAG failure, but a focus
 * indicator is the one signal a keyboard user navigates by. It must not arrive late, or
 * in the wrong hue, while someone tabs through a form.
 *
 * Naming the properties explicitly also documents what is allowed to animate at all.
 * Anything that moves or recolours the focus indicator is not.
 *
 * Enforced by tests/architecture/design-tokens.test.ts.
 */
export const COLOR_TRANSITION =
  "transition-[color,background-color,border-color] duration-normal ease-out";

/**
 * A control that also MOVES.
 *
 * `transform` was missing from the transition list, so the 1px press on every button
 * snapped instead of settling — the feedback existed and could not be felt. Buttons use
 * this; anything that only changes colour on hover uses HOVER_GROUND instead.
 *
 * `--ease-glide` at 260ms, not `--ease-out` at 150ms. 150ms is right for a state change —
 * a badge turning green should arrive and stop — and wrong for something following a
 * cursor, where the same curve reads as a snap. Leaves fast, settles long.
 */
export const CONTROL_TRANSITION =
  "transition-[color,background-color,border-color,transform,box-shadow] duration-glide ease-glide";

/**
 * HOVER, AND IT IS ASYMMETRIC. §10b.
 *
 * The single most-felt change in the 2026-09-04 pass, and one line.
 *
 * A hover that fades IN feels laggy. The cursor is already on the row; the feedback is
 * late by definition if it takes 260ms to arrive. A hover that fades OUT feels smooth,
 * because nothing is waiting on it. So: instant on, gentle off.
 *
 * Implemented as a base transition that the `hover:` variant cancels. Tailwind emits
 * `hover:duration-0` after `duration-hover-out` in the cascade, so the hovered state
 * carries a 0ms duration and the resting state carries 150ms. Entering uses the HOVERED
 * element's duration (0ms) and leaving uses the RESTING one (150ms), which is exactly
 * the asymmetry wanted.
 *
 * Rebuilt from the pattern in Macro (proprietary, apps/web is all-rights-reserved).
 * Nothing was copied: this is the idea, expressed in our tokens and Tailwind's variants.
 */
export const HOVER_GROUND =
  "transition-[background-color,border-color,color] ease-out duration-[--duration-hover-out] hover:duration-0";

/** A hover that moves as well as recolours. Movement keeps its mass. */
export const HOVER_LIFT = `${HOVER_GROUND} motion-safe:hover:-translate-y-px transition-[background-color,border-color,color,transform]`;

/**
 * Chrome arrives. 150ms.
 *
 * Menus, tooltips, dropdowns, the ground behind a dialog. Measured across all four
 * references: overlays run 100–160ms without exception, and content runs 200–320ms.
 * An overlay is not content; it is the product acknowledging a click.
 */
export const OVERLAY_ENTER = "duration-[--duration-overlay] ease-out";

/**
 * Content settles. 200ms.
 *
 * A panel opening, a row expanding, a tab body arriving. Slower than chrome on purpose:
 * this is something to read, and it should finish arriving before the eye commits.
 */
export const CONTENT_ENTER = "duration-[--duration-content] ease-out";

/*
  The jobs below are utility CLASSES defined in tokens.css, not Tailwind arbitrary
  animations. That is the existing convention (`.zc-enter`, `.zc-pop`), and it keeps the
  keyframe, the duration and the curve in the token layer where they can be reviewed
  together, rather than spread across call sites as bracket syntax.
*/

/** A tab body arriving. Content timing, plus 8px of travel so the swap has a direction. */
export const TAB_ENTER = "zc-tab-enter";

/** A side panel entering from the right. Content timing with the glide curve. */
export const PANEL_ENTER = "zc-panel-enter";

/**
 * A number changing under the reader. 320ms.
 *
 * Slide plus fade plus a 4px blur that resolves to 0. The blur is what makes a value
 * swap read as the same number changing rather than as two different numbers. Observed
 * in Midday (AGPL-3.0); the idea, not the code.
 */
export const VALUE_CHANGE = "zc-value-change";

/** Skeleton handing over to content. */
export const SKELETON_SETTLE = "zc-enter-fade";

/** The standard entrance: 8px up, fading in. */
export const ENTER = "zc-enter";

/**
 * The stagger, WITH ITS CAP.
 *
 * An 80-row list at 40ms per row takes 3.2 seconds to finish appearing, which is not a
 * reveal, it is a wait. Everything past the cap shares the last delay, so a long list
 * still arrives as a wave and still arrives promptly.
 */
export const STAGGER_CAP = 8;

/** Default step, in ms. Mirrors --stagger-step; used only when a caller overrides it. */
export const STAGGER_MS = 40;

export function staggerStyle(
  index: number,
  cap: number = STAGGER_CAP,
  intervalMs: number = STAGGER_MS,
): { animationDelay: string } {
  const step = Math.min(index, cap);
  /* The token path when the caller takes the defaults, so a retimed stagger moves
     everywhere at once; an explicit interval falls back to a literal, because a caller
     passing one is deliberately opting out of the shared timing. */
  return intervalMs === STAGGER_MS
    ? { animationDelay: `calc(${step} * var(--stagger-step))` }
    : { animationDelay: `${step * intervalMs}ms` };
}
