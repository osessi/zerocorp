/**
 * The accent scale for a multi-step conversation.
 *
 * `--chart-1` to `--chart-5`, and the choice matters. The status tones — success,
 * warning, danger, info — already mean something specific in this product: warning is
 * "a person must act", danger is "it came back". Using them to distinguish five
 * interview steps would overload a vocabulary the whole dashboard depends on, and a
 * step called "Markets" would inherit the colour of an alert.
 *
 * The chart series exists for exactly this problem: five hues that need to be told
 * apart and mean nothing individually. They are already measured, and they already flip
 * for dark mode (§4.7).
 *
 * `text-background` on a filled marker is deliberate: light background over a dark chart
 * hue in light mode, near-black over a light chart hue in dark mode. It flips on its own.
 */
export type AccentIndex = 1 | 2 | 3 | 4 | 5;

export const ACCENT_FILL: Record<AccentIndex, string> = {
  1: "bg-chart-1 text-background",
  2: "bg-chart-2 text-background",
  3: "bg-chart-3 text-background",
  4: "bg-chart-4 text-background",
  5: "bg-chart-5 text-background",
};

export const ACCENT_EDGE: Record<AccentIndex, string> = {
  1: "border-chart-1",
  2: "border-chart-2",
  3: "border-chart-3",
  4: "border-chart-4",
  5: "border-chart-5",
};

export const ACCENT_TEXT: Record<AccentIndex, string> = {
  1: "text-chart-1",
  2: "text-chart-2",
  3: "text-chart-3",
  4: "text-chart-4",
  5: "text-chart-5",
};

/**
 * Hover edges, written out in full.
 *
 * Tailwind scans source files for literal class names. Building these with
 * `ACCENT_EDGE[n].replace("border-", "hover:border-")` produces a string that exists
 * nowhere in the source, so the class is never generated and the hover silently does
 * nothing. It typechecks, it renders, and the colour never appears.
 */
export const ACCENT_EDGE_HOVER: Record<AccentIndex, string> = {
  1: "hover:border-chart-1",
  2: "hover:border-chart-2",
  3: "hover:border-chart-3",
  4: "hover:border-chart-4",
  5: "hover:border-chart-5",
};

/**
 * A wash of the hue behind a marker. What tells "being answered now" apart from
 * "assumed", without adding a second element around the first.
 *
 * 10% because it has to survive both themes: darker and it competes with the solid
 * fill that means done, lighter and it disappears on the dark background.
 */
export const ACCENT_TINT: Record<AccentIndex, string> = {
  1: "bg-chart-1/10",
  2: "bg-chart-2/10",
  3: "bg-chart-3/10",
  4: "bg-chart-4/10",
  5: "bg-chart-5/10",
};

/** The connector between steps. Same hue, drawn as a rule. */
export const ACCENT_RULE: Record<AccentIndex, string> = {
  1: "bg-chart-1",
  2: "bg-chart-2",
  3: "bg-chart-3",
  4: "bg-chart-4",
  5: "bg-chart-5",
};

/** Wraps around, so a six-step flow does not crash into an undefined class. */
export function accentFor(index: number): AccentIndex {
  return ((index % 5) + 1) as AccentIndex;
}
