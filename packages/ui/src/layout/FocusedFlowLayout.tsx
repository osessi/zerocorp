import type { ReactNode } from "react";
import { cx } from "../cx";

/**
 * FocusedFlowLayout — DESIGN_SYSTEM.md §21.24, VALIDATED 2026-09-01.
 *
 * The frame for the pre-payment funnel. A visitor arriving from an ad has no account,
 * no tenant and no navigation to speak of, and every pixel of chrome is a pixel not
 * spent on the question being asked. `DashboardShell` is the wrong frame for it.
 *
 * Same tokens, same borders, same type scale as every dashboard screen. A different
 * frame, not a different design system.
 */


export interface FocusedFlowLayoutProps {
  children: ReactNode;
  /** 1-based. Renders as "Step N of M" plus a rule along the header's bottom edge. */
  step?: number;
  totalSteps?: number;
  /** The single forward action. A step that offers two ways forward is two steps. */
  forward?: ReactNode;
  back?: ReactNode;
  /** `wide` for a result the visitor reads rather than answers. */
  width?: "question" | "reading";
}

export function FocusedFlowLayout({
  children,
  step,
  totalSteps,
  forward,
  back,
  width = "question",
}: FocusedFlowLayoutProps) {
  const showProgress = step !== undefined && totalSteps !== undefined && totalSteps > 0;
  const fraction = showProgress ? Math.min(step / totalSteps, 1) : 0;

  return (
    <div className="bg-background text-foreground flex min-h-screen flex-col">
      <header className="border-border relative flex h-14 shrink-0 items-center justify-between border-b px-6">
        <span className="text-label tracking-tight">ZeroCorp</span>
        {showProgress ? (
          <span className="text-body-sm text-muted-foreground">
            Step {step} of {totalSteps}
          </span>
        ) : null}
        {/* A rule at the completed fraction. Never a ring, never a percentage. */}
        {showProgress ? (
          <span
            aria-hidden="true"
            className="bg-primary absolute bottom-0 left-0 h-0.5 transition-[width] duration-emphasis ease-out"
            style={{ width: `${fraction * 100}%` }}
          />
        ) : null}
      </header>

      <main className="flex flex-1 justify-center overflow-y-auto px-6 py-12">
        <div className={cx("w-full", width === "question" ? "max-w-2xl" : "max-w-4xl")}>{children}</div>
      </main>

      {forward || back ? (
        <footer className="border-border sticky bottom-0 flex h-18 shrink-0 items-center justify-between border-t px-6">
          <div className="min-w-0">{back}</div>
          <div className="flex items-center gap-3">{forward}</div>
        </footer>
      ) : null}
    </div>
  );
}

/**
 * The rhythm inside a step: eyebrow, question, one line of help, then the control.
 *
 * A component rather than a convention, so two steps written a week apart cannot drift
 * into two different vertical rhythms.
 */
export function FlowStep({
  eyebrow,
  title,
  help,
  children,
}: {
  eyebrow?: string;
  title: string;
  help?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col">
      <div className="flex flex-col gap-2">
        {eyebrow ? <p className="text-overline text-muted-foreground">{eyebrow}</p> : null}
        <h1 className="text-h2 text-balance">{title}</h1>
        {help ? <p className="text-body-sm text-muted-foreground">{help}</p> : null}
      </div>
      <div className="pt-8">{children}</div>
    </div>
  );
}
