import type { ReactNode } from "react";
import { cx } from "../field/control-styles";
import { TONE_EDGE, TONE_GLYPH, TONE_INK, TONE_SURFACE, isAssertive, type StatusTone } from "../tone";

/**
 * Alert — status in the flow of the page.
 *
 * The persistent half of the feedback pair. A Toast is transient and may be missed; an
 * Alert stays until the condition does. Anything the user must act on is an Alert, and
 * a Toast at most repeats it.
 *
 * No primitive: the semantics are a role, and Base UI has nothing to add to a role.
 * docs/DESIGN_SYSTEM.md §17, §19.
 */
export interface AlertProps {
  tone: StatusTone;
  /** Required. An alert with no title is a coloured stripe with no meaning. */
  title: string;
  children?: ReactNode;
  /** Buttons. Keep to one primary action — an alert is not a form. */
  action?: ReactNode;
  className?: string;
}

export function Alert({ tone, title, children, action, className }: AlertProps) {
  const Glyph = TONE_GLYPH[tone];
  return (
    <div
      /*
        role is derived from the tone, never passed in. danger and warning interrupt;
        the rest are polite. A caller who could choose would eventually make a success
        message abandon whatever a screen reader was mid-sentence on.
      */
      role={isAssertive(tone) ? "alert" : "status"}
      className={cx(
        "flex gap-3 border p-3",
        TONE_EDGE[tone],
        TONE_SURFACE[tone],
        className,
      )}
    >
      <Glyph
        size={20}
        weight="regular"
        aria-hidden="true"
        className={cx("mt-0.5 shrink-0", TONE_INK[tone])}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/*
          The title carries the tone colour; the body stays --foreground.

          A whole paragraph in a status colour is harder to read and adds nothing — the
          same finding as the Select label, where teal at 3.18:1 failed as text while the
          identical 3.18:1 passed as a border. The threshold belongs to the role.
        */}
        <span className={cx("text-label", TONE_INK[tone])}>{title}</span>
        {children ? <div className="text-body-sm text-foreground">{children}</div> : null}
        {action ? <div className="mt-1 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </div>
  );
}
