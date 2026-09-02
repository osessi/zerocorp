import { Avatar } from "./Avatar";
import { cx } from "./../cx";

/**
 * AvatarStack — initials do NOT overlap.
 *
 * The reference overlaps photographs, which reads fine because a face survives being
 * half-covered. Two-letter initials do not: an 8px overlap at 24px hides the first
 * character, so "AO TK" renders as "AC TK". Found in review 2026-08-31.
 *
 * When real photographs replace initials, overlap can come back — as a deliberate
 * decision, on that condition.
 */
export function AvatarStack({
  people,
  max = 3,
  className,
}: {
  people: { initials: string; name: string; src?: string }[];
  max?: number;
  className?: string;
}) {
  const shown = people.slice(0, max);
  const rest = people.length - shown.length;

  return (
    <span className={cx("flex items-center gap-1", className)}>
      {shown.map((p) => (
        // `src` is spread rather than passed, because exactOptionalPropertyTypes
        // distinguishes "no image" from "an image that is undefined".
        <Avatar key={p.name} initials={p.initials} name={p.name} {...(p.src ? { src: p.src } : {})} size="sm" />
      ))}
      {rest > 0 ? (
        <span
          className="bg-muted text-muted-foreground text-caption rounded-sm inline-flex size-6 items-center justify-center font-mono"
          aria-label={`and ${rest} more`}
          role="img"
        >
          +{rest}
        </span>
      ) : null}
    </span>
  );
}
