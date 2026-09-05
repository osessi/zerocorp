import type { ReactNode } from "react";
import { cx } from "../cx";
import { Icon, type PhosphorIcon } from "../icon/Icon";

/*
  Rebuilt from patterns in Midday (apps/dashboard, AGPL-3.0), Macro (apps/web,
  proprietary) and Dub (packages/ui, AGPL-3.0). Nothing was copied.

  From Midday, the important one: THREE empty states for one table, distinguished by
  CAUSE, not one state with different copy.

      NoResults        filters matched nothing        → "Clear filters"
      NoTransactions   there has never been data      → the primary action
      ReviewComplete   the queue is finished          → NO action. "All done"

  The third is the one nobody builds. Finishing is not a failure and should not be
  offered a remedy.

  Also from Midday: the ghost skeleton. The real, column-derived skeleton renders BEHIND
  the message at `opacity-20 blur-[7px] pointer-events-none`, so the screen shows the
  shape of what will fill it instead of a blank rectangle. Zero assets, zero licence, and
  it is the single largest visible improvement in the pass.

  From Macro: a FIXED top spacer, so the title lands on the same baseline in every empty
  state in the product regardless of how much sits below it. Theirs is `basis-[28%]` with
  a fixed-height graphic box.

  From Dub: the icon tile. A 64px bordered square holding a 24px glyph, which is all the
  "illustration" an empty state actually needs.

  ILLUSTRATION POSITION, decided 2026-09-04: we own none. The empty state is the real
  thing at 20% opacity, so it is drawn from the product's own vocabulary and needs no
  asset, no licence entry and no attribution. Four commissioned milestone pieces are the
  only illustration budget, and their slots are in docs/design-refs/.
*/

export type EmptyCause =
  /** There has never been data here. Offer the action that creates the first one. */
  | "first-run"
  /** A filter or search matched nothing. Offer to clear it. */
  | "filtered"
  /** The queue is done. Offer NOTHING. */
  | "complete";

export interface EmptyStateProps {
  readonly cause: EmptyCause;
  readonly title: string;
  readonly body?: string;
  readonly icon?: PhosphorIcon;
  /**
   * The action. Forbidden on `complete` by the type below, because the whole point of
   * that state is that there is nothing to do.
   */
  readonly action?: ReactNode;
  /**
   * The shape of what will be here. Rendered behind, blurred and dimmed.
   *
   * Pass the same rows or table the screen renders when it has data. Anything else is a
   * decoration pretending to be a preview.
   */
  readonly ghost?: ReactNode;
  readonly className?: string;
}

export function EmptyState({
  cause,
  title,
  body,
  icon,
  action,
  ghost,
  className,
}: EmptyStateProps) {
  return (
    <div className={cx("relative isolate flex min-h-(--empty-min-height) w-full flex-col", className)}>
      {ghost ? (
        <div className="zc-ghost absolute inset-0 -z-10 overflow-hidden" aria-hidden="true">
          {ghost}
        </div>
      ) : null}

      {/*
        The fixed spacer. 28% of the container, not a proportion of the content, so the
        title sits on the same line whether the state has a body and a button or just a
        title. Macro's number, and it is well chosen: high enough to feel composed,
        low enough that a short viewport does not push the action out of sight.
      */}
      <div aria-hidden="true" className="shrink-0 basis-[28%]" />

      <div className="mx-auto flex w-full max-w-sm shrink-0 flex-col items-center gap-4 px-6 text-center">
        {icon ? (
          <span className="border-border bg-surface flex size-16 items-center justify-center border">
            <Icon icon={icon} size={24} className="text-muted-foreground" />
          </span>
        ) : null}

        <div className="flex flex-col gap-2">
          <p className="text-body font-medium">{title}</p>
          {body ? <p className="text-body-sm text-muted-foreground text-pretty">{body}</p> : null}
        </div>

        {/* `complete` gets no action even if one is passed. The state means "done". */}
        {cause !== "complete" && action ? <div className="pt-1">{action}</div> : null}
      </div>
    </div>
  );
}

/**
 * Placeholder rows for a ghost, matching the row anatomy the screen actually uses.
 *
 * Derived from the density and column shape rather than invented, so the blurred shape
 * behind an empty Content screen is the shape a filled Content screen has. Midday derive
 * theirs from the column definitions through `meta.skeleton`; ours is simpler because
 * our lists are simpler, and the principle is identical: the skeleton IS the table.
 */
export function GhostRows({
  rows = 6,
  columns = [200, 140, 90],
}: {
  readonly rows?: number;
  readonly columns?: readonly number[];
}) {
  return (
    <ul className="flex flex-col gap-(--gap-row)">
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex min-h-(--row-comfortable) items-center gap-3 px-4 py-2.5">
          <span className="bg-foreground/25 size-5 shrink-0 rounded-full" />
          {columns.map((w, c) => (
            <span key={c} className="bg-foreground/20 h-3" style={{ width: w }} />
          ))}
          <span className="bg-foreground/15 ml-auto h-3 w-16" />
        </li>
      ))}
    </ul>
  );
}
