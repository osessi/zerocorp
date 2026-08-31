"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  CheckCircleIcon,
  WarningIcon,
  XCircleIcon,
  InfoIcon,
  CircleNotchIcon,
  MinusCircleIcon,
} from "@phosphor-icons/react/dist/ssr";

/**
 * StatusBadge — variant review surface. NOTHING here is validated.
 *
 * Three treatments of the same six tones, so the choice is made by looking rather than
 * by arguing. None of this lives in @zerocorp/ui and none of it is in the registry
 * (§19). It exists to be judged and then thrown away.
 *
 * The comparison the review has to settle:
 *   greyscale legibility · distinction without colour · Lyra / radius 0 / teal ·
 *   light + dark · a dense table · a detail header · all six ZeroCorp tones.
 *
 * docs/DESIGN_SYSTEM.md §4.3, §17, §21.0, §21.19 (open item 15).
 */

const cx = (...p: Array<string | false | undefined>) => p.filter(Boolean).join(" ");

/* ── The six tones ──────────────────────────────────────────────────────────
   §17 names six; §4.3 gives colours to five. `neutral` has none and borrows the
   muted pair — that gap is one of the things this review has to notice.         */
type Tone = "success" | "processing" | "warning" | "danger" | "info" | "neutral";

const TONES: Tone[] = ["success", "processing", "warning", "danger", "info", "neutral"];

/**
 * One icon per tone, and they must differ in SHAPE, not only in colour.
 *
 * This is the whole point of §14: in greyscale, at 12px, in a printed screenshot or for
 * a colour-blind reader, the glyph is the only thing left. A ring, a triangle, a cross,
 * an "i", an arc and a bar are six silhouettes nobody confuses.
 */
const ICON: Record<Tone, typeof CheckCircleIcon> = {
  success: CheckCircleIcon,
  processing: CircleNotchIcon,
  warning: WarningIcon,
  danger: XCircleIcon,
  info: InfoIcon,
  neutral: MinusCircleIcon,
};

const TONE_INK: Record<Tone, string> = {
  success: "text-success",
  processing: "text-processing",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
  neutral: "text-muted-foreground",
};

const TONE_OUTLINE: Record<Tone, string> = {
  success: "text-success border-success",
  processing: "text-processing border-processing",
  warning: "text-warning border-warning",
  danger: "text-destructive border-destructive",
  info: "text-info border-info",
  neutral: "text-muted-foreground border-border",
};

/**
 * Solid fill needs a light ink that does NOT flip with the theme: `--background` would
 * become #0A0A0A in dark and drop to 3.94:1 on --success. `--primary-foreground` is the
 * only near-white token that is theme-stable, so treatment C borrows it.
 *
 * Borrowing it is a real cost, not a detail: C only works if we add a token that does
 * not exist yet. Recorded so the review judges C with that attached.
 */
const TONE_SOLID: Record<Tone, string> = {
  success: "bg-success border-success text-primary-foreground",
  processing: "bg-processing border-processing text-primary-foreground",
  warning: "bg-warning border-warning text-primary-foreground",
  danger: "bg-destructive border-destructive text-primary-foreground",
  info: "bg-info border-info text-primary-foreground",
  neutral: "bg-muted-foreground border-muted-foreground text-primary-foreground",
};

/* ── A · Outlined chip ──────────────────────────────────────────────────────
   The §21.19 proposal, with a real icon instead of a square marker. Medium
   emphasis: a container, but the page shows through it.                        */
function BadgeA({ tone, children }: { tone: Tone; children: ReactNode }) {
  const Glyph = ICON[tone];
  return (
    <span
      className={cx(
        "text-caption inline-flex items-center gap-1.5 border px-2 py-0.5 whitespace-nowrap",
        TONE_OUTLINE[tone],
      )}
    >
      <Glyph size={16} weight="regular" aria-hidden="true" />
      {children}
    </span>
  );
}

/* ── B · Bare status line ───────────────────────────────────────────────────
   No container at all. The icon carries the tone, the label stays at full
   --foreground contrast. Lowest emphasis, highest label readability.           */
