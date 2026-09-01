/**
 * Three colour directions — PROPOSALS ONLY.
 *
 * Nothing here touches packages/design-system/src/tokens.css. Each option is a set of CSS
 * custom properties scoped to its own preview container, so the three can sit side by
 * side on one page and be compared against the same components.
 *
 * The diagnosis they answer, measured on the current dashboard 2026-08-31:
 *
 *   neutral token uses      169
 *   chromatic token uses     21
 *   tinted SURFACES           1   (`bg-success`, once)
 *
 * The palette is not too small. Colour has nowhere to land: it lives in a 1px border and
 * 12–16px of text, which is 1–3% of a component's pixels. §24.10 already recorded that
 * the system has "five solid colours and no subtle scale".
 *
 * Shared constraints, from the brief: radius 0, Geist, borders and type hierarchy
 * unchanged; teal #00786F stays the identity; neutral foundation, expressive semantic
 * layer; no decorative colour; every colour earns a role.
 *
 * ── What the reference actually shows, once seen ────────────────────────────
 *
 * Two corrections to the diagnosis above, both material:
 *
 * 1. THE REFERENCE'S CHROME IS MORE NEUTRAL THAN OURS, NOT LESS. White surfaces, thin
 *    grey rules, black text — and its primary buttons are BLACK, not brand-coloured.
 *    Colour is reserved almost entirely for status and data. So the answer is not "more
 *    colour everywhere"; it is a stricter monochrome frame with louder status chips.
 *
 * 2. ITS STATUS CHIPS ARE BRIGHT AND SATURATED. Vivid mint greens, real yellows. Ours are
 *    dark and muddy — #15803D forest green, #B45309 brown-amber — because §4.3 tuned all
 *    five to 4.83–5.36:1 AS TEXT ON WHITE. That constraint forces dark, desaturated hues.
 *    Read as text on a light TINT instead, the same 4.5:1 is reachable with a much
 *    brighter colour, because the tint carries part of the contrast.
 *
 * So the tints below sit at the 100–200 level, not 50. A 50-level tint reads as "slightly
 * off-white"; the reference reads as alive because its fills are unmistakably coloured.
 *
 * One thing no palette supplies: the reference is full of AVATAR PHOTOGRAPHS. Faces bring
 * colour that tokens cannot. Worth knowing before concluding the palette is at fault.
 */

export type Vars = Record<string, string>;

export interface Direction {
  key: "A" | "B" | "C";
  name: string;
  thesis: string;
  adds: string[];
  pros: string[];
  cons: string[];
  light: Vars;
  dark: Vars;
}

/* Shared across all three: the five status hues are UNCHANGED (§4.3 is validated). */
const STATUS_LIGHT: Vars = {
  "--p-success": "#15803d",
  "--p-warning": "#b45309",
  "--p-info": "#2563eb",
  "--p-processing": "#00786f",
  "--p-danger": "#dc2626",
};
const STATUS_DARK: Vars = {
  "--p-success": "#22c55e",
  "--p-warning": "#f59e0b",
  "--p-info": "#3b82f6",
  "--p-processing": "#2dd4bf",
  "--p-danger": "#ef4444",
};

/* ── A ─────────────────────────────────────────────────────────────────────── */

const A_LIGHT: Vars = {
  ...STATUS_LIGHT,
  // One new step per hue: a surface tint. Nothing else changes.
  /*
    THREE roles per hue, not two. Measuring the first draft found why: at the 100-level
    tint, `info` text landed at 4.24 and `danger` at 3.95 — both below the 4.5 floor —
    while their borders passed comfortably. The validated §4.3 colour is tuned as text on
    WHITE; on a coloured tint it needs one step darker.

      --p-{tone}            §4.3, unchanged. Borders and solid fills.
      --p-{tone}-subtle     the surface.
      --p-{tone}-ink        text ON that surface. 5.30–6.80:1, measured.

    Splitting the roles is what makes bright tints safe. Without it the choice is a dull
    tint or a failing label.
  */
  "--p-success-ink": "#166534",
  "--p-warning-ink": "#92400e",
  "--p-info-ink": "#1d4ed8",
  "--p-processing-ink": "#005e57",
  "--p-danger-ink": "#b91c1c",
  "--p-success-subtle": "#dcfce7",
  "--p-warning-subtle": "#fef3c7",
  "--p-info-subtle": "#dbeafe",
  "--p-processing-subtle": "#ccfbf1",
  "--p-danger-subtle": "#fee2e2",
  "--p-accent": "#00786f",
  "--p-accent-subtle": "#f0fdfa",
  "--p-accent-strong": "#00786f",
};
const A_DARK: Vars = {
  ...STATUS_DARK,
  // In dark a "tint" is a dark wash, not a pale one — the same hue pulled toward the page.
  // In dark the wash is dark, so the bright §4.2 status colour is already the right ink.
  "--p-success-ink": "#22c55e",
  "--p-warning-ink": "#f59e0b",
  "--p-info-ink": "#3b82f6",
  "--p-processing-ink": "#2dd4bf",
  "--p-danger-ink": "#ef4444",
  "--p-success-subtle": "#0c1f14",
  "--p-warning-subtle": "#241703",
  "--p-info-subtle": "#0d1a33",
  "--p-processing-subtle": "#082220",
  "--p-danger-subtle": "#2a0e0e",
  "--p-accent": "#2dd4bf",
  "--p-accent-subtle": "#082220",
  "--p-accent-strong": "#00786f",
};

