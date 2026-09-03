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
  WarningIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  AGENTS,
  ActivityPanel,
  EmptyState,
  SectionHeader,
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
import { Kpi, KpiRow } from "./Kpi";
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
  const st = overview.state;
  /*
    The open RFI outranks everything.

    A formation order sitting in operator_review with an open question is the one thing
    actually blocking this customer's company from existing, and the dashboard said
    "Nothing needs you right now". It was not a phrasing problem: the RFI was never
    fetched, so the screen could not know.
  */
  const blockedStep = included.find((s) => s.status === "blocked");
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
      <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-6 px-5 pt-6 sm:px-8">
        {/*
          No full-bleed band.

          The blocking question shipped as a yellow strip across the whole width with a
          border on its BOTTOM EDGE ONLY — the single-side accent, for the fourth time,
          and my own CI rule had a hole that let it through. It is a card now, bordered on
          four sides, the same width as everything else on the page.
        */}
        {st.openRfi ? (
          <div className="border-warning bg-warning-subtle flex flex-wrap items-center gap-4 border p-4">
            <WarningIcon size={20} weight="fill" className="text-warning-ink shrink-0" aria-hidden="true" />
            <p className="text-body-sm text-warning-ink min-w-0 flex-1">
              <span className="font-semibold">Waiting on you.</span> {st.openRfi}
            </p>
            <ButtonLink href="/company" variant="primary">Send your passport page</ButtonLink>
          </div>
        ) : null}

        <KpiRow>
          <Kpi
            label="Launch progress"
            value={`${percent}%`}
            note={`${done} of ${included.length} steps complete`}
            delta={{ text: `${included.length - done} left`, direction: done === included.length ? "flat" : "up" }}
          />
          <Kpi
            label="Articles published"
            value={String(st.postsPublished)}
            {...(st.postsScheduled > 0 ? { sub: `+${st.postsScheduled} scheduled` } : {})}
            note="Search follows consistency, not volume"
            delta={{ text: `${st.postsDraft} drafts`, direction: st.postsDraft > 0 ? "up" : "flat" }}
          />
          <Kpi
            label="Prospects found"
            value={String(st.leadsTotal)}
            {...(st.leadsReplied > 0 ? { sub: `${st.leadsReplied} replied` } : {})}
            note={st.leadsQualified > 0 ? `${st.leadsQualified} qualified so far` : "Discovery is running"}
            delta={{ text: `${st.leadsReplied} replies`, direction: st.leadsReplied > 0 ? "up" : "flat" }}
          />
          <Kpi
            label="Needs you"
            value={String(needsYou)}
            note={needsYou > 0 ? "Everything else is running" : "Nothing is blocked"}
            highlight={needsYou > 0}
          />
        </KpiRow>
      </div>

      {/*
        One big chart, then the work.

        Two small charts side by side were cramped and neither was readable. Publishing
        over time is the question this screen answers — is anything going out — so it
        gets the full width, and the pipeline moves beside the plan where it is a
        summary rather than a headline.
      */}
      <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-6 px-5 py-6 sm:px-8">
        <PublishingChart data={st.publishingByWeek} />

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <section className="flex min-w-0 flex-col gap-3">
            <SectionHeader title="What ZeroCorp is building" count={included.length} countTone="processing" />
            <ul className="border-border border">
              {overview.steps.map((step, i) => (
                <StepRow key={step.id} step={step} anchor={step.id === anchorId} state={st} index={i} />
              ))}
            </ul>
          </section>

          <aside className="flex min-w-0 flex-col gap-6">
            <PipelineChart data={st.leadsByStage} />

            {/*
              Brand. The numbers panel that used to sit here repeated all four KPI cards
              a few hundred pixels below them, which is the kind of duplication that makes
              a dashboard feel busy without saying anything more.
            */}
            {st.brandName ? (
              <section className="border-border flex flex-col gap-3 border p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-overline text-muted-foreground">Your brand</span>
                  <span className="text-caption text-muted-foreground font-mono tabular-nums">{st.brandComplete}/5</span>
                </div>
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
                <ButtonLink
                  href={st.businessNamed ? "/brand" : "/onboarding"}
                  {...(st.businessNamed ? {} : { variant: "primary" as const })}
                >
                  {st.businessNamed ? "Open brand" : "Name your business"}
                </ButtonLink>
              </section>
            ) : null}
          </aside>
        </div>

        <section className="flex flex-col gap-3">
          <SectionHeader title="Recent activity" count={events.length} countTone="ai" />
          {events.length === 0 ? (
            <EmptyState
              title="Nothing has happened yet"
              body="Every action shows up here with the agent that took it."
              action={<ButtonLink href="/company">Start your company</ButtonLink>}
            />
          ) : (
            <div className="border-border border p-4">
              <ActivityPanel events={events} />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