function BadgeB({ tone, children }: { tone: Tone; children: ReactNode }) {
  const Glyph = ICON[tone];
  return (
    <span className="text-caption text-foreground inline-flex items-center gap-1.5 whitespace-nowrap">
      <span className={cx("inline-flex shrink-0", TONE_INK[tone])}>
        <Glyph size={16} weight="fill" aria-hidden="true" />
      </span>
      {children}
    </span>
  );
}

/* ── C · Solid fill ─────────────────────────────────────────────────────────
   The container is the colour. Highest emphasis — and the loudest thing on any
   screen that shows more than three of them.                                   */
function BadgeC({ tone, children }: { tone: Tone; children: ReactNode }) {
  const Glyph = ICON[tone];
  return (
    <span
      className={cx(
        "text-caption inline-flex items-center gap-1.5 border px-2 py-0.5 whitespace-nowrap",
        TONE_SOLID[tone],
      )}
    >
      <Glyph size={16} weight="regular" aria-hidden="true" />
      {children}
    </span>
  );
}

const TREATMENTS = [
  { key: "A", name: "Outlined chip", Badge: BadgeA, note: "container, page shows through" },
  { key: "B", name: "Bare status line", Badge: BadgeB, note: "no container, label at full contrast" },
  { key: "C", name: "Solid fill", Badge: BadgeC, note: "container is the colour" },
] as const;

/* ── ZeroCorp content ───────────────────────────────────────────────────────
   Invented, but every label is one a real ZeroCorp surface would print.        */
const TONE_LABEL: Record<Tone, string> = {
  success: "Active",
  processing: "Filing",
  warning: "Renews in 14 days",
  danger: "Rejected",
  info: "EIN on file",
  neutral: "Draft",
};

type Row = { name: string; state: string; formed: string; tone: Tone; status: string };

const ROWS: Row[] = [
  { name: "Northwind Studio LLC", state: "Wyoming", formed: "Mar 4, 2026", tone: "success", status: "Active" },
  { name: "Bluepine Labs LLC", state: "Delaware", formed: "Aug 12, 2026", tone: "processing", status: "Filing" },
  { name: "Auric Freight LLC", state: "Wyoming", formed: "Jan 22, 2025", tone: "warning", status: "Renews in 14 days" },
  { name: "Vela Commerce LLC", state: "New Mexico", formed: "Aug 28, 2026", tone: "danger", status: "Rejected" },
  { name: "Tenpoint Media LLC", state: "Delaware", formed: "Jul 9, 2026", tone: "processing", status: "EIN pending" },
  { name: "Harbor & Co LLC", state: "Wyoming", formed: "—", tone: "neutral", status: "Draft" },
  { name: "Cobalt Tools LLC", state: "Wyoming", formed: "Nov 30, 2025", tone: "success", status: "Active" },
  { name: "Fernwood Goods LLC", state: "New Mexico", formed: "Feb 2, 2026", tone: "warning", status: "Payment past due" },
];

