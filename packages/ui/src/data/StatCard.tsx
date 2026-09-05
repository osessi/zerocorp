import type { ElementType, ReactNode } from "react";
import { cx } from "../cx";
import { HOVER_GROUND } from "../motion";
import { Counter } from "./Counter";
import { Sparkline } from "./Sparkline";

/*
  Rebuilt from the pattern in Midday (apps/dashboard/src/components/widgets, AGPL-3.0).
  Nothing was copied.

  Their WidgetCard anatomy, measured: `min-h-28`, `p-5`, label at the smallest size
  in muted pinned to the TOP, value at the bottom, detail in muted INLINE AFTER the value,
  and — the part we did not have — the whole card is a LINK to the screen that acts on it,
  with a hover that moves background and border together.

  That last detail converts four dead numbers into four entry points, and it is one prop.
*/

export interface StatCardProps {
  readonly label: string;
  readonly value: string | number;
  /** Sits inline after the value, muted. Context, not a second figure. */
  readonly detail?: string;
  /** Where this number is acted on. A KPI that is not a door is a decoration. */
  readonly href?: string;
  /**
   * The element to render when `href` is set. Defaults to "a".
   *
   * @zerocorp/ui must not import next/link — NN-1, and tests/architecture asserts it —
   * so the router's Link is passed in the way ButtonLink already establishes.
   */
  readonly as?: ElementType;
  /** A trend, drawn small. Renders under the figure. */
  readonly trend?: readonly number[];
  /**
   * This one wants attention.
   *
   * ---------------------------------------------------------------------------
   * REVERSED 2026-09-04, and the reversal is the interesting part.
   *
   * First it was a 2px yellow rule, which was invisible among four white cards. So it
   * became a tinted ground plus a gold edge, which WAS visible and was then rejected on
   * sight: "je ne veux pas de panneau en jaune, tous les panneaux doivent avoir la même
   * couleur".
   *
   * Both attempts were wrong in the same way: a KPI row is a set of four comparable
   * figures, and recolouring one of them breaks the comparison it exists to support. The
   * row stops reading as one instrument and starts reading as three numbers and a
   * warning.
   *
   * What is left is the honest signal: the DETAIL LINE says what is wrong, in words, and
   * the blocking item is already carried by the announcement strip in the top bar, where
   * a founder looks once rather than four times. The prop stays so call sites need not
   * change and so the reasoning has somewhere to live; it emphasises the DETAIL only.
   * ---------------------------------------------------------------------------
   */
  readonly attention?: boolean;
  readonly className?: string;
}

export function StatCard({
  label,
  value,
  detail,
  href,
  as: Component = "a",
  trend,
  attention = false,
  className,
}: StatCardProps) {
  const body = (
    <>
      <span className="text-overline text-muted-foreground">{label}</span>

      <div className="flex items-end justify-between gap-3">
        <div className="flex min-w-0 items-baseline gap-2">
          {/* --figure-ink, true black. §5: the figure is the most present type on the
              screen and it is never a status colour. */}
          <Counter value={value} className="text-h3 text-figure-ink leading-none font-semibold" />
          {detail ? (
            <span
              className={cx(
                "text-caption truncate",
                /* The one place attention shows: the words, not the panel. */
                attention ? "text-warning-ink font-medium" : "text-muted-foreground",
              )}
            >
              {detail}
            </span>
          ) : null}
        </div>
        {trend && trend.length > 1 ? <Sparkline data={trend} width={64} height={22} /> : null}
      </div>
    </>
  );

  /*
    ONE treatment for all four. --border-card at 2.14 against the card, where --border
    measured 1.26: the cards were faint rectangles and now they are objects. The
    difference between them is their CONTENT, which is the only difference a row of
    comparable figures should have.
  */
  const shell = cx(
    "border-border-card bg-surface relative flex min-h-28 flex-col justify-between gap-3 border p-5",
    className,
  );

  if (!href) return <div className={shell}>{body}</div>;

  return (
    <Component
      href={href}
      className={cx(
        shell,
        HOVER_GROUND,
        "hover:border-border-hover hover:bg-accent/50",
        "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
      )}
    >
      {body}
    </Component>
  );
}

/** Four across, and they share one grid so their edges line up. */
export function StatGrid({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cx("grid grid-cols-1 gap-(--gap-block) sm:grid-cols-2 xl:grid-cols-4", className)}>
      {children}
    </div>
  );
}
