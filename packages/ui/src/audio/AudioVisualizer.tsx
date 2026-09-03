"use client";

import { useEffect, useRef } from "react";
import { cx } from "../cx";
import { useMicAnalyser } from "./useMicAnalyser";

/**
 * The voice, drawn.
 *
 * Four renderings of one signal, chosen by `variant`. ONE component rather than four,
 * because four files sharing a canvas loop, a colour resolver, a resize observer and a
 * reduced-motion branch are four copies of the same bugs — and the constitution is
 * explicit that a competing implementation is worse than a parameter.
 *
 * ── On the LiveKit components this replaces ────────────────────────────────────────
 *
 * The reference snippets call `useAgent()` from `@livekit/components-react` and render
 * `AgentAudioVisualizer{Bar,Wave,Aura,Radial}` from a shadcn registry. Neither is used
 * here, for two reasons that are about this product rather than about that library:
 *
 *   THE REGISTRY IS NOT REACHABLE. Every documented URL 404s. Nothing is copied into
 *   this repository before its licence is read, and a package that cannot be fetched
 *   cannot have its licence read.
 *
 *   THERE IS NO AGENT. `useAgent()` reads the state of a LiveKit realtime session.
 *   Onboarding uses the browser's own recogniser — ADR 0002, which measured a batch
 *   transcription API at $0.025–0.043 per assessment and refused it for the free tier.
 *   Adding a realtime SFU client to draw a waveform would install a transport with
 *   nothing on the other end of it.
 *
 * So the props are kept and the source is changed. Every snippet maps directly:
 *
 *   <AgentAudioVisualizerBar size="xl" state="speaking" />
 *     → <AudioVisualizer variant="bar" size="xl" state="speaking" />
 *   <AgentAudioVisualizerAura colorShift={0.3} themeMode={…} />
 *     → <AudioVisualizer variant="aura" colorShift={0.3} />   (theme is read from tokens)
 *   <AgentAudioVisualizerWave lineWidth={2} />
 *     → <AudioVisualizer variant="wave" lineWidth={2} />
 *   <AgentAudioVisualizerRadial barCount={24} radius={60} />
 *     → <AudioVisualizer variant="radial" barCount={24} radius={60} />
 *
 * `themeMode` has no equivalent on purpose: the colour is a TOKEN, and a token already
 * knows what it is in each theme. Passing the theme in would let a caller disagree with
 * the theme it is rendering inside.
 *
 * ── Colour ────────────────────────────────────────────────────────────────────────
 *
 * `color` is a custom property NAME, never a hex. The reference passes "#4CA3FA", which
 * is exactly the arbitrary value the constitution forbids: it survives a theme switch
 * unchanged, it has never been measured against any ground, and it is invisible to every
 * audit in tests/architecture because those read tokens. The value is resolved from
 * computed style at mount, so a canvas gets a real colour and the palette stays the one
 * place colours live.
 */

export type AudioVisualizerVariant = "bar" | "wave" | "aura" | "radial";

/** `thinking` is the pause after the founder stops and before the answer arrives. */
export type AudioVisualizerState = "idle" | "listening" | "speaking" | "thinking";

export type AudioVisualizerSize = "sm" | "md" | "lg" | "xl";

const SIZE: Record<AudioVisualizerSize, string> = {
  sm: "h-16",
  md: "h-24",
  lg: "h-40",
  xl: "h-64",
};

export interface AudioVisualizerProps {
  variant?: AudioVisualizerVariant;
  state?: AudioVisualizerState;
  size?: AudioVisualizerSize;
  /** A design-token custom property, e.g. "--primary-emphasis". Never a hex. */
  color?: string;
  /** 0 to 1. How far the far end of the signal drifts toward `colorTo`. */
  colorShift?: number;
  /** The token the shift drifts toward. Ignored when `colorShift` is 0. */
  colorTo?: string;
  lineWidth?: number;
  barCount?: number;
  /** Inner radius of the radial variant, in canvas units. */
  radius?: number;
  className?: string;
  /** Announced to a screen reader, which cannot see any of this. */
  label?: string;
}

