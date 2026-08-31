"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { useFieldState } from "./field-state";
import { CONTROL_FOCUS, SWITCH_THUMB, SWITCH_TRACK, cx } from "./control-styles";

/**
 * Switch — a rectangle with a square thumb, --radius-none.
 *
 * Unlike the radio, dropping the conventional pill creates no ambiguity: a switch is
 * still a switch. It is one of the few places where radius 0 produces something
 * distinctive rather than merely restrained.
 *
 * A switch applies immediately. When a change needs confirming, use a Checkbox and a
 * submit action instead. docs/DESIGN_SYSTEM.md §17.
 */
export interface SwitchProps {
  checked?: boolean;
  defaultChecked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  name?: string;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

export function Switch({ className, ...props }: SwitchProps) {
  const field = useFieldState();

  return (
    <BaseSwitch.Root
      {...props}
      className={cx(
        SWITCH_TRACK,
        CONTROL_FOCUS,
        field.invalid ? "border-destructive" : "border-input hover:border-input-hover",
        "data-disabled:bg-muted data-disabled:border-border data-disabled:cursor-not-allowed",
        className,
      )}
      aria-invalid={field.invalid || undefined}
      aria-describedby={field.describedBy}
    >
      <BaseSwitch.Thumb className={SWITCH_THUMB} />
    </BaseSwitch.Root>
  );
}
