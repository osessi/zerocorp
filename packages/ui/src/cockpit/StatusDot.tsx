import { cx } from "../cx";
import { type StatusTone, TONE_INK } from "../tone";

/**
 * StatusDot — a square dot and a word. No border, no padding box.
 *
 * The motivating case: twenty-four identical `targeting` badges stacked in the keyword
 * list. A tinted badge is right when a status is the exception on the row; when every row
 * carries the same one, twenty-four boxes are twenty-four objects competing with the data
 * they are annotating.
 *
 * A dot, not a circle: §7 is radius 0 on everything that is not a control, and this is not
 * a control.
 *
 * Colour is still never alone — the label is always rendered beside it. That is why this
 * has no icon: the word IS the second channel, and a dot plus a glyph plus a word is just
 * a badge with the box taken off.
 */
const DOT: Record<StatusTone, string> = {
  success: "bg-success",
  processing: "bg-processing",
  warning: "bg-warning",
  danger: "bg-destructive",
  info: "bg-info",
  neutral: "bg-muted-foreground",
  ai: "bg-ai",
};

export function StatusDot({
  tone,
  children,
  muted = false,
  className,
}: {
  tone: StatusTone;
  children: React.ReactNode;
  /** Keeps the dot coloured but the label neutral, for a column where every row matches. */
  muted?: boolean;
  className?: string;
}) {
  return (
    <span className={cx("text-body-sm inline-flex items-center gap-2", className)}>
      <span className={cx("size-2 shrink-0", DOT[tone])} aria-hidden="true" />
      <span className={muted ? "text-muted-foreground" : TONE_INK[tone]}>{children}</span>
    </span>
  );
}
