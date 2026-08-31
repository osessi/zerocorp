import { cx } from "../field/control-styles";

/**
 * Skeleton — a placeholder shaped like the thing it is standing in for.
 *
 * Rectangular, --radius-none, filled with --muted. It is deliberately not a shimmering
 * gradient: §8 says hierarchy comes from borders, spacing and typography, and a moving
 * highlight is decoration that also costs a repaint on every frame.
 *
 * The rule that matters is not visual. **A skeleton must occupy exactly the space its
 * content will occupy**, or the page jumps when the data lands — which is worse than
 * having shown nothing. So it takes its size from the caller, from the §6 spacing scale:
 *
 *   <Skeleton className="h-10 w-full" />     a form control
 *   <Skeleton className="size-8" />          an avatar
 *
 * Always aria-hidden. A skeleton is decoration; the CONTAINER owns the announcement and
 * must carry `aria-busy` — otherwise a screen-reader user hears an empty region and no
 * explanation. docs/DESIGN_SYSTEM.md §17.
 */
export interface SkeletonProps {
  /** Sizing and spacing, from the token scales. Required in practice — see above. */
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <span
      aria-hidden="true"
      className={cx("bg-muted block motion-safe:animate-pulse", className)}
    />
  );
}

export interface SkeletonTextProps {
  /** Number of lines. */
  lines?: number;
  className?: string;
}

/**
 * SkeletonText — n lines at the body line height, the last one short.
 *
 * The short last line is the whole point: a stack of equal bars reads as a table, not as
 * a paragraph. Provided so that every screen does not rewrite the same loop and get that
 * detail wrong.
 */
export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <span className={cx("flex flex-col gap-2", className)}>
      {Array.from({ length: lines }, (_, i) => (
        <Skeleton key={i} className={cx("h-4", i === lines - 1 ? "w-3/5" : "w-full")} />
      ))}
    </span>
  );
}
