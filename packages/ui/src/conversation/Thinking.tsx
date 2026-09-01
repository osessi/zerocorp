import { cx } from "../cx";
import { PULSE } from "./motion";

/**
 * The thinking indicator.
 *
 * Three dots, opacity only, no movement and no spinner. A spinner says "the machine is
 * busy"; this says "someone is considering what you said", which is the difference
 * between waiting for software and waiting for a person.
 *
 * It carries a live region so the wait is announced rather than being a silent pause
 * for anyone not watching the dots.
 */
export function Thinking({ label = "Thinking", className }: { label?: string; className?: string }) {
  return (
    <div className={cx("flex items-center gap-3", className)} role="status" aria-live="polite">
      <span className="flex items-center gap-1" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className={cx("bg-muted-foreground size-1.5", PULSE)}
            style={{ animationDelay: `${i * 160}ms` }}
          />
        ))}
      </span>
      <span className="text-body-sm text-muted-foreground">{label}</span>
    </div>
  );
}
