"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { useId, type ReactNode } from "react";
import { FieldStateContext, type FieldState } from "./field-state";

/**
 * Field — the ZeroCorp form shell.
 *
 * THE REFERENCE IMPLEMENTATION for every form control. Textarea, Select, Combobox,
 * DatePicker and FileUpload compose this rather than reimplementing labels, help text,
 * error handling and aria wiring. docs/DESIGN_SYSTEM.md §17.
 *
 * Built on Base UI Field (MIT), which supplies native validity, touched, dirty, filled
 * and focused state. Externally-supplied errors — a Zod message from
 * @zerocorp/contracts, a server rejection — flow through `error`.
 *
 * `label` is required by design. A placeholder is not a label: it disappears on focus,
 * is invisible to some assistive technology, and fails at 4.74:1 as help text.
 */
export interface FieldProps {
  /** Always rendered. A placeholder is not a label. */
  label: string;
  /** Help text below the control. Hidden while an error is shown. */
  description?: string;
  /** Error message. Present ⇒ the control renders its error state. */
  error?: string;
  /** Success message. Ignored when `error` is set. */
  success?: string;
  /** Marks the control required and appends a visible indicator to the label. */
  required?: boolean;
  /** Disables the control. Not the same as `loading`. */
  disabled?: boolean;
  /** An async operation is in flight — validating, searching, saving. */
  loading?: boolean;
  /** Field name, used by Base UI's Form integration. */
  name?: string;
  /** The control: Input today; Textarea, Select and the rest as they land. */
  children: ReactNode;
  className?: string;
}

export function Field({
  label,
  description,
  error,
  success,
  required = false,
  disabled = false,
  loading = false,
  name,
  children,
  className,
}: FieldProps) {
  const id = useId();
  const descriptionId = `${id}-description`;
  const messageId = `${id}-message`;

  const invalid = error !== undefined && error !== "";
  const valid = !invalid && success !== undefined && success !== "";
  const showDescription = description !== undefined && description !== "" && !invalid;

  const state: FieldState = {
    invalid,
    valid,
    loading,
    describedBy:
      [invalid || valid ? messageId : undefined, showDescription ? descriptionId : undefined]
        .filter(Boolean)
        .join(" ") || undefined,
  };

  return (
    <FieldStateContext.Provider value={state}>
      <BaseField.Root
        name={name}
        disabled={disabled}
        className={["flex w-full flex-col gap-2", className].filter(Boolean).join(" ")}
      >
        <BaseField.Label className="text-label text-foreground data-disabled:text-muted-foreground">
          {label}
          {required ? (
            <span className="text-destructive ml-1" aria-hidden="true">
              *
            </span>
          ) : null}
        </BaseField.Label>

        {children}

        {showDescription ? (
          <BaseField.Description id={descriptionId} className="text-caption text-muted-foreground">
            {description}
          </BaseField.Description>
        ) : null}

        {/*
          role="alert" announces the message when it appears. Colour is never the only
          carrier of meaning (§14) — the message itself is the primary signal, and the
          border is reinforcement.
        */}
        {invalid ? (
          <p id={messageId} role="alert" className="text-caption text-destructive">
            {error}
          </p>
        ) : null}

        {valid ? (
          <p id={messageId} role="status" className="text-caption text-success">
            {success}
          </p>
        ) : null}
      </BaseField.Root>
    </FieldStateContext.Provider>
  );
}
