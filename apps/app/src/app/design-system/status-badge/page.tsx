"use client";

import { useEffect, useState } from "react";
import { StatusBadge, type StatusTone, type StatusEmphasis } from "@zerocorp/ui";

/**
 * StatusBadge — visual review surface.
 *
 * Renders the real component from @zerocorp/ui, not a copy. The treatment was chosen on
 * 2026-08-31: A outlined as the default, C solid as the prominent variant, one component
 * with two emphases. The third candidate (bare icon + label) was not built.
 *
 * What this page has to prove before the registry entry: light + dark, greyscale, a
 * dense table, a detail header, 375px, and the six statuses in French — every badge on
 * one line at both widths. docs/DESIGN_SYSTEM.md §19.
 */

const cx = (...p: Array<string | false | undefined>) => p.filter(Boolean).join(" ");

const TONES: StatusTone[] = ["success", "processing", "warning", "danger", "info", "neutral", "ai"];

/** The same six statuses in French — the longest is 44% longer than its English original. */
const TONE_LABEL_FR: Record<StatusTone, string> = {
  success: "Active",
  processing: "Dépôt en cours",
  warning: "Renouvellement sous 14 j",
  danger: "Rejetée",
  info: "EIN enregistré",
  neutral: "Brouillon",
  ai: "Rédigé par l'agent",
};

const TONE_LABEL: Record<StatusTone, string> = {
  success: "Active",
  processing: "Filing",
  warning: "Renews in 14 days",
  danger: "Rejected",
  info: "EIN on file",
  neutral: "Draft",
  ai: "Drafted by an agent",
};

const EMPHASES: { key: StatusEmphasis; name: string; note: string }[] = [
  { key: "default", name: "default — outlined", note: "the everyday badge" },
  { key: "prominent", name: "prominent — solid", note: "when the status is the point" },
];

type Row = { name: string; state: string; formed: string; tone: StatusTone; status: string };

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

function DenseTable({ emphasis }: { emphasis: StatusEmphasis }) {
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
              <td className="text-body-sm text-foreground px-3 py-2">{r.name}</td>
              <td className="text-body-sm text-muted-foreground px-3 py-2">{r.state}</td>
              <td className="text-body-sm text-muted-foreground px-3 py-2 font-mono">{r.formed}</td>
              <td className="px-3 py-2">
                <StatusBadge tone={r.tone} emphasis={emphasis}>
                  {r.status}
                </StatusBadge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-h4">{title}</h2>
        <p className="text-body-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  );
}

export default function StatusBadgeReviewPage() {
  const [dark, setDark] = useState(false);
  const [grey, setGrey] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div
        className={cx(
          "mx-auto flex max-w-(--container-content) flex-col gap-10 p-4 sm:p-8",
          grey && "grayscale",
        )}
      >
        <header className="border-border flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-h2">StatusBadge</h1>
            <p className="text-body-sm text-muted-foreground">
              One component, two emphases. Six tones, one icon each. Colour is never alone.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setGrey((g) => !g)}
              className="border-input hover:border-input-hover text-label focus-visible:outline-ring h-10 border px-4 transition-[color,background-color,border-color] focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {grey ? "Colour" : "Greyscale"}
            </button>
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="border-input hover:border-input-hover text-label focus-visible:outline-ring h-10 border px-4 transition-[color,background-color,border-color] focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {dark ? "Light" : "Dark"}
            </button>
          </div>
        </header>

        <Section
          title="The six tones"
          note="Same labels, same icons. Only the container changes between the two emphases."
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {EMPHASES.map(({ key, name, note }) => (
              <div key={key} className="border-border flex flex-col gap-4 border p-4">
                <div className="flex flex-col gap-1">
                  <span className="text-label text-foreground">{name}</span>
                  <span className="text-caption text-muted-foreground">{note}</span>
                </div>
                <div className="flex flex-col items-start gap-3">
                  {TONES.map((tone) => (
                    <StatusBadge key={tone} tone={tone} emphasis={key}>
                      {TONE_LABEL[tone]}
                    </StatusBadge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="In a dense table"
          note="Eight rows, a badge on each. The default has to repeat without taking the table over."
        >
          <div className="flex flex-col gap-6">
            {EMPHASES.map(({ key, name }) => (
              <div key={key} className="flex flex-col gap-2">
                <span className="text-label text-muted-foreground">{name}</span>
                <DenseTable emphasis={key} />
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="In a detail view"
          note="One record. Here the badge has to hold its own beside an h3 — the opposite pressure from the table."
        >
          <div className="border-border flex flex-col gap-4 border p-4 sm:p-6">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-h3 text-foreground">Northwind Studio LLC</h3>
              <StatusBadge tone="success" emphasis="prominent">
                Active
              </StatusBadge>
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
            <div className="border-border flex flex-col gap-3 border-t pt-4">
              {[
                ["Registered agent", "success", "Paid through 2027"],
                ["Annual report", "warning", "Renews in 14 days"],
                ["Identity", "processing", "In review"],
              ].map(([label, tone, status]) => (
                <div key={label} className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <span className="text-caption text-muted-foreground w-36">{label}</span>
                  <StatusBadge tone={tone as StatusTone}>{status}</StatusBadge>
                </div>
              ))}
            </div>
          </div>
        </Section>

        <Section
          title="i18n — the same six statuses in French"
          note="A badge is always one line. French runs ~25% longer, so the badge widens; it never wraps, never truncates, and never gets a fixed width."
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {EMPHASES.map(({ key, name }) => (
              <div key={key} className="border-border flex flex-col gap-4 border p-4">
                <span className="text-label text-foreground">{name}</span>
                <div className="flex flex-col items-start gap-3">
                  {TONES.map((tone) => (
                    <StatusBadge key={tone} tone={tone} emphasis={key}>
                      {TONE_LABEL_FR[tone]}
                    </StatusBadge>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <p className="text-body-sm text-muted-foreground">
            A label long enough to need a second line is not a status — it is a message, and
            it belongs in a description or a row of its own. The longest real one here,
            &ldquo;Renouvellement sous 14 j&rdquo;, is 44% longer than its English original and
            still one line.
          </p>
        </Section>

        <Section
          title="Without colour"
          note="Always visible, never a toggle you can forget. The five status colours sit between 4.83:1 and 5.36:1 — an even set collapses to one grey. Only the glyph separates the tones."
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            {EMPHASES.map(({ key, name }) => (
              <div key={key} className="border-border flex flex-col gap-4 border p-4 grayscale">
                <span className="text-label text-foreground">{name}</span>
                <div className="flex flex-col items-start gap-3">
                  {TONES.map((tone) => (
                    <StatusBadge key={tone} tone={tone} emphasis={key}>
                      {TONE_LABEL[tone]}
                    </StatusBadge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
