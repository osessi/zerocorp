import { redirect } from "next/navigation";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import {
  AGENTS,
  ActivityPanel,
  ButtonLink,
  CATEGORY_ICON,
  CONTROL_TRANSITION,
  CellAction,
  CellIdentity,
  CellStatus,
  CellText,
  ENTER,
  EmptyState,
  GhostRows,
  ICONS,
  Icon,
  Page,
  Panel,
  Row,
  Rows,
  Section,
  StatCard,
  StatGrid,
  cx,
  staggerStyle,
  type AgentKey,
} from "@zerocorp/ui";
import type { BusinessState, PlanStepRow } from "@zerocorp/application";
import { outcomeFor, waitingFor } from "./outcome";
import { Insights, buildInsights } from "./Insight";
import { PipelineChart, PublishingChart, WorkloadChart } from "./Charts";
import { getDashboardRepository, getUnitOfWork } from "../../../server/container";
import { getViewer } from "../../../server/session";

export const metadata = { title: "Overview · ZeroCorp" };

/**
 * The Command Center — PRODUCT_SPEC.md §19.
 *
 * It answers ONE question: what is ZeroCorp doing for me. Everything on it either
 * answers that or should be on another page.
 */

/*
  The category→icon map moved to the dictionary (§11b). It was declared here AND in
  Shell.tsx AND per screen, so "which glyph means Company" had three answers that could
  drift. One place decides now.
*/

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

/** The category, as a founder would name it. The raw keys are storage, not language. */
const AREA_LABEL: Record<string, string> = {
  company: "Company",
  brand: "Brand",
  website: "Website",
  domain: "Website",
  email: "Email",
  content: "Content",
  seo: "Content",
  leads: "Customers",
  operations: "Operations",
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
  const concept = CATEGORY_ICON[step.category] ?? "operations";
  const glyph = ICONS[concept].icon;
  const done = step.status === "done";
  const marker = done ? "done" : anchor ? "current" : "pending";
  const href = CATEGORY_HREF[step.category] ?? "/company";
  const outcome = outcomeFor(step.category, state);
  const waiting = waitingFor(step.status, step.category, state);

  return (
    <Row
      density="comfortable"
      active={anchor}
      muted={!step.included}
      className={cx(CONTROL_TRANSITION, ENTER)}
      /* The plan settles one row at a time. Capped at 8 by staggerStyle, so a thirty-step
         plan still arrives as a wave rather than as a wait. */
      style={staggerStyle(index)}
    >
      <StepMarker state={marker} />

      {!done ? (
        <span
          className={cx(
            "flex size-8 shrink-0 items-center justify-center border",
            anchor ? "border-primary text-primary" : "border-border text-muted-foreground",
          )}
        >
          <Icon icon={glyph} size={16} />
        </span>
      ) : null}

      <CellIdentity
        width="content"
        className={cx(done && "text-muted-foreground")}
        sub={outcome ?? step.outcome}
      >
        <span className={cx(!step.included && "line-through", anchor && "font-semibold")}>
          {step.title}
        </span>
      </CellIdentity>

      {waiting ? (
        <CellText className={cx("hidden sm:block", step.status === "blocked" && "text-warning-ink font-medium")}>
          {waiting}
        </CellText>
      ) : null}

      <CellStatus width="marker">
        {done ? <Icon icon={CheckIcon} size={16} className="text-success" /> : null}
      </CellStatus>

      {step.included && !done ? (
        <CellAction>
          <ButtonLink href={href} {...(anchor ? { variant: "primary" as const } : {})}>
            {ACTION_LABEL[step.status] ?? "Open"}
          </ButtonLink>
        </CellAction>
      ) : null}
    </Row>
  );
}

