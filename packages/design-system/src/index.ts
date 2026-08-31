/**
 * @zerocorp/design-system — Layer 0
 *
 * Tokens and primitives only: color, typography, spacing, radius, elevation, motion,
 * breakpoints. No product knowledge, no business components.
 *
 * The values live in `./tokens.css`, which is the single source. This module exposes
 * them as typed names so TypeScript can reject a token that does not exist — a
 * misspelt `text-bodySm` fails to compile instead of silently rendering unstyled.
 *
 * Consumed by @zerocorp/ui (ZeroCorp product UI). NOT consumed by
 * @zerocorp/site-renderer, which owns a separate customer theme system.
 * See docs/DESIGN_SYSTEM.md §15 and §16.
 */

/** Semantic colour tokens. docs/DESIGN_SYSTEM.md §4. */
export const COLOR_TOKENS = [
  "background", "foreground",
  "primary", "primary-foreground",
  "secondary", "secondary-foreground",
  "muted", "muted-foreground",
  "accent", "accent-foreground",
  "surface", "surface-elevated",
  "border", "border-hover", "input", "input-hover", "ring",
  "success", "warning", "info", "processing",
  "destructive", "destructive-foreground",
] as const;
export type ColorToken = (typeof COLOR_TOKENS)[number];

/** Typography scale. docs/DESIGN_SYSTEM.md §5. */
export const TEXT_TOKENS = [
  "display-xl", "display-l",
  "h1", "h2", "h3", "h4",
  "body-lg", "body", "body-sm",
  "label", "caption", "overline",
] as const;
export type TextToken = (typeof TEXT_TOKENS)[number];

/** Radius scale. 0px is the signature; there is no md, lg, pill or full. §7. */
export const RADIUS_TOKENS = ["none", "xs", "sm"] as const;
export type RadiusToken = (typeof RADIUS_TOKENS)[number];

/** Motion durations, in milliseconds. §10. */
export const DURATION = {
  fast: 100,
  normal: 150,
  emphasis: 200,
  modal: 250,
} as const;
export type DurationToken = keyof typeof DURATION;

/** Breakpoints, in pixels. §12. */
export const BREAKPOINTS = {
  mobile: 0,
  tablet: 640,
  desktop: 1024,
  large: 1280,
} as const;
export type Breakpoint = keyof typeof BREAKPOINTS;

/**
 * The one status system for the whole product: formation, payments, domains, email,
 * social, agents, content, CRM. A feature never invents its own status colour.
 * §4.3 and §17.
 */
export const STATUS_TONES = [
  "success", "warning", "danger", "info", "neutral", "processing",
] as const;
export type StatusTone = (typeof STATUS_TONES)[number];
