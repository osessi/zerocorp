"use client";

import { Checkbox as BaseCheckbox } from "@base-ui/react/checkbox";
import { CheckIcon, MinusIcon } from "@phosphor-icons/react/dist/ssr";
import { useFieldState } from "./field-state";
import { CHOICE_BOX, CHOICE_CHECKED, CONTROL_FOCUS, cx } from "./control-styles";

/**
 * Checkbox — square, --radius-none.
 *
 * A square checkbox beside a circular radio is the forty-year-old signal for
 * "many" versus "one". Keeping the square costs nothing and carries meaning.
 *
 * Supports the indeterminate state, which a checkbox group's parent needs.
 * docs/DESIGN_SYSTEM.md §17.
 */
export interface CheckboxProps {
  checked?: boolean;
  defaultChecked?: boolean;
  indeterminate?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
  required?: boolean;
  readOnly?: boolean;
  name?: string;
  value?: string;
  id?: string;
  className?: string;
  "aria-label"?: string;
}

export function Checkbox({ className, indeterminate, ...props }: CheckboxProps) {
  const field = useFieldState();

  return (
    <BaseCheckbox.Root
      {...props}
      indeterminate={indeterminate ?? false}
      className={cx(
        CHOICE_BOX,
        CHOICE_CHECKED,
        CONTROL_FOCUS,
        // Same boundary token as a text field: a control border must clear 3:1.
        field.invalid ? "border-destructive" : "border-input hover:border-input-hover",
        "data-disabled:bg-muted data-disabled:border-border data-disabled:cursor-not-allowed",
        // The row is what the eye follows; nudge the box onto the label's first line.
        "mt-0.5",
        className,
      )}
      aria-invalid={field.invalid || undefined}
      aria-describedby={field.describedBy}
    >
      <BaseCheckbox.Indicator className="flex items-center justify-center">
        {indeterminate ? (
          <MinusIcon size={12} weight="bold" />
        ) : (
          <CheckIcon size={12} weight="bold" />
        )}
      </BaseCheckbox.Indicator>
    </BaseCheckbox.Root>
  );
}
