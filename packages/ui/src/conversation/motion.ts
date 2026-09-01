/**
 * Entrance motion for the conversational assessment — DESIGN_SYSTEM.md §10.
 *
 * Class names rather than inline styles, so the keyframes live in the design system and
 * a component cannot invent a duration. The stagger is the one value passed inline,
 * because it is per-item and there is no sane way to tokenise "the fourth one".
 */
export const ENTER = "zc-enter";
export const ENTER_FADE = "zc-enter-fade";
export const PULSE = "zc-pulse";

/**
 * Options appear in sequence rather than all at once.
 *
 * 40ms apart. Under about 30ms the eye reads it as simultaneous and the effect is
 * wasted; over about 60ms a six-option list takes longer to finish arriving than it
 * takes to read, which is worse than no animation at all.
 */
export const STAGGER_MS = 40;

/**
 * The interval for something being REVEALED rather than merely arriving.
 *
 * 90ms, more than double the option stagger, and the difference is deliberate. Options
 * are a list the visitor is about to scan, so they should be there by the time the eye
 * lands. The steps of a plan are the product: showing them settle one after another says
 * they were worked out rather than fetched, and eight of them take under a second.
 */
export const REVEAL_MS = 90;

/** Capped so a long list does not end with an item arriving a second late. */
export function staggerStyle(index: number, cap = 8, intervalMs = STAGGER_MS): { animationDelay: string } {
  return { animationDelay: `${Math.min(index, cap) * intervalMs}ms` };
}
