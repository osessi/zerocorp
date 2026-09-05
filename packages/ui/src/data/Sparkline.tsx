import { useId } from "react";
import { cx } from "../cx";

/*
  Rebuilt from the pattern in Dub (packages/ui/src/mini-area-chart.tsx, AGPL-3.0).
  Nothing was copied — theirs is built on visx, which we do not depend on, and this is
  30 lines of path arithmetic instead.

  The idea worth taking is the PADDING: `{ top: 8, right: 2, bottom: 2, left: 2 }`. Two
  pixels of horizontal padding means the line runs edge to edge and the sparkline fills
  its box completely. A sparkline with comfortable padding is a small chart; a sparkline
  with no padding is a texture, which is what it should be.
*/

export interface SparklineProps {
  readonly data: readonly number[];
  readonly width?: number;
  readonly height?: number;
  /** Fills the area under the line. Off for a dense table cell, on for a KPI card. */
  readonly fill?: boolean;
  readonly className?: string;
  readonly label?: string;
}

const PAD = { top: 8, right: 2, bottom: 2, left: 2 } as const;

export function Sparkline({
  data,
  width = 72,
  height = 24,
  fill = true,
  className,
  label,
}: SparklineProps) {
  const gradientId = useId();

  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  /* A flat series has zero range, and dividing by it puts every point at NaN. A flat
     line belongs on the baseline, not in the middle: "nothing happened" reads as a floor,
     not as a steady mid-level. */
  const range = max - min || 1;

  const innerW = width - PAD.left - PAD.right;
  const innerH = height - PAD.top - PAD.bottom;

  const points = data.map((v, i) => {
    const x = PAD.left + (i / (data.length - 1)) * innerW;
    const y = PAD.top + innerH - ((v - min) / range) * innerH;
    return [x, y] as const;
  });

  const line = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)}`).join(" ");
  const area = `${line} L${(width - PAD.right).toFixed(2)},${height - PAD.bottom} L${PAD.left},${height - PAD.bottom} Z`;
  const [lastX, lastY] = points[points.length - 1]!;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cx("text-chart-1 shrink-0 overflow-visible", className)}
      {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}
    >
      {fill ? (
        <>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="currentColor" stopOpacity="0.18" />
              <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={area} fill={`url(#${gradientId})`} />
        </>
      ) : null}
      <path d={line} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
      {/* The endpoint, emphasised. A sparkline without one has no "now". */}
      <circle cx={lastX} cy={lastY} r="2" fill="currentColor" />
    </svg>
  );
}
