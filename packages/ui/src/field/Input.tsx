"use client";

import { Field as BaseField } from "@base-ui/react/field";
import { CircleNotchIcon } from "@phosphor-icons/react/dist/ssr";
import type { ComponentPropsWithoutRef } from "react";
import { useFieldState } from "./field-state.js";

/**
 * Input — the ZeroCorp text control.
 *
 * Renders Base UI's Field.Control, so it inherits native validity, touched, dirty,
 * filled and focused state and is wired to the surrounding label automatically.
 *
 * States: default · hover · focus · loading · disabled · error · success.
 * docs/DESIGN_SYSTEM.md §17.
 *
 * Every visual value comes from a token. There is no hard-coded colour, radius,
 * duration or spacing in this file.
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

/**
 * Control geometry.
 *
 *   h-10        40px — 10 × the 4px spacing unit (§6)
 *   px-3        12px horizontal padding
 *   rounded-none 0px — the signature (§7)
 *
 * Type size is 16px on mobile and 14px from the sm breakpoint up. Below 16px, iOS
 * Safari zooms the viewport on focus, which breaks the layout and traps the user.
 */
const BASE = [
  "h-10 w-full px-3",
  "rounded-none border bg-background",
  "text-body sm:text-body-sm text-foreground",
  "placeholder:text-muted-foreground",
  "transition-colors duration-normal ease-out",
  "outline-none",
].join(" ");

/** Default · hover. --input identifies the control boundary and clears WCAG 1.4.11. */
const NEUTRAL = "border-input hover:border-input-hover";

/** Focus. The ring is drawn outside the border so it never shifts layout. */
const FOCUS = "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";

/** Disabled — inert. Distinct from loading, which is busy but still readable. */
const DISABLED = [
  "disabled:cursor-not-allowed",
  "disabled:bg-muted disabled:text-muted-foreground",
  "disabled:border-border disabled:hover:border-border",
  "data-disabled:cursor-not-allowed data-disabled:bg-muted",
].join(" ");

const INVALID = "border-destructive hover:border-destructive";
const VALID = "border-success hover:border-success";

export function Input({ loading, className, ...props }: InputProps) {
  const field = useFieldState();
  const isLoading = loading ?? field.loading;

  const tone = field.invalid ? INVALID : field.valid ? VALID : NEUTRAL;

  const classes = [
    BASE,
    tone,
    FOCUS,
    DISABLED,
    // Reserve room for the spinner so the value never slides under it.
    isLoading ? "pr-10" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative w-full">
      <BaseField.Control
        {...props}
        className={classes}
        aria-invalid={field.invalid || undefined}
        aria-describedby={field.describedBy}
        aria-busy={isLoading || undefined}
      />

      {isLoading ? (
        <span
          className="pointer-events-none absolute inset-y-0 right-3 flex items-center"
          aria-hidden="true"
        >
          <CircleNotchIcon
            size={16}
            weight="regular"
            className="text-muted-foreground motion-safe:animate-spin"
          />
        </span>
      ) : null}
    </div>
  );
}
