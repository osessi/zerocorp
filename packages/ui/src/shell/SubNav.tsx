import type { ComponentType, ReactNode } from "react";
import { cx } from "../cx";

/**
 * The second level of structure.
 *
 * Seven screens shared one skeleton — a title, then a stack of panels — so Company,
 * Website, Email and Content were structurally indistinguishable and none of them felt
 * like a place. The sidebar says which SECTION you are in; this says which part of it,
 * and the counts say how much is there.
 *
 * Horizontal tabs, not a second sidebar: a nested vertical rail spends 200px repeating
 * what the first one already established.
 *
 * Anchors, not client state. Every sub-section is a real fragment on the page, so a tab
 * is a link a founder can send to someone, and the browser's own scrolling does the work.
 *
 * A SERVER component, deliberately. It was marked "use client" and it has no hooks and no
 * handlers, so the directive bought nothing — and it broke every screen that used it: a
 * server page passing an icon COMPONENT across the client boundary throws "Functions
 * cannot be passed directly to Client Components". Five screens were dead.
 */
export interface SubNavItem {
  readonly id: string;
  readonly label: string;
  readonly count?: number | undefined;
  readonly icon?: ComponentType<{ size?: number; className?: string }> | undefined;
  /** Marks the one that wants attention. Yellow, per §4.8. */
  readonly attention?: boolean | undefined;
}

export function SubNav({ items, action }: { items: readonly SubNavItem[]; action?: ReactNode }) {
  return (
    <nav
      aria-label="Sections"
      className="border-border bg-surface sticky top-0 z-10 flex items-center justify-between gap-4 overflow-x-auto border-b"
    >
      <ul className="flex min-w-0 items-stretch">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.id}>
              <a
                href={`#${item.id}`}
                className={cx(
                  "text-body-sm text-muted-foreground hover:text-foreground hover:bg-accent focus-visible:outline-ring",
                  "flex items-center gap-2 whitespace-nowrap px-4 py-3 transition-[color,background-color] duration-normal",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2",
                )}
              >
                {Icon ? <Icon size={16} aria-hidden="true" /> : null}
                {item.label}
                {item.count !== undefined && item.count > 0 ? (
                  <span
                    className={cx(
                      "text-caption rounded-sm inline-flex h-5 min-w-5 items-center justify-center px-1.5 font-mono tabular-nums",
                      item.attention
                        ? "bg-accent-highlight text-accent-highlight-ink font-semibold"
                        : "bg-muted text-muted-foreground",
                    )}
                  >
                    {item.count}
                  </span>
                ) : null}
              </a>
            </li>
          );
        })}
      </ul>
      {action ? <div className="shrink-0 pr-4">{action}</div> : null}
    </nav>
  );
}
