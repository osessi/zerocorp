import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "../field/control-styles";
import type { IconSize } from "../icon";

/**
 * Spinner — the one busy indicator for the whole product.
 *
 * Phosphor `CircleNotch`, Regular weight, in every size. §11 forbids one icon appearing
 * in two weights for the same meaning, and "busy" is one meaning everywhere: a button
 * submitting, a field validating, a panel fetching.
 *
 * It existed inline in four places before this component — Button, IconButton, Input and
 * Textarea each spelled it out. That is the drift COLOR_TRANSITION was just extracted to
 * stop, so it is written once here and composed everywhere else.
 *
 * docs/DESIGN_SYSTEM.md §11, §17.
 */

export interface SpinnerProps {
  /** §11: 20px is the standard UI size. */
  size?: IconSize;
  /**
   * Announced to assistive technology, e.g. "Submitting filing".
   *
   * Omit it ONLY when an ancestor already carries `aria-busy` — a Button or an Input
   * does, so the spinner inside one is decorative and would otherwise be announced
   * twice. Standalone, always pass it: a silent spinning glyph tells a screen-reader
   * user nothing at all.
   */
  label?: string;
  className?: string;
}

export function Spinner({ size = 20, label, className }: SpinnerProps) {
  /*
    motion-safe, so someone who asked for less motion gets a static glyph.

    That is only acceptable because a Spinner is never the sole signal that something is
    loading. Button keeps its label visible while busy, Input and Textarea set aria-busy,
    and a standalone Spinner takes `label`. If the spin were the only carrier, reduced
    motion would make "loading" and "loaded" identical — the same failure as colour being
    the only carrier of meaning. §14.
  */
  const glyph = (
    <CircleNotchIcon
      size={size}
      weight="regular"
      aria-hidden="true"
      className={cx("shrink-0 motion-safe:animate-spin", className)}
    />
  );

  if (!label) return glyph;

  return (
    <span role="status" className="inline-flex items-center">
      {glyph}
      <span className="sr-only">{label}</span>
    </span>
  );
}
