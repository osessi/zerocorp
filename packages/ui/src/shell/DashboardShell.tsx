"use client";

import { useState, type ComponentType, type ElementType, type ReactNode } from "react";
import { CaretLeftIcon, CaretRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "../cx";
import { JOURNEY, NEUTRAL, type JourneyTone, type ToneClasses } from "./journey";

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
  /** Which journey stage this group is. Omitted, the group stays neutral. */
  readonly tone?: JourneyTone;
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
  /**
   * One announcement, across the whole product, IN the top bar.
   *
   * The blocking question was repeated on every screen that cared about it — Overview and
   * Company and nowhere else — so a founder reading Content had no idea their filing was
   * paused. It is a property of the ACCOUNT.
   *
   * It replaces the top bar's contents rather than adding a row beneath them. A second
   * band under the chrome pushes the whole product down by 48px to say something that
   * belongs in the chrome, and the bar was mostly empty anyway.
   */
  announcement?: ReactNode;
  children: ReactNode;
}

function NavRow({
  item,
  active,
  collapsed,
  tone,
  Link,
}: {
  item: NavItem;
  active: boolean;
  collapsed: boolean;
  /** The group's journey classes. NEUTRAL outside a journey block. */
  tone: ToneClasses;
  Link: ElementType;
}) {
  const Icon = item.icon;
  const hasChildren = !collapsed && !!item.children && item.children.length > 0;

  /*
    Sub-sections open on a CHEVRON, not on being the active section.

    They only appeared once you were already on the page, which is the wrong way round:
    the reason to show them is so somebody can see what is in a section BEFORE going
    there, and jump straight to the part they want. The active section starts open
    because that is the one you are looking at.
  */
  const [open, setOpen] = useState(active);

  return (
    <li className="flex flex-col">
      <div className="relative flex items-stretch">
        <Link
          href={item.href}
          title={collapsed ? item.label : undefined}
          {...(active ? { "aria-current": "page" } : {})}
          className={cx(
            "group relative flex flex-1 items-center gap-3 border transition-[color,background-color,border-color,transform] duration-glide ease-glide",
            "focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
            collapsed ? "h-11 justify-center px-0" : "h-11 px-2.5",
            /*
              On a tinted ground the active row is a PANE OF THE PAGE, not a darker grey.
              `bg-accent` is a neutral #efefef, and dropping it onto a green wash reads as
              dirt rather than as selection. The row lifts to --background instead and
              takes the group's own edge, which is the same move a tab makes.
            */
            active ? tone.activeRow : cx(tone.rest, "motion-safe:hover:translate-x-0.5"),
          )}
        >
          {Icon ? (
            <span
              className={cx(
                "rounded-sm flex size-7 shrink-0 items-center justify-center border",
                "transition-[color,background-color,border-color,transform] duration-glide ease-glide",
                active ? tone.activeTile : tone.tile,
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

          {/* RED, not yellow. Yellow is "look here"; this is "something is blocked". */}
          {!collapsed && item.attention ? (
            <span className="bg-destructive zc-pulse size-2 shrink-0 rounded-full" aria-label="Needs your attention" />
          ) : null}

          {/*
            The count wears the row's own colour.

            A red pulsing dot beside a grey number said two different things about one
            row. If the row is blocked, its number is part of what is blocked.
          */}
          {!collapsed && item.badge !== undefined && item.badge > 0 ? (
            <span
              className={cx(
                "text-caption rounded-sm inline-flex h-5 min-w-5 shrink-0 items-center justify-center px-1.5 font-mono tabular-nums",
                "transition-[background-color,color] duration-glide ease-glide",
                item.attention
                  ? "bg-destructive-subtle text-destructive-ink border-destructive border font-semibold"
                  : tone.count,
              )}
            >
              {item.badge}
            </span>
          ) : null}
        </Link>

        {/*
          The chevron column is always there, even when a section has no sub-sections.

          Without it every count landed at a different x depending on whether its row
          happened to expand, so five numbers in one list sat on four different verticals.
          A reserved slot costs 28px and buys a column.
        */}
        {!collapsed && !hasChildren ? <span className="w-7 shrink-0" aria-hidden="true" /> : null}

        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-expanded={open}
            aria-label={`${open ? "Hide" : "Show"} ${item.label} sections`}
            className={cx(
              "focus-visible:outline-ring",
              tone.child,
              "flex w-7 shrink-0 items-center justify-center border border-transparent",
              "transition-[color,background-color,transform] duration-glide ease-glide",
              "focus-visible:outline-2 focus-visible:-outline-offset-2",
            )}
          >
            <CaretRightIcon
              size={13}
              weight="bold"
              aria-hidden="true"
              className={cx("transition-transform duration-glide ease-glide", open && "rotate-90")}
            />
          </button>
        ) : null}
      </div>

      {hasChildren && open ? (
        <ul className="mt-1 mb-1 ml-6 flex flex-col gap-0.5">
          {item.children!.map((child) => (
            <li key={child.href}>
              <Link
                href={child.href}
                className={cx(
                  "text-caption focus-visible:outline-ring",
                  tone.child,
                  "flex items-center justify-between gap-2 border border-transparent px-2.5 py-1.5",
                  "transition-[color,background-color,transform] duration-glide ease-glide",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2 motion-safe:hover:translate-x-0.5",
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
  announcement,
  children,
}: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="bg-background text-foreground flex h-dvh overflow-hidden">
      <aside
        className={cx(
          "border-border hidden shrink-0 flex-col border-r transition-[width] duration-emphasis ease-out lg:flex",
          collapsed ? "w-16" : "w-64",
        )}
      >
        {/*
          The mark, the wordmark, and the control that folds the rail — one row, nothing
          floating.

          The collapse chevron used to be an absolutely positioned square straddling the
          rail's right edge at `-right-3`. Half of it sat over the workspace, where the
          sticky tab band (z-20) and the announcement painted across it, so it arrived on
          screen sliced. A control that lives on a seam gets cut by whatever owns the
          seam; this one now lives inside the header and cannot be clipped by anything.

          The mark is the REAL yellow, at full strength. --accent-highlight is the
          non-semantic accent (§4.8) and a brand tile is the one place it can carry the
          whole product's colour without ever being mistaken for a status.
        */}
        <div
          className={cx(
            "border-border flex h-14 shrink-0 items-center gap-2.5 border-b",
            collapsed ? "justify-center px-2" : "px-3",
          )}
        >
          {collapsed ? (
            /* Folded, the mark IS the control. Nothing else fits in 64px, and a rail with
               no way back open is a trap. */
            <button
              type="button"
              onClick={() => setCollapsed(false)}
              aria-label="Expand navigation"
              title="Expand navigation"
              className="bg-accent-highlight text-accent-highlight-ink focus-visible:outline-ring flex size-9 items-center justify-center text-body-sm font-mono leading-none font-bold focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {brand.charAt(0)}
            </button>
          ) : (
            <>
              <span
                className="bg-accent-highlight text-accent-highlight-ink flex size-8 shrink-0 items-center justify-center text-body-sm font-mono leading-none font-bold"
                aria-hidden="true"
              >
                {brand.charAt(0)}
              </span>
              <span className="text-label min-w-0 flex-1 truncate tracking-tight">{brand}</span>
              <button
                type="button"
                onClick={() => setCollapsed(true)}
                aria-label="Collapse navigation"
                title="Collapse navigation"
                className="border-border text-muted-foreground hover:border-input-hover hover:text-foreground focus-visible:outline-ring flex size-7 shrink-0 items-center justify-center border transition-[color,border-color] duration-normal focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <CaretLeftIcon size={12} aria-hidden="true" />
              </button>
            </>
          )}
        </div>

        <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-2.5 py-4" aria-label="Main">
          {groups.map((group) => {
            const tone = group.tone ? JOURNEY[group.tone] : NEUTRAL;
            return (
              /*
                A group is a BLOCK, on its own ground, with an edge on all four sides.

                Not a border on one side and not a bare label over a gap: a stack of rows
                under a caption is a list you have to read, and three tinted blocks are a
                shape you learn once. `gap-4` on the nav is what keeps them separate —
                blocks welded into a column are the same defect as cards welded into a
                grid, and the space between them is what says they are three things.
              */
              <div
                key={group.label}
                className={cx("flex flex-col gap-2 border p-2", tone.block || "border-transparent")}
              >
                {/*
                  Collapsed, the label goes and the TINT stays. A three-letter stump of
                  "LAUNCH" is noise, and the grey hairline that used to stand in for it
                  said only "a boundary" — the ground says which boundary.
                */}
                {!collapsed ? (
                  <p className={cx("text-overline px-1.5 pb-0.5", tone.label || "text-muted-foreground")}>
                    {group.label}
                  </p>
                ) : null}
                <ul className="flex flex-col gap-1.5">
                  {group.items.map((item) => (
                    <NavRow
                      key={item.href}
                      item={item}
                      active={item.href === activePath}
                      collapsed={collapsed}
                      tone={tone}
                      Link={Link}
                    />
                  ))}
                </ul>
              </div>
            );
          })}
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
                  tone={NEUTRAL}
                  Link={Link}
                />
              ))}
            </ul>
          </div>
        ) : null}

        {account && !collapsed ? (
          <div className="border-border shrink-0 border-t p-3">{account}</div>
        ) : null}

      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/*
          The tone never touches the header's own rule.

          The header keeps a neutral `border-b`, which is structure — a hairline dividing
          two regions. Adding `border-destructive` beside it put a tone on a single edge
          for the fifth time, and the CI rule missed it because the two classes were on
          two different lines of one cx() call. Both are fixed: the announcement carries
          its own DASHED border on four sides, and the rule now reads a window of lines.
        */}
        {/*
          When there is an announcement it IS the header, edge to edge.

          It used to sit inside the header's own padding, so a full-width band had a gap
          on the left and the right and read as a floating strip rather than the top of
          the workspace. The header drops its padding and its rule; the band supplies both.
        */}
        {announcement ? (
          <div className="shrink-0">{announcement}</div>
        ) : topBar ? (
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
