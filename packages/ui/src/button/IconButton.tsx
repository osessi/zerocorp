"use client";

import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import type { ComponentPropsWithoutRef } from "react";
import { cx } from "../field/control-styles";
import type { GlyphComponent } from "./Button";
import {
  BUTTON_BASE,
  BUTTON_BUSY,
  BUTTON_INERT,
  BUTTON_VARIANT,
  ICON_BUTTON_SIZE,
  ICON_PX,
  type ButtonSize,
  type ButtonVariant,
} from "./button-styles";

/**
 * IconButton — a square button whose only content is a glyph.
 *
 * A separate component rather than `<Button variant="icon">`, which is how §17 lists it.
 * The reason is enforcement: a control with no visible text MUST carry an accessible
 * name, and `label` being a required prop makes that a compile error rather than a
 * review comment. A variant string cannot require anything.
 *
 * Sizes match Button exactly, so an IconButton sits flush beside one in a toolbar.
 * The smallest, 32px, still clears the 24×24 target minimum of WCAG 2.5.8.
 */
export interface IconButtonProps
  extends Omit<ComponentPropsWithoutRef<"button">, "className" | "children"> {
  /**
   * The accessible name — required, and never decorative. This is the entire reason the
   * component exists. It is also the tooltip text once Tooltip lands.
   */
  label: string;
  icon: GlyphComponent;
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  className?: string;
}

export function IconButton({
  label,
  icon: Icon,
  variant = "ghost",
  size = "md",
  loading = false,
  disabled,
  type,
  className,
  ...props
}: IconButtonProps) {
  const px = ICON_PX[size];

  return (
    <button
      type={type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      // aria-label, not a visually-hidden span: there is no visible text to associate
      // with, and the glyph itself is aria-hidden.
      aria-label={label}
      className={cx(
        BUTTON_BASE,
        ICON_BUTTON_SIZE[size],
        BUTTON_VARIANT[variant],
        loading ? BUTTON_BUSY : disabled ? BUTTON_INERT : undefined,
        className,
      )}
      {...props}
    >
      {loading ? (
        <CircleNotchIcon
          size={px}
          weight="regular"
          aria-hidden="true"
          className="shrink-0 motion-safe:animate-spin"
        />
      ) : (
        <Icon size={px} weight="regular" aria-hidden="true" className="shrink-0" />
      )}
    </button>
  );
}
