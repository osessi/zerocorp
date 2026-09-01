import type { AnchorHTMLAttributes, ElementType, ReactNode } from "react";
import type { IconSize } from "../icon";
import type { GlyphComponent } from "./Button";
import { cx } from "../cx";
import { BUTTON_BASE, BUTTON_SIZE, BUTTON_VARIANT, ICON_PX, type ButtonSize, type ButtonVariant } from "./button-styles";

/**
 * ButtonLink — a navigation that looks like a Button.
 *
 * It exists because the alternatives are both wrong. A `<button onClick={router.push}>`
 * loses middle-click, cmd-click, "copy link address" and the status bar preview, and it
 * makes a client component out of a page that did not need one. Wrapping a `<button>`
 * in a `<Link>` nests two interactive elements, which assistive technology reads as one
 * confused control.
 *
 * If it navigates, it is an anchor. It shares BUTTON_BASE with Button so the two cannot
 * drift apart, and it deliberately has no `loading` and no `disabled`: a link that is
 * disabled is not a link, and a route that should not be reachable belongs behind a
 * guard rather than behind a greyed-out anchor.
 *
 * `as` lets a router's Link component be passed in, so this package stays framework
 * free — @zerocorp/ui must not import next/link.
 */
export interface ButtonLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, "className"> {
  /** The element to render. Defaults to "a"; pass a router Link where one exists. */
  as?: ElementType;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: GlyphComponent;
  iconPosition?: "start" | "end";
  children: ReactNode;
  className?: string;
}

export function ButtonLink({
  as: Component = "a",
  variant = "secondary",
  size = "md",
  icon: Icon,
  iconPosition = "start",
  children,
  className,
  ...props
}: ButtonLinkProps) {
  const px: IconSize = ICON_PX[size];
  const glyph = Icon ? <Icon size={px} weight="regular" aria-hidden="true" className="shrink-0" /> : null;

  return (
    <Component
      className={cx(BUTTON_BASE, BUTTON_SIZE[size], BUTTON_VARIANT[variant], className)}
      {...props}
    >
      {iconPosition === "start" ? glyph : null}
      {children}
      {iconPosition === "end" ? glyph : null}
    </Component>
  );
}
