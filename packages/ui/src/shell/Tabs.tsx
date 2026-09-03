"use client";

import { useEffect, useState, type ReactNode } from "react";
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
  banner,
}: {
  tabs: readonly TabDef[];
  action?: ReactNode;
  defaultTab?: string;
  /**
   * Shown under the strip, on every tab.
   *
   * For the thing that is true whichever tab you are on — a blocking question, a
   * compliance warning. Burying that inside one tab is how it goes unread by anyone who
   * happened to land on another.
   */
  banner?: ReactNode;
}) {
  const [active, setActive] = useState(defaultTab ?? tabs[0]?.id ?? "");

  /*
    The URL fragment selects a tab.

    The sidebar's sub-sections link to /company#filing, and before this they scrolled to
    an anchor that no longer existed — the tabs replaced the stacked sections that used to
    carry those ids, so every sub-link went nowhere. Reading the hash makes those links
    work again, and it gives back the one thing local state had cost: a tab you can send
    to somebody.

    `hashchange` as well as mount, because clicking /company#entity while already on
    /company changes the hash without remounting anything.
  */
  useEffect(() => {
    const fromHash = () => {
      const id = window.location.hash.slice(1);
      if (id && tabs.some((t) => t.id === id)) setActive(id);
    };
    fromHash();
    window.addEventListener("hashchange", fromHash);
    return () => window.removeEventListener("hashchange", fromHash);
  }, [tabs]);

  const current = tabs.find((t) => t.id === active) ?? tabs[0];

  return (
    <div className="flex flex-col">
      {/*
        The BAND spans the width; the TABS sit in the middle of it. §21.28.

        The first reading of "centralised in the workspace" was "aligned to the content
        column", so the strip started at the same x as the table under it and still hugged
        the left edge of a 1500px screen. That was answered with "tu sais ce que veut dire
        centraliser au mieux ?", which settles it: centred means centred. The tablist is
        now optically in the centre of the workspace and the action, if there is one, is
        pinned right without pushing the tabs off centre.
      */}
      <div className="border-border bg-surface sticky top-0 z-20 border-b">
        <div className="relative mx-auto flex w-full max-w-(--container-content) items-end justify-center gap-4 overflow-x-auto px-5 sm:px-8">
        <div role="tablist" aria-label="Sections" className="flex items-stretch">
          {tabs.map((tab) => {
            const on = tab.id === current?.id;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={on}
                onClick={() => {
                  setActive(tab.id);
                  // Keep the URL honest without a navigation: replaceState leaves no
                  // history entry, so Back still means "the previous page".
                  window.history.replaceState(null, "", `#${tab.id}`);
                }}
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
                {/* RED, not yellow. Yellow is the non-semantic "look here" accent (§4.8)
                    and this is not decoration — something is actually blocked. */}
                {tab.attention ? (
                  <span className="bg-destructive zc-pulse size-2 shrink-0 rounded-full" aria-label="Needs attention" />
                ) : null}
                {/* The selected marker is a 2px rule on the BOTTOM edge of a tab strip —
                    which is what a tab is. §21.27 is about a bar down the left side of a
                    panel; this is the underline that makes a tab a tab. */}
                {on ? <span className="bg-primary absolute inset-x-0 -bottom-px h-0.5" aria-hidden="true" /> : null}
              </button>
            );
          })}
        </div>
        {action ? <div className="absolute end-5 shrink-0 py-2 sm:end-8">{action}</div> : null}
        </div>
      </div>

      {banner ? <div className="border-border border-b">{banner}</div> : null}

      <div role="tabpanel" className="zc-enter">
        {current?.content}
      </div>
    </div>
  );
}
