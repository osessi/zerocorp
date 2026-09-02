import type { ReactNode } from "react";
import { WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { cx } from "../cx";
import { SegmentedProgress } from "./SegmentedProgress";

/**
 * CockpitHeader — the focal block at the top of Overview.
 *
 * The dashboard answers ONE question: what is ZeroCorp doing for me. Until now it opened
 * with a title and a subtitle on the same white as everything below it, so the answer had
 * no more weight than the list under it. This is the one region on the screen that sits on
 * `--surface-focal`, and everything below stays on `--background`. That contrast is the
 * whole point: it is what makes a page have a top.
 *
 * The anatomy changed during review. The brief opened with a greeting; the screen already
 * knows which step is blocked, and "Waiting on you: connect your domain" is a better answer
 * to "what is ZeroCorp doing for me" than "Good morning". So the blocked step is the
 * headline when there is one, the status line is the headline when there is not, and the
 * greeting is demoted to a small line above.
 *
 * One per screen. It is the focal block, and two focal blocks is no focal block.
 */
export function CockpitHeader({
  greeting,
  headline,
  blocked,
  total,
  completed,
  current,
  actions,
}: {
  /** Demoted to an overline. It is courtesy, not information. */
  greeting: string;
  /** The status line, used when nothing is blocked. */
  headline: string;
  /** The step waiting on the founder. Takes over the headline when present. */
  blocked?: { label: string; href?: string } | undefined;
  total: number;
  completed: number;
  current?: number | undefined;
  actions?: ReactNode;
}) {
  return (
    <header className="bg-surface-focal text-surface-focal-foreground border-border w-full border-b">
      <div className="mx-auto flex max-w-(--container-content) flex-col gap-5 px-8 py-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 flex-col gap-2">
            <span className="text-overline text-surface-focal-foreground/60">{greeting}</span>

            {blocked ? (
              /* Warning tone, but on a dark ground the §4.3 colour is not legible, so the
                 icon carries the hue and the text stays at full contrast. Colour is never
                 the only carrier here either: the word "Waiting on you" says it. */
              <p className="text-h3 flex items-start gap-2.5">
                <WarningIcon size={22} className="text-warning mt-0.5 shrink-0" weight="fill" />
                <span>
                  <span className="text-warning">Waiting on you:</span> {blocked.label}
                </span>
              </p>
            ) : (
              <p className="text-h3">{headline}</p>
            )}
          </div>

          {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
        </div>

        <div className="flex flex-col gap-2">
          <SegmentedProgress
            total={total}
            completed={completed}
            {...(current !== undefined ? { current } : {})}
            label={`${completed} of ${total} steps complete`}
            onFocal
          />
          <p className={cx("text-caption text-surface-focal-foreground/60 font-mono")}>
            {completed} of {total} steps complete
          </p>
        </div>
      </div>
    </header>
  );
}
