"use client";

import { useEffect, useState } from "react";
import { Button, Field, Select } from "@zerocorp/ui";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";

/**
 * Select option treatments — PROTOTYPE, not the shipped component.
 *
 * Reported 2026-08-31: the selected option reads as "too basic", the popup has no visible
 * edge, and the tick is not distinctive enough.
 *
 * Reading the code confirmed something worse than a styling complaint. ITEM carries a
 * `data-highlighted` rule and NO `data-selected` rule at all, so:
 *
 *   - selection is carried by a 16px glyph and nothing else
 *   - the grey band that reads as "selected" is actually the CURSOR
 *   - the louder of the two visuals belongs to the less important meaning
 *
 * And POPUP uses --border at 1.26:1 — the same WCAG 1.4.11 failure §4.4 fixed for
 * controls and §21.20 fixed for the neutral badge.
 *
 * These lists are static on purpose. A live popup can only show one state at a time; the
 * decision needs selected, cursor, both-at-once and disabled side by side.
 */

const cx = (...p: Array<string | false | undefined>) => p.filter(Boolean).join(" ");

type RowState = "plain" | "selected" | "cursor" | "both" | "disabled";

const ROWS: { label: string; state: RowState }[] = [
  { label: "Wyoming", state: "plain" },
  { label: "Delaware", state: "selected" },
  { label: "New Mexico", state: "cursor" },
  { label: "Florida", state: "plain" },
  { label: "Texas", state: "both" },
  { label: "California (not available for non-residents)", state: "disabled" },
];

/** The popup shell. Same in every treatment — --input, not --border. 3.03:1 / 3.72:1. */
const POPUP = "bg-surface-elevated border-input border shadow-floating py-1 w-full";
const ROW_BASE = "relative flex items-center gap-2 py-2 pr-3 text-body-sm";

/** A — the row IS the colour. */
function TreatmentA() {
  return (
    <div className={POPUP}>
      {ROWS.map((r) => (
        <div
          key={r.label}
          className={cx(
            ROW_BASE,
            "pl-9",
            r.state === "selected" && "bg-primary text-primary-foreground font-medium",
            r.state === "both" && "bg-primary-hover text-primary-foreground font-medium",
            r.state === "cursor" && "bg-accent text-accent-foreground",
            r.state === "disabled" && "text-muted-foreground",
            r.state === "plain" && "text-foreground",
          )}
        >
          {(r.state === "selected" || r.state === "both") && (
            <CheckIcon size={16} weight="bold" className="absolute left-3 shrink-0" />
          )}
          {r.label}
        </div>
      ))}
    </div>
  );
}

/** B — a teal bar on the edge, and a filled tick badge. Nothing fills the row. */
function TreatmentB() {
  return (
    <div className={POPUP}>
      {ROWS.map((r) => {
        const on = r.state === "selected" || r.state === "both";
        return (
          <div
            key={r.label}
            className={cx(
              ROW_BASE,
              "border border-l-2 pl-7",
              // transparent, not absent — otherwise every row shifts 2px on selection
              on ? "border-l-primary" : "border-l-transparent",
              on && "font-medium",
              (r.state === "cursor" || r.state === "both") && "bg-accent",
              r.state === "disabled" ? "text-muted-foreground" : "text-foreground",
            )}
          >
            <span
              className={cx(
                "flex size-4 shrink-0 items-center justify-center",
                on ? "bg-primary text-primary-foreground" : "bg-transparent",
              )}
            >
              {on && <CheckIcon size={12} weight="bold" />}
            </span>
            {r.label}
          </div>
        );
      })}
    </div>
  );
}