/** `#rrggbb` or `rgb(...)` from computed style, as three channels. */
function channels(value: string): [number, number, number] {
  const trimmed = value.trim();
  if (trimmed.startsWith("#")) {
    const hex = trimmed.length === 4
      ? trimmed[1]! + trimmed[1]! + trimmed[2]! + trimmed[2]! + trimmed[3]! + trimmed[3]!
      : trimmed.slice(1, 7);
    const n = parseInt(hex, 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const parts = trimmed.match(/[\d.]+/g);
  return parts && parts.length >= 3
    ? [Number(parts[0]), Number(parts[1]), Number(parts[2])]
    : [0, 0, 0];
}

export function AudioVisualizer({
  variant = "bar",
  state = "idle",
  size = "md",
  color = "--primary-emphasis",
  colorShift = 0,
  colorTo = "--accent-highlight",
  lineWidth = 2,
  barCount = 32,
  radius = 60,
  className,
  label = "Sound level",
}: AudioVisualizerProps) {
  const canvas = useRef<HTMLCanvasElement>(null);
  const listening = state === "listening";
  const { bands, level, error } = useMicAnalyser(listening, barCount);

  useEffect(() => {
    const node = canvas.current;
    if (!node) return;
    const ctx = node.getContext("2d");
    if (!ctx) return;

    const styles = getComputedStyle(node);
    const from = channels(styles.getPropertyValue(color) || "#000000");
    const to = channels(styles.getPropertyValue(colorTo) || styles.getPropertyValue(color) || "#000000");
    const at = (t: number, alpha = 1) => {
      const k = Math.min(1, Math.max(0, t)) * colorShift;
      const c = from.map((v, i) => Math.round(v + (to[i]! - v) * k));
      return `rgb(${c[0]} ${c[1]} ${c[2]} / ${alpha})`;
    };

    /*
      Reduced motion gets ONE frame, not a slower animation.

      A visualiser is motion with no informational content a still frame cannot carry:
      the transcript below it says everything this says. Slowing it down keeps the thing
      the preference exists to remove.
    */
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let frame = 0;
    let t = 0;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      const rect = node.getBoundingClientRect();
      node.width = Math.max(1, Math.floor(rect.width * ratio));
      node.height = Math.max(1, Math.floor(rect.height * ratio));
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      return rect;
    };
    let rect = resize();
    const observer = new ResizeObserver(() => {
      rect = resize();
      if (still) draw();
    });
    observer.observe(node);

    /*
      When there is no microphone there is still a state to show, and it MOVES.

      The first version returned a flat 0.04 for `idle`, which is a dead object on the
      screen for the entire time before anyone presses record. "Ca bouge pas, c'est nul",
      and correctly: a control that looks switched off is one nobody presses.

      Idle breathes, thinking pulses on a slower cycle, speaking runs a travelling wave.
      All three are deterministic from the frame counter rather than random. A visualiser
      that flickers randomly reads as a fault, and the eye is extremely good at telling
      noise from a signal.
    */
    const synthetic = (i: number, n: number): number => {
      const p = i / Math.max(1, n - 1);
      if (state === "idle") {
        // Low and slow. Alive, and quiet enough that it never competes with the copy.
        return 0.1 + 0.07 * Math.sin(t * 0.022 + p * Math.PI * 1.5) + 0.03 * Math.sin(t * 0.05 + p * 6);
      }
      if (state === "thinking") {
        return 0.2 + 0.16 * Math.sin(t * 0.045 + p * Math.PI * 2) + 0.05 * Math.sin(t * 0.11 + p * 4);
      }
      return 0.28 + 0.42 * Math.abs(Math.sin(t * 0.085 + p * Math.PI * 3)) * (0.55 + 0.45 * Math.sin(t * 0.028));
    };

    /*
      A floor under the live signal.

      Silence into a live microphone is legitimately nothing, but rendering literally
      nothing is indistinguishable from a broken component. The floor is the idle breath
      at a third of its amplitude: visibly quieter than any real speech, visibly alive.
    */
    const floor = (i: number, n: number) => 0.035 + 0.02 * Math.sin(t * 0.03 + (i / Math.max(1, n - 1)) * 5);

    const amplitude = (i: number, n: number): number => {
      if (!listening) return synthetic(i, n);
      // Bands are low-frequency-first and the low end carries most of the energy, so a
      // little gain on the tail keeps the shape from collapsing to a single spike.
      const raw = bands[Math.min(bands.length - 1, i)] ?? 0;
      return Math.max(floor(i, n), Math.min(1, raw * (1 + (i / n) * 1.6)));
    };

    function draw() {
      const w = rect.width;
      const h = rect.height;
      ctx!.clearRect(0, 0, w, h);

      if (variant === "bar") {
        const gap = Math.max(2, w / barCount / 4);
        const width = Math.max(1, w / barCount - gap);
        for (let i = 0; i < barCount; i++) {
          const a = amplitude(i, barCount);
          const bh = Math.max(lineWidth, a * h);
          ctx!.fillStyle = at(i / barCount);
          ctx!.fillRect(i * (width + gap), (h - bh) / 2, width, bh);
        }
        return;
      }

      if (variant === "wave") {
        ctx!.lineWidth = lineWidth;
        ctx!.lineJoin = "round";
        ctx!.lineCap = "round";
        // Three passes at falling opacity: one line reads as a chart, a small stack of
        // them reads as sound.
        for (let pass = 0; pass < 3; pass++) {
          ctx!.beginPath();
          ctx!.strokeStyle = at(pass / 3, 1 - pass * 0.32);
          for (let x = 0; x <= w; x += 2) {
            const p = x / w;
            const a = amplitude(Math.floor(p * barCount), barCount);
            const envelope = Math.sin(p * Math.PI); // pinned at both ends
            const y = h / 2 + Math.sin(p * Math.PI * 6 - t * 0.08 - pass * 0.7) * a * envelope * (h / 2.4);
            if (x === 0) ctx!.moveTo(x, y);
            else ctx!.lineTo(x, y);
          }
          ctx!.stroke();
        }
        return;
      }

      if (variant === "aura") {
        const cx0 = w / 2;
        const cy0 = h / 2;
        const base = Math.min(w, h) / 4;
        let loudness = 0;
        for (let i = 0; i < barCount; i++) loudness += amplitude(i, barCount);
        loudness /= barCount;
        // Outermost first, so the core paints over the halo rather than under it.
        for (let ring = 3; ring >= 1; ring--) {
          const r = base * (1 + ring * 0.42) * (1 + loudness * 0.5);
          const gradient = ctx!.createRadialGradient(cx0, cy0, base * 0.4, cx0, cy0, r);
          gradient.addColorStop(0, at(ring / 3, 0.22));
          gradient.addColorStop(1, at(ring / 3, 0));
          ctx!.fillStyle = gradient;
          ctx!.beginPath();
          ctx!.arc(cx0, cy0, r, 0, Math.PI * 2);
          ctx!.fill();
        }

        /*
          A core with an EDGE.

          Four stacked gradients alone gave a soft smudge with no shape, which at any
          size below very large reads as a smear rather than a thing. The core is a solid
          disc that breathes with the signal, and a rim one step outside it makes the
          whole object legible at a glance.
        */
        const core = base * (0.62 + loudness * 0.3);
        const disc = ctx!.createRadialGradient(cx0, cy0, 0, cx0, cy0, core);
        disc.addColorStop(0, at(0, 0.9));
        disc.addColorStop(0.72, at(0.5, 0.55));
        disc.addColorStop(1, at(1, 0.1));
        ctx!.fillStyle = disc;
        ctx!.beginPath();
        ctx!.arc(cx0, cy0, core, 0, Math.PI * 2);
        ctx!.fill();

        ctx!.strokeStyle = at(1, 0.55);
        ctx!.lineWidth = lineWidth;
        ctx!.beginPath();
        ctx!.arc(cx0, cy0, core + lineWidth * 3, 0, Math.PI * 2);
        ctx!.stroke();
        return;
      }

      // radial
      const cx0 = w / 2;
      const cy0 = h / 2;
      const inner = Math.min(radius, Math.min(w, h) / 2 - lineWidth * 2);
      ctx!.lineWidth = lineWidth;
      ctx!.lineCap = "round";
      for (let i = 0; i < barCount; i++) {
        const angle = (i / barCount) * Math.PI * 2 - Math.PI / 2;
        const a = amplitude(i, barCount);
        const outer = inner + a * (Math.min(w, h) / 2 - inner);
        ctx!.strokeStyle = at(i / barCount);
        ctx!.beginPath();
        ctx!.moveTo(cx0 + Math.cos(angle) * inner, cy0 + Math.sin(angle) * inner);
        ctx!.lineTo(cx0 + Math.cos(angle) * outer, cy0 + Math.sin(angle) * outer);
        ctx!.stroke();
      }
      ctx!.strokeStyle = at(0, 0.35);
      ctx!.lineWidth = 1;
      ctx!.beginPath();
      ctx!.arc(cx0, cy0, inner, 0, Math.PI * 2);
      ctx!.stroke();
    }

    if (still) {
      draw();
    } else {
      const loop = () => {
        t += 1;
        draw();
        frame = requestAnimationFrame(loop);
      };
      frame = requestAnimationFrame(loop);
    }

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [variant, state, listening, color, colorTo, colorShift, lineWidth, barCount, radius, bands, level]);

  return (
    <canvas
      ref={canvas}
      role="img"
      aria-label={error ?? label}
      className={cx("w-full", SIZE[size], className)}
    />
  );
}
