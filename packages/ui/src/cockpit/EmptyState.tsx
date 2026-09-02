import type { ReactNode } from "react";
import type { ComponentType } from "react";
import { cx } from "../cx";

/**
 * EmptyState — a title, one sentence, and an action that is REQUIRED.
 *
 * `action` is not optional, and that is the whole design. An empty state without an action
 * is a dead end that tells a founder their product is broken; with one it is the first step
 * of the thing they came to do. Making it required means a dead end cannot typecheck.
 *
 * Renders on `--surface-sunken`, not inside a dashed outline. A dashed box says "content
 * failed to load". A sunken well says "this is a place, and it is waiting".
 */
export function EmptyState({
  title,
  body,
  action,
  icon: Icon,
  className,
}: {
  title: string;
  /** One sentence. If it needs two, the screen is explaining something the title should. */
  body: string;
  action: ReactNode;
  icon?: ComponentType<{ size?: number; className?: string }>;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "bg-surface-sunken border-border flex flex-col items-center gap-3 border px-6 py-10 text-center",
        className,
      )}
    >
      {Icon ? <Icon size={24} className="text-muted-foreground" /> : null}
      <div className="flex flex-col gap-1.5">
        <p className="text-h4">{title}</p>
        <p className="text-body-sm text-muted-foreground mx-auto max-w-prose">{body}</p>
      </div>
      <div className="mt-1">{action}</div>
    </div>
  );
}
