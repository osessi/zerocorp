/**
 * The Phosphor icon scale, as a type. docs/DESIGN_SYSTEM.md §11.
 *
 * ```text
 * 12  XS      16  SM      20  MD  ← standard UI size
 * 24  LG      32  XL      40  2XL
 * ```
 *
 * A union rather than `number`, so a size outside the scale is a compile error instead
 * of a review comment — the same enforcement idea as IconButton's required `label`.
 */
export type IconSize = 12 | 16 | 20 | 24 | 32 | 40;
