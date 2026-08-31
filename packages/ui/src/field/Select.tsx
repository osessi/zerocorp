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
/** Exported so the visual contract is assertable, as button-styles.ts is. */
export const POPUP = [
  // --input, not --border. A popup edge separates a floating layer from the page, so it
  // is a meaningful graphical object and owes WCAG 1.4.11 its 3:1. --border measures
  // 1.26:1 light and 1.31:1 dark and the popup read as edgeless — reported in review
  // 2026-08-31, the same failure §4.4 fixed for controls and §21.20 for the neutral badge.
  "bg-surface-elevated border-input border shadow-floating",
  "max-h-72 overflow-y-auto",
  // px-1 so a selected row's box does not touch the popup edge.
  "px-1 py-1",
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
 * There are TWO states here and they mean different things:
 *
 *   data-highlighted   where the cursor is — keyboard and pointer, unified by Base UI,
 *                      which is why there is no separate `hover:` rule
 *   data-selected      the value the field actually holds
 *
 * Until 2026-08-31 only `data-highlighted` had a rule. Selection rode on a 16px tick and
 * nothing else, so the grey band — the CURSOR — was the loudest thing in the popup and
 * read as "selected". The louder visual belonged to the less important meaning.
 *
 * Treatment C, chosen by review 2026-08-31: the selected row is BOXED in --primary and
 * carries a filled tick badge. Hierarchy from borders, §1.
 *
 * The label stays --foreground, NOT --primary. Teal text measures 3.18:1 on
 * --surface-elevated in dark, below the 4.5:1 floor, and in greyscale it made the
 * selected row the DIMMEST text in the list — the one row that must read best. The box
 * and the badge carry the teal instead: a border is a graphical object at a 3:1
 * threshold, which 3.18 clears. Revisit if §24.15 gives --primary a dark value.
 */
export const ITEM = [
  "relative flex cursor-default items-center gap-2",
  // The border is always there, transparent when unselected. Adding it on selection
  // would shift every row by 2px the moment a value is chosen.
  "border border-transparent",
  "py-2 pr-3 pl-8",
  "text-body sm:text-body-sm text-foreground",
  "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
  // Two carriers, neither of them colour alone: the box and the weight. §14.
  "data-selected:border-primary data-selected:font-medium",
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
                  {/*
                    A filled badge, not a bare tick. Base UI renders the indicator only
                    when the item is selected, so the badge IS the selection marker and
                    it survives greyscale as a shape. --primary-foreground on --primary
                    measures 5.14:1 in both themes.
                  */}
                  <BaseSelect.ItemIndicator className="bg-primary text-primary-foreground absolute left-2 flex size-4 items-center justify-center">
                    <CheckIcon size={12} weight="bold" />
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
