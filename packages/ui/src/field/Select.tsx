"use client";

import { Select as BaseSelect } from "@base-ui/react/select";
import { CaretDownIcon, CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { useFieldState } from "./field-state";
import {
  CONTROL_BASE,
  CONTROL_FOCUS,
  CONTROL_HEIGHT,
  controlTone,
  cx,
} from "./control-styles";

/**
 * Select — the ZeroCorp single-choice control.
 *
 * Composes the same Field shell, the same control-styles fragments and the same tokens
 * as Input and Textarea. No new pattern.
 *
 * Two differences forced by the primitive, both handled inside this file so callers
 * never see them:
 *
 *   - The trigger is a <button>, not an <input>. `<label for>` cannot address a button,
 *     so it takes aria-labelledby from the Field context. Native `disabled:` variants do
 *     work on a button, but the empty state is `data-placeholder`, not `::placeholder`.
 *   - The popup renders in a portal. `alignItemWithTrigger` is deliberately off: the
 *     default overlaps the trigger to line the selected item up under the cursor, which
 *     reads as macOS, not as a calm form control.
 *
 * docs/DESIGN_SYSTEM.md §17.
 */
export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps {
  options: readonly SelectOption[];
  /** Shown when nothing is selected. Never a substitute for the Field label. */
  placeholder?: string;
  value?: string | null;
  defaultValue?: string | null;
  onValueChange?: (value: string | null) => void;
  name?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
}

/** Popup surface. Elevated, bordered, radius 0 — §7, §8. */
const POPUP = [
  "bg-surface-elevated border-border border shadow-floating",
  "max-h-72 overflow-y-auto",
  "py-1",
  // At least as wide as its trigger, free to grow so a long option stays on one line,
  // never wider than the space the positioner has.
  //
  // CSS min-width beats max-width, so these can only conflict if the trigger is itself
  // wider than the available space — which the min-w-0 on Select.Value now prevents.
  "min-w-(--anchor-width) max-w-(--available-width)",
  "origin-(--transform-origin)",
  "transition-opacity duration-fast ease-out",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
].join(" ");

/**
 * Option row.
 *
 * `data-highlighted` is the keyboard AND pointer state — Base UI unifies them, so a
 * mouse user and a keyboard user see the same affordance. That is why there is no
 * separate `hover:` rule here.
 */
const ITEM = [
  "relative flex cursor-default items-center gap-2",
  "py-2 pr-3 pl-9",
  "text-body sm:text-body-sm text-foreground",
  "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
  "data-disabled:text-muted-foreground data-disabled:cursor-not-allowed",
  "outline-hidden",
].join(" ");

export function Select({
  options,
  placeholder = "Select an option",
  className,
  ...rootProps
}: SelectProps) {
  const field = useFieldState();

  return (
    <BaseSelect.Root items={options as SelectOption[]} {...rootProps}>
      <BaseSelect.Trigger
        className={cx(
          CONTROL_BASE,
          CONTROL_HEIGHT,
          controlTone(field),
          CONTROL_FOCUS,
          // A button centres its content and has no ::placeholder.
          "flex items-center justify-between gap-2 text-left",
          "data-placeholder:text-muted-foreground",
          "disabled:cursor-not-allowed disabled:bg-muted disabled:text-muted-foreground",
          "disabled:border-border disabled:hover:border-border",
          className,
        )}
        aria-labelledby={field.labelId || undefined}
        aria-describedby={field.describedBy}
        aria-invalid={field.invalid || undefined}
      >
        {/*
          min-w-0 is not optional. A flex child defaults to min-width:auto and refuses to
          shrink below its content, so `truncate` never fires and a long option pushes the
          trigger — and the page — wider than the viewport. Found on a 375px screen,
          2026-08-31.
        */}
        <BaseSelect.Value className="min-w-0 truncate" placeholder={placeholder} />
        <BaseSelect.Icon className="text-muted-foreground shrink-0">
          <CaretDownIcon size={16} weight="regular" />
        </BaseSelect.Icon>
      </BaseSelect.Trigger>

      <BaseSelect.Portal>
        <BaseSelect.Positioner
          sideOffset={4}
          align="start"
          alignItemWithTrigger={false}
          className="z-50"
        >
          <BaseSelect.Popup className={POPUP}>
            <BaseSelect.List>
              {options.map((option) => (
                <BaseSelect.Item
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled ?? false}
                  className={ITEM}
                >
                  <BaseSelect.ItemIndicator className="text-primary absolute left-3 flex items-center">
                    <CheckIcon size={16} weight="bold" />
                  </BaseSelect.ItemIndicator>
                  {/* Never truncated. The popup grows to fit; when it runs out of
                      room the text wraps. A state name the user cannot read is worse
                      than a wider popup or a taller row. */}
                  <BaseSelect.ItemText className="min-w-0">{option.label}</BaseSelect.ItemText>
                </BaseSelect.Item>
              ))}
            </BaseSelect.List>
          </BaseSelect.Popup>
        </BaseSelect.Positioner>
      </BaseSelect.Portal>
    </BaseSelect.Root>
  );
}
