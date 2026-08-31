"use client";

import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import type { ComponentPropsWithoutRef, ComponentType } from "react";
import { cx } from "../field/control-styles";
import {
  BUTTON_BASE,
  BUTTON_BUSY,
  BUTTON_INERT,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  ICON_PX,
  type ButtonSize,
  type ButtonVariant,
} from "./button-styles";

/**
 * Button — the ZeroCorp action control.
 *
 * A plain <button>. Base UI has no Button primitive and does not need one: there is no
 * state machine here, only a native element and a token contract. Adding a wrapper
 * library would buy nothing and cost a dependency.
 *
 * Variants primary · secondary · tertiary · ghost · danger, states
 * default · hover · active · focus · loading · disabled. docs/DESIGN_SYSTEM.md §17.
 */

/**
 * A Phosphor icon component. Structural rather than imported: `@phosphor-icons/react`
 * exports no public `Icon` type from `/dist/ssr`, and pinning to an internal one would
 * break on a patch release.
 */
export type GlyphComponent = ComponentType<{
  size?: number;
  weight?: "regular";
  className?: string;
  "aria-hidden"?: boolean | "true" | "false";
}>;

export interface ButtonProps
  extends Omit<ComponentPropsWithoutRef<"button">, "className"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /**
   * Busy. Also disables the button — a submit that can be fired twice is a defect, not
   * a feature. Announced with aria-busy.
   */
  loading?: boolean;
  /** Optional leading or trailing glyph. Sized from `size`; never sized by the caller. */
  icon?: GlyphComponent;
  iconPosition?: "start" | "end";
  className?: string;
}

export function Button({
  variant = "secondary",
  size = "md",
  loading = false,
  icon: Icon,
  iconPosition = "start",
  disabled,
  type,
  children,
  className,
  ...props
}: ButtonProps) {
  const px = ICON_PX[size];

  /*
    The spinner takes the icon slot rather than replacing the label.

    Two alternatives were rejected. Hiding the label and centring a spinner over it keeps
    the width perfectly stable but removes the one piece of text that says what is
    happening. Appending a spinner alongside the icon makes the button grow every time it
    is pressed. Taking the slot means a button that HAS an icon does not move at all, and
    a button without one grows once, by 22px, and keeps its label throughout.
  */
  const glyph = loading ? (
    <CircleNotchIcon
      size={px}
      weight="regular"
      aria-hidden="true"
      className="shrink-0 motion-safe:animate-spin"
    />
  ) : Icon ? (
    <Icon size={px} weight="regular" aria-hidden="true" className="shrink-0" />
  ) : null;

  return (
    <button
      // Default to "button". A <button> inside a <form> submits it by default, which
      // turns every unlabelled Cancel into an accidental submit.
      type={type ?? "button"}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cx(
        BUTTON_BASE,
        BUTTON_SIZE[size],
        BUTTON_VARIANT[variant],
        // Inert dims; busy does not. Both set the disabled attribute, so this cannot be
        // a `disabled:` variant — see BUTTON_INERT.
        loading ? BUTTON_BUSY : disabled ? BUTTON_INERT : undefined,
        className,
      )}
      {...props}
    >
      {iconPosition === "start" ? glyph : null}
      {children}
      {iconPosition === "end" ? glyph : null}
    </button>
  );
}