export default async function DashboardPage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const overview = await getUnitOfWork().withTenant(viewer.ctx, (tx) =>
    getDashboardRepository().overview(tx, viewer.ctx),
  );

  if (!overview) {
    return (
      <EmptyState
        cause="first-run"
        icon={ICONS.overview.icon}
        title="Your business is being set up"
        body="This page fills in as ZeroCorp works. Nothing is required from you yet."
        action={<ButtonLink href="/company">See what is in progress</ButtonLink>}
        ghost={<GhostRows rows={6} columns={[200, 260]} />}
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
  /*
    What the plan is MADE OF, by area.

    Derived from the steps that are already fetched — no second query for a chart. Only
    INCLUDED steps count: an excluded step is not work ZeroCorp is doing. Five areas at
    most, largest first, because §4.7 has five series and a sixth would have to repeat a
    colour, which on a chart whose only axis IS colour is a chart that lies.
  */
  const byArea = Object.entries(
    included.reduce<Record<string, number>>((acc, step) => {
      const area = AREA_LABEL[step.category] ?? "Other";
      acc[area] = (acc[area] ?? 0) + 1;
      return acc;
    }, {}),
  )
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([area, steps], i) => ({ area, steps, slot: i + 1 }));

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

  const insights = buildInsights(st, needsYou, percent);

  return (
    /*
      THE COMPOSITION CHANGED, 2026-09-04.

      This screen used to be a 1280px column of four KPI cards, a chart row, a split and
      an activity list — the same skeleton as the other six, with better contents. It is
      now the one screen in the product that OPENS WITH A SENTENCE.

      Midday's Overview is a centred 768px column: a greeting, a prose summary built from
      real data, then the numbers. Ours keeps the numbers wider because a launch plan is
      genuinely a list of nine things, but the opening is theirs and it is right: a
      founder asked ZeroCorp to run their business, so the first thing the product should
      say is what it did, in a sentence.
    */
    <Page width="work">
      {/*
        `businessNamed`, NOT `brandName`.

        `business_profiles.business_name` is seeded at conversion from the assessment
        HEADLINE, which is a positioning sentence and not a name, because the free
        assessment never asks what the business is called. Onboarding step 1 does.

        Passing brandName straight through printed "I design brand identities for
        early-stage software companies." as an h1 — the exact defect the businessNamed
        flag exists to prevent, and which its own doc comment names verbatim. Caught on
        seeded data 2026-09-04, one hour after the flag's comment was read and not
        applied.
      */}
      <Insights
        name={st.businessNamed ? st.brandName : null}
        insights={insights}
        percent={percent}
        done={done}
        total={included.length}
      />

      {/*
        Every card is a DOOR. A KPI that cannot be acted on is a decoration, and four of
        them were exactly that until today.
      */}
      <StatGrid>
        <StatCard
          label="Launch progress"
          value={`${percent}%`}
          detail={`${done} of ${included.length}`}
          href="/dashboard"
        />
        <StatCard
          label="Articles published"
          value={st.postsPublished}
          detail={st.postsScheduled > 0 ? `+${st.postsScheduled} scheduled` : `${st.postsDraft} drafts`}
          href="/content#articles"
          trend={st.publishingByWeek?.map((w) => w.published) ?? undefined}
        />
        <StatCard
          label="Prospects found"
          value={st.leadsTotal}
          detail={st.leadsReplied > 0 ? `${st.leadsReplied} replied` : "none replied"}
          href="/leads#leads"
        />
        <StatCard
          label="Needs you"
          value={needsYou}
          detail={needsYou > 0 ? "blocking your launch" : "nothing pending"}
          href={blockedStep ? (CATEGORY_HREF[blockedStep.category] ?? "/company") : "/dashboard"}
          attention={needsYou > 0}
        />
      </StatGrid>

      {/*
        `items-stretch`, not `items-start`. The two charts are ONE row of the same
        instrument read two ways, and a row where the left block is 340px and the right
        is 268px reads as two unrelated things that happened to land side by side.

        A grid row already stretches its cells; `items-start` was explicitly cancelling
        that. The charts fill their cell, so whichever is taller sets the height for both.
      */}
      <div className="grid grid-cols-1 items-stretch gap-(--gap-block) xl:grid-cols-4">
        <div className="flex min-w-0 flex-col xl:col-span-3">
          <PublishingChart data={st.publishingByWeek} />
        </div>
        <div className="flex min-w-0 flex-col">
          <WorkloadChart data={byArea} />
        </div>
      </div>

      <div className="grid grid-cols-1 items-start gap-(--gap-block) lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Section title="What ZeroCorp is building" count={included.length}>
          {/*
            A Panel with a scrolling body, not a list that grows the page. The plan is
            nine rows today and thirty on a full account; the screen should not get
            taller because the plan did.
          */}
          <Panel>
            <Panel.Header title="Launch plan" count={`${done}/${included.length}`}>
              <span className="text-caption text-muted-foreground font-mono tabular-nums">
                {percent}%
              </span>
            </Panel.Header>
            <Panel.Body padded={false} scroll className="max-h-(--panel-scroll-max)">
              <Rows>
                {overview.steps.map((step, i) => (
                  <StepRow key={step.id} step={step} anchor={step.id === anchorId} state={st} index={i} />
                ))}
              </Rows>
            </Panel.Body>
          </Panel>
        </Section>

        <aside className="flex min-w-0 flex-col gap-(--gap-block)">
          <PipelineChart data={st.leadsByStage} />

          {st.brandName ? (
            <Panel>
              <Panel.Header title="Your brand" count={`${st.brandComplete}/5`} />
              <Panel.Body className="flex flex-col gap-3">
                {st.businessNamed ? (
                  <span className="text-h4">{st.brandName}</span>
                ) : (
                  <span className="text-body-sm text-muted-foreground">
                    Not named yet. ZeroCorp is using your description until you choose one.
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
              </Panel.Body>
            </Panel>
          ) : null}
        </aside>
      </div>

      <Section title="Recent activity" count={events.length}>
        {events.length === 0 ? (
          <EmptyState
            cause="first-run"
            icon={ICONS.overview.icon}
            title="Nothing has happened yet"
            body="Every action shows up here with the agent that took it."
            action={<ButtonLink href="/company">Start your company</ButtonLink>}
            ghost={<GhostRows rows={5} columns={[160, 240]} />}
          />
        ) : (
          <Panel>
            <Panel.Body>
              <ActivityPanel events={events} />
            </Panel.Body>
          </Panel>
        )}
      </Section>
    </Page>
  );
}
