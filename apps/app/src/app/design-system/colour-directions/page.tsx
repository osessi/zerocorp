"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  CheckCircleIcon,
  CircleNotchIcon,
  InfoIcon,
  RobotIcon,
  SparkleIcon,
  UserIcon,
  WarningIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button } from "@zerocorp/ui";
import { DIRECTIONS, type Direction, type Vars } from "./palettes";

/**
 * Colour directions — PROPOSAL, nothing is applied.
 *
 * Reported 2026-08-31: the dashboard reads monotone beside the visual references.
 *
 * Measured rather than assumed. Across the dashboard screens, neutral tokens are used 169
 * times and chromatic ones 21 — but the number that matters is that colour reaches a
 * SURFACE exactly once (`bg-success`). Everywhere else it is a 1px border or 12–16px of
 * text: 1–3% of a component's pixels. The palette is not too small; it has nowhere to land.
 *
 * Every ratio on this page is computed in the browser from the rendered colours. Nothing
 * here is a claimed number.
 */

/* ── contrast, computed from what the browser actually painted ─────────────── */

function lum(css: string): number {
  const m = css.match(/[\d.]+/g);
  if (!m) return 0;
  const [r, g, b] = m.slice(0, 3).map((v) => {
    const c = Number(v) / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * (r ?? 0) + 0.7152 * (g ?? 0) + 0.0722 * (b ?? 0);
}

function ratio(a: string, b: string): number {
  const l1 = lum(a);
  const l2 = lum(b);
  const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
}

/** Resolves a custom property to the rgb() the browser will paint. */
function resolve(el: HTMLElement | null, name: string): string {
  if (!el) return "rgb(0,0,0)";
  const raw = getComputedStyle(el).getPropertyValue(name).trim();
  if (!raw) return "rgb(0,0,0)";
  if (raw.startsWith("rgb")) return raw;
  const h = raw.replace("#", "");
  const n = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return `rgb(${parseInt(n.slice(0, 2), 16)},${parseInt(n.slice(2, 4), 16)},${parseInt(n.slice(4, 6), 16)})`;
}

const TONES = ["success", "warning", "info", "processing", "danger"] as const;
type Tone = (typeof TONES)[number];

const GLYPH = {
  success: CheckCircleIcon,
  warning: WarningIcon,
  info: InfoIcon,
  processing: CircleNotchIcon,
  danger: XCircleIcon,
} as const;

const LABEL: Record<Tone, string> = {
  success: "Active",
  warning: "Renews in 14 days",
  info: "EIN on file",
  processing: "Filing",
  danger: "Rejected",
};

/* ── the same dashboard fragment, rendered in whichever palette wraps it ───── */

function Fragment({ hasAi, hasAction }: { hasAi: boolean; hasAction: boolean }) {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <span className="text-overline text-muted-foreground uppercase">Status badges</span>
        <div className="flex flex-wrap gap-2">
          {TONES.map((t) => {
            const G = GLYPH[t];
            return (
              <span
                key={t}
                className="text-caption inline-flex items-center gap-1.5 border px-2 py-0.5 whitespace-nowrap"
                style={{
                  color: `var(--p-${t}-ink)`,
                  borderColor: `var(--p-${t})`,
                  background: `var(--p-${t}-subtle)`,
                }}
              >
                <G size={14} weight="regular" aria-hidden="true" />
                {LABEL[t]}
              </span>
            );
          })}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-overline text-muted-foreground uppercase">Buttons</span>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="text-label h-10 border px-4"
            style={{ background: "var(--p-accent)", borderColor: "var(--p-accent)", color: "var(--p-on-accent)" }}
          >
            Upgrade to Scale
          </button>
          <button
            type="button"
            className="text-label bg-background h-10 border px-4"
            style={{ borderColor: "var(--p-accent)", color: "var(--p-accent-strong)" }}
          >
            Change plan
          </button>
          <button
            type="button"
            className="text-label h-10 border px-4"
            style={{ background: "var(--p-danger)", borderColor: "var(--p-danger)", color: "var(--p-on-danger)" }}
          >
            Dissolve
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-overline text-muted-foreground uppercase">Metrics</span>
        <div className="border-border grid grid-cols-2 border sm:grid-cols-4">
          {[
            ["Businesses", "7", "+2", "success"],
            ["Credits", "1 240", "of 5 000", "processing"],
            ["Due soon", "3", "14 days", "warning"],
            ["MRR", "$1,196", "+18%", "success"],
          ].map(([label, value, note, tone], i) => (
            <div
              key={label as string}
              className={i > 0 ? "border-border flex flex-col gap-1 border-l p-3" : "flex flex-col gap-1 p-3"}
            >
              <span className="text-overline text-muted-foreground uppercase">{label as string}</span>
              <span className="text-h3 text-foreground font-mono">{value as string}</span>
              <span className="text-caption font-mono" style={{ color: `var(--p-${tone as string})` }}>
                {note as string}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-overline text-muted-foreground uppercase">Alerts</span>
        {(["danger", "warning", "success"] as Tone[]).map((t) => {
          const G = GLYPH[t];
          return (
            <div
              key={t}
              className="border-border flex gap-3 border p-3"
              style={{ borderLeftColor: `var(--p-${t})`, background: `var(--p-${t}-subtle)` }}
            >
              <G size={20} aria-hidden="true" className="mt-0.5 shrink-0" style={{ color: `var(--p-${t}-ink)` }} />
              <div className="flex flex-col gap-0.5">
                <span className="text-label" style={{ color: `var(--p-${t}-ink)` }}>
                  {t === "danger" ? "Wyoming rejected the filing" : t === "warning" ? "Annual report due in 14 days" : "EIN issued"}
                </span>
                <span className="text-body-sm text-foreground">
                  {t === "danger"
                    ? "The registered agent address is a PO box."
                    : t === "warning"
                      ? "File by 1 March 2027 to stay in good standing."
                      : "88-4192077 is on file."}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-overline text-muted-foreground uppercase">Progress</span>
        {[
          ["Formation", 100, "success"],
          ["Website", 64, "processing"],
          ["Email warm-up", 28, "warning"],
        ].map(([label, v, tone]) => (
          <div key={label as string} className="flex flex-col gap-1">
            <div className="flex justify-between">
              <span className="text-caption text-foreground">{label as string}</span>
              <span className="text-caption text-muted-foreground font-mono">{v as number}%</span>
            </div>
            <div className="bg-muted border-border h-1.5 border">
              <div className="h-full" style={{ width: `${v as number}%`, background: `var(--p-${tone as string})` }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-overline text-muted-foreground uppercase">Activity</span>
        <div className="border-border flex flex-col border">
          {[
            ["Content agent", "drafted 4 blog posts", true],
            ["Olivier K.", "approved the homepage copy", false],
            ["Lead agent", "added 128 prospects", true],
          ].map(([who, what, isAgent]) => (
            <div key={who as string} className="border-border flex items-center gap-3 border-b p-3 last:border-b-0">
              <span
                className="flex size-8 shrink-0 items-center justify-center border"
                style={
                  hasAi && (isAgent as boolean)
                    ? { borderColor: "var(--p-ai)", background: "var(--p-ai-subtle)", color: "var(--p-ai)" }
                    : { borderColor: "var(--color-border)", color: "var(--color-muted-foreground)" }
                }
              >
                {(isAgent as boolean) ? <RobotIcon size={16} aria-hidden="true" /> : <UserIcon size={16} aria-hidden="true" />}
              </span>
              <span className="text-body-sm text-foreground">
                <span className="font-medium">{who as string}</span> {what as string}
              </span>
            </div>
          ))}
        </div>
        {!hasAi ? (
          <span className="text-caption text-muted-foreground">
            No AI hue in this direction — agent rows read the same as human ones.
          </span>
        ) : null}
      </div>

      {hasAction ? (
        <div className="flex flex-col gap-2">
          <span className="text-overline text-muted-foreground uppercase">Waiting on you</span>
          <div
            className="border-border flex items-center justify-between gap-3 border p-3"
            style={{ borderLeftColor: "var(--p-action)", background: "var(--p-action-subtle)" }}
          >
            <span className="text-body-sm inline-flex items-center gap-2" style={{ color: "var(--p-action)" }}>
              <SparkleIcon size={16} aria-hidden="true" />
              4 articles are drafted and need your approval
            </span>
            <span className="text-caption text-muted-foreground font-mono">2 days</span>
          </div>
        </div>
      ) : null}

      <div className="flex flex-col gap-2">
        <span className="text-overline text-muted-foreground uppercase">Chart</span>
        <div className="border-border flex h-24 items-end gap-1 border p-3">
          {[38, 52, 44, 67, 58, 81, 74, 92, 70, 88, 96, 84].map((h, i) => (
            <div
              key={i}
              className="flex-1"
              style={{
                height: `${h}%`,
                background: `var(--p-chart-${(i % 6) + 1}, var(--p-processing))`,
              }}
            />
          ))}
        </div>
        <span className="text-caption text-muted-foreground">
          {DIRECTIONS[2] && "Only direction C defines chart series; A and B fall back to one hue."}
        </span>
      </div>
    </div>
  );
}

/* ── a live contrast table, read from the DOM ──────────────────────────────── */

type Row = { label: string; got: number; need: number; kind: string };

function Contrast({ scope, dark }: { scope: React.RefObject<HTMLDivElement | null>; dark: boolean }) {
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    const el = scope.current;
    if (!el) return;
    const t = setTimeout(() => {
      const page = resolve(el, "--color-background");
      const out: Row[] = [];
      for (const tone of TONES) {
        const strong = resolve(el, `--p-${tone}`);
        const subtle = resolve(el, `--p-${tone}-subtle`);
        const ink = resolve(el, `--p-${tone}-ink`);
        out.push({ label: `${tone} ink on its tint`, got: ratio(ink, subtle), need: 4.5, kind: "text" });
        out.push({ label: `${tone} border on page`, got: ratio(strong, page), need: 3, kind: "border" });
        out.push({ label: `${tone} tint on page`, got: ratio(subtle, page), need: 1.1, kind: "surface" });
      }
      const ai = resolve(el, "--p-ai");
      if (getComputedStyle(el).getPropertyValue("--p-ai").trim()) {
        out.push({ label: "ai ink on its tint", got: ratio(ai, resolve(el, "--p-ai-subtle")), need: 4.5, kind: "text" });
      }
      const action = getComputedStyle(el).getPropertyValue("--p-action").trim();
      if (action) {
        out.push({
          label: "action ink on its tint",
          got: ratio(resolve(el, "--p-action"), resolve(el, "--p-action-subtle")),
          need: 4.5,
          kind: "text",
        });
      }
      setRows(out);
    }, 120);
    return () => clearTimeout(t);
  }, [scope, dark]);

  const failing = rows.filter((r) => r.got < r.need);

  return (
    <div className="border-border flex flex-col gap-2 border p-3">
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-label">Measured in this browser</span>
        <span className={`text-caption font-mono ${failing.length ? "text-destructive" : "text-success"}`}>
          {failing.length ? `${failing.length} failing` : `${rows.length} checks pass`}
        </span>
      </div>
      <div className="grid grid-cols-1 gap-x-6 gap-y-1 sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex items-baseline justify-between gap-2">
            <span className="text-caption text-muted-foreground truncate">{r.label}</span>
            <span
              className={`text-caption shrink-0 font-mono ${r.got < r.need ? "text-destructive" : "text-muted-foreground"}`}
            >
              {r.got.toFixed(2)} {r.got < r.need ? `< ${r.need}` : "✓"}
            </span>
          </div>
        ))}
      </div>
      <span className="text-caption text-muted-foreground">
        A tint on the page is checked at ≥1.1 only — it must be perceptible, not accessible;
        it carries no meaning on its own.
      </span>
    </div>
  );
}

function Column({ d, dark, grey }: { d: Direction; dark: boolean; grey: boolean }) {
  const ref = useRef<HTMLDivElement | null>(null);
  const vars = useMemo(() => {
    const v: Vars = { ...(dark ? d.dark : d.light) };
    v["--p-on-accent"] = dark ? "#082220" : "#f0fdfa";
    v["--p-on-danger"] = dark ? "#0a0a0a" : "#ffffff";
    return v;
  }, [d, dark]);

  return (
    <div
      ref={ref}
      style={vars as React.CSSProperties}
      className={`flex flex-col gap-4 ${grey ? "grayscale" : ""}`}
    >
      <div className="border-border flex flex-col gap-2 border-b pb-3">
        <div className="flex items-baseline gap-2">
          <span className="text-h4">{d.key}</span>
          <span className="text-label text-foreground">{d.name}</span>
        </div>
        <p className="text-body-sm text-muted-foreground">{d.thesis}</p>
        <div className="flex flex-wrap gap-1">
          {d.adds.map((a) => (
            <span key={a} className="text-caption text-muted-foreground border-input border px-1.5 py-0.5">
              {a}
            </span>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap gap-1">
        {[...TONES, "ai", "action"].map((t) => (
          <div key={t} className="flex flex-col">
            <span className="border-border size-8 border" style={{ background: `var(--p-${t}, transparent)` }} />
            <span className="border-border size-8 border border-t-0" style={{ background: `var(--p-${t}-subtle, transparent)` }} />
          </div>
        ))}
      </div>

      <Contrast scope={ref} dark={dark} />
      <Fragment hasAi={d.key !== "A"} hasAction={d.key === "C"} />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <span className="text-overline text-success uppercase">For</span>
          <ul className="text-caption text-muted-foreground flex list-disc flex-col gap-1 pl-4">
            {d.pros.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-overline text-warning uppercase">Against</span>
          <ul className="text-caption text-muted-foreground flex list-disc flex-col gap-1 pl-4">
            {d.cons.map((x) => <li key={x}>{x}</li>)}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default function ColourDirectionsPage() {
  const [dark, setDark] = useState(false);
  const [grey, setGrey] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className="mx-auto flex min-w-0 max-w-(--container-content) flex-col gap-8 p-4 sm:p-8">
        <header className="border-border flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div className="flex max-w-2xl flex-col gap-2">
            <h1 className="text-h2">Colour directions</h1>
            <p className="text-body-sm text-muted-foreground">
              Proposals. Nothing here touches the validated tokens. Structure is unchanged —
              radius 0, Geist, borders, type hierarchy, teal #00786F as the identity.
            </p>
            <p className="text-body-sm text-muted-foreground">
              <span className="text-foreground">The measured problem:</span> across the
              dashboard, neutral tokens are used <span className="font-mono">169</span> times
              and chromatic ones <span className="font-mono">21</span> — but colour reaches a
              surface exactly <span className="font-mono">once</span>. Everywhere else it is a
              1px border or 12–16px of text. The palette is not too small; it has nowhere to land.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={() => setGrey((g) => !g)}>{grey ? "Colour" : "Greyscale"}</Button>
            <Button onClick={() => setDark((d) => !d)}>{dark ? "Light" : "Dark"}</Button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {DIRECTIONS.map((d) => (
            <Column key={d.key} d={d} dark={dark} grey={grey} />
          ))}
        </div>
      </div>
    </div>
  );
}
