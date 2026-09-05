import { cx } from "../cx";

/*
  Rebuilt from the pattern in Dub (packages/ui, AGPL-3.0 — no licence field, so it
  inherits the root). Nothing was copied. The idea is Bucket 3: a donut drawn from a
  fixed 100-unit viewBox with a stroke-dasharray arc, rendered small enough to sit inline
  in a table cell beside text.

  Their `ProgressCircle` uses strokeWidth 16 on a 100 box at `size-3`. That ratio is the
  whole trick: at 12px a 1px ring is invisible and a 3px ring reads as a solid dot, so
  the stroke has to be ~16% of the diameter to read as a ring at all.
*/

export interface MeterProps {
  /** 0 to 1. Clamped. */
  readonly value: number;
  /** Rendered size. 12 sits inline in body copy; 16 sits in a table cell. */
  readonly size?: 12 | 16 | 20 | 24;
  /**
   * The arc colour. A token class, never a hex.
   *
   * Defaults to the brand teal because a meter reports PROGRESS, which is not a status.
   * Pass a status tone only when the value genuinely carries health.
   */
  readonly className?: string;
  readonly label?: string;
}

const STROKE = 16;
const RADIUS = (100 - STROKE) / 2;
const CIRCUMFERENCE = RADIUS * Math.PI * 2;

export function Meter({ value, size = 12, className, label }: MeterProps) {
  const progress = Math.min(Math.max(value, 0), 1);
  const dash = progress * CIRCUMFERENCE;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={cx("text-primary shrink-0", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {/* The track. --border, because an empty meter is a divider, not a state. */}
      <circle
        cx="50"
        cy="50"
        r={RADIUS}
        fill="none"
        strokeWidth={STROKE}
        strokeLinecap="butt"
        className="stroke-border"
      />
      {progress > 0 ? (
        <circle
          cx="50"
          cy="50"
          r={RADIUS}
          fill="none"
          stroke="currentColor"
          strokeWidth={STROKE}
          /* Butt caps, not round. §7: the product has no rounded terminals, and a round
             cap on a 16-unit stroke adds 8 units of arc at each end, so a 4% value would
             draw as though it were 20%. The cap would be lying about the number. */
          strokeLinecap="butt"
          strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
          style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
        />
      ) : null}
    </svg>
  );
}
