"use client";

import type { ComponentType, ReactNode } from "react";
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

/**
 * PanelHeader — the top band of a bordered container.
 *
 * Validated on the Invoices block, 2026-08-31, then extracted rather than copied. A bare
 * 14px word floating on white gives the eye nothing to land on; the --muted band, the
 * glyph and the count together make the panel findable when five of them share a screen.
 *
 * Three slots, and the order is the point:
 *
 *   icon + title + count   what this is, and how much of it there is
 *   meta                   a qualifier the user does not act on — "last 24 h"
 *   action                 the one thing they can do to the whole panel
 *
 * `count` is rendered in Geist Mono. §5: any number a user compares.
 *
 * ADJACENT TO §21.6 `SectionHeader`, which is one of the twelve patterns §24.8 still
 * holds as PROPOSED. This is a PANEL header, not a page-section header, and it lives in
 * the prototypes until that item is settled — promoting it means touching §24.8.
 */
export function PanelHeader({
  icon: Icon,
  title,
  count,
  meta,
  action,
}: {
  icon?: ComponentType<{ size?: number; weight?: "regular"; className?: string; "aria-hidden"?: boolean }>;
  title: string;
  count?: number;
  meta?: string;
  action?: ReactNode;
}) {
  return (
    <div className="border-border bg-muted flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <span className="text-label text-foreground inline-flex items-center gap-2">
        {Icon ? (
          <Icon size={16} weight="regular" aria-hidden className="text-muted-foreground" />
        ) : null}
        {title}
        {count !== undefined ? (
          <span className="text-caption text-muted-foreground font-mono">{count}</span>
        ) : null}
      </span>
      <span className="flex items-center gap-3">
        {meta ? <span className="text-caption text-muted-foreground font-mono">{meta}</span> : null}
        {action}
      </span>
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
