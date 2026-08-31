"use client";

import type { ReactNode } from "react";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * Shared furniture for the all-components exploration page.
 *
 * Everything under _proto is a PROTOTYPE. Nothing here is in packages/ui and nothing
 * here is in the §19 registry. The purpose of this pass is explore → compare → preview
 * → surface the decisions, not to validate a component library in one go.
 *
 * Where a registered component already exists (Button, Field, Input, Select, Checkbox,
 * Radio, Switch, StatusBadge, Spinner, Skeleton) it is imported and used as-is. §18:
 * do not create a competing implementation of something that already exists.
 */

export const cx = (...p: Array<string | false | null | undefined>) => p.filter(Boolean).join(" ");

/** The one popup surface idiom, shared by Select, Menu, Popover, Combobox and Dialog. */
export const SURFACE = "bg-surface-elevated border-input border shadow-floating";

/** The one overlay motion. §10 — 200ms, no bounce. */
export const OVERLAY_MOTION = [
  "transition-[opacity,transform] duration-emphasis ease-out",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
].join(" ");

export function Section({
  id,
  title,
  source,
  note,
  status = "prototype",
  children,
}: {
  id: string;
  title: string;
  /** Where the structure comes from — a primitive, a registered component, or nothing. */
  source: string;
  note?: string;
  status?: "prototype" | "registered" | "blocked";
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-8 flex min-w-0 flex-col gap-4">
      <div className="border-border flex flex-col gap-1 border-b pb-3">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-h4">{title}</h2>
          <span
            className={cx(
              "text-overline uppercase",
              status === "registered" && "text-success",
              status === "prototype" && "text-muted-foreground",
              status === "blocked" && "text-warning",
            )}
          >
            {status === "registered" ? "in §19 registry" : status === "blocked" ? "needs a decision" : "prototype"}
          </span>
          <span className="text-caption text-muted-foreground font-mono">{source}</span>
        </div>
        {note ? <p className="text-body-sm text-muted-foreground">{note}</p> : null}
      </div>
      {children}
    </section>
  );
}

/** A demo surface. Bordered, never shadowed — §1, hierarchy comes from borders. */
export function Demo({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("border-border min-w-0 border p-4", className)}>{children}</div>;
}

/** Raised where this pass found something that needs the product owner's call. */
export function Arbitration({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border-warning flex flex-col gap-2 border p-4">
      <div className="text-label text-warning flex items-center gap-2">
        <WarningIcon size={16} weight="regular" aria-hidden="true" />
        {title}
      </div>
      <div className="text-body-sm text-muted-foreground flex flex-col gap-2">{children}</div>
    </div>
  );
}

/** Two-column label/demo row, so a dozen variants stay scannable. */
export function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
      <span className="text-caption text-muted-foreground w-40 shrink-0">{label}</span>
      <div className="flex flex-wrap items-center gap-3">{children}</div>
    </div>
  );
}
