import type { CSSProperties, ReactNode } from "react";
import { cx } from "../cx";
import { HOVER_GROUND } from "../motion";

/*
  Rebuilt from patterns in Twenty (twenty-front, AGPL-3.0) and Dub (packages/ui,
  AGPL-3.0). Nothing was copied.

  From Twenty: NO BORDER AT REST. Their resting table has no row rules at all, and the
  border appears only on hover, focus or active, drawn as an outline with
  `outline-offset: -1px` so it never shifts layout. Also the separation of four
  orthogonal states, which we had collapsed into one.

  From Dub: the proportional bar behind the row, and the action revealed by shrinking the
  identity column's max-width rather than by mounting a button.

  ---------------------------------------------------------------------------
  THE STANDING RULE, AMENDED — 2026-09-04

  "No single-side borders: four sides, dotted, or none" was given to stop rows welding
  into a slab, and that reason was right. Every row therefore carried a four-side border,
  which is why nine rows read as nine cards.

  The rule now resolves to NONE, and it satisfies the original intent more completely
  than four sides ever did:

    > A row with no edge cannot weld to its neighbour.

  The hover border is an OUTLINE, not a border: it is drawn inside the row's own box at
  `-1px` offset, occupies no layout, and only one row can have it at a time, so no seam
  between two rows can ever exist.
  ---------------------------------------------------------------------------
*/

export type RowDensity = "compact" | "comfortable";

export interface RowProps {
  readonly children: ReactNode;
  /** 36px for scanning, 48px for rows carrying an avatar or two lines. */
  readonly density?: RowDensity;
  /**
   * The keyboard is on this row. DISTINCT from hover.
   *
   * Twenty calls this "soft focus" and keeps it separate from the active/editing state
   * and from selection. Without it, keyboard navigation is invisible on a list whose
   * hover is the only feedback.
   */
  readonly focused?: boolean;
  /** This row is expanded or being edited. */
  readonly active?: boolean;
  /** This row is in the selection. Orthogonal to all three above. */
  readonly selected?: boolean;
  /** De-emphasised. Loses weight and colour, never drops below 0.6 opacity. */
  readonly muted?: boolean;
  /**
   * This row is waiting on the reader.
   *
   * A tinted ground, not a louder badge. 2026-09-04: a list of twenty rows where three
   * need action carried that fact only in a 20px chip in a fixed column — findable, not
   * seeable. The ground is what lets someone scan the list and land on the three.
   *
   * Deliberately the WARNING wash rather than the mark yellow: this is a status ("a
   * person must act"), and §4.8 keeps the mark non-semantic.
   */
  readonly waiting?: boolean;
  /**
   * 0 to 1. Draws a proportional ground behind the row.
   *
   * This is the single cheapest density device in the study: ten ranked rows with it
   * read as populated, and the same ten without it read as empty.
   */
  readonly proportion?: number;
  readonly onClick?: () => void;
  readonly className?: string;
  /** For the entrance stagger only. Not a hook for arbitrary inline styling. */
  readonly style?: CSSProperties;
}

const DENSITY: Record<RowDensity, string> = {
  compact: "min-h-(--row-compact) px-3 py-1.5",
  comfortable: "min-h-(--row-comfortable) px-4 py-2.5",
};

export function Row({
  children,
  density = "comfortable",
  focused = false,
  active = false,
  selected = false,
  muted = false,
  proportion,
  waiting = false,
  onClick,
  className,
  style,
}: RowProps) {
  const interactive = onClick !== undefined;

  return (
    <li
      style={style}
      className={cx(
        "group/row relative isolate flex items-center gap-3",
        DENSITY[density],
        HOVER_GROUND,
        /* No border at rest. The outline arrives on hover and takes no layout. */
        "hover:outline hover:outline-1 hover:-outline-offset-1 hover:outline-border-hover",
        "hover:bg-accent/60",
        /* The waiting ground sits UNDER hover and focus, so pointing at a waiting row
           still gives the normal hover feedback rather than looking inert. */
        waiting && "bg-warning-wash",
        focused && "outline outline-1 outline-input bg-accent/40",
        active && "bg-surface-sunken outline outline-1 outline-border-hover",
        selected && "bg-accent-subtle",
        muted && "opacity-60",
        interactive && "cursor-pointer",
        className,
      )}
      {...(interactive
        ? {
            onClick,
            tabIndex: 0,
            role: "button",
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            },
          }
        : {})}
    >
      {/* The proportional ground, behind everything. `-z-10` with `isolate` on the row so
          it cannot escape into the page's stacking context. */}
      {proportion !== undefined && proportion > 0 ? (
        <span
          aria-hidden="true"
          className="bg-accent-subtle absolute inset-y-0 left-0 -z-10 origin-left"
          style={{ width: `${Math.min(Math.max(proportion, 0), 1) * 100}%` }}
        />
      ) : null}
      {children}
    </li>
  );
}

/**
 * A list of rows. 2px apart, because the list is ONE object.
 *
 * 8px was the old value and it made every list read as a stack of separate cards. §6b:
 * 2 between rows, 16 between blocks, 40 between sections. The 8:1 step from row to block
 * is what makes the grouping legible without a single rule or border.
 */
export function Rows({ children, className }: { children: ReactNode; className?: string }) {
  return <ul className={cx("flex flex-col gap-(--gap-row)", className)}>{children}</ul>;
}
