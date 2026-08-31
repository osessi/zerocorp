"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { useFieldState } from "./field-state";
import {
  CONTROL_FOCUS,
  SWITCH_LABEL,
  SWITCH_THUMB,
  SWITCH_TRACK,
  cx,
} from "./control-styles";

/**
 * Switch — a labelled rectangle with a square thumb, --radius-none.
 *
 * The state word sits inside the track: ON on the left when on, OFF on the right when
 * off. That second signal is not decoration. DESIGN_SYSTEM.md §14 requires that colour
 * never be the only carrier of meaning, and a switch that reads only through colour and
 * thumb position fails for a colour-blind user scanning a settings list — exactly where
 * a toggle like Autopilot lives.
 *
 * A switch applies immediately and is immediately reversible. When a change is not
 * reversible, use a Checkbox and a submit action instead; do not bolt a confirmation
 * onto a switch.
 *
 * docs/DESIGN_SYSTEM.md §17.
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
  /**
   * The word shown while on.
   *
   * A prop rather than a hard-coded string, so the caller supplies a translated value
   * once an i18n layer exists. English is the default because the product is
   * English-first (§5), not because the component assumes English.
   */
  labelOn?: string;
  /** The word shown while off. */
  labelOff?: string;
  className?: string;
  "aria-label"?: string;
}

export function Switch({
  labelOn = "On",
  labelOff = "Off",
  className,
  ...props
}: SwitchProps) {
  const field = useFieldState();

  return (
    <BaseSwitch.Root
      {...props}
      className={cx(
        SWITCH_TRACK,
        CONTROL_FOCUS,
        field.invalid ? "border-destructive" : "border-input hover:border-input-hover",
        "data-disabled:border-border data-disabled:cursor-not-allowed data-disabled:opacity-60",
        className,
      )}
      aria-invalid={field.invalid || undefined}
      aria-describedby={field.describedBy}
    >
      {/*
        aria-hidden: the accessible state already comes from role="switch" and
        aria-checked. Exposing the word again would make a screen reader say it twice.
      */}
      <span
        aria-hidden="true"
        className={cx(
          SWITCH_LABEL,
          "text-primary-foreground left-1.5 hidden",
          "[[data-checked]_&]:block",
          "[[data-disabled]_&]:text-muted-foreground",
        )}
      >
        {labelOn}
      </span>

      <span
        aria-hidden="true"
        className={cx(
          SWITCH_LABEL,
          "text-foreground right-1.5",
          "[[data-checked]_&]:hidden",
          "[[data-disabled]_&]:text-muted-foreground",
        )}
      >
        {labelOff}
      </span>

      <BaseSwitch.Thumb className={SWITCH_THUMB} />
    </BaseSwitch.Root>
  );
}
