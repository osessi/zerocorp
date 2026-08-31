"use client";

import { Radio as BaseRadio } from "@base-ui/react/radio";
import { RadioGroup as BaseRadioGroup } from "@base-ui/react/radio-group";
import type { ReactNode } from "react";
import { useFieldState } from "./field-state";
import { CHOICE_BOX, CHOICE_CIRCLE, CONTROL_FOCUS, cx } from "./control-styles";

/**
 * Radio — a circle. The one deliberate exception to --radius-none.
 *
 * DESIGN_SYSTEM.md §7 already allows it: "if something needs to be a circle, it is a
 * circle, and that is a component decision, not a scale value."
 *
 * The shape of a radio is a signal learned over forty years — square means many,
 * round means one. Breaking it charges the user a comprehension cost for an identity
 * gain the rest of the interface already carries. A square checkbox and a square radio
 * side by side in one form would be genuinely ambiguous. Decided 2026-08-31.
 *
 * A radio never stands alone: it always lives inside a RadioGroup, itself inside a
 * Field with as="group" so the set gets a <legend>.
 */
export interface RadioProps {
  value: string;
  disabled?: boolean;
  readOnly?: boolean;
  required?: boolean;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

export function Radio({ className, ...props }: RadioProps) {
  const field = useFieldState();

  return (
    <BaseRadio.Root
      {...props}
      className={cx(
        CHOICE_BOX,
        CHOICE_CIRCLE,
        CONTROL_FOCUS,
        field.invalid ? "border-destructive" : "border-input hover:border-input-hover",
        "data-checked:border-primary",
        "data-disabled:border-border data-disabled:cursor-not-allowed data-disabled:opacity-60",
        "mt-0.5",
        className,
      )}
      aria-invalid={field.invalid || undefined}
    >
      {/* A filled dot, not a check: the radio reads as "this one" rather than "done". */}
      <BaseRadio.Indicator className="bg-primary size-2 rounded-full" />
    </BaseRadio.Root>
  );
}

export interface RadioGroupProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  name?: string;
  disabled?: boolean;
  children: ReactNode;
  className?: string;
}

/**
 * RadioGroup — the roving-focus container.
 *
 * It takes its accessible name from the surrounding Field's <legend> through
 * aria-labelledby, which is why a radio group must sit inside `<Field as="group">`.
 */
export function RadioGroup({ children, className, ...props }: RadioGroupProps) {
  const field = useFieldState();

  return (
    <BaseRadioGroup
      {...props}
      aria-labelledby={field.labelId || undefined}
      aria-describedby={field.describedBy}
      className={cx("flex flex-col gap-3", className)}
    >
      {children}
    </BaseRadioGroup>
  );
}
