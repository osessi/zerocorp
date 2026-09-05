import Link from "next/link";
import type { BusinessState } from "@zerocorp/application";

/*
  Rebuilt from the pattern in Midday (apps/dashboard/src/components/widgets/welcome-section.tsx,
  AGPL-3.0). Nothing was copied.

  Theirs opens the Overview with a PROSE SENTENCE built from real data, where the
  actionable noun is a link carrying a dashed underline:

      You have 3 invoices outstanding, totaling $12,400.

  That is worth more than four numbers, and it is the voice this product should have: a
  founder asked ZeroCorp to run their business, and the first thing the product says
  should be what it did, in a sentence, not a grid of figures they have to assemble
  themselves.

  The dashed underline is the load-bearing detail. It marks the noun as a DOOR without
  making it look like a link in running text, which on a dashboard reads as an error.
*/

/** One thing worth saying, with the place it is said about. */
interface Insight {
  readonly before: string;
  readonly link: string;
  readonly href: string;
  readonly after: string;
}

/**
 * What ZeroCorp would tell the founder if it could only say one thing.
 *
 * Ordered by urgency, not by area: what is blocked comes before what is running, and
 * what is running comes before what is merely counted.
 */
export function buildInsights(state: BusinessState, needsYou: number, percent: number): Insight[] {
  const out: Insight[] = [];

  if (needsYou > 0) {
    out.push({
      before: "ZeroCorp is waiting on you for ",
      link: `${needsYou} ${needsYou === 1 ? "thing" : "things"}`,
      href: "/company",
      after: ". Everything else is moving.",
    });
  }

  if (state.postsPublished > 0) {
    out.push({
      before: "You have ",
      link: `${state.postsPublished} ${state.postsPublished === 1 ? "article" : "articles"} published`,
      href: "/content#articles",
      after:
        state.postsScheduled > 0
          ? `, and ${state.postsScheduled} more scheduled.`
          : ", and nothing scheduled after them.",
    });
  }

  if (state.leadsTotal > 0) {
    out.push({
      before: "ZeroCorp found ",
      link: `${state.leadsTotal} ${state.leadsTotal === 1 ? "prospect" : "prospects"}`,
      href: "/leads#leads",
      after:
        state.leadsReplied > 0
          ? `, and ${state.leadsReplied} have replied.`
          : ". None have replied yet.",
    });
  }

  if (state.pages > 0) {
    out.push({
      before: "Your site has ",
      link: `${state.pages} ${state.pages === 1 ? "page" : "pages"}`,
      href: "/website#pages",
      after:
        state.pagesPublished > 0
          ? `, ${state.pagesPublished} of them published.`
          : ", none published yet.",
    });
  }

  if (out.length === 0) {
    out.push({
      before: "ZeroCorp is ",
      link: `${percent}% through your launch plan`,
      href: "/dashboard",
      after: ". Nothing needs you yet.",
    });
  }

  return out;
}

/**
 * The greeting and the sentence.
 *
 * A SERVER component. Midday's rotates through insights on a timer with a blur
 * transition, which is lovely and is also a client component, a state machine and an
 * interval on a screen whose whole job is to be readable in two seconds. Ours shows the
 * most urgent one and lists the rest beneath it, which says the same thing without
 * asking the founder to wait for the carousel to come round.
 */
export function Insights({
  name,
  insights,
  percent,
  done,
  total,
}: {
  name: string | null;
  insights: readonly Insight[];
  percent: number;
  done: number;
  total: number;
}) {
  const [lead, ...rest] = insights;
  if (!lead) return null;

  return (
    /*
      THE MASTHEAD, rebuilt 2026-09-04.

      The first version was a heading and two grey paragraphs — "c'est de la merde", and
      it was: prose set at body size in --muted-foreground is the LEAST emphatic thing a
      page can open with, so the one sentence that should carry the whole screen was
      quieter than the four numbers under it.

      What it is now: a dark focal block, which the product already owns as a token
      (--surface-focal, §4.1) and had never used at the top of a screen. Three reasons it
      is right here rather than decoration:

        1. It is the only element on Overview that is not a panel, so it reads as the
           page speaking rather than as another card.
        2. The sentence is set at display size in the focal foreground, so the most
           important line is also the largest. It was the smallest before.
        3. It carries the plan gauge, so the masthead answers "how far along am I" and
           "what is happening" in one object instead of two.

      The links keep the dashed underline on the DARK ground, where a solid underline
      would read as an error state.
    */
    <section className="bg-surface-focal text-surface-focal-foreground relative flex flex-col gap-5 overflow-hidden p-6 sm:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
        <h1 className="text-h3 text-surface-focal-foreground/70 font-medium text-balance">
          {name ?? "Your business"}
        </h1>
        <span className="text-caption text-surface-focal-foreground/60 font-mono tabular-nums">
          {done}/{total} steps · {percent}%
        </span>
      </div>

      {/* The sentence, at display size. The largest type on the screen. */}
      <p className="text-display-l text-surface-focal-foreground max-w-[24ch] leading-[1.1] font-semibold text-balance sm:max-w-[30ch]">
        {lead.before}
        <InsightLink href={lead.href}>{lead.link}</InsightLink>
        {lead.after}
      </p>

      {/* The plan gauge. One bar, full bleed to the block's padding, no label: the
          figures beside the title already name it. */}
      <div className="bg-surface-focal-foreground/15 h-1 w-full">
        <div
          className="bg-primary-emphasis h-full origin-left transition-[width] duration-[--duration-content] ease-out motion-reduce:transition-none"
          style={{ width: `${Math.min(Math.max(percent, 0), 100)}%` }}
        />
      </div>

      {rest.length > 0 ? (
        <p className="text-body-sm text-surface-focal-foreground/75 max-w-prose text-pretty">
          {rest.map((i, n) => (
            <span key={i.href}>
              {n > 0 ? " " : ""}
              {i.before}
              <InsightLink href={i.href}>{i.link}</InsightLink>
              {i.after}
            </span>
          ))}
        </p>
      ) : null}
    </section>
  );
}

function InsightLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      /* Dashed, not solid. A solid underline in running text on a dashboard reads as a
         mis-styled paragraph; a dashed one reads as "this number is a place". */
      /* On the focal block the link is the brightest thing in the sentence, and the
         dashed rule sits at 45% so it marks the noun without boxing it. */
      className="text-primary-emphasis hover:decoration-primary-emphasis focus-visible:outline-ring decoration-primary-emphasis/45 font-semibold underline decoration-dashed decoration-from-font underline-offset-4 transition-[text-decoration-color] duration-[--duration-hover-out] ease-out hover:duration-0 focus-visible:outline-2 focus-visible:outline-offset-2"
    >
      {children}
    </Link>
  );
}
