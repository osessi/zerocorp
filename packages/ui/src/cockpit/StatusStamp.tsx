import { cx } from "../cx";

/**
 * StatusStamp — the milestone treatment.
 *
 * Four milestones only: FILED, FORMED, EIN ISSUED, LIVE. These are the moments a founder
 * screenshots and sends to somebody, and a 20px tinted chip is not what that moment
 * deserves. Everything else in the product is a `StatusBadge`.
 *
 * §17 has component tiers and §21.20 gives StatusBadge two emphases, neither of which is a
 * milestone, so this is a third tier rather than a fourth variant of an existing one.
 *
 * **One per screen.** Documented here, flagged in review, deliberately NOT enforced at
 * runtime: a component that throws because a designer put two on a page is a component
 * that breaks production over a layout opinion.
 *
 * The rotation is the only intentionally imperfect thing in the system. It is a rubber
 * stamp, and a rubber stamp applied by a person is never square. It comes from a token so
 * the angle is one decision in one place, not a value someone tunes per screen.
 */
const MILESTONES = {
  filed: { label: "Filed", tone: "info" },
  formed: { label: "Formed", tone: "success" },
  ein_issued: { label: "EIN Issued", tone: "success" },
  live: { label: "Live", tone: "success" },
} as const;

export type Milestone = keyof typeof MILESTONES;

const STAMP: Record<(typeof MILESTONES)[Milestone]["tone"], string> = {
  info: "border-info text-info-ink",
  success: "border-success text-success-ink",
};

export function StatusStamp({
  milestone,
  date,
  className,
}: {
  milestone: Milestone;
  /** Already formatted. This component does not know the viewer's locale. */
  date?: string;
  className?: string;
}) {
  const { label, tone } = MILESTONES[milestone];

  return (
    <span
      className={cx(
        // Double border: the outer ring is the stamp's edge, the inner one its ink well.
        "rounded-sm inline-flex flex-col items-center gap-0.5 border-2 px-4 py-2 outline-2 outline-offset-2",
        "outline-current/25",
        STAMP[tone],
        className,
      )}
      style={{ rotate: "var(--stamp-rotation)" }}
    >
      <span className="text-body-sm font-mono font-semibold tracking-[0.18em] uppercase">{label}</span>
      {date ? <span className="text-caption font-mono tracking-widest opacity-70">{date}</span> : null}
    </span>
  );
}
