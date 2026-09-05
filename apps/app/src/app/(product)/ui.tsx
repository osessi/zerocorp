import type { ReactNode } from "react";
import {
  EmptyState,
  GhostRows,
  Panel as UiPanel,
  Row as UiRow,
  Rows as UiRows,
  cx,
} from "@zerocorp/ui";

/**
 * The shared furniture of a product page.
 *
 * ---------------------------------------------------------------------------
 * 2026-09-04 — these are now ADAPTERS, not implementations.
 *
 * Every one of them used to hold its own markup, which is how seven screens ended up
 * with one skeleton: `Panel` was always `text-h3` plus `gap-4`, `Row` was always
 * `px-5 py-3.5` with a four-side border, `FactGrid` was always 1/2/4 columns, and no
 * call site could vary any of it because there was nothing to vary.
 *
 * They delegate to @zerocorp/ui now. Kept as a thin layer only so the screens that have
 * not been rewritten by hand still get the new treatment; each one should be replaced
 * with its @zerocorp/ui equivalent at the next edit to its screen, and this file deleted.
 * ---------------------------------------------------------------------------
 */

/** A titled block. Delegates to the four-slot Panel. */
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
    <UiPanel>
      <UiPanel.Header title={title} count={count}>
        {action}
      </UiPanel.Header>
      <UiPanel.Body>{children}</UiPanel.Body>
    </UiPanel>
  );
}

/**
 * Nothing here yet, said honestly.
 *
 * The dashed well is gone. It is the real thing at 20% opacity behind the message now —
 * an empty screen shows the SHAPE of what will fill it rather than a rectangle with a
 * dashed edge, which reads as content that failed to load.
 *
 * `cause` defaults to `first-run` because that is what every existing call site means;
 * a screen that can also be filtered should pass `filtered` explicitly.
 */
export function Empty({ title, body, action }: { title: string; body: string; action?: ReactNode }) {
  return (
    <EmptyState
      cause="first-run"
      title={title}
      body={body}
      {...(action ? { action } : {})}
      ghost={<GhostRows rows={5} />}
    />
  );
}

/** A label and a value. Values that are numbers use mono, and are never black. */
export function Fact({ label, value, tone }: { label: string; value: ReactNode; tone?: string }) {
  return (
    <div className="flex flex-col gap-1.5 p-4">
      <span className="text-overline text-muted-foreground">{label}</span>
      <span className={cx("text-body", tone)}>{value}</span>
    </div>
  );
}

/** Facts side by side, separated. Every block is its own object and the gap says so. */
export function FactGrid({ children }: { children: ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-(--gap-block) sm:grid-cols-2 lg:grid-cols-4">{children}</div>
  );
}

/** One fact, with its own edge. */
export function FactCell({ children }: { children: ReactNode }) {
  return <div className="border-border bg-surface border">{children}</div>;
}

/** A list of records. 2px apart, because the list is one object. */
export function Rows({ children }: { children: ReactNode }) {
  return <UiRows>{children}</UiRows>;
}

/**
 * One record.
 *
 * No border at rest; the border arrives on hover as an inset outline. The standing rule
 * was amended on 2026-09-04 with the reasoning that satisfies its own intent most
 * completely: a row with no edge cannot weld to its neighbour.
 */
export function Row({
  children,
  muted,
  waiting,
}: {
  children: ReactNode;
  muted?: boolean;
  /** This row is waiting on the reader. A tinted ground, not a louder badge. */
  waiting?: boolean;
}) {
  return (
    <UiRow {...(muted ? { muted } : {})} {...(waiting ? { waiting } : {})}>
      {children}
    </UiRow>
  );
}
