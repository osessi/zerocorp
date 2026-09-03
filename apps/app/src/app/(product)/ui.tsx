import type { ReactNode } from "react";
import { cx } from "@zerocorp/ui";

/**
 * The shared furniture of a product page.
 *
 * Local to (product) rather than promoted into @zerocorp/ui. A component earns a place
 * in the design system by being used by more than one surface; promoting on first use
 * fills the library with things nobody else wants and makes them expensive to change.
 */

/** A titled block. `SectionHeader` is §21.6 and still PROPOSED, so this stays here. */
export function Panel({
  title,
  count,
  action,
  children,
}: {
  title: string;
  count?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-wrap items-baseline justify-between gap-4">
        <div className="flex items-baseline gap-3">
          <h2 className="text-h3">{title}</h2>
          {count !== undefined ? (
            <span className="text-body-sm text-muted-foreground font-mono tabular-nums">{count}</span>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

/**
 * Nothing here yet, said honestly.
 *
 * A dashed outline rather than a filled card: it reads as a space waiting to be filled,
 * which is what it is. A solid panel with "no data" in it reads as a thing that broke.
 *
 * The interior is SUNKEN, one step down from the page. On white it was a dashed rectangle
 * around white, which is the same non-shape as the page itself and disappeared entirely.
 * --surface-sunken is 1.14 against the page: enough to read as a well, not enough to
 * compete with anything that has content in it.
 */
export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="border-border bg-surface-sunken flex flex-col items-start gap-3 border border-dashed p-6">
      <p className="text-body-sm font-medium">{title}</p>
      <p className="text-body-sm text-muted-foreground max-w-prose text-pretty">{body}</p>
      {action}
    </div>
  );
}

/** A label and a value. Values that are numbers use mono, and are never black. */
export function Fact({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="flex flex-col gap-1 p-5">
      <span className="text-overline text-muted-foreground">{label}</span>
      <span className={cx("text-body", tone)}>{value}</span>
    </div>
  );
}

/**
 * Facts side by side, SEPARATED.
 *
 * This was a 1px-gap grid over a border-coloured ground, so four facts read as four cells
 * of one table welded together. Standing rule, given for the third time on 2026-09-03:
 * every block is its own object and the gap is what says so.
 */
export function FactGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}

/** One fact, with its own edge on all four sides. */
export function FactCell({ children }: { children: ReactNode }) {
  return <div className="border-border bg-surface border">{children}</div>;
}

/**
 * A list of records, SEPARATED.
 *
 * The rows used to share a `border-b` inside one outer box: a slab, and a single-side
 * border, which is the shape the standing rule bans. Each row is now its own card with an
 * edge on four sides, and 8px of air between them keeps a long list dense without welding
 * it. §21.12 RecordCardList.
 */
export function Rows({ children }: { children: ReactNode }) {
  return <ul className="flex flex-col gap-2">{children}</ul>;
}

export function Row({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <li
      className={cx(
        "border-border bg-surface hover:border-border-hover hover:bg-accent flex flex-wrap items-center gap-4 border px-5 py-3.5",
        "duration-glide ease-glide transition-[background-color,border-color]",
        muted && "opacity-60",
      )}
    >
      {children}
    </li>
  );
}