/** C — the selected row is boxed. Hierarchy from borders, §1. */
function TreatmentC() {
  return (
    <div className={POPUP}>
      <div className="px-1">
        {ROWS.map((r) => {
          const on = r.state === "selected" || r.state === "both";
          return (
            <div
              key={r.label}
              className={cx(
                ROW_BASE,
                "border pl-8",
                // NOT text-primary. Teal text measures 3.18:1 on --surface-elevated in
                // dark and made the selected row the DIMMEST text in the list under
                // greyscale. The box and the badge carry the teal; a border is a
                // graphical object at a 3:1 threshold, which 3.18 clears. §24.15.
                on ? "border-primary" : "border-transparent",
                on && "font-medium",
                (r.state === "cursor" || r.state === "both") && "bg-accent",
                r.state === "disabled" ? "text-muted-foreground" : "text-foreground",
              )}
            >
              {on && (
                <span className="bg-primary text-primary-foreground absolute left-2 flex size-4 items-center justify-center">
                  <CheckIcon size={12} weight="bold" />
                </span>
              )}
              {r.label}
            </div>
          );
        })}
      </div>
    </div>
  );
}

const TREATMENTS = [
  { key: "A", name: "A — filled row", note: "the row IS the colour. Zero ambiguity, loudest.", el: <TreatmentA /> },
  { key: "B", name: "B — edge bar + tick badge", note: "teal bar on the edge, filled tick. The list stays light.", el: <TreatmentB /> },
  { key: "C", name: "C — boxed row  ✅ CHOSEN", note: "outlined row + filled tick badge. Hierarchy from borders, §1. Shipped 2026-08-31.", el: <TreatmentC /> },
];

export default function SelectTreatmentsPage() {
  const [dark, setDark] = useState(false);
  const [grey, setGrey] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div className={cx("mx-auto flex max-w-(--container-content) flex-col gap-10 p-4 sm:p-8", grey && "grayscale")}>
        <header className="border-border flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-h2">Select — option treatments</h1>
            <p className="text-body-sm text-muted-foreground">
              C was chosen on 2026-08-31 and is now the shipped component. A and B are kept
            as the record of the comparison.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={() => setGrey((g) => !g)}>{grey ? "Colour" : "Greyscale"}</Button>
            <Button onClick={() => setDark((d) => !d)}>{dark ? "Light" : "Dark"}</Button>
          </div>
        </header>

        <section className="border-destructive flex flex-col gap-2 border p-4">
          <h2 className="text-h4">What is actually wrong today</h2>
          <ul className="text-body-sm text-muted-foreground flex list-disc flex-col gap-1 pl-5">
            <li>
              <span className="text-foreground">There is no `data-selected` rule at all.</span>{" "}
              Selection is carried by a 16px tick and nothing else.
            </li>
            <li>
              <span className="text-foreground">The grey band is the CURSOR, not the selection.</span>{" "}
              The louder visual belongs to the less important meaning.
            </li>
            <li>
              <span className="text-foreground">The popup edge is --border at 1.26:1.</span> A
              floating layer boundary is a meaningful graphical object — WCAG 1.4.11 asks 3:1.
            </li>
          </ul>
          <div className="mt-2 flex max-w-sm flex-col gap-1">
            <span className="text-overline text-muted-foreground uppercase">Live, as shipped</span>
            <Field label="State of formation">
              <Select
                defaultValue="de"
                options={[
                  { value: "wy", label: "Wyoming" },
                  { value: "de", label: "Delaware" },
                  { value: "nm", label: "New Mexico" },
                ]}
              />
            </Field>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-h4">Three treatments</h2>
            <p className="text-body-sm text-muted-foreground">
              Every state at once: plain · <span className="text-foreground">Delaware = selected</span> ·{" "}
              <span className="text-foreground">New Mexico = cursor</span> ·{" "}
              <span className="text-foreground">Texas = selected AND cursor</span> · California = disabled.
              The fourth is the one a live popup never lets you check.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {TREATMENTS.map((t) => (
              <div key={t.key} className="flex flex-col gap-3">
                <div className="flex flex-col gap-0.5">
                  <span className="text-label text-foreground">{t.name}</span>
                  <span className="text-caption text-muted-foreground">{t.note}</span>
                </div>
                {t.el}
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-h4">Without colour</h2>
            <p className="text-body-sm text-muted-foreground">
              §14 — colour is never the only carrier. Does selection still read?
            </p>
          </div>
          <div className="grid grid-cols-1 gap-6 grayscale lg:grid-cols-3">
            {TREATMENTS.map((t) => (
              <div key={t.key} className="flex flex-col gap-2">
                <span className="text-label">{t.name}</span>
                {t.el}
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
