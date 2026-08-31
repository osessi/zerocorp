import {
  CheckCircleIcon,
  CircleNotchIcon,
  InfoIcon,
  MinusCircleIcon,
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
  | "neutral";

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
} as const satisfies Record<StatusTone, unknown>;

/**
 * Tone as ink.
 *
 * `neutral` takes --muted-foreground: §4.3 gives colours to five of the six, and "no
 * status yet" is genuinely the absence of one rather than a sixth colour competing with
 * the five.
 */
export const TONE_INK: Record<StatusTone, string> = {
  success: "text-success",
  processing: "text-processing",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
  neutral: "text-muted-foreground",
};

/**
 * Tone as a left edge — a 2px rule, never a tinted fill.
 *
 * There is no tint scale in the system (§24) and inventing one here would put a sixth
 * unvalidated colour family into the product. A rule also keeps the surface readable:
 * a tinted panel changes the background every piece of text inside it sits on.
 */
export const TONE_EDGE: Record<StatusTone, string> = {
  success: "border-l-success",
  processing: "border-l-processing",
  warning: "border-l-warning",
  danger: "border-l-destructive",
  info: "border-l-info",
  neutral: "border-l-muted-foreground",
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