function DenseTable({ Badge }: { Badge: (p: { tone: Tone; children: ReactNode }) => ReactNode }) {
  return (
    <div className="border-border overflow-x-auto border">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-border bg-muted border-b">
            {["Business", "State", "Formed", "Status"].map((h) => (
              <th
                key={h}
                className="text-overline text-muted-foreground px-3 py-2 text-left font-semibold uppercase"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {ROWS.map((r) => (
            <tr key={r.name} className="border-border hover:bg-accent border-b last:border-b-0">
              <td className="text-body-sm text-foreground px-3 py-2 whitespace-nowrap">{r.name}</td>
              <td className="text-body-sm text-muted-foreground px-3 py-2 whitespace-nowrap">{r.state}</td>
              <td className="text-body-sm text-muted-foreground px-3 py-2 font-mono whitespace-nowrap">
                {r.formed}
              </td>
              <td className="px-3 py-2">
                <Badge tone={r.tone}>{r.status}</Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailHeader({ Badge }: { Badge: (p: { tone: Tone; children: ReactNode }) => ReactNode }) {
  return (
    <div className="border-border flex flex-col gap-4 border p-6">
      <div className="flex flex-wrap items-center gap-3">
        <h3 className="text-h3 text-foreground">Northwind Studio LLC</h3>
        <Badge tone="success">Active</Badge>
      </div>
      <dl className="grid grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-3">
        {[
          ["State", "Wyoming"],
          ["Formed", "Mar 4, 2026"],
          ["EIN", "88-4192077"],
        ].map(([k, v]) => (
          <div key={k} className="flex flex-col gap-1">
            <dt className="text-overline text-muted-foreground uppercase">{k}</dt>
            <dd className="text-body-sm text-foreground font-mono">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="border-border flex flex-wrap items-center gap-x-6 gap-y-2 border-t pt-4">
        <span className="text-caption text-muted-foreground">Registered agent</span>
        <Badge tone="success">Paid through 2027</Badge>
        <span className="text-caption text-muted-foreground">Annual report</span>
        <Badge tone="warning">Renews in 14 days</Badge>
        <span className="text-caption text-muted-foreground">Identity</span>
        <Badge tone="processing">In review</Badge>
      </div>
    </div>
  );
}

export default function StatusBadgeVariantsPage() {
  const [dark, setDark] = useState(false);
  const [grey, setGrey] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className={cx("mx-auto flex max-w-(--container-content) flex-col gap-10 p-8", grey && "grayscale")}>
        <header className="border-border flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-h2">StatusBadge — three treatments</h1>
            <p className="text-body-sm text-muted-foreground">
              Nothing here is validated. Open item 15 · §21.19 calls the current outlined badge
              &ldquo;an interpretation, not an observation&rdquo;.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setGrey((g) => !g)}
              className="border-input hover:border-input-hover text-label focus-visible:outline-ring h-10 border px-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {grey ? "Colour" : "Greyscale"}
            </button>
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="border-input hover:border-input-hover text-label focus-visible:outline-ring h-10 border px-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {dark ? "Light" : "Dark"}
            </button>
          </div>
        </header>

        {/* 1 — the six tones, side by side */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-h4">The six tones</h2>
            <p className="text-body-sm text-muted-foreground">
              Same tones, same labels, same icons. Only the container changes.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {TREATMENTS.map(({ key, name, Badge, note }) => (
              <div key={key} className="border-border flex flex-col gap-4 border p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-label text-foreground">
                    {key} · {name}
                  </span>
                  <span className="text-caption text-muted-foreground">{note}</span>
                </div>
                <div className="flex flex-col items-start gap-3">
                  {TONES.map((tone) => (
                    <Badge key={tone} tone={tone}>
                      {TONE_LABEL[tone]}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* 2 — a dense table, where a badge appears on every row */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-h4">In a dense table</h2>
            <p className="text-body-sm text-muted-foreground">
              Eight rows, a badge on every one — the case that decides it. A treatment that
              reads well alone can shout when it repeats.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            {TREATMENTS.map(({ key, name, Badge }) => (
              <div key={key} className="flex flex-col gap-2">
                <span className="text-label text-muted-foreground">
                  {key} · {name}
                </span>
                <DenseTable Badge={Badge} />
              </div>
            ))}
          </div>
        </section>

        {/* 3 — a detail view, where a badge appears once and must carry weight */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-h4">In a detail view</h2>
            <p className="text-body-sm text-muted-foreground">
              One record, a few badges. Here the badge has to hold its own beside an h3 —
              the opposite pressure from the table.
            </p>
          </div>
          <div className="flex flex-col gap-6">
            {TREATMENTS.map(({ key, name, Badge }) => (
              <div key={key} className="flex flex-col gap-2">
                <span className="text-label text-muted-foreground">
                  {key} · {name}
                </span>
                <DetailHeader Badge={Badge} />
              </div>
            ))}
          </div>
        </section>

        {/* 4 — the greyscale test, always visible so it is never skipped */}
        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-h4">Without colour</h2>
            <p className="text-body-sm text-muted-foreground">
              The five status colours were tuned to sit between 4.83:1 and 5.36:1 — a
              deliberately even set (§4.3). Even contrast means they collapse to nearly the
              same grey. Whatever separates the tones here is what a colour-blind reader gets.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {TREATMENTS.map(({ key, name, Badge }) => (
              <div key={key} className="border-border flex flex-col gap-4 border p-4 grayscale">
                <span className="text-label text-foreground">
                  {key} · {name}
                </span>
                <div className="flex flex-col items-start gap-3">
                  {TONES.map((tone) => (
                    <Badge key={tone} tone={tone}>
                      {TONE_LABEL[tone]}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
