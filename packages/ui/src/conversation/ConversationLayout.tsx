import type { ReactNode } from "react";
import { cx } from "../cx";

/**
 * ConversationLayout — the frame for the adaptive assessment (D18).
 *
 * Three zones and one column. It is a sibling of FocusedFlowLayout rather than a
 * replacement: that one frames a fixed sequence of steps, this one frames a conversation
 * whose length is not known in advance, which is why it has no "step N of M".
 *
 * What replaces the step counter is the slot progress in the header, which is honest
 * about a thing a step counter cannot be: the interview may end at turn three or turn
 * eight, and pretending otherwise would show a progress bar that lies.
 */
export interface ConversationLayoutProps {
  /** The slot progress. Rendered right in the header. */
  progress?: ReactNode;
  /** Answered turns, collapsed. */
  history?: ReactNode;
  /** The active question, or the thinking indicator. */
  children: ReactNode;
  /** The prompt dock. Always present — D18. */
  dock?: ReactNode;
  brand?: string;
}

export function ConversationLayout({
  progress,
  history,
  children,
  dock,
  brand = "ZeroCorp",
}: ConversationLayoutProps) {
  return (
    <div className="bg-background text-foreground flex h-dvh flex-col">
      <header className="border-border flex h-14 shrink-0 items-center justify-between gap-4 border-b px-4 sm:px-6">
        <span className="text-label shrink-0 tracking-tight">{brand}</span>
        {progress}
      </header>

      <main className="flex min-h-0 flex-1 justify-center overflow-y-auto px-4 sm:px-6">
        <div className="flex w-full max-w-2xl flex-col gap-10 py-10">
          {history ? <div className="flex flex-col gap-2">{history}</div> : null}
          {children}
        </div>
      </main>

      {dock ? (
        <div className={cx("border-border shrink-0 border-t px-4 py-4 sm:px-6")}>
          <div className="mx-auto w-full max-w-2xl">{dock}</div>
        </div>
      ) : null}
    </div>
  );
}
