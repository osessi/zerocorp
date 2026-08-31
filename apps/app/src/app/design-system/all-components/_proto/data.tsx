"use client";

import {
  ArrowUpIcon,
  BuildingsIcon,
  CaretUpDownIcon,
  DotsThreeIcon,
  FileTextIcon,
  PulseIcon,
  RobotIcon,
  UserIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button, Checkbox, IconButton, StatusBadge, type StatusTone } from "@zerocorp/ui";
import { Demo, PanelHeader, cx } from "./shell";
import { TONE_GLYPH, TONE_INK, type Tone } from "./feedback";

/* ── Card ─────────────────────────────────────────────────────────────────── */

/**
 * A bordered container. That is the whole component — §1 and §8: hierarchy comes from
 * borders, spacing and typography, and there is exactly one elevation.
 *
 * Deliberately not a Card component in packages/ui yet. A `<div className="border-border
 * border p-4">` is not an abstraction worth a file, and shipping a Card invites
 * CardHeader / CardTitle / CardFooter — five files to reproduce a border.
 */
export function CardDemo() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div className="border-border flex flex-col gap-3 border p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-col gap-1">
            <span className="text-label text-foreground">Northwind Studio LLC</span>
            <span className="text-caption text-muted-foreground">Wyoming · formed 4 Mar 2026</span>
          </div>
          <StatusBadge tone="success">Active</StatusBadge>
        </div>
        <dl className="grid grid-cols-2 gap-3">
          {[["EIN", "88-4192077"], ["Agent", "Paid to 2027"]].map(([k, v]) => (
            <div key={k} className="flex flex-col gap-0.5">
              <dt className="text-overline text-muted-foreground uppercase">{k}</dt>
              <dd className="text-body-sm text-foreground font-mono">{v}</dd>
            </div>
          ))}
        </dl>
      </div>
      <div className="border-border flex flex-col gap-2 border p-4">
        <span className="text-overline text-muted-foreground uppercase">Metric</span>
        <span className="text-display-l text-foreground font-mono">1 240</span>
        <span className="text-caption text-success inline-flex items-center gap-1">
          <ArrowUpIcon size={14} aria-hidden="true" /> 18% vs last month
        </span>
      </div>
      <div className="border-border border border-dashed p-4">
        <span className="text-body-sm text-muted-foreground">
          Dashed border marks a placeholder slot, never a disabled card.
        </span>
      </div>
    </div>
  );
}

/* ── Data table ───────────────────────────────────────────────────────────── */

type Business = {
  id: string;
  name: string;
  state: string;
  formed: string;
  tone: StatusTone;
  status: string;
  credits: number;
};

const BUSINESSES: Business[] = [
  { id: "1", name: "Northwind Studio LLC", state: "Wyoming", formed: "Mar 4, 2026", tone: "success", status: "Active", credits: 1240 },
  { id: "2", name: "Bluepine Labs LLC", state: "Delaware", formed: "Aug 12, 2026", tone: "processing", status: "Filing", credits: 310 },
  { id: "3", name: "Auric Freight LLC", state: "Wyoming", formed: "Jan 22, 2025", tone: "warning", status: "Renews in 14 days", credits: 4820 },
  { id: "4", name: "Vela Commerce LLC", state: "New Mexico", formed: "Aug 28, 2026", tone: "danger", status: "Rejected", credits: 0 },
  { id: "5", name: "Harbor & Co LLC", state: "Wyoming", formed: "—", tone: "neutral", status: "Draft", credits: 0 },
];

/**
 * Hand-rolled, and deliberately so for this pass. §24.12 leaves row height, column
 * widths, hover and click target unresolved, so anything here is a proposal.
 *
 * Two things are settled regardless of that decision and are shown:
 *   every number is Geist Mono — §5, any number a user compares
 *   the table scrolls horizontally rather than truncating a name
 */
