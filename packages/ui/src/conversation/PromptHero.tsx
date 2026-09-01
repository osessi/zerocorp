import type { ReactNode } from "react";
import { cx } from "../cx";
import { ENTER } from "./motion";

/**
 * PromptHero — a starting point that is a prompt, not a button.
 *
 * The same pattern in two places, on purpose:
 *
 *   page    the landing. The opening question is fixed and costs no model call, so
 *           there is no reason to make a visitor click through to a second page to
 *           answer it. They type, they send, the page becomes the conversation.
 *   panel   inside the product. Every "start something" surface — a new business, a
 *           content brief, a plan revision — is the same gesture: say what you want,
 *           and it becomes a conversation.
 *
 * That consistency is the point. A founder learns one way to begin anything in
 * ZeroCorp, and an empty dashboard panel stops being a dead end with a button in it.
 *
 * The dock is passed in rather than built here, so the same hero serves a free-text
 * prompt, a file drop or anything else that starts work.
 */
export interface PromptHeroProps {
  title: ReactNode;
  subtitle?: ReactNode;
  /** The PromptDock, or whatever starts the work. */
  children: ReactNode;
  /** Below the dock: reassurance on the landing, examples inside the product. */
  footnote?: ReactNode;
  variant?: "page" | "panel";
  className?: string;
}

export function PromptHero({
  title,
  subtitle,
  children,
  footnote,
  variant = "page",
  className,
}: PromptHeroProps) {
  const page = variant === "page";

  return (
    <div
      className={cx(
        "flex w-full flex-col",
        page ? "items-center justify-center px-4 py-12 sm:px-6" : "px-0 py-8",
        className,
      )}
    >
      <div className={cx(ENTER, "flex w-full flex-col gap-8", page ? "max-w-2xl" : "max-w-full")}>
        <div className="flex flex-col gap-4">
          {/* text-h1 on a page, text-h3 in a panel: a hero inside a dashboard that
              shouts as loudly as the landing page turns every panel into a billboard. */}
          <h1 className={cx(page ? "text-h1" : "text-h3", "text-balance")}>{title}</h1>
          {subtitle ? (
            <p className={cx(page ? "text-body" : "text-body-sm", "text-muted-foreground max-w-prose")}>
              {subtitle}
            </p>
          ) : null}
        </div>

        {children}

        {footnote ? (
          <div className="text-caption text-muted-foreground flex flex-wrap items-center gap-x-6 gap-y-2">
            {footnote}
          </div>
        ) : null}
      </div>
    </div>
  );
}
