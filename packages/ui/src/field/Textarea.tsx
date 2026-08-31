"use client";

import { Field as BaseField } from "@base-ui/react/field";
import type { ComponentPropsWithoutRef } from "react";
import { Spinner } from "../feedback/Spinner";
import { useFieldState } from "./field-state";
import {
  CONTROL_BASE,
  CONTROL_DISABLED,
  CONTROL_FOCUS,
  controlTone,
  cx,
} from "./control-styles";

/**
 * Textarea — the ZeroCorp multi-line text control.
 *
 * No new pattern. It is Field.Control rendered as a <textarea>, composing exactly the
 * same style fragments as Input, reading exactly the same Field context, and wired
 * for accessibility by the same shell.
 *
 * Three deliberate differences from Input, all forced by the element:
 *   - no fixed height; `rows` sets the initial height and it grows with content
 *   - vertical resize only — horizontal resize breaks the layout grid
 *   - the loading spinner sits at the top, not vertically centred, because a tall
 *     control has no meaningful middle
 *
 * docs/DESIGN_SYSTEM.md §17.
 */
export interface TextareaProps
  extends Omit<ComponentPropsWithoutRef<"textarea">, "className" | "rows"> {
  /** Initial visible height in lines. Default 4 — enough to signal "write freely". */
  rows?: number;
  /**
   * Overrides the surrounding Field's loading state. Normally left unset — put
   * `loading` on the Field so the whole control group agrees.
   */
  loading?: boolean;
  className?: string;
}

export function Textarea({ rows = 4, loading, className, ...props }: TextareaProps) {
  const field = useFieldState();
  const isLoading = loading ?? field.loading;

  return (
    <div className="relative w-full">
      {/*
        Field.Control is typed for <input>. Textarea-specific props therefore travel on
        the rendered element; Base UI merges the Control's own props onto it.
      */}
      <BaseField.Control
        render={<textarea rows={rows} {...props} />}
        className={cx(
          CONTROL_BASE,
          // py-2 replaces Input's fixed height: a multi-line control is sized by rows.
          "resize-y py-2",
          controlTone(field),
          CONTROL_FOCUS,
          CONTROL_DISABLED,
          "disabled:resize-none",
          isLoading && "pr-10",
          className,
        )}
        aria-invalid={field.invalid || undefined}
        aria-describedby={field.describedBy}
        aria-busy={isLoading || undefined}
      />

      {isLoading ? (
        <span className="pointer-events-none absolute top-3 right-3" aria-hidden="true">
          <Spinner size={16} className="text-muted-foreground" />
        </span>
      ) : null}
    </div>
  );
}
