import type { ReactNode } from "react";

/**
 * ConversationLayout — the frame for the adaptive assessment (D18).
 *
 * ```text
 * ┌──────────────────────────────────────────────────────────┐
 * │  brand                                   3 of 5 understood│  h-14, full width
 * ├────────────────┬─────────────────────────────────────────┤
 * │  timeline      │   ▪───▪───◈┈┈○┈┈┈○   the rail            │
 * │  of what has   ├─────────────────────────────────────────┤
 * │  been asked    │   the one question being asked           │
 * │                ├─────────────────────────────────────────┤
 * │  w-72          │   [ dock ]                               │
 * └────────────────┴─────────────────────────────────────────┘
 * ```
 *
 * The rail lives INSIDE the content column, not across the whole window.
 *
 * Centring it on the viewport put it visibly off-centre from the question, because the
 * sidebar takes 288px out of one side and nothing out of the other. Two things that
 * belong to the same column have to be centred on that column; centring them on
 * different things is what makes a layout look almost right and slightly wrong.
 *
 * The rail and the question share one max-width for the same reason: a step marker
 * should sit over the content it is about.
 */
export interface ConversationLayoutProps {
  brand?: string;
  /** Right of the brand. A count, not a percentage. */
  status?: ReactNode;
  /** The WizardRail. Rendered above the question, inside the content column. */
  rail?: ReactNode;
  /** The QuestionTimeline. */
  timeline?: ReactNode;
  /** The active question, or the thinking indicator. */
  children: ReactNode;
  /** The PromptDock. Always present — D18. */
  dock?: ReactNode;
}

export function ConversationLayout({
  brand = "ZeroCorp",
  status,
  rail,
  timeline,
  children,
  dock,
}: ConversationLayoutProps) {
  return (
    <div className="bg-background text-foreground flex h-dvh flex-col overflow-hidden">
      <header className="border-border flex h-14 shrink-0 items-center justify-between gap-4 border-b px-5 sm:px-8">
        <span className="text-label tracking-tight">{brand}</span>
        {status ? <span className="text-body-sm text-muted-foreground">{status}</span> : null}
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/*
          The timeline scrolls independently and starts at the top. Centring it made it
          drift down the column as answers were added, so the same item sat at a
          different height on every turn.
        */}
        {timeline ? (
          <aside className="border-border order-2 shrink-0 overflow-y-auto border-t px-5 py-6 lg:order-1 lg:w-72 lg:border-t-0 lg:border-r lg:px-6 lg:py-8">
            {timeline}
          </aside>
        ) : null}

        <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col lg:order-2">
          {rail ? (
            <div className="border-border shrink-0 border-b px-5 py-5 sm:px-8">
              <div className="mx-auto w-full max-w-2xl">{rail}</div>
            </div>
          ) : null}

          <main className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-5 py-10 sm:px-8 lg:py-14">
            <div className="w-full max-w-2xl">{children}</div>
          </main>

          {dock ? (
            <div className="border-border shrink-0 border-t px-5 py-4 sm:px-8">
              <div className="mx-auto w-full max-w-2xl">{dock}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
