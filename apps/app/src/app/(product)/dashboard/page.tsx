import { redirect } from "next/navigation";
import {
  ArticleIcon,
  CheckIcon,
  BrowserIcon,
  BuildingsIcon,
  EnvelopeSimpleIcon,
  GearIcon,
  GlobeHemisphereWestIcon,
  MagnifyingGlassIcon,
  PaletteIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  AGENTS,
  ActivityPanel,
  CockpitHeader,
  EmptyState,
  SectionHeader,
  StatusBadge,
  StatusStamp,
  ButtonLink,
  CONTROL_TRANSITION,
  ENTER,
  cx,
  staggerStyle,
  type AgentKey,
} from "@zerocorp/ui";
import type { BusinessState, PlanStepRow } from "@zerocorp/application";
import { outcomeFor, waitingFor } from "./outcome";
import { PipelineChart, PublishingChart } from "./Charts";
import { getDashboardRepository, getUnitOfWork } from "../../../server/container";
import { getViewer } from "../../../server/session";

export const metadata = { title: "Overview — ZeroCorp" };

/**
 * The Command Center — PRODUCT_SPEC.md §19.
 *
 * It answers ONE question: what is ZeroCorp doing for me. Everything on it either
 * answers that or should be on another page.
 */

const CATEGORY_ICON: Record<string, typeof BuildingsIcon> = {
  company: BuildingsIcon,
  brand: PaletteIcon,
  website: BrowserIcon,
  domain: GlobeHemisphereWestIcon,
  email: EnvelopeSimpleIcon,
  content: ArticleIcon,
  seo: MagnifyingGlassIcon,
  leads: UsersThreeIcon,
  operations: GearIcon,
};

/** Where a step is actually done. A row the founder cannot act on is a dead row. */
const CATEGORY_HREF: Record<string, string> = {
  company: "/company",
  brand: "/brand",
  website: "/website",
  domain: "/website",
  email: "/email",
  content: "/content",
  seo: "/content",
  leads: "/leads",
  operations: "/settings",
};

const ACTION_LABEL: Record<string, string> = {
  blocked: "Continue",
  in_progress: "Open",
  pending: "Start",
};

/**
 * Progress, in the colours the dashboard already uses for it.
 *
 * Red under 50%, amber under 75%, green above. Decided in review; the same rule is on
 * the formation queue, so a founder learns it once.
 */
function progressTone(percent: number): { bar: string; text: string } {
  if (percent >= 75) return { bar: "bg-success", text: "text-success" };
  if (percent >= 50) return { bar: "bg-warning", text: "text-warning-ink" };
  return { bar: "bg-destructive", text: "text-destructive-ink" };
}

/**
 * The leading status indicator.
 *
 * Trailing badges on all eight rows were the reason the list read as one grey block: an
 * identical chip at the identical x-position eight times over is a column of noise, not a
 * status. A leading marker puts the state where the eye starts and lets the three states
 * differ in SHAPE, not only in colour (§14):
 *
 *   done     a filled disc with a check   history
 *   current  a filled ring                you are here
 *   pending  an empty outline             not yet
 *
 * A circle, deliberately. §7 says radius 0 is for rectangles and that a circle is a
 * component decision, which this is: it is a bullet in a sequence, not a container.
 */
function StepMarker({ state }: { state: "done" | "current" | "pending" }) {
  if (state === "done") {
    return (
      <span className="bg-success text-background flex size-5 shrink-0 items-center justify-center rounded-full">
        <CheckIcon size={12} weight="bold" aria-hidden="true" />
      </span>
    );
  }
  if (state === "current") {
    return (
      <span className="border-primary bg-background flex size-5 shrink-0 items-center justify-center rounded-full border-2">
        <span className="bg-primary size-2 rounded-full" />
      </span>
    );
  }
  return <span className="border-input size-5 shrink-0 rounded-full border" />;
}

/**
 * One row of the plan, with the state actually visible.
 *
 * Before this every row had identical weight whether it was done, running, blocked or
 * untouched, which is why eight rows read as a table rather than as a sequence. Three
 * treatments now:
 *
 *   anchor    --surface-sunken, full-weight title, icon tile, action button
 *   pending   unfilled, normal title
 *   done      recedes: muted title, no tile, no action. It is history.
 */
