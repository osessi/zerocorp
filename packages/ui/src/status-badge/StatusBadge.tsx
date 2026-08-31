import type { ReactNode } from "react";
import {
  CheckCircleIcon,
  CircleNotchIcon,
  WarningIcon,
  XCircleIcon,
  InfoIcon,
  MinusCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
// cx lives with the control fragments today. It is a pure join helper with no form
// semantics; promoting it to its own module is the right move the day a third area
// needs it, not before.
import { cx } from "../field/control-styles";

/**
 * StatusBadge — one status system for the whole product.
 *
 * Formation, payments, domains, email, social, agents, content and CRM all use this.
 * A feature never invents its own status colour or its own badge (§4.3, §17).
 *
 * Two emphases, one component. Chosen by review on 2026-08-31 after comparing three
 * treatments on a dense table, a detail header and a greyscale panel:
 *
 *   default    outlined — the page shows through. The everyday badge, and the one
 *              that repeats eight times in a table without taking it over.
 *   prominent  solid fill — the container IS the colour. For the few places where the
 *              status is the point of the screen.
 *
 * A third treatment (bare icon + label, no container) read best in a table but too
 * lightly beside a heading. Not built.
 *
 * docs/DESIGN_SYSTEM.md §4.3, §14, §17, §19.
 */

/**
 * Six tones. §17 names six; §4.3 gives colours to five — `neutral` has none and takes
 * the muted pair, which is why it is the only tone whose border is not a status colour.
 */
export type StatusTone =
  | "success"
  | "processing"
  | "warning"
  | "danger"
  | "info"
  | "neutral";

export type StatusEmphasis = "default" | "prominent";

export interface StatusBadgeProps {
  tone: StatusTone;
  /** `default` outlined, `prominent` solid fill. */
  emphasis?: StatusEmphasis;
  /**
   * The label. Required, and never decorative: §14 forbids colour from being the only
   * carrier of meaning, so there is no icon-only badge and no way to build one.
   */
  children: ReactNode;
  className?: string;
}

/**
 * One icon per tone, differing in SHAPE and not only in colour.
 *
 * This is what actually makes the system work. §4.3 tuned the five status colours to
 * sit between 4.83:1 and 5.36:1 — a deliberately even set, so no status shouts louder
 * than another. Even contrast means they collapse to nearly the same grey: in the
 * greyscale review all six tones were indistinguishable by colour alone, in every
 * treatment. The glyph is the only thing left for a colour-blind reader, a greyscale
 * print, or a screenshot pasted into a ticket.
 *
 * One weight, Regular, across both emphases — §11 forbids one icon appearing in two
 * weights for the same meaning.
 */
const ICON = {
  success: CheckCircleIcon,
  processing: CircleNotchIcon,
  warning: WarningIcon,
  danger: XCircleIcon,
  info: InfoIcon,
  neutral: MinusCircleIcon,
} as const satisfies Record<StatusTone, unknown>;

/**
 * Outlined. Border and label both take the status colour.
 *
 * `neutral` uses --muted-foreground for its border, NOT --border. --border measures
 * 1.26:1 in light and 1.31:1 in dark, the same WCAG 1.4.11 failure §4.4 fixed for form
 * controls; the review prototype had inherited it. --muted-foreground gives 4.74:1 and
 * 7.85:1, and makes neutral consistent with the other five, where border == label.
 */
const OUTLINE: Record<StatusTone, string> = {
  success: "text-success border-success",
  processing: "text-processing border-processing",
  warning: "text-warning border-warning",
  danger: "text-destructive border-destructive",
  info: "text-info border-info",
  neutral: "text-muted-foreground border-muted-foreground",
};

/**
 * Solid. The fill is the status colour and the ink is --background.
 *
 * --background, specifically, because it flips with the theme and the status colours
 * flip with it. A theme-stable near-white was tried first and failed hard in dark:
 * #F0FDFA on the bright dark-mode tones measured 1.78:1 to 3.61:1, all six below the
 * 4.5:1 floor. Pairing a fixed ink with a flipping fill cannot work.
 *
 * Measured with --background: 4.74:1 to 5.36:1 in light, 5.26:1 to 10.64:1 in dark.
 * No new token was needed. Do not "fix" this to --primary-foreground.
 */
const SOLID: Record<StatusTone, string> = {
  success: "bg-success border-success text-background",
  processing: "bg-processing border-processing text-background",
  warning: "bg-warning border-warning text-background",
  danger: "bg-destructive border-destructive text-background",
  info: "bg-info border-info text-background",
  neutral: "bg-muted-foreground border-muted-foreground text-background",
};

/**
 * A badge is always one line.
 *
 * A status that wraps to three lines stops reading as a status and starts reading as a
 * paragraph in a box. Reported in review 2026-08-31.
 *
 * This is a constraint on the LABEL, not a licence to clip: nothing here truncates, and
 * the badge grows with its text in every language. What it means is that a status label
 * is one to three words — "Active", "Filing", "Renews in 14 days". If a label is long
 * enough to need wrapping, it is not a status; it is a message, and it belongs in a
 * description, a tooltip or a row of its own.
 *
 * §5 is still satisfied. The rule there is that no layout may depend on a string length
 * and no fixed-height container may hold translatable text. The badge has neither a
 * fixed width nor a fixed height — it widens as the text does, and the surfaces around
 * it absorb that: a DataTableLayout scrolls horizontally, a detail row uses flex-wrap so
 * whole badges move to the next line instead of breaking inside one.
 */
const BASE = [
  "text-caption inline-flex items-center gap-1.5 whitespace-nowrap",
  "border px-2 py-0.5",
  "rounded-none",
].join(" ");

export function StatusBadge({
  tone,
  emphasis = "default",
  children,
  className,
}: StatusBadgeProps) {
  const Glyph = ICON[tone];
  return (
    <span className={cx(BASE, emphasis === "prominent" ? SOLID[tone] : OUTLINE[tone], className)}>
      {/*
        aria-hidden: the label already states the status, and role="img" here would make
        a screen reader announce the tone twice. In a table the column header supplies
        the rest — "Status: Active".
      */}
      <Glyph size={16} weight="regular" aria-hidden="true" className="shrink-0" />
      {children}
    </span>
  );
}
