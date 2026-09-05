import type { ReactNode } from "react";
import { cx } from "../cx";

/*
  Rebuilt from the pattern in Midday (apps/dashboard, AGPL-3.0). Nothing was copied.

  Their transaction table composes every row from typed, memoised cell components —
  DateCell, DescriptionCell, AmountCell, TagsCell — each with ONE rendering rule applied
  everywhere. That is why their rows carry seven pieces of information without looking
  crowded, and it is the thing our screens most obviously lacked: leads/page.tsx wrote six
  raw spans with hard-coded widths (w-52, w-44, w-12) inline in the page.

  Column widths, from their table, as the shape to follow rather than the numbers to copy:
  identity columns are FIXED and narrow (select 50, date 110), content columns are WIDE
  and elastic (description 320 min 200 max 600), and nothing is under 100.
*/

/** The widths a cell may take. Named, so a screen never invents `w-52`. */
export const CELL_WIDTH = {
  marker: "w-6 shrink-0",
  stamp: "w-(--cell-stamp) shrink-0",
  identity: "w-(--cell-identity) shrink-0",
  identityWide: "w-(--cell-identity-wide) shrink-0",
  content: "min-w-0 flex-1",
  numeric: "w-(--cell-numeric) shrink-0",
  status: "w-(--cell-status) shrink-0",
  action: "w-(--cell-action) shrink-0",
} as const;

export type CellWidth = keyof typeof CELL_WIDTH;

interface Base {
  readonly width?: CellWidth;
  readonly className?: string;
}

/** The row's subject. One per row, full weight, truncates rather than wraps. */
export function CellIdentity({
  children,
  sub,
  width = "identity",
  className,
}: Base & { children: ReactNode; sub?: ReactNode }) {
  return (
    <div className={cx(CELL_WIDTH[width], "flex min-w-0 flex-col", className)}>
      <span className="text-body-sm truncate font-medium">{children}</span>
      {sub ? <span className="text-caption text-muted-foreground truncate">{sub}</span> : null}
    </div>
  );
}

/** Supporting prose. Muted, truncates, never the subject. */
export function CellText({ children, width = "content", className }: Base & { children: ReactNode }) {
  return (
    <span className={cx(CELL_WIDTH[width], "text-body-sm text-muted-foreground truncate", className)}>
      {children}
    </span>
  );
}

/**
 * A number. Mono, tabular, right-aligned, and never true black.
 *
 * Right-aligned because digits only line up if their ones column does. Mono because
 * §5 requires every comparable number to be comparable at a glance.
 */
export function CellNumber({
  children,
  width = "numeric",
  className,
}: Base & { children: ReactNode }) {
  return (
    <span
      className={cx(
        CELL_WIDTH[width],
        "text-body-sm text-foreground text-right font-mono tabular-nums",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** A fixed-width stamp: a date, a country, an id. Muted, mono, never truncated. */
export function CellStamp({ children, width = "stamp", className }: Base & { children: ReactNode }) {
  return (
    <span
      className={cx(CELL_WIDTH[width], "text-caption text-muted-foreground font-mono", className)}
    >
      {children}
    </span>
  );
}

/** Whatever carries state: a StatusDot, a badge, a meter. Fixed width so the column holds. */
export function CellStatus({ children, width = "status", className }: Base & { children: ReactNode }) {
  return (
    <div className={cx(CELL_WIDTH[width], "flex items-center gap-2", className)}>{children}</div>
  );
}

/**
 * The action, revealed on hover WITHOUT layout shift.
 *
 * Rebuilt from the pattern in Dub (AGPL-3.0): they reserve the space by shrinking the
 * title's max-width on `group-hover` rather than by mounting a button, so nothing on the
 * row moves when the cursor arrives. Here the cell always occupies its width and only
 * its contents fade, which achieves the same thing with less arithmetic.
 *
 * `focus-within:opacity-100` matters as much as the hover: a keyboard user tabbing to
 * the button must be able to see it.
 */
export function CellAction({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        /*
          FIXED WIDTH, right-aligned. Not `ml-auto` with intrinsic width.

          With an intrinsic width the box grew with its label, and because the identity
          column is flex-1 it absorbed the difference — so "Review" (81px) pushed every
          column on that row 12px left of the same column on an "Open" (69px) row. The
          fix belongs here rather than on the identity column: the action is the only
          cell whose CONTENT length is decided by state.
        */
        CELL_WIDTH.action,
        "ml-auto flex items-center justify-end gap-2",
        "opacity-0 transition-opacity duration-[--duration-overlay] ease-out",
        "group-hover/row:opacity-100 focus-within:opacity-100",
        "motion-reduce:transition-none",
        className,
      )}
    >
      {children}
    </div>
  );
}
