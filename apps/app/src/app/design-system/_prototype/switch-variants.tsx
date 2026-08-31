"use client";

import { Switch as BaseSwitch } from "@base-ui/react/switch";
import { CheckIcon, MinusIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "./primitives";

/**
 * Switch variants — PROPOSALS for review. Not in @zerocorp/ui, not in the registry.
 *
 * The validated Switch reads its state from colour and thumb position only, which
 * conflicts with DESIGN_SYSTEM.md §14: colour is never the only carrier of meaning.
 * For a consequential toggle — Autopilot lets agents act without approval — that is
 * too thin, and it fails outright for a colour-blind user scanning a settings list.
 *
 * Every variant keeps Lyra: radius 0, teal #00786F, --input boundary, token spacing.
 */

const FOCUS =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring";
const DISABLED =
  "data-disabled:bg-muted data-disabled:border-border data-disabled:cursor-not-allowed";
const BORDER = "border-input hover:border-input-hover";

/** Baseline — what is validated today. Colour and position, nothing else. */
export function SwitchCurrent(props: { defaultChecked?: boolean; disabled?: boolean }) {
  return (
    <BaseSwitch.Root
      {...props}
      className={cx(
        "relative inline-flex h-5 w-9 shrink-0 items-center border bg-muted",
        "transition-colors duration-normal ease-out",
        "data-checked:bg-primary data-checked:border-primary",
        BORDER,
        FOCUS,
        DISABLED,
      )}
    >
      <BaseSwitch.Thumb className="block size-4 translate-x-0.5 bg-background transition-transform duration-normal ease-out data-checked:translate-x-4" />
    </BaseSwitch.Root>
  );
}

/**
 * Variant A — iconic thumb.
 *
 * The thumb carries a check when on and a minus when off. Adds a second, non-colour
 * signal at the same 36×20 footprint. Language-independent, so nothing to translate.
 */
export function SwitchIconic(props: { defaultChecked?: boolean; disabled?: boolean }) {
  return (
    <BaseSwitch.Root
      {...props}
      className={cx(
        "relative inline-flex h-5 w-9 shrink-0 items-center border bg-muted",
        "transition-colors duration-normal ease-out",
        "data-checked:bg-primary data-checked:border-primary",
        BORDER,
        FOCUS,
        DISABLED,
      )}
    >
      <BaseSwitch.Thumb
        className={cx(
          "flex size-4 translate-x-0.5 items-center justify-center bg-background",
          "transition-transform duration-normal ease-out data-checked:translate-x-4",
        )}
      >
        <span className="text-primary hidden group-data-checked:block" />
        <CheckIcon size={10} weight="bold" className="text-primary hidden [[data-checked]_&]:block" />
        <MinusIcon size={10} weight="bold" className="text-muted-foreground [[data-checked]_&]:hidden" />
      </BaseSwitch.Thumb>
    </BaseSwitch.Root>
  );
}

/**
 * Variant B — labelled track.
 *
 * The state is written inside the track: ON on the left when on, OFF on the right when
 * off. The most explicit option, and the only one that survives a greyscale print or a
 * screenshot pasted into a ticket.
 *
 * Costs 20px of width and needs translation — "ON"/"OFF" are English words, and §5
 * requires every user-facing string to go through i18n.
 */
export function SwitchLabelled(props: { defaultChecked?: boolean; disabled?: boolean }) {
  return (
    <BaseSwitch.Root
      {...props}
      className={cx(
        "relative inline-flex h-5 w-14 shrink-0 items-center border bg-muted",
        "transition-colors duration-normal ease-out",
        "data-checked:bg-primary data-checked:border-primary",
        BORDER,
        FOCUS,
        DISABLED,
      )}
    >
      <span
        aria-hidden="true"
        className="text-overline text-primary-foreground data-disabled:text-muted-foreground absolute left-1.5 hidden uppercase [[data-checked]_&]:block [[data-disabled]_&]:text-muted-foreground"
      >
        On
      </span>
      <span
        aria-hidden="true"
        className="text-overline text-muted-foreground absolute right-1.5 uppercase [[data-checked]_&]:hidden"
      >
        Off
      </span>
      <BaseSwitch.Thumb className="block size-4 translate-x-0.5 bg-background transition-transform duration-normal ease-out data-checked:translate-x-9" />
    </BaseSwitch.Root>
  );
}

/**
 * Variant C — two-cell track.
 *
 * The track is visibly divided into two cells by a hairline; the thumb fills one. It
 * reads as a mechanical two-position switch rather than a coloured pill, which suits
 * radius 0 better than anything rounded ever could.
 *
 * The division persists in both states, so position alone communicates — the second
 * signal is structural rather than added.
 */
export function SwitchTwoCell(props: { defaultChecked?: boolean; disabled?: boolean }) {
  return (
    <BaseSwitch.Root
      {...props}
      className={cx(
        "relative inline-flex h-5 w-10 shrink-0 items-center border bg-background",
        "transition-colors duration-normal ease-out",
        "data-checked:border-primary",
        BORDER,
        FOCUS,
        DISABLED,
      )}
    >
      {/* The hairline stays put; the filled cell moves. */}
      <span aria-hidden="true" className="bg-border absolute left-1/2 h-full w-px" />
      <BaseSwitch.Thumb
        className={cx(
          "bg-muted block h-full w-1/2",
          "transition-transform duration-normal ease-out",
          "translate-x-0 data-checked:translate-x-full data-checked:bg-primary",
        )}
      />
    </BaseSwitch.Root>
  );
}
