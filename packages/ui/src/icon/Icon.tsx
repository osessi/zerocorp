import type { Icon as PhosphorIconComponent } from "@phosphor-icons/react";
import { cx } from "../cx";
import { ICON_SIZE_DEFAULT, type IconSize, type IconWeight } from "../icon";

/**
 * The one way to render an icon.
 *
 * The enforcement mechanism for §11. `size` is `IconSize`, so `size={16}` does not
 * compile, and a lint rule forbids importing `@phosphor-icons/react` outside this
 * package so nothing can route around it.
 *
 * Phosphor stays. It was the right call for reasons that had nothing to do with licence
 * — both Phosphor and Tabler are MIT — and everything to do with the grid: Phosphor is
 * drawn on 256 and scales cleanly to our 20px standard, where Tabler is drawn on 24 with
 * a 2px stroke and renders heavy at anything but 16.
 */

/**
 * A Phosphor glyph.
 *
 * Their own exported type, not a hand-rolled structural one: a structural type has to
 * guess at `color`, `mirrored` and the ref, and under `exactOptionalPropertyTypes` every
 * guess is a compile error at the call site rather than here.
 */
export type PhosphorIcon = PhosphorIconComponent;

export interface IconProps {
  /** The Phosphor glyph. Import it in the module that names the concept, not here. */
  readonly icon: PhosphorIcon;
  /** On the scale, or it does not compile. */
  readonly size?: IconSize;
  readonly weight?: IconWeight;
  readonly className?: string;
  /**
   * Decorative by default.
   *
   * An icon beside its own label is decoration and must be hidden from a screen reader,
   * or the label is announced twice. Pass `label` only when the icon is the ONLY carrier
   * of the meaning, which on this product is close to never: §14 already requires an
   * icon and a text label together.
   */
  readonly label?: string;
}

export function Icon({
  icon: Glyph,
  size = ICON_SIZE_DEFAULT,
  weight = "regular",
  className,
  label,
}: IconProps) {
  return (
    <Glyph
      size={size}
      weight={weight}
      className={cx("shrink-0", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    />
  );
}
