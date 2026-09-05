"use client";

import { useEffect, useState, type ElementType, type ReactNode } from "react";
import { CaretLineLeftIcon, CaretLineRightIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "../cx";
import { NavGlyph } from "../icon/NavGlyph";
import type { PhosphorIcon } from "../icon/Icon";
import { JOURNEY, NEUTRAL, type JourneyTone } from "./journey";

/*
  Rebuilt from the pattern in Midday (apps/dashboard, AGPL-3.0). Nothing was copied.

  Theirs, measured from source:
    70px at rest, 240px on hover, 200ms cubic-bezier(0.4, 0, 0.2, 1); the ICON never
    moves, sitting in a fixed 40x40 box; the active background is a SEPARATE element that
    grows 40px → calc(100% - 30px); the label fades in at left:55px; sub-items stagger at
    40 + index*20 ms in and index*20 ms out.

  The fixed icon position is what makes it work. If the icon moves when the rail expands,
  the expansion reads as the whole product shifting sideways.

  ---------------------------------------------------------------------------
  WHAT THIS ADDS OVER MIDDAY — 2026-09-04, second pass.

  Midday's rail has ONE behaviour: it opens on hover and closes when you leave. There is
  no way to keep it open. That is a real weakness on a wide screen, where a founder
  reading a table wants the labels visible without holding the cursor in the gutter.

  So there are two modes here, and the chevron switches between them:

    PEEK    72px, opens on hover, closes on leave        the default
    PINNED  240px, stays open, content shifts to match   the deliberate choice

  Pinned is remembered in localStorage, because a layout preference that resets every
  navigation is not a preference. In PEEK the rail floats OVER the content, so nothing
  reflows while the cursor passes; in PINNED it takes real width and the content moves
  once, when the choice is made.
  ---------------------------------------------------------------------------
*/

const STORAGE_KEY = "zc.rail.pinned";

export interface RailItem {
  readonly label: string;
  readonly href: string;
  readonly icon: PhosphorIcon;
  readonly count?: number | undefined;
  readonly attention?: boolean | undefined;
  readonly children?: readonly { readonly label: string; readonly href: string }[] | undefined;
}

export interface RailGroup {
  readonly label: string;
  readonly tone: JourneyTone;
  readonly items: readonly RailItem[];
}

export interface RailProps {
  readonly groups: readonly RailGroup[];
  readonly footer: readonly RailItem[];
  readonly pathname: string;
  /** The router's Link. @zerocorp/ui stays framework free — NN-1. */
  readonly as?: ElementType;
  readonly brand?: ReactNode;
  readonly children?: ReactNode;
  /** Told the shell so it can reserve the width when pinned. */
  readonly onPinnedChange?: (pinned: boolean) => void;
}

export function Rail({
  groups,
  footer,
  pathname,
  as: L = "a",
  brand,
  children,
  onPinnedChange,
}: RailProps) {
  const [pinned, setPinned] = useState(false);
  const [peek, setPeek] = useState(false);

  /* Read once on mount. `useState(() => localStorage…)` would run during SSR and throw. */
  useEffect(() => {
    const stored = typeof window === "undefined" ? null : window.localStorage.getItem(STORAGE_KEY);
    if (stored === "1") {
      setPinned(true);
      onPinnedChange?.(true);
    }
    /* Mount-only by design: this READS a stored preference once, it does not track one.
       No dependency array entry is wanted — re-running on every onPinnedChange identity
       change would fight the user's own toggle. */
  }, []);

  const togglePinned = () => {
    const next = !pinned;
    setPinned(next);
    setPeek(false);
    onPinnedChange?.(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next ? "1" : "0");
    } catch {
      /* Private browsing refuses writes. The preference is a convenience, not state. */
    }
  };

  const open = pinned || peek;

  return (
    <aside
      onMouseEnter={() => !pinned && setPeek(true)}
      onMouseLeave={() => setPeek(false)}
      /* Focus opens it too. A keyboard user cannot hover, and the labels are the point. */
      onFocusCapture={() => !pinned && setPeek(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setPeek(false);
      }}
      data-open={open ? "" : undefined}
      data-pinned={pinned ? "" : undefined}
      className={cx(
        "group/rail border-border bg-background fixed inset-y-0 left-0 z-40 hidden shrink-0 flex-col border-r md:flex",
        "transition-[width] duration-[--duration-content] ease-in-out motion-reduce:transition-none",
        open ? "w-(--spacing-sidebar)" : "w-(--spacing-sidebar-rail)",
        /* Peek floats over the content; pinned sits beside it. */
        !pinned && peek && "shadow-floating",
      )}
      aria-label="Main"
    >
      <div className="border-border flex h-14 flex-none items-center gap-2 border-b px-4">
        {brand}
        {/*
          The chevron. Only rendered once there is room for it, and it is the ONE control
          in the rail that is not navigation, so it sits apart from the groups.
        */}
        <button
          type="button"
          onClick={togglePinned}
          aria-pressed={pinned}
          aria-label={pinned ? "Unpin the sidebar" : "Keep the sidebar open"}
          className={cx(
            "text-muted-foreground hover:text-foreground hover:bg-surface focus-visible:outline-ring ml-auto flex size-7 shrink-0 items-center justify-center border border-transparent",
            "transition-[opacity,color,background-color,border-color] duration-[--duration-overlay] ease-out motion-reduce:transition-none",
            "focus-visible:outline-2 focus-visible:-outline-offset-2",
            pinned && "border-border bg-surface text-foreground",
            open ? "opacity-100" : "pointer-events-none opacity-0",
          )}
        >
          {pinned ? <CaretLineLeftIcon size={16} /> : <CaretLineRightIcon size={16} />}
        </button>
      </div>

      <nav className="flex min-h-0 flex-1 flex-col gap-4 overflow-x-hidden overflow-y-auto py-3">
        {groups.map((group) => (
          <div key={group.label} className="flex flex-col gap-0.5">
            <span
              className={cx(
                "text-overline px-4 pb-1 whitespace-nowrap",
                JOURNEY[group.tone].label,
                "transition-opacity duration-[--duration-content] ease-out motion-reduce:transition-none",
                open ? "opacity-100" : "opacity-0",
              )}
              aria-hidden={!open}
            >
              {group.label}
            </span>
            {group.items.map((item) => (
              <RailRow
                key={item.href}
                item={item}
                tone={group.tone}
                active={pathname === item.href || pathname.startsWith(`${item.href}/`)}
                open={open}
                as={L}
                pathname={pathname}
              />
            ))}
          </div>
        ))}
      </nav>

      <div className="border-border flex flex-none flex-col gap-0.5 border-t py-3">
        {footer.map((item) => (
          <RailRow
            key={item.href}
            item={item}
            tone={null}
            active={pathname === item.href}
            open={open}
            as={L}
            pathname={pathname}
          />
        ))}
        {children}
      </div>
    </aside>
  );
}

