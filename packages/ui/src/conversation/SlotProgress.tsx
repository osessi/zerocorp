import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "../cx";

/**
 * "Understanding you" — the slot checklist.
 *
 * It is not a decoration and it is not a step counter. It renders the interview's actual
 * slot state, which is the same state that decides when the interview stops. The two can
 * therefore never disagree, which a separate progress counter eventually would.
 */
export interface SlotProgressItem {
  readonly id: string;
  readonly label: string;
  readonly filled: boolean;
  /** Inferred rather than stated: shown, but not yet counted as understood. */
  readonly tentative?: boolean;
}

export function SlotProgress({ items, className }: { items: readonly SlotProgressItem[]; className?: string }) {
  const done = items.filter((i) => i.filled && !i.tentative).length;

  return (
    <div className={cx("flex items-center gap-3", className)}>
      <span className="text-body-sm text-muted-foreground hidden sm:inline">Understanding you</span>
      <ul className="flex items-center gap-1.5" aria-label={`${done} of ${items.length} understood`}>
        {items.map((item) => (
          <li key={item.id} title={item.label}>
            <span
              className={cx(
                "flex size-4 items-center justify-center border transition-[color,background-color,border-color] duration-normal ease-out",
                item.filled && !item.tentative
                  ? "border-primary bg-primary text-primary-foreground"
                  : item.tentative
                    ? "border-primary text-primary"
                    : "border-input text-transparent",
              )}
            >
              <CheckIcon size={12} weight="bold" aria-hidden="true" />
              <span className="sr-only">
                {item.label}: {item.filled ? (item.tentative ? "assumed" : "understood") : "not yet"}
              </span>
            </span>
          </li>
        ))}
      </ul>
      <span className="text-body-sm text-muted-foreground font-mono tabular-nums">
        {done}/{items.length}
      </span>
    </div>
  );
}
