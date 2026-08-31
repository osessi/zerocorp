"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { Fieldset as BaseFieldset } from "@base-ui/react/fieldset";
import { useId, type ReactNode } from "react";
import { FieldStateContext, type FieldState } from "./field-state";
import { FieldMessages, resolveFieldMessages } from "./field-messages";

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
 *
 * Two arrangements:
 *
 *   as="control"  (default)  label above a full-width control — Input, Textarea, Select
 *   as="group"               a <fieldset> with a <legend> — Radio and Checkbox groups
 *
 * The group mode exists because a <label> cannot label a set of radios; only a <legend>
 * can. Inside a group each option is a Choice, whose own label sits beside its control.
 * Two levels of label, one shell.
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
  /**
   * "control" labels a single control with a <label>.
   * "group" labels a set of controls with a <fieldset> and <legend>.
   */
  as?: "control" | "group";
  /** The control, or the set of Choice rows when as="group". */
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
  as = "control",
  children,
  className,
}: FieldProps) {
  const id = useId();
  const ids = { descriptionId: `${id}-description`, messageId: `${id}-message` };
  const labelId = `${id}-label`;

  const { invalid, valid, showDescription, describedBy } = resolveFieldMessages({
    description,
    error,
    success,
    ids,
  });

  const state: FieldState = {
    invalid,
    valid,
    loading,
    labelId,
    describedBy,
    inGroup: as === "group",
  };

  const labelText = (
    <>
      {label}
      {required ? (
        <span className="text-destructive ml-1" aria-hidden="true">
          *
        </span>
      ) : null}
    </>
  );

  const renderDescription = (descriptionId: string, text: string) => (
    <BaseField.Description id={descriptionId} className="text-caption text-muted-foreground">
      {text}
    </BaseField.Description>
  );

  /**
   * Order differs by arrangement, and it matters.
   *
   * For a single control the description sits under the control, as help after the
   * thing it describes. For a GROUP it sits under the legend and BEFORE the options:
   * it explains the choice, so it has to arrive before the choices do.
   *
   * The error message always comes last, in both.
   */
  const messages = (
    <FieldMessages
      description={as === "group" ? undefined : description}
      error={error}
      success={success}
      invalid={invalid}
      valid={valid}
      showDescription={as === "group" ? false : showDescription}
      ids={ids}
      renderDescription={renderDescription}
    />
  );

  const groupDescription =
    as === "group" && showDescription && description
      ? renderDescription(ids.descriptionId, description)
      : null;

  return (
    <FieldStateContext.Provider value={state}>
      <BaseField.Root
        name={name}
        disabled={disabled}
        className={["flex w-full flex-col gap-2", className].filter(Boolean).join(" ")}
      >
        {as === "group" ? (
          <BaseFieldset.Root className="flex w-full flex-col gap-2">
            <BaseFieldset.Legend
              id={labelId}
              className="text-label text-foreground data-disabled:text-muted-foreground"
            >
              {labelText}
            </BaseFieldset.Legend>
            {groupDescription}
            {/* Options sit tighter than sections: they are one unit. */}
            <div className="flex flex-col gap-1">{children}</div>
            {messages}
          </BaseFieldset.Root>
        ) : (
          <>
            <BaseField.Label
              id={labelId}
              className="text-label text-foreground data-disabled:text-muted-foreground"
            >
              {labelText}
            </BaseField.Label>
            {children}
            {messages}
          </>
        )}
      </BaseField.Root>
    </FieldStateContext.Provider>
  );
}
