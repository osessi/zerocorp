"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { useId, type ReactNode } from "react";
import { FieldStateContext, useFieldState, type FieldState } from "./field-state";
import { FieldMessages, resolveFieldMessages } from "./field-messages";

/**
 * Choice — the inline label row for Checkbox, Radio and Switch.
 *
 * Not a second shell. It reuses the same field-state context and the same message layer
 * as Field; only the arrangement differs: the label sits BESIDE the control and wraps
 * it, so the whole row is the click target.
 *
 * That wrapping is not cosmetic. A 16px control alone fails WCAG 2.5.8, which asks for
 * a 24×24 target. Wrapping the text makes the row the target and clears it.
 *
 * Two ways to use it:
 *
 *   standalone — it owns its own description and error
 *     <Choice label="I confirm…" description="…" error={errors.confirmed}>
 *       <Checkbox />
 *     </Choice>
 *
 *   inside a group — the surrounding Field owns the error; the row stays quiet
 *     <Field as="group" label="State" error={errors.state}>
 *       <Choice label="Wyoming"><Radio value="wy" /></Choice>
 *     </Field>
 *
 * docs/DESIGN_SYSTEM.md §17.
 */
export interface ChoiceProps {
  /** Always rendered, always beside the control. */
  label: string;
  /** Help text under the label, indented to align with it. */
  description?: string;
  /** Error message. Omit inside a group — the group owns the message. */
  error?: string;
  /** Success message. Ignored when `error` is set. */
  success?: string;
  disabled?: boolean;
  /** The control: Checkbox, Radio or Switch. */
  children: ReactNode;
  className?: string;
}

export function Choice({
  label,
  description,
  error,
  success,
  disabled = false,
  children,
  className,
}: ChoiceProps) {
  const id = useId();
  const ids = { descriptionId: `${id}-description`, messageId: `${id}-message` };
  const parent = useFieldState();

  const { invalid, valid, showDescription, describedBy } = resolveFieldMessages({
    description,
    error,
    success,
    ids,
  });

  // A row inside an invalid group is itself invalid, so the control shows the error
  // border without every row repeating the message.
  const state: FieldState = {
    invalid: invalid || parent.invalid,
    valid,
    loading: parent.loading,
    labelId: `${id}-label`,
    describedBy: describedBy ?? parent.describedBy,
    inGroup: false,
  };

  const ownsMessages = error !== undefined || success !== undefined || description !== undefined;

  /*
    Field.Label requires a Field.Root ancestor. Standalone, Choice opens one; inside a
    group the Root already exists, so each option opens a Field.Item — the per-option
    scope Base UI provides for exactly this.
  */
  const Scope = parent.inGroup ? BaseField.Item : BaseField.Root;

  return (
    <FieldStateContext.Provider value={state}>
      <Scope
        disabled={disabled}
        className={["flex flex-col gap-1", className].filter(Boolean).join(" ")}
      >
        {/*
          The label WRAPS the control. Clicking anywhere on the row toggles it, and the
          association needs no id plumbing.
        */}
        {/*
          py-1 is load-bearing. The label row is the click target, and a 14px/20px line
          box gives a 20px row — under the 24×24 WCAG 2.5.8 minimum. Four pixels of
          vertical padding takes it to 28px. Measured in Chrome on 2026-08-31; the
          wrapping alone was not enough.
        */}
        <BaseField.Label
          id={state.labelId}
          className={[
            "text-body-sm text-foreground flex items-start gap-3 py-1",
            disabled ? "text-muted-foreground cursor-not-allowed" : "cursor-pointer",
          ].join(" ")}
        >
          {children}
          <span className="min-w-0">{label}</span>
        </BaseField.Label>

        {ownsMessages ? (
          // Indented to align with the label text, past the 16px control and 12px gap.
          <div className="flex flex-col gap-1 pl-7">
            <FieldMessages
              description={description}
              error={error}
              success={success}
              invalid={invalid}
              valid={valid}
              showDescription={showDescription}
              ids={ids}
              renderDescription={(descriptionId, text) => (
                <p id={descriptionId} className="text-caption text-muted-foreground">
                  {text}
                </p>
              )}
            />
          </div>
        ) : null}
      </Scope>
    </FieldStateContext.Provider>
  );
}
