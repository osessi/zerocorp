import {
  CheckCircleIcon,
  CircleNotchIcon,
  InfoIcon,
  MinusCircleIcon,
  SparkleIcon,
  WarningIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

/**
 * The one status system, for the whole product.
 *
 * Formation, payments, domains, email, social, agents, content and CRM all read this.
 * A feature never invents its own status colour or its own glyph. §4.3, §17.
 *
 * Written once because THREE surfaces now render it — StatusBadge, Alert and Toast — and
 * a map spelled out three times drifts one entry at a time. Same reason COLOR_TRANSITION
 * and Spinner were extracted.
 */
export type StatusTone =
  | "success"
  | "processing"
  | "warning"
  | "danger"
  | "info"
  | "neutral"
  | "ai";

/**
 * `ai` joined the union 2026-09-02, closing open item 21.
 *
 * `--ai` had been a token since §4.5 and the dashboard prototype used it, but this file
 * carried six tones and `ai` was not one, so any product screen wanting it had to invent
 * a second tone vocabulary beside this one. That is the exact failure this module exists
 * to prevent.
 *
 * It is NOT assertive. An agent finishing a draft is not an error, and `role="alert"`
 * makes a screen reader abandon what it is saying.
 */

/**
 * One glyph per tone, differing in SHAPE and not only in colour.
 *
 * §4.3 tuned the five status colours to sit between 4.83:1 and 5.36:1 — a deliberately
 * even set, so no status shouts louder than another. Even contrast means they collapse
 * to nearly the same grey: in the greyscale review all six tones were indistinguishable
 * by colour alone. The glyph is the only thing left for a colour-blind reader, a
 * greyscale print, or a screenshot pasted into a ticket. §14.
 *
 * One weight, Regular, everywhere — §11 forbids one icon in two weights for one meaning.
 */
export const TONE_GLYPH = {
  success: CheckCircleIcon,
  processing: CircleNotchIcon,
  warning: WarningIcon,
  danger: XCircleIcon,
  info: InfoIcon,
  neutral: MinusCircleIcon,
  ai: SparkleIcon,
} as const satisfies Record<StatusTone, unknown>;

/**
 * Tone as ink, ON A TINTED SURFACE.
 *
 * NOT the §4.3 colour. That one is tuned as text on WHITE, which on a coloured tint falls
 * short: measured at the 100-level tint, --info reached 4.24 and --destructive 3.95, both
 * under 4.5, while their borders passed comfortably. The `-ink` step is one darker and
 * measures 5.30–6.80:1. §4.5.
 *
 * `neutral` takes --muted-foreground: §4.3 gives colours to five of the six, and "no
 * status yet" is genuinely the absence of one rather than a sixth colour competing.
 */
export const TONE_INK: Record<StatusTone, string> = {
  success: "text-success-ink",
  processing: "text-processing-ink",
  warning: "text-warning-ink",
  danger: "text-destructive-ink",
  info: "text-info-ink",
  neutral: "text-muted-foreground",
  ai: "text-ai-ink",
};

/**
 * Tone as a surface.
 *
 * The point of direction B. Across the whole dashboard, colour reached a surface exactly
 * once — everywhere else it lived in a 1px border and 12–16px of text, 1–3% of a
 * component's pixels. A palette with nowhere to land reads as no palette.
 *
 * In light these are 100-level tints, not 50: a 50 tint reads as slightly-off-white. In
 * dark they are dark washes of the same hue. Each is ≥1.1 against the page — a
 * perceptibility floor, not an accessibility one, because a tint carries no meaning alone.
 *
 * `neutral` stays --muted. It is the absence of a status, and inventing a sixth tint for
 * "nothing yet" would give it more presence than the five that mean something.
 */
export const TONE_SURFACE: Record<StatusTone, string> = {
  success: "bg-success-subtle",
  processing: "bg-processing-subtle",
  warning: "bg-warning-subtle",
  danger: "bg-destructive-subtle",
  info: "bg-info-subtle",
  neutral: "bg-muted",
  ai: "bg-ai-subtle",
};

/**
 * Tone as a left edge — a 2px rule, never a tinted fill.
 *
 * A rule keeps the surface readable: a tinted panel changes the background every piece of
 * text inside it sits on, which is why `-wash` exists as a separate, card-safe step (§4.6).
 *
 * The original comment here said "there is no tint scale in the system", written before
 * §4.5 shipped one on 2026-08-31. Corrected 2026-09-02 in the same sweep that retired the
 * matching stale refusals in §21.0 and §21.18.
 */
export const TONE_EDGE: Record<StatusTone, string> = {
  success: "border-l-success",
  processing: "border-l-processing",
  warning: "border-l-warning",
  danger: "border-l-destructive",
  info: "border-l-info",
  neutral: "border-l-muted-foreground",
  ai: "border-l-ai",
};

/**
 * Which tones interrupt.
 *
 * `role="alert"` is assertive: a screen reader abandons what it is saying. That is right
 * for a failure and wrong for a confirmation. Getting it backwards either shouts over the
 * user or lets an error pass in silence.
 */
export function isAssertive(tone: StatusTone): boolean {
  return tone === "danger" || tone === "warning";
}
