import type { ReactNode } from "react";
import { cx } from "../cx";

/*
  Rebuilt from the pattern in Midday (apps/dashboard, AGPL-3.0). Nothing was copied.

  Their app layout applies `md:ml-[70px]` and `px-4 md:px-8` and then STOPS. There is no
  container. Overview chooses to be a centred 768px column, vertically centred;
  Transactions chooses to be full-bleed with an internally scrolling table. That single
  decision, made per screen, is why their screens look like different places.

  Ours applied 1280px to all seven. The byte-identical container line appeared 15 times
  across 5 files, which is the visual monotony stated literally.
*/

export type PageWidth =
  /** 768px, centred. A single subject read top to bottom: a form, onboarding, a summary. */
  | "reading"
  /** 1280px, centred. Panels and grids. Most screens. */
  | "work"
  /** Viewport, gutters only. Scanned rather than read: tables, calendars. */
  | "full";

const WIDTH: Record<PageWidth, string> = {
  reading: "mx-auto w-full max-w-(--container-reading)",
  work: "mx-auto w-full max-w-(--container-work)",
  full: "w-full",
};

/**
 * The content column of a screen.
 *
 * `width` is a required prop with no default, deliberately. A default is how one width
 * ended up on every screen: nobody chose it, they just did not pass anything.
 */
export function Page({
  width,
  children,
  className,
}: {
  readonly width: PageWidth;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div
      className={cx(
        WIDTH[width],
        "flex flex-col gap-(--gap-section) px-4 py-6 sm:px-6 lg:px-8",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A screen whose body scrolls INSIDE itself while the page does not scroll.
 *
 * The difference between a document and an application, and it is one flex column with
 * `min-h-0`. Macro and Twenty both do this; Midday does it per-table with an explicit
 * `calc(100vh-200px)`.
 *
 * `min-h-0` is the load-bearing class and the one everybody omits: a flex child defaults
 * to `min-height: auto`, which refuses to shrink below its content, so the inner
 * `overflow-auto` never gets a bounded height and the whole page scrolls instead.
 */
export function PageFrame({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx("flex min-h-0 flex-1 flex-col", className)}>{children}</div>;
}

/** A section within a page. Blocks inside it sit 16px apart. */
export function Section({
  title,
  count,
  action,
  children,
  className,
}: {
  readonly title?: string;
  readonly count?: ReactNode;
  readonly action?: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <section className={cx("flex flex-col gap-(--gap-block)", className)}>
      {title || action ? (
        <div className="flex flex-wrap items-baseline justify-between gap-3">
          <div className="flex items-baseline gap-2.5">
            {title ? <h2 className="text-h4">{title}</h2> : null}
            {count !== undefined ? (
              <span className="text-caption text-muted-foreground font-mono tabular-nums">
                {count}
              </span>
            ) : null}
          </div>
          {action}
        </div>
      ) : null}
      {children}
    </section>
  );
}
