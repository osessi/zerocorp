"use client";

import { useEffect, useRef } from "react";
import { cx } from "../cx";
import type { MicAnalyser } from "./useMicAnalyser";

/*
  A continuous WAVE, not a bar meter.

  Written here rather than installed, and the reason is worth recording so it is not
  asked a fourth time: `pnpm dlx shadcn@latest add @livekit/agent-audio-visualizer-aura`
  cannot run in this environment. `ui.livekit.io` does not resolve from here — github.com
  and registry.npmjs.org both answer 200 and that host returns ENOTFOUND — so the
  registry cannot be read. Separately, LiveKit's component is driven by `useAgent()`,
  which needs a LiveKit room and an agent session; onboarding captures the microphone
  directly through the Web Audio API, so even with the file there would be no session to
  read from.

  What it does instead, and it is the same idea:

    three phase-shifted sine waves, summed with a travelling envelope, amplitude driven
    by the live level, drawn to a canvas at frame rate

  Three, because one sine reads as a test signal and two read as a bug. Summed at
  different frequencies and speeds they never repeat within a session, which is what
  makes it read as a signal rather than as an animation on a loop.

  Canvas rather than SVG: this repaints every frame, and DESIGN_SYSTEM's own guidance is
  that generative or decorative graphics go to canvas rather than to hand-authored path
  data being diffed sixty times a second.
*/

export type WaveState = "idle" | "listening" | "thinking";

export interface WaveVisualizerProps {
  readonly analyser: MicAnalyser;
  readonly state: WaveState;
  /** CSS height. The canvas takes the full width of its container. */
  readonly height?: number;
  readonly className?: string;
  /** Reads a CSS custom property for the stroke. Defaults to the brand teal. */
  readonly colorVar?: string;
}

/** Layers, from back to front. Each is a different frequency and drift speed. */
const LAYERS = [
  { freq: 1.1, speed: 0.00042, amp: 1.0, alpha: 1.0, width: 2 },
  { freq: 1.9, speed: -0.00061, amp: 0.62, alpha: 0.5, width: 1.5 },
  { freq: 3.1, speed: 0.00087, amp: 0.34, alpha: 0.26, width: 1 },
] as const;

export function WaveVisualizer({
  analyser,
  state,
  height = 96,
  className,
  colorVar = "--primary",
}: WaveVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  /* The rendered amplitude trails the measured one, so a consonant does not snap the
     wave to full height and back inside two frames. */
  const smoothed = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const reduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const stroke = getComputedStyle(canvas).getPropertyValue(colorVar).trim() || "#00786f";
    let raf = 0;
    let width = 0;
    let cssHeight = height;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      width = rect.width;
      cssHeight = rect.height || height;
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(cssHeight * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);

    const draw = (t: number) => {
      /*
        Target amplitude by state:
          listening  the live level, floored so the line is never flat while recording
          thinking   a slow steady pulse, so the wave says "working" without a signal
          idle       a hairline
      */
      const live = Math.min(1, analyser.level.current * 1.6);
      const target =
        state === "listening"
          ? 0.18 + live * 0.82
          : state === "thinking"
            ? 0.22 + Math.sin(t * 0.0022) * 0.1
            : 0.04;

      /* Attack fast, release slow: a voice starting should be felt at once, a voice
         stopping should settle rather than drop. */
      const k = target > smoothed.current ? 0.28 : 0.06;
      smoothed.current += (target - smoothed.current) * (reduced ? 1 : k);

      const mid = cssHeight / 2;
      const peak = (cssHeight / 2 - 2) * smoothed.current;

      ctx.clearRect(0, 0, width, cssHeight);

      for (const layer of LAYERS) {
        ctx.beginPath();
        ctx.globalAlpha = layer.alpha;
        ctx.lineWidth = layer.width;
        ctx.strokeStyle = stroke;
        ctx.lineJoin = "round";
        ctx.lineCap = "butt";

        const phase = reduced ? 0 : t * layer.speed;
        for (let x = 0; x <= width; x += 2) {
          const u = width === 0 ? 0 : x / width;
          /* The envelope. sin(pi*u) tapers both ends to zero so the wave is anchored to
             its own baseline instead of being clipped by the canvas edge. */
          const envelope = Math.sin(Math.PI * u);
          const y =
            mid +
            Math.sin(u * Math.PI * 2 * layer.freq + phase * 6.28) *
              peak *
              layer.amp *
              envelope;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;

      raf = window.requestAnimationFrame(draw);
    };

    raf = window.requestAnimationFrame(draw);
    return () => {
      window.cancelAnimationFrame(raf);
      observer.disconnect();
    };
  }, [analyser, state, height, colorVar]);

  return (
    <canvas
      ref={canvasRef}
      style={{ height }}
      className={cx("block w-full", className)}
      aria-hidden="true"
    />
  );
}
