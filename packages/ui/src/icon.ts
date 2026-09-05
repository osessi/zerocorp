/**
 * The Phosphor icon scale, as a type. docs/DESIGN_SYSTEM.md §11.
 *
 * ```text
 * 12  XS      16  SM      20  MD  ← standard UI size
 * 24  LG      32  XL      40  2XL
 * ```
 *
 * A union rather than `number`, so a size outside the scale is a compile error instead
 * of a review comment.
 *
 * ---------------------------------------------------------------------------
 * WHY THIS FILE GREW A WRAPPER — 2026-09-04
 *
 * The union above existed and enforced nothing, because nothing was required to pass
 * through it. Every call site imported the Phosphor component directly and handed it a
 * raw number. Counted across the product on 2026-09-04, 178 call sites:
 *
 *   65 × 16      on scale
 *   31 × 12      on scale
 *   30 × 14      OFF SCALE
 *   21 × 20      on scale — the "locked standard"
 *   15 × 17      OFF SCALE
 *    6 × 18      OFF SCALE
 *    4 × 24      on scale
 *    3 × 15      OFF SCALE
 *    1 × 32      on scale
 *    1 × 22      OFF SCALE
 *    1 × 13      OFF SCALE
 *
 * 56 of 178 — 31% — used a size not in the scale, and 42 files imported Phosphor
 * directly. The standard was marked locked and was the fifth most common value in its
 * own product.
 *
 * The general rule this produced, recorded in DESIGN_SYSTEM.md §11b:
 *
 *   > A standard nothing enforces is not locked, it is decorative.
 *   > Every locked decision needs a mechanism that makes violating it fail.
 *
 * So: `Icon` takes `size?: IconSize` and nothing else, and a lint rule forbids importing
 * `@phosphor-icons/react` outside this package.
 * ---------------------------------------------------------------------------
 */
export type IconSize = 12 | 16 | 20 | 24 | 32 | 40;

/**
 * The one weight. §11.
 *
 * `regular` for everything, `fill` reserved for the active state of a navigation glyph
 * and for a status marker that must read at 12px. `bold` is not available: it was used
 * to compensate for icons that were too small, which is a size problem wearing a weight
 * costume.
 */
export type IconWeight = "regular" | "fill";

/** The default, stated once rather than at every call site. */
export const ICON_SIZE_DEFAULT: IconSize = 20;

/**
 * Sizes by role, so a call site names a job instead of a number.
 *
 * `inline` is the only size below the standard that is allowed in body copy: it is
 * cap-height-matched to --text-body-sm. The 14s and 17s in the audit were all reaching
 * for this and picking a number by eye.
 */
export const ICON_SIZE = {
  inline: 12,
  dense: 16,
  standard: 20,
  prominent: 24,
  feature: 32,
  hero: 40,
} as const satisfies Record<string, IconSize>;