/* ── B ─────────────────────────────────────────────────────────────────────── */

const B_LIGHT: Vars = {
  ...A_LIGHT,
  // The teal gets depth: a ramp instead of one flat value.
  "--p-teal-50": "#f0fdfa",
  "--p-teal-100": "#ccfbf1",
  "--p-teal-200": "#99f6e4",
  "--p-teal-500": "#14b8a6",
  "--p-teal-700": "#00786f",
  "--p-teal-900": "#004b45",
  "--p-accent-subtle": "#f0fdfa",
  "--p-accent-strong": "#004b45",
  // One added hue, with a job: "a machine produced this".
  "--p-ai": "#6d28d9",
  "--p-ai-ink": "#6d28d9",
  "--p-ai-subtle": "#ede9fe",
};
const B_DARK: Vars = {
  ...A_DARK,
  "--p-teal-50": "#082220",
  "--p-teal-100": "#0d3b36",
  "--p-teal-200": "#125e56",
  "--p-teal-500": "#2dd4bf",
  "--p-teal-700": "#5eead4",
  "--p-teal-900": "#99f6e4",
  "--p-accent-subtle": "#0d3b36",
  "--p-accent-strong": "#5eead4",
  "--p-ai": "#a78bfa",
  "--p-ai-ink": "#a78bfa",
  "--p-ai-subtle": "#1a1030",
};

/* ── C ─────────────────────────────────────────────────────────────────────── */

const C_LIGHT: Vars = {
  ...B_LIGHT,
  // A second added hue: "waiting on a human", which is not the same as "warning".
  "--p-action": "#854d0e",
  "--p-action-ink": "#854d0e",
  "--p-action-subtle": "#fef08a",
  // A chart series ramp — §24.14 is open and a chart library left to its own defaults
  // decides the palette, which CLAUDE_CODE_RULES forbids.
  "--p-chart-1": "#00786f",
  "--p-chart-2": "#2563eb",
  "--p-chart-3": "#a16207",
  "--p-chart-4": "#7c3aed",
  "--p-chart-5": "#b91c1c",
  "--p-chart-6": "#4d7c0f",
};
const C_DARK: Vars = {
  ...B_DARK,
  "--p-action": "#facc15",
  "--p-action-ink": "#facc15",
  "--p-action-subtle": "#241f03",
  "--p-chart-1": "#2dd4bf",
  "--p-chart-2": "#60a5fa",
  "--p-chart-3": "#facc15",
  "--p-chart-4": "#a78bfa",
  "--p-chart-5": "#f87171",
  "--p-chart-6": "#a3e635",
};

export const DIRECTIONS: Direction[] = [
  {
    key: "A",
    name: "Tinted surfaces",
    thesis:
      "Give the colours we already have somewhere to land. One new step per hue — a surface tint — and nothing else.",
    adds: ["5 subtle surfaces", "no new hues"],
    pros: [
      "Answers the measured cause directly: colour finally touches a surface.",
      "No new identity decision. §4.3 stays exactly as validated.",
      "Smallest surface to review, and trivially reversible.",
      "Closes §24.10, which already asked for a subtle scale.",
    ],
    cons: [
      "Still six hues in total. If the references are genuinely more varied, this closes part of the gap, not all of it.",
      "Tinted surfaces are the doorway to the pastel look the brief rejects — the tints must stay near-neutral.",
      "Does nothing for the teal, which stays one flat value.",
    ],
    light: A_LIGHT,
    dark: A_DARK,
  },
  {
    key: "B",
    name: "Tinted surfaces + teal ramp + one AI hue",
    thesis:
      "A, plus depth for the identity colour, plus the one semantic gap the product actually has: nothing says “a machine made this”.",
    adds: ["A", "6-step teal ramp", "violet = AI-generated"],
    pros: [
      "The teal stops being a single value and becomes usable as wash, fill, hover and edge.",
      "Fills a real gap: agent output currently borrows --processing, so “an agent is working” and “the brand” are the same colour.",
      "The added hue has a testable job, so it is not decorative.",
      "Leaves chart colours for a separate, deliberate decision.",
    ],
    cons: [
      "Seven hue families to keep coherent in two themes.",
      "Violet is a genuine identity decision, not a neutral one.",
      "A teal ramp invites teal everywhere; it needs a usage rule or the page turns green.",
    ],
    light: B_LIGHT,
    dark: B_DARK,
  },
  {
    key: "C",
    name: "Full functional palette",
    thesis:
      "B, plus “waiting on a human” as its own colour, plus a chart series ramp — closing §24.14 in the same pass.",
    adds: ["B", "amber = action needed", "6 chart series"],
    pros: [
      "Separates “something is wrong” (warning) from “we are waiting on you” (action), which the dashboard conflates today.",
      "Closes §24.14 deliberately instead of letting a chart library pick the palette.",
      "Most headroom: the dashboard, charts and agent surfaces all have distinct vocabulary.",
    ],
    cons: [
      "Nine hue families. The largest thing to validate, and the easiest to get wrong.",
      "Highest risk of the decorative explosion the brief forbids.",
      "warning vs action is a subtle distinction that will be misused unless the rule is very clear.",
      "Chart tokens are worth their own review; bundling them here hides them.",
    ],
    light: C_LIGHT,
    dark: C_DARK,
  },
];
