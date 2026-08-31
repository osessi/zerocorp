"use client";

import { Field as BaseField } from "@base-ui/react/field";
import type { ComponentPropsWithoutRef } from "react";
import { Spinner } from "../feedback/Spinner";
import { useFieldState } from "./field-state";
import {
  CONTROL_BASE,
  CONTROL_DISABLED,
  CONTROL_FOCUS,
  CONTROL_HEIGHT,
  controlTone,
  cx,
} from "./control-styles";

/**
 * Input — the ZeroCorp single-line text control.
 *
 * Renders Base UI's Field.Control, so it inherits native validity, touched, dirty,
 * filled and focused state and is wired to the surrounding label automatically.
 *
 * All styling composes ./control-styles, shared with Textarea and every control that
 * follows. States: default · hover · focus · loading · disabled · error · success.
 * docs/DESIGN_SYSTEM.md §17.
 */
export interface InputProps
  extends Omit<ComponentPropsWithoutRef<"input">, "size" | "className"> {
  /**
   * Overrides the surrounding Field's loading state. Normally left unset — put
   * `loading` on the Field so the whole control group agrees.
   */
  loading?: boolean;
  className?: string;
}

export function Input({ loading, className, ...props }: InputProps) {
  const field = useFieldState();
  const isLoading = loading ?? field.loading;

  return (
    <div className="relative w-full">
      <BaseField.Control
        {...props}
        className={cx(
          CONTROL_BASE,
          CONTROL_HEIGHT,
          controlTone(field),
          CONTROL_FOCUS,
          CONTROL_DISABLED,
          // Reserve room for the spinner so the value never slides under it.
          isLoading && "pr-10",
          className,
        )}
        aria-invalid={field.invalid || undefined}
        aria-describedby={field.describedBy}
        aria-busy={isLoading || undefined}
      />

      {isLoading ? (
        <span
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center"
          aria-hidden="true"
        >
          <Spinner size={16} className="text-muted-foreground" />
        </span>
      ) : null}
    </div>
  );
}
