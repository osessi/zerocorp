"use client";

import { Menu } from "@base-ui/react/menu";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { cx } from "../field/control-styles";
import type { GlyphComponent } from "../button/Button";
import {
  OVERLAY_GROUP_LABEL,
  OVERLAY_ITEM,
  OVERLAY_ITEM_INDICATOR,
  OVERLAY_MOTION,
  OVERLAY_SEPARATOR,
  OVERLAY_SURFACE,
} from "./overlay-styles";

/**
 * DropdownMenu — actions, not choices.
 *
 * The distinction matters and decides which component to reach for: a Select holds a
 * VALUE the form submits; a menu fires an ACTION and holds nothing. A menu used as a
 * select loses the value on close; a select used as a menu announces itself wrong.
 *
 * Composes the same popup surface and the same item rules as Select — a menu and a
 * select popup that highlight differently teach two rules for one gesture.
 * ./overlay-styles.ts, docs/DESIGN_SYSTEM.md §17, §19.
 */

const POPUP = cx(OVERLAY_SURFACE, "min-w-56 max-w-[calc(100vw-2rem)] px-1 py-1", OVERLAY_MOTION);

export interface DropdownMenuProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "start" | "center" | "end";
  className?: string;
}

export function DropdownMenu({ trigger, children, align = "start", className }: DropdownMenuProps) {
  return (
    <Menu.Root>
      <Menu.Trigger render={trigger as React.ReactElement} />
      <Menu.Portal>
        <Menu.Positioner sideOffset={4} align={align} className="z-50">
          <Menu.Popup className={cx(POPUP, className)}>{children}</Menu.Popup>
        </Menu.Positioner>
      </Menu.Portal>
    </Menu.Root>
  );
}

export interface MenuItemProps {
  icon?: GlyphComponent;
  /**
   * Destructive items take --destructive as TEXT, never a red fill. A menu is a list, and
   * one filled red band would out-shout every other row in it.
   */
  destructive?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
}

export function MenuItem({ icon: Icon, destructive, disabled, onClick, children }: MenuItemProps) {
  return (
    <Menu.Item
      disabled={disabled}
      onClick={onClick}
      className={cx(OVERLAY_ITEM, destructive && "text-destructive")}
    >
      {Icon ? <Icon size={16} aria-hidden="true" className="absolute left-2 shrink-0" /> : null}
      {children}
    </Menu.Item>
  );
}

export function MenuGroupLabel({ children }: { children: ReactNode }) {
  return <Menu.GroupLabel className={OVERLAY_GROUP_LABEL}>{children}</Menu.GroupLabel>;
}

export function MenuSeparator() {
  return <Menu.Separator className={OVERLAY_SEPARATOR} />;
}

/** A toggle inside a menu. The badge marks it, so state is a shape and not only a colour. */
export function MenuCheckboxItem({
  checked,
  onCheckedChange,
  children,
}: {
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  children: ReactNode;
}) {
  return (
    <Menu.CheckboxItem checked={checked} onCheckedChange={onCheckedChange} className={OVERLAY_ITEM}>
      <Menu.CheckboxItemIndicator className={OVERLAY_ITEM_INDICATOR}>
        <CheckIcon size={12} weight="bold" />
      </Menu.CheckboxItemIndicator>
      {children}
    </Menu.CheckboxItem>
  );
}

/** One-of-many inside a menu — density, sort order, a view. */
export function MenuRadioGroup({
  value,
  onValueChange,
  children,
}: {
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
}) {
  return (
    <Menu.RadioGroup value={value} onValueChange={onValueChange}>
      {children}
    </Menu.RadioGroup>
  );
}

export function MenuRadioItem({ value, children }: { value: string; children: ReactNode }) {
  return (
    <Menu.RadioItem value={value} className={OVERLAY_ITEM}>
      <Menu.RadioItemIndicator className={OVERLAY_ITEM_INDICATOR}>
        <CheckIcon size={12} weight="bold" />
      </Menu.RadioItemIndicator>
      {children}
    </Menu.RadioItem>
  );
}
