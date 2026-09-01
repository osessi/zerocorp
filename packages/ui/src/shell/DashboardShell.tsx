"use client";

import { useState, type ComponentType, type ElementType, type ReactNode } from "react";
import { CaretDownIcon, CaretLeftIcon, CaretUpIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "../cx";

/**
 * DashboardShell · SidebarNavigation · TopCommandBar — DESIGN_SYSTEM.md §21.2 to §21.4,
 * VALIDATED 2026-09-01.
 *
 * The sidebar is fixed and carries its own logo header. The top bar spans the CONTENT
 * COLUMN ONLY: it does not cross the sidebar, which is a deliberate observation from the
 * reference and differs from the more common full-width bar. One 1px rule separates
 * them, no shadow and no elevation change.
 *
 * `linkAs` takes the router's own Link component. @zerocorp/ui must not import next/link:
 * a component library that knows which router it is under cannot be used by a second app,
 * and apps/sites is a second app.
 */

export type Glyph = ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill"; className?: string }>;

export interface NavItem {
  readonly label: string;
  readonly href?: string;
  readonly icon?: Glyph;
  readonly children?: readonly { href: string; label: string }[];
  /** A count. A dot is a state indicator and never a count — §21.4. */
  readonly badge?: number;
}

export interface DashboardShellProps {
  brand?: string;
  nav: readonly NavItem[];
  /** The current path, for marking the active item. Compared, never parsed. */
  activePath: string;
  linkAs?: ElementType;
  /** Pinned to the bottom, separated by a rule — §21.3. */
  footerNav?: readonly NavItem[];
  topBar?: ReactNode;
  children: ReactNode;
}

const ITEM =
  "text-label flex h-9 items-center gap-3 px-3 transition-[color,background-color,border-color] duration-normal ease-out focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2";

export function DashboardShell({
  brand = "ZeroCorp",
  nav,
  activePath,
  linkAs: Link = "a",
  footerNav = [],
  topBar,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [open, setOpen] = useState<readonly string[]>(() =>
    nav.filter((item) => item.children?.some((c) => c.href === activePath)).map((item) => item.label),
  );

  function renderItem(item: NavItem) {
    const Icon = item.icon;
    const isOpen = open.includes(item.label);
    const childActive = item.children?.some((c) => c.href === activePath) ?? false;

    if (!item.children) {
      const active = item.href === activePath;
      return (
        <li key={item.label}>
          <Link
            href={item.href}
            className={cx(
              ITEM,
              active ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
              collapsed && "justify-center px-0",
            )}
            {...(active ? { "aria-current": "page" } : {})}
          >
            {Icon ? <Icon size={20} weight="regular" className="shrink-0" /> : null}
            {!collapsed ? <span className="flex-1 truncate">{item.label}</span> : null}
            {!collapsed && item.badge !== undefined ? (
              <span className="bg-muted text-muted-foreground text-caption inline-flex size-5 items-center justify-center">
                {item.badge}
              </span>
            ) : null}
          </Link>
        </li>
      );
    }

    return (
      <li key={item.label}>
        <button
          type="button"
          aria-expanded={isOpen}
          onClick={() => setOpen((o) => (isOpen ? o.filter((x) => x !== item.label) : [...o, item.label]))}
          className={cx(
            ITEM,
            "w-full",
            childActive ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
        >
          {Icon ? <Icon size={20} weight="regular" className="shrink-0" /> : null}
          {!collapsed ? (
            <>
              <span className="flex-1 truncate text-left">{item.label}</span>
              {isOpen ? <CaretUpIcon size={16} /> : <CaretDownIcon size={16} />}
            </>
          ) : null}
        </button>

        {isOpen && !collapsed ? (
          <ul className="flex flex-col gap-0.5 pt-0.5">
            {item.children.map((child) => (
              <li key={child.href}>
                <Link
                  href={child.href}
                  className={cx(
                    ITEM,
                    "pl-12",
                    child.href === activePath ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
                  )}
                  {...(child.href === activePath ? { "aria-current": "page" } : {})}
                >
                  <span className="truncate">{child.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        ) : null}
      </li>
    );
  }

  return (
    <div className="bg-background text-foreground flex h-dvh overflow-hidden">
      <aside
        className={cx(
          "border-border relative hidden shrink-0 border-r transition-[width] duration-emphasis ease-out lg:block",
          collapsed ? "w-16" : "w-60",
        )}
      >
        <nav className="flex h-full flex-col" aria-label="Main">
          <div className={cx("flex h-14 items-center", collapsed ? "justify-center px-3" : "px-6")}>
            <span className="text-label tracking-tight">{collapsed ? brand.charAt(0) : brand}</span>
          </div>

          <ul className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-3 pt-4">{nav.map(renderItem)}</ul>

          {footerNav.length > 0 ? (
            <div className="border-border mx-3 border-t py-3">
              <ul className="flex flex-col gap-0.5">{footerNav.map(renderItem)}</ul>
            </div>
          ) : null}
        </nav>

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          className="border-border bg-background hover:border-input-hover focus-visible:outline-ring absolute top-20 -right-3 flex size-6 items-center justify-center border transition-[color,background-color,border-color] duration-normal focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <CaretLeftIcon size={12} className={cx("transition-transform duration-emphasis", collapsed && "rotate-180")} />
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {topBar ? (
          <header className="border-border flex h-14 shrink-0 items-center gap-4 border-b px-5 sm:px-6">
            {topBar}
          </header>
        ) : null}
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}

/** PageHeader — §21.5, VALIDATED 2026-09-01. Two stacked rows, then a rule. */
export function PageHeader({
  breadcrumb,
  meta,
  title,
  subtitle,
  actions,
}: {
  breadcrumb?: ReactNode;
  meta?: ReactNode;
  title: string;
  subtitle?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="border-border shrink-0 border-b">
      {breadcrumb || meta ? (
        <div className="border-border flex items-center justify-between gap-4 border-b px-5 py-3 sm:px-8">
          <div className="text-body-sm text-muted-foreground flex min-w-0 items-center gap-2">{breadcrumb}</div>
          {meta ? <div className="text-body-sm text-muted-foreground shrink-0">{meta}</div> : null}
        </div>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-6 sm:px-8">
        <div className="flex min-w-0 flex-col gap-1">
          <h1 className="text-h2 truncate">{title}</h1>
          {subtitle ? <div className="text-body-sm text-muted-foreground">{subtitle}</div> : null}
        </div>
        {/* Right-aligned and ordered least to most destructive — §21.5. */}
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </div>
    </div>
  );
}