export function DataTableDemo() {
  return (
    // min-w-0 is not optional, again. A flex child defaults to min-width:auto and refuses
    // to shrink below its content, so the <table> grew the ROOT scroll width even though
    // its wrapper was correctly clipping at 328px. Measured at 375px: the page scrolled
    // sideways by 345px. Same defect Select.tsx documents for its trigger.
    <div className="flex min-w-0 flex-col gap-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-body-sm text-muted-foreground">
          <span className="text-foreground font-mono">2</span> selected
        </span>
        <div className="flex gap-2">
          <Button size="sm" variant="secondary">Export</Button>
          <Button size="sm" variant="danger">Dissolve</Button>
        </div>
      </div>
      {/*
        contain-paint is load-bearing, not a micro-optimisation.

        A wide <table> inside overflow-x-auto still grew the ROOT scroll width: measured
        at 375px, the whole page scrolled sideways by 345px and unrelated content moved
        with it, while every ancestor correctly reported scrollWidth === clientWidth and
        the wrapper was clipping at 326px. The table's layout overflow was propagating
        past the scroll container to the initial containing block.

        Isolated by elimination — hiding this one section alone returned the page to 360.
        Of the fixes tried, only `contain: paint` and `table-layout: fixed` worked, and
        table-layout:fixed changes how columns size. contain: paint changes nothing
        visible and leaves the wrapper's own horizontal scroll intact.
      */}
      <div className="border-border w-full max-w-full min-w-0 contain-paint overflow-x-auto border">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-border bg-muted border-b">
              <th className="w-10 px-3 py-2">
                {/*
                  Bare Checkbox, no Choice. A selection column has no visible label, and
                  Choice requires one — useFieldState returns a neutral state when
                  unwrapped, so this works, but it is a gap worth naming: Choice has no
                  visually-hidden-label mode.
                */}
                <Checkbox aria-label="Select all businesses" />
              </th>
              {["Business", "State", "Formed", "Status", "Credits"].map((h) => (
                <th key={h} className="text-overline text-muted-foreground px-3 py-2 text-left font-semibold uppercase">
                  <button
                    type="button"
                    className="hover:text-foreground focus-visible:outline-ring inline-flex items-center gap-1 transition-[color] duration-normal ease-out focus-visible:outline-2 focus-visible:outline-offset-2"
                  >
                    {h}
                    <CaretUpDownIcon size={12} aria-hidden="true" />
                  </button>
                </th>
              ))}
              <th className="w-12 px-3 py-2">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {BUSINESSES.map((b, i) => (
              <tr
                key={b.id}
                className={cx(
                  "border-border hover:bg-accent border-b last:border-b-0",
                  "transition-[background-color] duration-fast ease-out",
                  i < 2 && "bg-accent",
                )}
              >
                <td className="px-3 py-2">
                  <Checkbox defaultChecked={i < 2} aria-label={`Select ${b.name}`} />
                </td>
                <td className="text-body-sm text-foreground px-3 py-2 whitespace-nowrap">{b.name}</td>
                <td className="text-body-sm text-muted-foreground px-3 py-2">{b.state}</td>
                <td className="text-body-sm text-muted-foreground px-3 py-2 font-mono whitespace-nowrap">{b.formed}</td>
                <td className="px-3 py-2">
                  <StatusBadge tone={b.tone}>{b.status}</StatusBadge>
                </td>
                <td className="text-body-sm text-foreground px-3 py-2 text-right font-mono">
                  {b.credits.toLocaleString("en-US")}
                </td>
                <td className="px-3 py-2">
                  <IconButton label={`Actions for ${b.name}`} icon={DotsThreeIcon} size="sm" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ── Timeline ─────────────────────────────────────────────────────────────── */

/**
 * Formation progress, workflow history, onboarding — §17.
 *
 * Same rail as the Stepper: a 1px border, a bordered marker, and a glyph whose SHAPE
 * differs per tone. The Stepper numbers its steps because they are a sequence you
 * complete; the Timeline timestamps them because they are things that happened.
 */
const EVENTS: { at: string; title: string; tone: Tone; by: string; detail?: string }[] = [
  { at: "Mar 4, 14:02", title: "Certificate of formation issued", tone: "success", by: "Wyoming SOS" },
  { at: "Mar 2, 09:41", title: "Filing submitted", tone: "processing", by: "ZeroCorp", detail: "Reference WY-2026-88214" },
  { at: "Mar 1, 18:20", title: "Identity verified", tone: "success", by: "Olivier K." },
  { at: "Feb 28, 11:05", title: "Address rejected", tone: "danger", by: "Wyoming SOS", detail: "PO box not accepted" },
  { at: "Feb 27, 16:33", title: "Business created", tone: "neutral", by: "Olivier K." },
];

export function TimelineDemo() {
  return (
    <Demo>
      <ol className="flex flex-col">
        {EVENTS.map((e, i) => {
          const Glyph = TONE_GLYPH[e.tone];
          const last = i === EVENTS.length - 1;
          return (
            <li key={e.title} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className="border-border bg-background flex size-6 shrink-0 items-center justify-center border">
                  <Glyph size={14} weight="regular" aria-hidden="true" className={TONE_INK[e.tone]} />
                </span>
                {!last ? <span className="bg-border w-px flex-1" /> : null}
              </div>
              <div className="flex flex-col gap-0.5 pb-5">
                <span className="text-body-sm text-foreground">{e.title}</span>
                {e.detail ? <span className="text-caption text-muted-foreground font-mono">{e.detail}</span> : null}
                <span className="text-caption text-muted-foreground">
                  <span className="font-mono">{e.at}</span> · {e.by}
                </span>
              </div>
            </li>
          );
        })}
      </ol>
    </Demo>
  );
}

/* ── Activity feed ────────────────────────────────────────────────────────── */

/**
 * §17: event · actor · time · status · action. The difference from Timeline is the
 * ACTOR — a feed mixes people and agents, and who did a thing is the first question.
 * Human and agent get different glyphs so a run is never mistaken for a decision.
 */
const ACTIVITY: { actor: string; agent: boolean; event: string; at: string; tone: Tone; action?: string }[] = [
  { actor: "Content agent", agent: true, event: "drafted 4 blog posts for Northwind", at: "12 min ago", tone: "info", action: "Review" },
  { actor: "Olivier K.", agent: false, event: "approved the homepage copy", at: "1 h ago", tone: "success" },
  { actor: "Billing agent", agent: true, event: "could not charge the card on file", at: "3 h ago", tone: "danger", action: "Update card" },
  { actor: "Lead agent", agent: true, event: "added 128 prospects to Q3 outreach", at: "yesterday", tone: "processing" },
];

export function ActivityFeedDemo() {
  return (
    <Demo className="p-0">
      <PanelHeader
        icon={PulseIcon}
        title="Activity"
        count={ACTIVITY.length}
        meta="today"
        action={<Button size="sm" variant="ghost">View all</Button>}
      />
      <ul className="flex flex-col">
        {ACTIVITY.map((a) => (
          <li key={a.event} className="border-border hover:bg-accent flex items-start gap-3 border-b p-3 last:border-b-0">
            <span className="border-border flex size-8 shrink-0 items-center justify-center border">
              {a.agent ? (
                <RobotIcon size={16} className="text-processing" aria-hidden="true" />
              ) : (
                <UserIcon size={16} className="text-muted-foreground" aria-hidden="true" />
              )}
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <p className="text-body-sm text-foreground">
                <span className="font-medium">{a.actor}</span> {a.event}
              </p>
              <span className="text-caption text-muted-foreground">{a.at}</span>
            </div>
            {a.action ? (
              <Button size="sm" variant="secondary">{a.action}</Button>
            ) : null}
          </li>
        ))}
      </ul>
    </Demo>
  );
}

/* ── Metric grid ──────────────────────────────────────────────────────────── */

export function MetricGridDemo() {
  return (
    <div className="border-border grid grid-cols-1 border sm:grid-cols-2 lg:grid-cols-4">
      {[
        ["Businesses", "7", "+2 this month", BuildingsIcon],
        ["Documents", "34", "3 need signature", FileTextIcon],
        ["Credits used", "1 240", "of 5 000", RobotIcon],
        ["MRR", "$1,196", "+18%", ArrowUpIcon],
      ].map(([label, value, note, Icon], i) => (
        <div
          key={label as string}
          className={cx(
            "flex flex-col gap-2 p-4",
            i > 0 && "border-border border-t sm:border-t-0 sm:border-l",
            i === 2 && "lg:border-l sm:border-t lg:border-t-0",
            i === 3 && "sm:border-t lg:border-t-0",
          )}
        >
          <span className="text-overline text-muted-foreground flex items-center gap-2 uppercase">
            {(() => { const I = Icon as typeof BuildingsIcon; return <I size={14} aria-hidden="true" />; })()}
            {label as string}
          </span>
          <span className="text-h2 text-foreground font-mono">{value as string}</span>
          <span className="text-caption text-muted-foreground">{note as string}</span>
        </div>
      ))}
    </div>
  );
}