function StepRow({
  step,
  anchor,
  state,
  index,
}: {
  step: PlanStepRow;
  anchor: boolean;
  state: BusinessState;
  index: number;
}) {
  const Icon = CATEGORY_ICON[step.category] ?? GearIcon;
  const done = step.status === "done";
  const marker = done ? "done" : anchor ? "current" : "pending";
  const href = CATEGORY_HREF[step.category] ?? "/company";
  const outcome = outcomeFor(step.category, state);
  const waiting = waitingFor(step.status, step.category, state);

  return (
    <li
      /* The plan settles one row at a time. 40ms — the option stagger, not the 90ms
         reveal: this is a list you are about to scan, so it should be there by the time
         the eye lands (§10). */
      className={cx(
        "border-border grid grid-cols-[auto_1fr_auto] items-center gap-x-4 gap-y-1 border-b px-4 py-3 last:border-b-0",
        CONTROL_TRANSITION,
        ENTER,
        anchor ? "bg-surface-sunken" : "hover:bg-accent motion-safe:hover:translate-x-0.5",
        !step.included && "opacity-55",
      )}
      style={staggerStyle(index)}
    >
      <StepMarker state={marker} />

      <div className="flex min-w-0 items-center gap-3">
        {!done ? (
          <span
            className={cx(
              "flex size-8 shrink-0 items-center justify-center border",
              anchor ? "border-primary text-primary" : "border-border text-muted-foreground",
            )}
          >
            <Icon size={16} weight="regular" aria-hidden="true" />
          </span>
        ) : null}
        <span className="flex min-w-0 flex-col">
          <span
            className={cx(
              "truncate",
              done ? "text-body-sm text-muted-foreground" : anchor ? "text-body font-semibold" : "text-body-sm font-medium",
              !step.included && "line-through",
            )}
          >
            {step.title}
          </span>
          {/*
            The middle column. A done row says what it PRODUCED — "12 published, 3
            scheduled" — and an open one says what it is waiting on. Before this, a row
            was a title, a description and five hundred pixels of nothing.
          */}
          <span className="text-caption text-muted-foreground truncate">
            {outcome ?? (done ? step.outcome : step.outcome)}
          </span>
        </span>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        {waiting ? (
          <span
            className={cx(
              "text-caption hidden sm:inline",
              step.status === "blocked" ? "text-warning-ink font-medium" : "text-muted-foreground",
            )}
          >
            {waiting}
          </span>
        ) : null}
        {step.included && !done ? (
          <ButtonLink href={href} {...(anchor ? { variant: "primary" as const } : {})}>
            {ACTION_LABEL[step.status] ?? "Open"}
          </ButtonLink>
        ) : null}
      </div>
    </li>
  );
}

/** One figure in the rail. The yellow is the non-semantic accent — where to look. */
function Stat({ label, value, sub, highlight }: { label: string; value: string; sub?: string | undefined; highlight?: boolean }) {
  return (
    <div className="flex items-baseline justify-between gap-3 py-2">
      <span className="text-body-sm text-muted-foreground">{label}</span>
      <span className="flex items-baseline gap-1.5">
        <span
          className={cx(
            "text-h4 font-mono tabular-nums",
            highlight ? "bg-accent-highlight text-accent-highlight-ink rounded-sm px-1.5" : "text-foreground",
          )}
        >
          {value}
        </span>
        {sub ? <span className="text-caption text-muted-foreground">{sub}</span> : null}
      </span>
    </div>
  );
}

