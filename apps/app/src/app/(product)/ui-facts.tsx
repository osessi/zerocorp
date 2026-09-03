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

const TONE: Record<FactTone, { edge: string; ink: string; wash: string }> = {
  processing: { edge: "border-processing", ink: "text-processing-ink", wash: "bg-processing-wash" },
  ai: { edge: "border-ai", ink: "text-ai-ink", wash: "bg-ai-wash" },
  info: { edge: "border-info", ink: "text-info-ink", wash: "bg-info-wash" },
  success: { edge: "border-success", ink: "text-success-ink", wash: "bg-success-wash" },
  warning: { edge: "border-warning", ink: "text-warning-ink", wash: "bg-warning-wash" },
  neutral: { edge: "border-border", ink: "text-foreground", wash: "bg-surface" },
};

export function BigFact({
  label,
  value,
  hint,
  tone = "neutral",
  mono,
}: {
  label: string;
  value: ReactNode;
  hint?: string;
  tone?: FactTone;
  mono?: boolean;
}) {
  const t = TONE[tone];
  return (
    <div className={cx("flex flex-col gap-1.5 border-t-2 p-4", t.edge, t.wash)}>
      <span className="text-overline text-muted-foreground">{label}</span>
      <span className={cx("text-h3 leading-tight", mono && "font-mono tabular-nums", t.ink)}>{value}</span>
      {hint ? <span className="text-caption text-muted-foreground">{hint}</span> : null}
    </div>
  );
}

/** Facts side by side, one hairline between them. */
export function BigFactGrid({ children }: { children: ReactNode }) {
  return <div className="border-border bg-border grid grid-cols-1 gap-px border sm:grid-cols-2 lg:grid-cols-4">{children}</div>;
}
