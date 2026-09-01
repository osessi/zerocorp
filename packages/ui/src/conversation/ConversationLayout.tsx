import type { ReactNode } from "react";
import { cx } from "../cx";

/**
 * ConversationLayout — the frame for the adaptive assessment (D18).
 *
 * ```text
 * ┌──────────────────────────────────────────────────────────┐
 * │  brand                                        3 of 5     │  h-14
 * ├──────────────────────────────────────────────────────────┤
 * │  ▪────▪────◈┈┈┈○┈┈┈┈○   the rail, validating step by step │  h-20
 * ├────────────────┬─────────────────────────────────────────┤
 * │  timeline      │  the one question being asked           │
 * │  of what has   │                                         │
 * │  been asked    │                                         │
 * │                ├─────────────────────────────────────────┤
 * │  w-72          │  [ dock ]                               │
 * └────────────────┴─────────────────────────────────────────┘
 * ```
 *
 * Three zones because they answer three different questions: what is still needed
 * (top), what has been said (left), and what is being asked right now (centre). A
 * single column has to interleave all three, and the one that matters ends up
 * competing with a history nobody is reading.
 *
 * The rail is not a progress bar. A bar claims to know how far through you are, and
 * this interview may end at turn three or turn eight. The rail says something true
 * instead: here are the five things we need, and three are settled.
 *
 * Below `lg` the timeline moves under the question, because a 288px rail on a 390px
 * screen leaves nothing for the question itself.
 */
export interface ConversationLayoutProps {
  brand?: string;
  /** Right of the brand. A count, not a percentage. */
  status?: ReactNode;
  /** The WizardRail. */
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

      {rail ? (
        <div className="border-border shrink-0 border-b px-5 py-5 sm:px-8">
          <div className="mx-auto w-full max-w-5xl">{rail}</div>
        </div>
      ) : null}

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {timeline ? (
          <aside className="border-border order-2 shrink-0 overflow-y-auto border-t px-5 py-6 lg:order-1 lg:w-72 lg:border-t-0 lg:border-r lg:px-6 lg:py-8">
            {timeline}
          </aside>
        ) : null}

        <div className="order-1 flex min-h-0 min-w-0 flex-1 flex-col lg:order-2">
          <main className="flex min-h-0 flex-1 items-start justify-center overflow-y-auto px-5 py-10 sm:px-8 lg:items-center lg:py-12">
            <div className="w-full max-w-xl">{children}</div>
          </main>

          {dock ? (
            <div className={cx("border-border shrink-0 border-t px-5 py-4 sm:px-8")}>
              <div className="mx-auto w-full max-w-xl">{dock}</div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
