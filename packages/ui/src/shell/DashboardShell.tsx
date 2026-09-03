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
  /**
   * A count. A dot is a state indicator and never a count — §21.4.
   *
   * ONE treatment for every count in the sidebar. The first version gave two of them the
   * yellow accent and left the rest grey, which reads as an unfinished job rather than a
   * distinction — if the emphasis is not applied to all of them it should not be applied
   * to any. Attention is carried by the ROW, not by recolouring its number.
   */
  readonly badge?: number;
  /** Something here wants the founder. Marks the ROW, never the count. */
  readonly attention?: boolean;
  /** One line under the label, shown only when the sidebar is expanded. */
  readonly hint?: string;
  /** Sub-sections, revealed under the item while it is the active one. */
  readonly children?: readonly { readonly label: string; readonly href: string; readonly count?: number }[];
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
    <li className="flex flex-col">
      <Link
        href={item.href}
        title={collapsed ? item.label : undefined}
        {...(active ? { "aria-current": "page" } : {})}
        className={cx(
          "group relative flex items-center gap-3 border transition-[color,background-color,border-color,transform] duration-glide ease-glide",
          "focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
          collapsed ? "h-11 justify-center px-0" : "h-11 px-2.5",
          /*
            A FULL border on the active row, on all four sides.

            It was a 2px bar on the left edge, and I wrote a comment arguing that §21.27
            only forbids a bare left bar as a panel's ONLY edge. That was a rationalisation
            of a rule stated more times than it should have needed. The instruction was
            explicit: a full outline, a dotted one, or none. This is the full one.
          */
          active
            ? "border-border bg-accent text-foreground"
            : "border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground motion-safe:hover:translate-x-0.5",
        )}
      >
        {Icon ? (
          <span
            className={cx(
              "rounded-sm flex size-7 shrink-0 items-center justify-center border",
              "transition-[color,background-color,border-color,transform] duration-glide ease-glide",
              active
                ? "border-primary bg-primary text-primary-foreground"
                : "border-border group-hover:border-input-hover group-hover:text-foreground",
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

        {/* Attention marks the ROW, with a dot. The count keeps one treatment everywhere. */}
        {!collapsed && item.attention ? (
          <span
            className="bg-accent-highlight zc-pulse size-2 shrink-0 rounded-full"
            aria-label="Needs your attention"
          />
        ) : null}

        {!collapsed && item.badge !== undefined && item.badge > 0 ? (
          <span
            className={cx(
              "text-caption rounded-sm inline-flex h-5 min-w-5 shrink-0 items-center justify-center px-1.5 font-mono tabular-nums",
              "transition-[background-color] duration-normal",
              active ? "bg-accent-highlight text-accent-highlight-ink font-semibold" : "bg-muted text-muted-foreground",
            )}
          >
            {item.badge}
          </span>
        ) : null}
      </Link>

      {/*
        Sub-sections, under the section you are in.

        The sidebar said which of seven screens you were on and nothing else, so the
        second level of structure existed only as tabs inside the page. Showing it here
        while the section is active makes the navigation describe the whole product
        instead of its front doors.
      */}
      {active && !collapsed && item.children && item.children.length > 0 ? (
        <ul className="border-border mt-1 mb-1 ml-5 flex flex-col gap-0.5 border-l pl-3">
          {item.children.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                className={cx(
                  "text-caption text-muted-foreground hover:text-foreground focus-visible:outline-ring",
                  "flex items-center justify-between gap-2 py-1.5 transition-[color] duration-fast",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2",
                )}
              >
                <span className="truncate">{child.label}</span>
                {child.count !== undefined && child.count > 0 ? (
                  <span className="text-caption text-muted-foreground font-mono tabular-nums">{child.count}</span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
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
            <div key={group.label} className="flex flex-col gap-2">
              {/*
                The group label disappears when collapsed rather than truncating. A
                three-letter stump of "LAUNCH" is noise where a gap is a boundary.
              */}
              {!collapsed ? (
                <p className="text-overline text-muted-foreground px-2.5 pb-1">{group.label}</p>
              ) : (
                <span className="bg-border mx-auto h-px w-6" aria-hidden="true" />
              )}
              <ul className="flex flex-col gap-1.5">
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
            <ul className="flex flex-col gap-1.5">
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
