"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "../cx";
import { VALUE_CHANGE } from "../motion";

/*
  Rebuilt from the pattern in Dub and Midday, both AGPL-3.0. Dub loads
  `@number-flow/react`; Midday animates the whole insight line with a framer variant that
  slides, fades and un-blurs. Neither was copied, and no dependency was added: the whole
  behaviour is one keyframe (`zc-value` in tokens.css) plus a key change.

  The blur is the part that matters. Slide-and-fade alone reads as two different numbers
  replacing each other. Slide, fade AND a 4px blur resolving to 0 reads as ONE number
  changing, which is what actually happened. It is a small effect doing a semantic job.
*/

export interface CounterProps {
  readonly value: string | number;
  readonly className?: string;
}

/**
 * A figure that animates when it changes, and only when it changes.
 *
 * Deliberately NOT a count-up. A count-up animates on first paint, which means every
 * KPI on the dashboard spins on load and the founder waits to read four numbers they
 * could already see. This animates on CHANGE: the first render is instant, and a value
 * arriving later moves.
 */
export function Counter({ value, className }: CounterProps) {
  const [display, setDisplay] = useState(value);
  const [animating, setAnimating] = useState(false);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      setDisplay(value);
      return;
    }
    if (value === display) return;
    setDisplay(value);
    setAnimating(true);
  }, [value, display]);

  return (
    <span
      /* The key restarts the keyframe. Without it, a value changing twice in a row
         animates once: the animation is already running and CSS will not replay it. */
      key={animating ? String(display) : undefined}
      className={cx("font-mono tabular-nums", animating && VALUE_CHANGE, className)}
      onAnimationEnd={() => setAnimating(false)}
    >
      {display}
    </span>
  );
}