export default async function Page() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const overview = await getUnitOfWork().withTenant(viewer.ctx, (tx) =>
    getDashboardRepository().overview(tx, viewer.ctx),
  );

  if (!overview) {
    return (
      <EmptyState
        title="Your business is being set up"
        body="This page fills in as ZeroCorp works. Nothing is required from you yet."
        action={<ButtonLink href="/company">See what is in progress</ButtonLink>}
        className="m-8"
      />
    );
  }

  const included = overview.steps.filter((s) => s.included);
  const done = included.filter((s) => s.status === "done").length;
  const percent = included.length === 0 ? 0 : Math.round((done / included.length) * 100);
  const tone = progressTone(percent);
  const st = overview.state;
  /*
    The open RFI outranks everything.

    A formation order sitting in operator_review with an open question is the one thing
    actually blocking this customer's company from existing, and the dashboard said
    "Nothing needs you right now". It was not a phrasing problem: the RFI was never
    fetched, so the screen could not know.
  */
  const blockedStep = included.find((s) => s.status === "blocked");
  const runningIndex = included.findIndex((s) => s.status === "in_progress");
  const needsYou = included.filter((s) => s.status === "blocked").length + (overview.state.openRfi ? 1 : 0);
  const anchorId =
    blockedStep?.id ??
    included.find((s) => s.status === "in_progress")?.id ??
    included.find((s) => s.status === "pending")?.id ??
    null;

  /**
   * The feed names its actor.
   *
   * The seed writes `{ agent, title }` into the payload and the renderer reads it, so a
   * row says `ZeroCorp Writer published "…"` rather than `content published`. Rows without
   * a payload fall back to the event type, because a system event genuinely has no agent.
   */
  const events = overview.activity.map((event) => {
    const agent = event.payload["agent"] as AgentKey | undefined;
    const title = event.payload["title"] as string | undefined;
    const known = agent && agent in AGENTS ? AGENTS[agent] : null;
    return {
      id: event.id,
      actor: known ? known.name : "ZeroCorp",
      action: title ?? event.eventType.replace(/\./g, " "),
      at: event.createdAt.toISOString().slice(0, 10),
      kind: (event.actorType === "agent" ? "agent" : event.actorType === "user" ? "person" : "system") as
        | "person"
        | "agent"
        | "system",
    };
  });

  return (
    /* A viewport-height column: the cockpit is fixed, the grid below it takes the rest
       and its panels scroll inside themselves. */
    <div className="flex min-h-0 flex-1 flex-col">
      <CockpitHeader
        /* The company name, not the business description: `businessName` holds the
           founder's own sentence about what they do, which the command bar already
           shows, and printing it twice made the block read as an echo. */
        eyebrow={overview.companyName ?? "Your business"}
        headline={
          needsYou === 0
            ? "ZeroCorp is building your business. Nothing needs you right now."
            : `${needsYou} steps are waiting on you`
        }
        blocked={
          st.openRfi
            ? { label: st.openRfi, action: <ButtonLink href="/company" variant="primary">Send your passport page</ButtonLink> }
            : blockedStep
              ? { label: blockedStep.title, action: <ButtonLink href="/company" variant="primary">Continue</ButtonLink> }
              : undefined
        }
        total={included.length}
        completed={done}
        current={runningIndex >= 0 ? runningIndex : undefined}
        /* The figures live IN the block now. They were a separate tinted row below it,
           which read as conditional formatting and left the block with an empty half. */
        /* One highlighted figure per screen, never three. The yellow marks where to
           look, and marking everything marks nothing (§4.8). */
        metrics={[
          { label: "Launch progress", value: `${percent}%`, highlight: needsYou === 0 },
          { label: "Steps done", value: `${done}`, sub: `of ${included.length}` },
          { label: "Needs you", value: `${needsYou}`, highlight: needsYou > 0 },
        ]}
        status={
          overview.companyStatus === "active" && overview.companyName ? (
            <StatusStamp milestone="formed" />
          ) : (
            <StatusBadge tone="processing">Company forming</StatusBadge>
          )
        }
      />

      {/* `w-full` is load-bearing. The shell centres its children, so the focal header —
          which is w-full — filled 1184px while this div shrink-wrapped to 958, putting the
          two left edges 113px apart. Same container, same padding, same edge. */}
      {/*
        Two columns, not one.

        A single 1200px column with rows this light cannot look dense: everything is
        alone on its line and the rail content — the numbers, the plan, the brand — got
        pushed below the fold where nobody scrolled to it.
      */}
      {/*
        A dashboard, not a document.

        Everything Overview has fits in one screen: the charts, the plan and the rail are
        all here without scrolling the page. What is long — the plan, the activity feed —
        scrolls INSIDE its own panel, which is the difference between a control surface
        and an article. `min-h-0` on the grid is what allows a child to be shorter than
        its content and scroll; without it flex children refuse to shrink and the page
        grows instead.
      */}
      <div className="mx-auto grid w-full min-h-0 max-w-(--container-content) flex-1 grid-cols-1 gap-5 px-5 py-5 sm:px-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="flex min-h-0 min-w-0 flex-col gap-5">
          <section className="flex min-h-0 flex-col gap-3">
            <SectionHeader title="What ZeroCorp is building" count={included.length} countTone="processing" />
            <ul className="border-border min-h-0 overflow-y-auto border">
              {overview.steps.map((step, i) => (
                <StepRow key={step.id} step={step} anchor={step.id === anchorId} state={st} index={i} />
              ))}
            </ul>
          </section>

          {/* The charts. §4.7 settled every value on 2026-09-01 and nothing had ever
              drawn one — a dashboard whose only shapes are rows is a list. */}
          <section className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <PublishingChart data={st.publishingByWeek} />
            <PipelineChart data={st.leadsByStage} />
          </section>

        </div>

        {/* The rail. Everything a founder checks without reading. */}
        <aside className="flex min-h-0 min-w-0 flex-col gap-4 overflow-y-auto">
          {/* What is waiting, first, because it is the only part that asks for something. */}
          {st.openRfi ? (
            <section className="border-warning bg-warning-subtle flex flex-col gap-3 border p-4">
              <span className="text-overline text-warning-ink">Waiting on you</span>
              <p className="text-body-sm text-warning-ink">{st.openRfi}</p>
              <ButtonLink href="/company" variant="primary">Send it</ButtonLink>
            </section>
          ) : null}

          <section className="flex min-h-0 flex-col gap-3">
            <SectionHeader title="Recent activity" count={events.length} countTone="ai" />
            {events.length === 0 ? (
              <EmptyState
                title="Nothing has happened yet"
                body="As soon as ZeroCorp starts working, every action shows up here with the agent that took it."
                action={<ButtonLink href="/company">Start your company</ButtonLink>}
              />
            ) : (
              <ActivityPanel events={events} />
            )}
          </section>

          <section className="border-border flex shrink-0 flex-col border">
            <div className="border-border bg-muted border-b px-4 py-2.5">
              <span className="text-overline text-muted-foreground">Your business, in numbers</span>
            </div>
            <div className="divide-border flex flex-col divide-y px-4 py-1">
              <Stat label="Articles published" value={String(st.postsPublished)} sub={st.postsScheduled > 0 ? `+${st.postsScheduled} scheduled` : undefined} highlight={st.postsPublished > 0} />
              <Stat label="Prospects found" value={String(st.leadsTotal)} sub={st.leadsReplied > 0 ? `${st.leadsReplied} replied` : undefined} highlight={st.leadsTotal > 0} />
              <Stat label="Keywords tracked" value={String(st.keywords)} />
              <Stat label="Pages" value={String(st.pages)} sub={`${st.pagesPublished} live`} />
              <Stat
                label="Mailboxes warming"
                value={String(st.mailboxes)}
                sub={st.warmupDay !== null ? `${Math.max(0, st.warmupTotal - st.warmupDay)}d left` : undefined}
              />
            </div>
          </section>

          {/* Brand had no entry point anywhere in the product. */}
          {st.brandName ? (
            <section className="border-border flex flex-col gap-3 border p-4">
              <div className="flex items-baseline justify-between gap-3">
                <span className="text-overline text-muted-foreground">Your brand</span>
                <span className="text-caption text-muted-foreground font-mono tabular-nums">{st.brandComplete}/5</span>
              </div>
              {/* A name, or an honest admission that there is not one yet. The seeded
                  "name" is the assessment headline until onboarding step 1 is answered,
                  and printing a positioning sentence as a heading is worse than empty. */}
              {st.businessNamed ? (
                <span className="text-h4">{st.brandName}</span>
              ) : (
                <span className="text-body-sm text-muted-foreground">
                  Not named yet — ZeroCorp is using your description until you choose one.
                </span>
              )}
              {st.brandColors.length > 0 ? (
                <div className="flex gap-1.5">
                  {st.brandColors.slice(0, 6).map((c) => (
                    <span
                      key={c}
                      className="border-border size-7 border"
                      style={{ backgroundColor: c }}
                      title={c}
                      aria-label={c}
                    />
                  ))}
                </div>
              ) : null}
              <ButtonLink href={st.businessNamed ? "/brand" : "/onboarding"} {...(st.businessNamed ? {} : { variant: "primary" as const })}>
                {st.businessNamed ? "Open brand" : "Name your business"}
              </ButtonLink>
            </section>
          ) : null}

          <section className="border-border bg-surface-sunken flex flex-col gap-3 border p-4">
            <span className="text-overline text-muted-foreground">Current plan</span>
            <span className="text-h4">{overview.subscriptionPlan ?? "No plan yet"}</span>
            <div className="bg-muted h-1.5 w-full" role="presentation">
              <div className={cx("h-full transition-[width] duration-modal ease-out", tone.bar)} style={{ width: `${percent}%` }} />
            </div>
            <span className={cx("text-caption font-mono tabular-nums", tone.text)}>{percent}% complete</span>
          </section>
        </aside>
      </div>
    </div>
  );
}
