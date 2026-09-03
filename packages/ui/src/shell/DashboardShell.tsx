"use client";

import { useState, type ComponentType, type ElementType, type ReactNode } from "react";
import { CaretLeftIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "../cx";

/**
 * DashboardShell · SidebarNavigation · TopCommandBar — DESIGN_SYSTEM.md §21.2 to §21.4.
 *
 * The sidebar is fixed and carries its own logo header. The top bar spans the CONTENT
 * COLUMN ONLY: it does not cross the sidebar, which is a deliberate observation from the
 * reference and differs from the more common full-width bar.
 *
 * The navigation is GROUPED and the groups are labelled. An unlabelled list of nine
 * items is a list you read every time; three labelled groups of three are a shape you
 * learn once. The labels are also the product's own account of what it does — Build,
 * Launch, Grow — which is the same journey PRODUCT_SPEC.md §29.3 describes.
 *
 * Items are 40px rather than 36px, and carry their glyph in a bordered tile. At 36px
 * with a bare icon the whole rail reads as one grey block; the tile gives each row a
 * left edge to start from and the extra 4px is what stops nine items looking crammed
 * into a corner.
 *
 * `linkAs` takes the router's own Link component. @zerocorp/ui must not import next/link:
 * a component library that knows which router it is under cannot be used by a second app,
 * and apps/sites is a second app.
 */

export type Glyph = ComponentType<{ size?: number; weight?: "regular" | "bold" | "fill"; className?: string }>;

export interface NavItem {
  readonly label: string;
  readonly href: string;
  readonly icon?: Glyph;
  /** A count. A dot is a state indicator and never a count — §21.4. */
  readonly badge?: number;
  /**
   * What the badge MEANS.
   *
   * `count` is information — how many articles, how many leads. `attention` is the one
   * that wants you. Yellow marks the second, per §4.8: it is the non-semantic accent
   * whose whole job is "look here", and using it on every count would make it mean
   * nothing at all.
   */
  readonly badgeTone?: "count" | "attention";
  /** One line under the label, shown only when the sidebar is expanded. */
  readonly hint?: string;
}

export interface NavGroup {
  readonly label: string;
  readonly items: readonly NavItem[];
}

export interface DashboardShellProps {
  brand?: string;
  groups: readonly NavGroup[];
  /** The current path, for marking the active item. Compared, never parsed. */
  activePath: string;
  linkAs?: ElementType;
  footerNav?: readonly NavItem[];
  /** The account row, pinned to the very bottom. */
  account?: ReactNode;
  topBar?: ReactNode;
  children: ReactNode;
}

function NavRow({
  item,
  active,
  collapsed,
  Link,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  Link: ElementType;
}) {
  const Icon = item.icon;

  return (
    <li>
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        {...(active ? { "aria-current": "page" } : {})}
        className={cx(
          "group relative flex items-center gap-3 transition-[color,background-color] duration-normal ease-out",
          "focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
          collapsed ? "h-10 justify-center px-0" : "h-10 px-2",
          active ? "bg-accent text-foreground" : "text-muted-foreground hover:bg-accent/60 hover:text-foreground",
        )}
      >
        {/*
          The active marker is a 2px bar on the left edge of the ROW, inside a filled
          row. §21.27 forbids a bare left bar as a panel's only edge; this is not a
          panel and not its only edge -- the fill is doing the work and the bar is
          telling you which of the filled rows is the one you are on.
        */}
        {active && !collapsed ? (
          <span className="bg-primary absolute inset-y-0 left-0 w-0.5" aria-hidden="true" />
        ) : null}

        {Icon ? (
          <span
            className={cx(
              "flex size-7 shrink-0 items-center justify-center border transition-[color,background-color,border-color] duration-normal ease-out",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border group-hover:border-input-hover",
            )}
          >
            <Icon size={16} weight="regular" aria-hidden="true" />
          </span>
        ) : null}

        {!collapsed ? (
          <span className="flex min-w-0 flex-1 flex-col">
            <span className={cx("text-label truncate", active && "font-medium")}>{item.label}</span>
          </span>
        ) : null}

        {!collapsed && item.badge !== undefined && item.badge > 0 ? (
          <span
            className={cx(
              "text-caption rounded-sm inline-flex h-5 min-w-5 items-center justify-center px-1.5 font-mono tabular-nums",
              item.badgeTone === "attention"
                ? "bg-accent-highlight text-accent-highlight-ink font-semibold"
                : "bg-muted text-muted-foreground",
            )}
          >
            {item.badge}
          </span>
        ) : null}
      </Link>
    </li>
  );
}

export function DashboardShell({
  brand = "ZeroCorp",
  groups,
  activePath,
  linkAs: Link = "a",
  footerNav = [],
  account,
  topBar,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-background text-foreground flex h-dvh overflow-hidden">
      <aside
        className={cx(
          "border-border relative hidden shrink-0 flex-col border-r transition-[width] duration-emphasis ease-out lg:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <div
          className={cx(
            "border-border flex h-14 shrink-0 items-center border-b",
            collapsed ? "justify-center px-3" : "px-4",
          )}
        >
          <span className="text-label tracking-tight">{collapsed ? brand.charAt(0) : brand}</span>
        </div>

        <nav className="flex flex-1 flex-col gap-6 overflow-y-auto px-3 py-5" aria-label="Main">
          {groups.map((group) => (
            <div key={group.label} className="flex flex-col gap-1.5">
              {/*
                The group label disappears when collapsed rather than truncating. A
                three-letter stump of "LAUNCH" is noise where a gap is a boundary.
              */}
              {!collapsed ? (
                <p className="text-overline text-muted-foreground px-2 pb-0.5">{group.label}</p>
              ) : (
                <span className="bg-border mx-auto h-px w-6" aria-hidden="true" />
              )}
              <ul className="flex flex-col gap-0.5">
                {group.items.map((item) => (
                  <NavRow
                    key={item.href}
                    item={item}
                    active={item.href === activePath}
                    collapsed={collapsed}
                    Link={Link}
                  />
                ))}
              </ul>
            </div>
          ))}
        </nav>

        {footerNav.length > 0 ? (
          <div className="border-border shrink-0 border-t px-3 py-3">
            <ul className="flex flex-col gap-0.5">
              {footerNav.map((item) => (
                <NavRow
                  key={item.href}
                  item={item}
                  active={item.href === activePath}
                  collapsed={collapsed}
                  Link={Link}
                />
              ))}
            </ul>
          </div>
        ) : null}

        {account && !collapsed ? (
          <div className="border-border shrink-0 border-t p-3">{account}</div>
        ) : null}

        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          aria-label={collapsed ? "Expand navigation" : "Collapse navigation"}
          className="border-border bg-background hover:border-input-hover focus-visible:outline-ring absolute top-[3.25rem] -right-3 z-10 flex size-6 items-center justify-center border transition-[color,background-color,border-color] duration-normal focus-visible:outline-2 focus-visible:outline-offset-2"
        >
          <CaretLeftIcon size={12} className={cx("transition-transform duration-emphasis", collapsed && "rotate-180")} />
        </button>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {topBar ? (
          <header className="border-border flex h-14 shrink-0 items-center gap-4 border-b px-5 sm:px-8">
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
          {meta ? <div className="shrink-0">{meta}</div> : null}
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
