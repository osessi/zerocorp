"use client";

import type { ReactNode } from "react";

/**
 * The message layer shared by Field and Choice — internal, not exported from the package.
 *
 * Extracted 2026-08-31 when Choice arrived, so the two shells agree on description
 * placement, message roles and aria wiring instead of drifting apart. Behaviour is
 * unchanged from the original Field: the twelve Field tests are the proof.
 */
export interface FieldMessageIds {
  descriptionId: string;
  messageId: string;
}

export function resolveFieldMessages(args: {
  description?: string | undefined;
  error?: string | undefined;
  success?: string | undefined;
  ids: FieldMessageIds;
}) {
  const invalid = args.error !== undefined && args.error !== "";
  const valid = !invalid && args.success !== undefined && args.success !== "";
  const showDescription =
    args.description !== undefined && args.description !== "" && !invalid;

  const describedBy =
    [
      invalid || valid ? args.ids.messageId : undefined,
      showDescription ? args.ids.descriptionId : undefined,
    ]
      .filter(Boolean)
      .join(" ") || undefined;

  return { invalid, valid, showDescription, describedBy };
}

/**
 * Renders the description and the single message slot.
 *
 * `role="alert"` announces an error the moment it appears; `role="status"` is the
 * polite equivalent for success. Colour is never the only carrier of meaning (§14) —
 * the message is the primary signal and the border only reinforces it.
 */
export function FieldMessages({
  description,
  error,
  success,
  invalid,
  valid,
  showDescription,
  ids,
  renderDescription,
}: {
  description?: string | undefined;
  error?: string | undefined;
  success?: string | undefined;
  invalid: boolean;
  valid: boolean;
  showDescription: boolean;
  ids: FieldMessageIds;
  /** Field renders its description through Base UI; Choice renders a plain node. */
  renderDescription: (id: string, text: string) => ReactNode;
}) {
  return (
    <>
      {showDescription && description ? renderDescription(ids.descriptionId, description) : null}

      {invalid ? (
        <p id={ids.messageId} role="alert" className="text-caption text-destructive">
          {error}
        </p>
      ) : null}

      {valid ? (
        <p id={ids.messageId} role="status" className="text-caption text-success">
          {success}
        </p>
      ) : null}
    </>
  );
}
