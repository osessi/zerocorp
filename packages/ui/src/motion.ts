/**
 * Motion fragments shared by every ZeroCorp control.
 *
 * docs/DESIGN_SYSTEM.md §10.
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
 * snapped instead of settling — the feedback existed and could not be felt. Buttons and
 * rows use this; anything that only changes colour keeps COLOR_TRANSITION.
 *
 * Still 1px, still no bounce (§10). The reduced-motion rule in tokens.css collapses the
 * duration, so it lands instantly for anyone who asked for that.
 */
export const CONTROL_TRANSITION =
  "transition-[color,background-color,border-color,transform,box-shadow] duration-normal ease-out";
