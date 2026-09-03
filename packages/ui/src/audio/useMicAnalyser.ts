"use client";

import { useEffect, useRef, useState } from "react";

/**
 * The live microphone, as numbers.
 *
 * `useSpeech` owns the browser's recogniser and gives back words. It does not give back
 * a signal, and there is no way to ask it for one — the Web Speech API holds its own
 * capture and exposes nothing. So a visualiser that is actually driven by the founder's
 * voice needs its own `getUserMedia`.
 *
 * Two consumers, ONE permission. The browser prompts once per origin and hands the
 * stream to both, so this costs the founder nothing extra. It is opened only while
 * `active` and every track is stopped the moment it is not — a microphone that stays
 * live after the recording stopped is the kind of thing people never forgive, and the
 * browser's own recording indicator would say so out loud.
 *
 * Returns a stable Float32Array that is MUTATED in place, never replaced. Sixty new
 * arrays a second is sixty allocations a second for a component that exists to be smooth.
 */

export interface MicAnalyser {
  /** Bands, 0 to 1, low frequency first. Mutated in place; read it inside a frame. */
  readonly bands: Float32Array;
  /** One number for the whole signal, 0 to 1. Smoothed. */
  readonly level: { current: number };
  /** False until a stream is actually running, so callers can render a resting state. */
  readonly live: boolean;
  /** Set when the browser refused, so the caller can say something true about it. */
  readonly error: string | null;
}

export function useMicAnalyser(active: boolean, bandCount = 32): MicAnalyser {
  const bands = useRef(new Float32Array(bandCount));
  const level = useRef(0);
  const [live, setLive] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    if (typeof window === "undefined" || !navigator.mediaDevices?.getUserMedia) {
      setError("This browser will not share a microphone.");
      return;
    }

    let stream: MediaStream | null = null;
    let context: AudioContext | null = null;
    let frame = 0;
    let cancelled = false;

    void (async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      } catch {
        // Refusing the microphone is a choice, not a fault. The caller falls back to
        // typing, which is offered on the same screen.
        if (!cancelled) setError("Microphone not shared.");
        return;
      }
      if (cancelled) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      context = new AudioContext();
      const analyser = context.createAnalyser();
      /*
        1024 rather than 2048: half the bins for the same frame budget, and at 32 bands
        the extra resolution is averaged away before it is ever drawn.

        smoothingTimeConstant at 0.75 is the difference between a visualiser that reads
        as a voice and one that reads as a strobe. Raw FFT output between two frames
        jumps hard enough to look like noise.
      */
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.75;
      context.createMediaStreamSource(stream).connect(analyser);

      const spectrum = new Uint8Array(analyser.frequencyBinCount);
      /*
        Speech lives roughly between 80Hz and 4kHz. Reading the whole spectrum spends
        most of the bands on frequencies a human voice never produces, which is why a
        naive visualiser is tall on the left and flat everywhere else.
      */
      const top = Math.floor((4000 / (context.sampleRate / 2)) * analyser.frequencyBinCount);
      const perBand = Math.max(1, Math.floor(top / bandCount));

      const tick = () => {
        analyser.getByteFrequencyData(spectrum);
        let sum = 0;
        for (let b = 0; b < bandCount; b++) {
          let acc = 0;
          for (let i = 0; i < perBand; i++) acc += spectrum[b * perBand + i] ?? 0;
          const value = acc / perBand / 255;
          // Ease each band toward its target rather than snapping. The FFT is already
          // smoothed in time; this smooths what the eye sees between two paints.
          bands.current[b] = (bands.current[b] ?? 0) * 0.6 + value * 0.4;
          sum += value;
        }
        level.current = level.current * 0.7 + (sum / bandCount) * 0.3;
        frame = requestAnimationFrame(tick);
      };
      frame = requestAnimationFrame(tick);
      setLive(true);
      setError(null);
    })();

    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      stream?.getTracks().forEach((t) => t.stop());
      void context?.close();
      setLive(false);
      bands.current.fill(0);
      level.current = 0;
    };
  }, [active, bandCount]);

  return { bands: bands.current, level, live, error };
}
