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
 */
export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <div className="border-border flex flex-col items-start gap-3 border border-dashed p-6">
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

export function FactGrid({ children }: { children: ReactNode }) {
  return <div className="border-border bg-border grid grid-cols-2 gap-px border lg:grid-cols-4">{children}</div>;
}

/** Wraps a Fact so the grid's 1px gaps read as rules rather than gutters. */
export function FactCell({ children }: { children: ReactNode }) {
  return <div className="bg-background">{children}</div>;
}

export function Rows({ children }: { children: ReactNode }) {
  return <ul className="border-border border">{children}</ul>;
}

export function Row({ children, muted }: { children: ReactNode; muted?: boolean }) {
  return (
    <li
      className={cx(
        "border-border hover:bg-accent flex flex-wrap items-center gap-4 border-b px-5 py-4 last:border-b-0",
        "transition-[background-color] duration-normal ease-out",
        muted && "opacity-60",
      )}
    >
      {children}
    </li>
  );
}
