import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import type { ComponentType } from "react";
import { cx } from "../cx";
import { ACCENT_EDGE, ACCENT_FILL, ACCENT_RULE, ACCENT_TEXT, ACCENT_TINT, accentFor } from "./accent";

/**
 * The steps, across the top, validating one at a time.
 *
 * A rail rather than a progress bar. A bar says "you are 60% through"; a rail says
 * "these are the five things we need, and three are settled", which is the true
 * statement and the more reassuring one.
 *
 * The connector runs BEHIND the markers, from one centre to the next, so the labels can
 * sit centred under their own marker. Drawing it between markers instead forces the
 * labels left-aligned, and a left-aligned label under a centred dot reads as belonging
 * to the gap rather than to the step.
 *
 * Nothing on this rail loops. The tint fades in once when a step becomes active and then
 * holds: a marker that keeps pulsing sits in the corner of the eye for as long as the
 * visitor is composing an answer, which is the whole time.
 */
export interface WizardStep {
  readonly id: string;
  readonly label: string;
  readonly done: boolean;
  /** Filled but not confirmed. An outline in the accent rather than a fill. */
  readonly tentative?: boolean;
  /** The step's glyph. Falls back to its number, which is a weaker signal. */
  readonly icon?: ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill" }>;
}

export function WizardRail({
  steps,
  activeId,
  className,
}: {
  steps: readonly WizardStep[];
  activeId?: string | null;
  className?: string;
}) {
  return (
    <ol className={cx("flex w-full items-start", className)}>
      {steps.map((step, i) => {
        const accent = accentFor(i);
        const active = step.id === activeId;
        const settled = step.done && !step.tentative;
        const Icon = step.icon;
        const last = i === steps.length - 1;

        return (
          <li key={step.id} className="relative flex min-w-0 flex-1 flex-col items-center gap-2.5">
            {/* Behind the markers, centre to centre. Two layers: the dashed track that
                is always there, and the solid run that grows as the step settles. */}
            {!last ? (
              <>
                <span className="border-border absolute top-3 left-1/2 w-full border-t border-dashed" aria-hidden="true" />
                <span
                  className={cx("absolute top-3 left-1/2 h-0.5 ease-out", ACCENT_RULE[accent])}
                  style={{
                    width: settled ? "100%" : "0%",
                    // 600ms, not the usual 200. This is the one moment that says "that
                    // answer counted", and at 200ms it is over before the eye that just
                    // left the option has reached the rail.
                    transitionProperty: "width",
                    transitionDuration: "600ms",
                  }}
                  aria-hidden="true"
                />
              </>
            ) : null}

            <span className="bg-background relative z-10 px-1">
              <span
                className={cx(
                  "relative flex size-6 items-center justify-center border",
                  "transition-[color,background-color,border-color] duration-emphasis ease-out",
                  /*
                    Four states, four treatments, and all of them on the marker itself.

                    An earlier version gave the active step a second bordered square
                    around the first, which reads as a doubled box rather than a glow.
                    The real problem it was papering over is that "active" and "assumed"
                    both rendered as an accent outline, so they needed telling apart. A
                    tint does that, and needs no second element.

                      done      solid accent, with a check
                      active    accent outline over an accent tint
                      assumed   accent outline, hollow
                      upcoming  neutral outline, hollow
                  */
                  settled
                    ? cx(ACCENT_FILL[accent], ACCENT_EDGE[accent], "zc-pop")
                    : active
                      ? cx(ACCENT_EDGE[accent], ACCENT_TEXT[accent], ACCENT_TINT[accent], "zc-enter-fade")
                      : step.tentative
                        ? cx(ACCENT_EDGE[accent], ACCENT_TEXT[accent], "bg-background")
                        : "border-border text-muted-foreground bg-background",
                )}
              >
                {settled ? (
                  <CheckIcon size={14} weight="bold" aria-hidden="true" />
                ) : Icon ? (
                  <Icon size={14} weight="regular" aria-hidden="true" />
                ) : (
                  <span className="text-caption font-mono tabular-nums" aria-hidden="true">
                    {i + 1}
                  </span>
                )}
              </span>
            </span>

            <span
              className={cx(
                "text-caption w-full truncate px-1 text-center transition-[color] duration-emphasis ease-out",
                settled ? ACCENT_TEXT[accent] : active ? cx(ACCENT_TEXT[accent], "font-medium") : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>

            <span className="sr-only">
              {settled ? "done" : active ? "current step" : step.tentative ? "assumed, not confirmed" : "not yet"}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
