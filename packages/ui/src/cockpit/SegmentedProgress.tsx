import { cx } from "../cx";

/**
 * SegmentedProgress — n discrete segments, never a continuous bar.
 *
 * A launch is eight named steps, not a percentage. A continuous bar says "you are 62%
 * done", which is a number nobody can act on; eight segments say "five are finished, this
 * one is running, two have not started", which is a journey with a position in it.
 *
 * Deliberately NOT the progress bar in §4.6. That one reads its own value — red under 50,
 * amber under 75, green above — because it measures a quantity whose level is the news.
 * This measures a sequence, where the news is WHICH step, so a red early segment would be
 * saying "behind" about a plan that has barely started.
 *
 * Works on --surface-focal and on --background: the track takes its colour from the
 * current-color channel rather than assuming a light ground.
 */
export function SegmentedProgress({
  total,
  completed,
  current,
  label,
  onFocal = false,
  className,
}: {
  total: number;
  completed: number;
  /** Index of the step in flight, 0-based. Rendered as a pulsing segment. */
  current?: number;
  /** The accessible description, e.g. "5 of 8 steps complete". */
  label: string;
  /** The focal block is dark in both themes, so the track and fill invert there. */
  onFocal?: boolean;
  className?: string;
}) {
  const segments = Array.from({ length: Math.max(total, 1) }, (_, i) => i);

  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={total}
      aria-valuenow={completed}
      aria-label={label}
      className={cx("flex w-full items-center gap-1", className)}
    >
      {segments.map((i) => {
        const done = i < completed;
        const running = i === current && !done;
        return (
          <span
            key={i}
            className={cx(
              "rounded-sm h-1.5 flex-1 transition-[background-color] duration-normal ease-out",
              done
                ? onFocal
                  ? "bg-primary-emphasis"
                  : "bg-primary"
                : running
                  ? onFocal
                    ? "bg-primary-emphasis/60 animate-pulse"
                    : "bg-primary/50 animate-pulse"
                  : onFocal
                    ? "bg-surface-focal-foreground/20"
                    : "bg-border",
            )}
          />
        );
      })}
    </div>
  );
}
