import type { ReactNode } from "react";
import { cx } from "../cx";

/*
  Rebuilt from the pattern in Macro (apps/web, proprietary — all rights reserved) and
  Midday (apps/dashboard, AGPL-3.0). Nothing was copied; Macro's is a Solid component and
  could not be in any case.

  Macro's Panel is a CSS grid of named areas:

      grid-template-areas:  "header" "toolbar" "body" "footer"
      grid-template-rows:   auto     auto      minmax(0,1fr)  auto

  The body is `minmax(0, 1fr)` and scrolls inside itself; header, toolbar and footer are
  `auto` and never move. That is the whole idea, and it is the difference between a
  document and an application.

  ---------------------------------------------------------------------------
  THE CARD TREATMENT — separated by GROUND, not by border. 2026-09-04.

  Taken from Midday, at the explicit instruction to take their light-mode treatment
  wholesale. Their cards are white on a receded page with a hairline edge; ours now are
  the same, because --background moved to #FAFAF9 and --surface stayed #FFFFFF.

  This is a deliberate departure from the previous house style, where every block carried
  a full-weight four-side border and hierarchy came entirely from those borders. The
  border here is present but quiet: it is the CARD'S OWN EDGE against a ground that is
  already doing most of the separating, rather than the only thing distinguishing one
  block from another.
  ---------------------------------------------------------------------------
*/

export interface PanelProps {
  readonly children: ReactNode;
  /** The body scrolls inside the panel rather than growing the page. */
  readonly scroll?: boolean;
  /** No edge at all. For a panel that is a region of the page, not an object on it. */
  readonly flush?: boolean;
  readonly className?: string;
}

export function Panel({ children, scroll = false, flush = false, className }: PanelProps) {
  return (
    <section
      className={cx(
        "grid min-h-0 min-w-0",
        "[grid-template-areas:'header''toolbar''body''footer']",
        "grid-rows-[auto_auto_minmax(0,1fr)_auto]",
        !flush && "border-border bg-surface border",
        scroll && "h-full",
        className,
      )}
    >
      {children}
    </section>
  );
}

/** 40px, and it never moves. Title on the left, count beside it, actions on the right. */
function Header({
  title,
  count,
  children,
  className,
}: {
  readonly title?: ReactNode;
  readonly count?: ReactNode;
  readonly children?: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={cx(
        "border-border flex min-h-10 flex-none items-center gap-3 border-b px-4",
        className,
      )}
      style={{ gridArea: "header" }}
    >
      {title ? <span className="text-body-sm truncate font-medium">{title}</span> : null}
      {count !== undefined ? (
        <span className="text-caption text-muted-foreground font-mono tabular-nums">{count}</span>
      ) : null}
      {children ? <div className="ml-auto flex items-center gap-2">{children}</div> : null}
    </div>
  );
}

/** Filters, search, segmented controls. Sits under the header and above the scroll. */
function Toolbar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx("border-border flex flex-none items-center gap-2 border-b px-4 py-2", className)}
      style={{ gridArea: "toolbar" }}
    >
      {children}
    </div>
  );
}

/**
 * The body. `minmax(0, 1fr)`, so it takes the slack and scrolls inside itself.
 *
 * `min-h-0` again: without it the grid row refuses to shrink under its content and the
 * overflow never engages.
 */
function Body({
  children,
  scroll = false,
  padded = true,
  className,
}: {
  readonly children: ReactNode;
  readonly scroll?: boolean;
  readonly padded?: boolean;
  readonly className?: string;
}) {
  return (
    <div
      className={cx(
        "min-h-0 min-w-0",
        scroll && "overflow-y-auto",
        padded && "p-4",
        className,
      )}
      style={{ gridArea: "body" }}
    >
      {children}
    </div>
  );
}

/** Totals, pagination, a summary line. Never scrolls away. */
function Footer({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div
      className={cx(
        "border-border text-caption text-muted-foreground flex min-h-9 flex-none items-center gap-3 border-t px-4",
        className,
      )}
      style={{ gridArea: "footer" }}
    >
      {children}
    </div>
  );
}

Panel.Header = Header;
Panel.Toolbar = Toolbar;
Panel.Body = Body;
Panel.Footer = Footer;
