import { cx } from "../cx";
import type { IconSize } from "../icon";
import type { PhosphorIcon } from "./Icon";

/*
  Rebuilt from the pattern in Macro (apps/web, proprietary — "Copyright 2023 CoParse,
  Inc. All rights reserved."). Nothing was copied: their files are Solid components under
  an all-rights-reserved licence, and their icons are proprietary.

  What their nav glyph does, read from source:

    - two weights of the SAME glyph, stacked `absolute inset-0`
    - swapped by OPACITY ALONE, never by mounting or unmounting
    - `transition-opacity duration-150 ease-out`, `motion-reduce:transition-none`
    - the trigger is `filled={isActive()}`

  Their own comment names the reason for the opacity swap and it is the good part:
  neither glyph reflows its button, and the outline glyph does not blink out before the
  filled one arrives. A conditional render does both.

  ---------------------------------------------------------------------------
  SECOND PASS, 2026-09-04 — the animation existed and could not be seen.

  The first build wired the swap to `active` alone, exactly as Macro does. Macro can
  afford that because their rail is always open and the active item changes often. Ours
  is a hover-expanding rail, so the one interaction a person actually performs — moving
  the cursor down the icons — drove NO icon animation at all. The rail widened and the
  glyphs sat there.

  Three triggers now, and they are different signals rather than the same one repeated:

    hover    the glyph FILLS and lifts 1px      "this is a thing you can press"
    active   the glyph stays filled, tinted     "you are here"
    press    the glyph drops back to 0          the click is felt

  Filling on hover is the change that makes it visible. It is also honest: Phosphor's
  fill weight is the same drawing at the same optical size, so the swap reads as the icon
  gaining weight rather than as one icon replacing another.
  ---------------------------------------------------------------------------
*/

export interface NavGlyphProps {
  readonly icon: PhosphorIcon;
  /** You are here. Holds the filled weight and the tint. */
  readonly active?: boolean;
  readonly size?: IconSize;
  readonly className?: string;
}

/** The box, on the icon scale. A literal size would be an arbitrary pixel value. */
const BOX: Record<IconSize, string> = {
  12: "size-3",
  16: "size-4",
  20: "size-5",
  24: "size-6",
  32: "size-8",
  40: "size-10",
};

/*
  Both weights are absolutely positioned in one box so neither can reflow the other, and
  the cross-fade is driven from the ROW (`group/nav`) rather than from the glyph, so
  hovering anywhere on the row fills the icon — not just hovering the 20px glyph itself.
*/
const LAYER =
  "absolute inset-0 transition-[opacity,transform] duration-[--duration-overlay] ease-out motion-reduce:transition-none";

export function NavGlyph({ icon: Glyph, active = false, size = 20, className }: NavGlyphProps) {
  return (
    <span
      className={cx(
        "pointer-events-none relative flex shrink-0 items-center justify-center",
        BOX[size],
        /* The 1px lift. Small on purpose: this is a nav row, not a button, and anything
           larger reads as the icon detaching from its tile. */
        "transition-transform duration-[--duration-overlay] ease-out motion-reduce:transition-none",
        "group-hover/nav:-translate-y-px group-active/nav:translate-y-0",
        className,
      )}
      aria-hidden="true"
    >
      {/* Regular: visible at rest, fades out on hover or when active. */}
      <Glyph
        size={size}
        weight="regular"
        className={cx(
          LAYER,
          active ? "opacity-0" : "opacity-100 group-hover/nav:opacity-0",
        )}
      />
      {/* Fill: the same drawing with weight. Arrives on hover, stays while active. */}
      <Glyph
        size={size}
        weight="fill"
        className={cx(
          LAYER,
          active ? "opacity-100" : "opacity-0 group-hover/nav:opacity-100",
        )}
      />
    </span>
  );
}
