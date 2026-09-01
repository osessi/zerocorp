import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "../cx";
import { ACCENT_EDGE, ACCENT_FILL, ACCENT_RULE, ACCENT_TEXT, accentFor } from "./accent";

/**
 * The steps, across the top, validating one at a time.
 *
 * A rail rather than a progress bar. A bar says "you are 60% through"; a rail says
 * "these are the five things we need, and three of them are settled", which is the true
 * statement and the more reassuring one.
 *
 * The segment between two nodes fills as the earlier one is answered. That filling is
 * the whole feedback moment: the marker turns, the check lands, the line runs to the
 * next node, and the next node lights up. Under prefers-reduced-motion each of those
 * simply arrives at its end state.
 */
export interface WizardStep {
  readonly id: string;
  readonly label: string;
  readonly done: boolean;
  /** Filled but not confirmed. Shown as an outline in the accent rather than a fill. */
  readonly tentative?: boolean;
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
    <div className={cx("flex w-full items-start", className)} aria-hidden="true">
      {steps.map((step, i) => {
        const accent = accentFor(i);
        const active = step.id === activeId;
        const settled = step.done && !step.tentative;

        return (
          <div key={step.id} className="flex min-w-0 flex-1 flex-col gap-2">
            <div className="flex items-center">
              <span
                className={cx(
                  "flex size-6 shrink-0 items-center justify-center border",
                  "transition-[color,background-color,border-color] duration-emphasis ease-out",
                  settled
                    ? cx(ACCENT_FILL[accent], ACCENT_EDGE[accent], "zc-pop")
                    : step.tentative
                      ? cx(ACCENT_EDGE[accent], ACCENT_TEXT[accent])
                      : active
                        ? "border-foreground text-foreground"
                        : "border-border text-muted-foreground",
                )}
              >
                {settled ? (
                  <CheckIcon size={12} weight="bold" />
                ) : (
                  <span className="text-caption font-mono tabular-nums">{i + 1}</span>
                )}
              </span>

              {i < steps.length - 1 ? (
                <span className="relative mx-2 h-px flex-1">
                  {/* The unfilled track. Dashed, so an unreached step reads as planned
                      rather than as broken. */}
                  <span className="border-border absolute inset-0 border-t border-dashed" />
                  {/* The filled run. Width, not opacity: the line has to travel. */}
                  <span
                    className={cx(
                      "absolute inset-y-0 left-0 transition-[width] duration-modal ease-out",
                      ACCENT_RULE[accent],
                    )}
                    style={{ width: settled ? "100%" : "0%" }}
                  />
                </span>
              ) : null}
            </div>

            <span
              className={cx(
                "text-caption truncate pr-2 transition-[color] duration-emphasis ease-out",
                settled ? ACCENT_TEXT[accent] : active ? "text-foreground" : "text-muted-foreground",
              )}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
