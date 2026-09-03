import type { ReactNode } from "react";
import { cx } from "@zerocorp/ui";

/**
 * A fact that is actually worth reading.
 *
 * The previous version was a label in grey and a value in grey, four across, and the
 * jurisdiction of a company being formed had exactly the same weight as everything
 * around it. Nobody looked at any of it.
 *
 * Now each field carries its own tone: the value is large and inked, the label is a
 * small overline above it, and the cell has a tinted edge in the field's own colour. A
 * founder scanning "Your formation" should be able to find the jurisdiction without
 * reading the labels.
 *
 * The tone is chosen per FIELD by the screen, not per value: jurisdiction is always
 * teal, structure always violet. A colour that changes with the data is a status; this
 * is a category.
 */
export type FactTone = "processing" | "ai" | "info" | "success" | "warning" | "neutral";

/**
 * A FULL border, on all four sides.
 *
 * The first version put a 2px coloured bar on the top edge only. That is the same shape
 * as the left bar §21.27 bans, rotated ninety degrees, and it was rejected for the third
 * time. A border is on every side or on none — there is now a CI rule so this cannot come
 * back a fourth.
 */
const TONE: Record<FactTone, { edge: string; ink: string; wash: string }> = {
  processing: { edge: "border-processing", ink: "text-processing-ink", wash: "bg-processing-wash" },
  ai: { edge: "border-ai", ink: "text-ai-ink", wash: "bg-ai-wash" },
  info: { edge: "border-info", ink: "text-info-ink", wash: "bg-info-wash" },
  success: { edge: "border-success", ink: "text-success-ink", wash: "bg-success-wash" },
  warning: { edge: "border-warning", ink: "text-warning-ink", wash: "bg-warning-wash" },
  neutral: { edge: "border-border", ink: "text-foreground", wash: "bg-surface" },
};

/**
 * A label and a value. Nothing else.
 *
 * There was a third line under every value explaining what the field meant — "Where the
 * entity is registered" under a jurisdiction, "What you will own" under a structure. A
 * founder who is forming a company knows what a jurisdiction is, and a caption that
 * restates its own label is filler that makes the card longer and says nothing.
 */
export function BigFact({
  label,
  value,
  tone = "neutral",
  mono,
}: {
  label: string;
  value: ReactNode;
  tone?: FactTone;
  mono?: boolean;
}) {
  const t = TONE[tone];
  return (
    <div className={cx("flex flex-col gap-2 border p-5", t.edge, t.wash)}>
      <span className="text-overline text-muted-foreground">{label}</span>
      <span className={cx("text-h3 leading-tight", mono && "font-mono tabular-nums", t.ink)}>{value}</span>
    </div>
  );
}

/**
 * Facts side by side, SEPARATED.
 *
 * They were glued into one bordered grid with 1px seams, which reads as a table of four
 * cells rather than four facts. Same correction as the KPI cards: each is its own object
 * and the gap is what says so.
 */
export function BigFactGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