function RailRow({
  item,
  tone,
  active,
  open,
  as: L,
  pathname,
}: {
  item: RailItem;
  tone: JourneyTone | null;
  active: boolean;
  open: boolean;
  as: ElementType;
  pathname: string;
}) {
  const t = tone ? JOURNEY[tone] : NEUTRAL;
  const expanded = open && active && item.children && item.children.length > 0;

  return (
    <div className="flex flex-col">
      <L
        href={item.href}
        aria-current={active ? "page" : undefined}
        className="group/nav focus-visible:outline-ring relative block focus-visible:outline-2 focus-visible:-outline-offset-2"
      >
        {/*
          The TILE, as its own element so it can grow without moving the icon.

          40px square collapsed, full width expanded. It steps up to --surface rather
          than sitting on --background: the rail IS --background, so an active tile on
          --background is invisible, which is exactly what shipped in the first pass.
        */}
        <span
          aria-hidden="true"
          className={cx(
            "ml-4 block h-(--row-nav) border",
            "transition-[width,background-color,border-color,box-shadow] duration-[--duration-content] ease-in-out motion-reduce:transition-none",
            active ? t.activeRow : "border-transparent group-hover/nav:border-border group-hover/nav:bg-surface",
            open ? "w-[calc(100%-2rem)]" : "w-(--row-nav)",
          )}
        />

        {/* The icon, in a fixed box that never moves. */}
        <span
          className={cx(
            "pointer-events-none absolute top-0 left-4 flex size-(--row-nav) items-center justify-center",
            active ? t.label : "text-muted-foreground group-hover/nav:text-foreground",
            "transition-[color] duration-[--duration-overlay] ease-out motion-reduce:transition-none",
          )}
        >
          <NavGlyph icon={item.icon} active={active} size={20} />
        </span>

        <span
          className={cx(
            "pointer-events-none absolute top-0 right-3 left-14 flex h-(--row-nav) items-center gap-2",
            "transition-opacity duration-[--duration-content] ease-out motion-reduce:transition-none",
            open ? "opacity-100" : "opacity-0",
          )}
          aria-hidden={!open}
        >
          <span
            className={cx(
              "text-body-sm truncate",
              active ? "text-foreground font-medium" : "text-muted-foreground",
            )}
          >
            {item.label}
          </span>
          {item.count !== undefined && item.count > 0 ? (
            <span
              className={cx(
                "text-caption ml-auto inline-flex h-5 min-w-5 items-center justify-center px-1.5 font-mono tabular-nums",
                item.attention
                  ? "bg-accent-highlight text-accent-highlight-ink font-semibold"
                  : t.count,
              )}
            >
              {item.count}
            </span>
          ) : null}
        </span>

        {/* Collapsed, a count has nowhere to go, so it becomes a dot on the tile. */}
        {!open && item.count !== undefined && item.count > 0 ? (
          <span
            aria-hidden="true"
            className={cx(
              "absolute top-1.5 left-11 size-2 rounded-full",
              item.attention ? "bg-accent-highlight" : "bg-muted-foreground",
            )}
          />
        ) : null}
      </L>

      {item.children && item.children.length > 0 ? (
        <div
          className={cx(
            "overflow-hidden transition-[max-height] duration-[--duration-content] ease-out motion-reduce:transition-none",
            expanded ? "max-h-64" : "max-h-0",
          )}
        >
          {item.children.map((child, i) => (
            <L
              key={child.href}
              href={child.href}
              className={cx(
                "mr-4 ml-9 flex h-(--row-nav-child) items-center border-l border-dotted pl-3",
                "border-border text-caption whitespace-nowrap",
                "transition-[opacity,transform,color] duration-[--duration-content] ease-out motion-reduce:transition-none",
                pathname === child.href
                  ? "text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
                expanded ? "translate-x-0 opacity-100" : "-translate-x-2 opacity-0",
              )}
              style={{ transitionDelay: expanded ? `${40 + i * 20}ms` : `${i * 20}ms` }}
            >
              {child.label}
            </L>
          ))}
        </div>
      ) : null}
    </div>
  );
}
