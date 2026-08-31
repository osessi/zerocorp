/**
 * Shared visual contract for Button and IconButton.
 *
 * Same discipline as ./field/control-styles.ts: the two components compose these
 * fragments rather than restyling themselves, so a variant never drifts between them.
 *
 * Every value here is a token. docs/DESIGN_SYSTEM.md §17.
 */
import type { IconSize } from "../icon";
import { COLOR_TRANSITION } from "../motion";

/**
 * Five variants, a prominence ladder built the way §1 says hierarchy is built —
 * from borders and typography, not from shadows or gradients:
 *
 *   primary    filled, bordered      one per screen, the thing to do
 *   danger     filled, bordered      destructive, and it must look destructive
 *   secondary  bordered, page fill   has an edge, does not compete
 *   tertiary   no border, full ink   reads as a button on hover
 *   ghost      no border, muted ink  recedes until hovered — toolbars, dense rows
 *
 * §17 also names an `icon` variant. It is implemented as a separate `IconButton`
 * instead: a button with no visible label MUST carry an accessible name, and a required
 * prop enforces that at the type level in a way a variant string cannot.
 */
export type ButtonVariant = "primary" | "secondary" | "tertiary" | "ghost" | "danger";

export type ButtonSize = "sm" | "md" | "lg";

/**
 * Shared by every button.
 *
 * `whitespace-nowrap` for the same reason StatusBadge has it: a button label that wraps
 * stops reading as a control. It constrains the LABEL, not the layout — nothing here
 * truncates and nothing has a fixed width.
 *
 * NEVER add `outline-none` (see control-styles.ts).
 */
export const BUTTON_BASE = [
  "inline-flex shrink-0 items-center justify-center",
  "rounded-none border whitespace-nowrap select-none",
  COLOR_TRANSITION,
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
  // No disabled: styling here at all. `disabled` and `loading` both set the disabled
  // attribute and must NOT look the same, so both the dimming and the cursor are applied
  // by the component from BUTTON_INERT / BUTTON_BUSY. A `disabled:` variant here would
  // out-specify them and win — which is exactly how the first version broke.
  //
  // Press feedback. Colour-free on purpose: `hover` already owns colour, so `active`
  // needs a channel of its own that works identically in both themes and in greyscale.
  // 1px, not a bounce — §10 forbids decorative motion. The reduced-motion rule in
  // tokens.css collapses the transition, so it lands instantly for anyone who asked.
  "active:translate-y-px",
].join(" ");

/**
 * Inert — genuinely unavailable.
 *
 * Applied by the component only when the button is disabled and NOT loading. It cannot
 * live in BUTTON_BASE as `disabled:opacity-60`, because `loading` also sets the disabled
 * attribute (a submit that can fire twice is a defect) and would inherit the dimming.
 *
 * That is exactly what happened in the first implementation. Measured in Chrome on
 * 2026-08-31, the loading label read 1.76:1 on primary and 1.86:1 on danger — the state
 * where the user is waiting and most needs to read "Submitting" was the least legible
 * thing on the screen. WCAG 1.4.3 exempts an INACTIVE component from contrast. A busy
 * one is not inactive; it is working, and it owes the same 4.5:1 as any other label.
 *
 * So: inert dims, busy does not. The two are also separated by the cursor and by the
 * spinner, so the distinction survives greyscale.
 */
export const BUTTON_INERT = "cursor-not-allowed opacity-60";

/**
 * Busy. Full contrast, and a cursor that says "wait", not "never".
 *
 * Plain utilities, not `disabled:` ones. `disabled:cursor-not-allowed` carries a
 * pseudo-class and would out-specify a bare `cursor-progress`, so the busy cursor never
 * appeared — a defect the class-name test happily passed because the class WAS present.
 * Measured in Chrome 2026-08-31.
 */
export const BUTTON_BUSY = "cursor-progress";

/**
 * Variants.
 *
 * Contrast, measured 2026-08-31 (light / dark):
 *
 *   primary    label   5.14 / 5.14     edge 5.36 / 3.69     hover label 7.35 / 7.35
 *   danger     label   4.83 / 5.26     edge 4.83 / 5.26     hover label 6.47 / 7.16
 *   secondary  label  18.16 / 17.74    edge 3.03 / 3.72     hover edge 4.35 / 4.68
 *   tertiary   label  18.16 / 17.74
 *   ghost      label   4.74 / 7.79     hover label 18.16 / 17.74
 *
 * `tertiary` deliberately does NOT use --primary as text. --primary has no dark value,
 * so teal text measures 3.69:1 on #0A0A0A — fine for a fill or a border, below the
 * 4.5:1 floor for text. Recorded as an open item; --processing already carries the
 * lighter dark teal for exactly this reason, but it is a status token and borrowing it
 * for an action would put two meanings on one colour.
 *
 * `secondary` fills with --background, not --secondary. --input is tuned against the
 * page colour and measures 3.03:1 there; on --secondary (#F4F4F5) the same border falls
 * to 2.76:1 and fails WCAG 1.4.11. A button edge is a control boundary — §4.4.
 */
export const BUTTON_VARIANT: Record<ButtonVariant, string> = {
  primary: [
    "bg-primary border-primary text-primary-foreground",
    "hover:bg-primary-hover hover:border-primary-hover",
  ].join(" "),
  danger: [
    "bg-destructive border-destructive text-destructive-foreground",
    "hover:bg-destructive-hover hover:border-destructive-hover",
  ].join(" "),
  secondary: [
    "bg-background border-input text-foreground",
    "hover:border-input-hover hover:bg-accent",
  ].join(" "),
  tertiary: ["border-transparent bg-transparent text-foreground", "hover:bg-accent"].join(" "),
  ghost: [
    "border-transparent bg-transparent text-muted-foreground",
    "hover:bg-accent hover:text-foreground",
  ].join(" "),
};

/**
 * Sizes. `md` is 40px — the same as CONTROL_HEIGHT, so a button sits flush beside an
 * Input on one row without either being nudged.
 *
 * `sm` is 32px, which still clears the 24×24 minimum target of WCAG 2.5.8.
 */
export const BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "h-8 gap-1.5 px-3 text-label",
  md: "h-10 gap-2 px-4 text-label",
  lg: "h-12 gap-2 px-6 text-body font-medium",
};

/** Square, so the icon sits on the centre of both axes. Same heights as BUTTON_SIZE. */
export const ICON_BUTTON_SIZE: Record<ButtonSize, string> = {
  sm: "size-8",
  md: "size-10",
  lg: "size-12",
};

/** §11: 20px is the standard UI size. 16px inside a 32px control, 24px inside 48px. */
export const ICON_PX: Record<ButtonSize, IconSize> = { sm: 16, md: 20, lg: 24 };
