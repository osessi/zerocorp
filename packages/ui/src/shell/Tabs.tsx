"use client";

import { useState, type ReactNode } from "react";
import { cx } from "../cx";

/**
 * Real sub-navigation. One panel at a time.
 *
 * The first version was anchors on one long page: every section stacked, and a "tab"
 * scrolled you down it. That is a table of contents, not navigation — the whole point of
 * a second level is that Entity shows the entity and nothing else, so a screen stops
 * being a scroll and becomes a place.
 *
 * Big targets. The anchor version rendered tabs so small they were hard to click, which
 * is the thing a founder notices first and forgives last.
 *
 * `defaultTab` rather than a URL segment: these are sub-sections of one screen, and
 * putting each behind its own route would multiply five pages into seventeen for a
 * distinction that is not worth a page load. The trade is that a tab cannot be linked to
 * — recorded, and worth revisiting if anyone ever needs to send one.
 */
export interface TabDef {
  readonly id: string;
  readonly label: string;
  readonly count?: number | undefined;
  /**
   * A RENDERED element, not a component.
   *
   * Tabs holds state so it must be a client component, and a server page passing an icon
   * COMPONENT across that boundary throws "Functions cannot be passed directly to Client
   * Components". An element is data and crosses fine. Same trap as SubNav, one layer on.
   */
  readonly icon?: ReactNode;
  /** Something in here wants the founder. Marks the tab, not its count. */
  readonly attention?: boolean | undefined;
  readonly content: ReactNode;
}

export function Tabs({
  tabs,
  action,
  defaultTab,
}: {
  tabs: readonly TabDef[];
  action?: ReactNode;
  defaultTab?: string;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? "");
  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="flex flex-col">
      <div className="border-border bg-surface flex items-end justify-between gap-4 overflow-x-auto border-b">
        <div role="tablist" aria-label="Sections" className="flex items-stretch">
          {tabs.map((tab) => {
            const on = tab.id === current?.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => setActive(tab.id)}
                className={cx(
                  "text-body-sm focus-visible:outline-ring relative flex items-center gap-2.5 whitespace-nowrap",
                  // Generous target. 44px tall, real horizontal padding — the previous
                  // tabs were genuinely hard to hit.
                  "h-12 px-5 transition-[color,background-color] duration-normal ease-out",
                  "focus-visible:outline-2 focus-visible:-outline-offset-2",
                  on
                    ? "text-foreground font-medium"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50",
                )}
              >
                {tab.icon}
                {tab.label}
                {tab.count !== undefined && tab.count > 0 ? (
                  <span className="text-caption bg-muted text-muted-foreground rounded-sm inline-flex h-5 min-w-5 items-center justify-center px-1.5 font-mono tabular-nums">
                    {tab.count}
                  </span>
                ) : null}
                {tab.attention ? (
                  <span className="bg-accent-highlight zc-pulse size-2 shrink-0 rounded-full" aria-label="Needs attention" />
                ) : null}
                {/* The selected marker is a 2px rule on the BOTTOM edge of a tab strip —
                    which is what a tab is. §21.27 is about a bar down the left side of a
                    panel; this is the underline that makes a tab a tab. */}
                {on ? <span className="bg-primary absolute inset-x-0 -bottom-px h-0.5" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
        {action ? <div className="shrink-0 py-2 pr-4">{action}</div> : null}
      </div>

      <div role="tabpanel" className="zc-enter">
        {current?.content}
      </div>
    </div>
  );
}
