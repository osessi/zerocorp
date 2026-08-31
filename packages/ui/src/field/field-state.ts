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
  /**
   * id of the Field's label.
   *
   * Input and Textarea are Field.Control, so Base UI associates them with the label
   * natively. Select's trigger is a <button>, which `<label for>` cannot address — it
   * uses aria-labelledby instead. Publishing the id here keeps Select on the same shell
   * rather than growing a parallel one.
   */
  labelId: string;
  /**
   * True when the surrounding Field is a <fieldset> group.
   *
   * A Choice needs to know: standalone it must open its own Field.Root, because
   * Field.Label requires one; inside a group the Root already exists and each option
   * opens a Field.Item instead.
   */
  inGroup: boolean;
}

const EMPTY: FieldState = {
  invalid: false,
  valid: false,
  loading: false,
  describedBy: undefined,
  labelId: "",
  inGroup: false,
};

export const FieldStateContext = createContext<FieldState>(EMPTY);

/** Read the surrounding Field's state. Returns a neutral state when unwrapped. */
export function useFieldState(): FieldState {
  return useContext(FieldStateContext);
}
