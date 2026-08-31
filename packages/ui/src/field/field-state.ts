"use client";

import { createContext, useContext } from "react";

/**
 * State a Field publishes to whatever control it wraps.
 *
 * Base UI already exposes native validity through data-* attributes. This context
 * carries the state that comes from OUTSIDE the browser — a Zod error from
 * @zerocorp/contracts, a server rejection, an async check in flight — so that
 * `<Field error="…"><Input /></Field>` styles correctly with no prop drilling.
 *
 * Every future control (Textarea, Select, Combobox, DatePicker, FileUpload) reads this
 * instead of reimplementing error handling. docs/DESIGN_SYSTEM.md §17.
 */
export interface FieldState {
  /** An error is being shown. Border and message use --destructive. */
  invalid: boolean;
  /** A success message is being shown. Border uses --success. */
  valid: boolean;
  /** An async operation is in flight. The control is busy but not disabled. */
  loading: boolean;
  /** id of the element describing the control, for aria-describedby. */
  describedBy: string | undefined;
}

const EMPTY: FieldState = {
  invalid: false,
  valid: false,
  loading: false,
  describedBy: undefined,
};

export const FieldStateContext = createContext<FieldState>(EMPTY);

/** Read the surrounding Field's state. Returns a neutral state when unwrapped. */
export function useFieldState(): FieldState {
  return useContext(FieldStateContext);
}
