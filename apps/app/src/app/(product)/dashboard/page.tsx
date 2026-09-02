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
  cx,
  type AgentKey,
} from "@zerocorp/ui";
import { ButtonLink } from "@zerocorp/ui";
import type { PlanStepRow } from "@zerocorp/application";
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
function StepRow({ step, anchor }: { step: PlanStepRow; anchor: boolean }) {
  const Icon = CATEGORY_ICON[step.category] ?? GearIcon;
  const done = step.status === "done";
  const state = done ? "done" : anchor ? "current" : "pending";
  const href = CATEGORY_HREF[step.category] ?? "/company";

  return (
    <li
      className={cx(
        "border-border flex items-center gap-4 border-b px-5 py-4 last:border-b-0",
        "transition-[background-color] duration-normal ease-out",
        anchor ? "bg-surface-sunken" : "hover:bg-accent",
        !step.included && "opacity-55",
      )}
    >
      <StepMarker state={state} />

      {/* The icon tile is a rank, not decoration: it appears on the row you are meant to
          look at and disappears on the ones you are not. */}
      {!done ? (
        <span
          className={cx(
            "flex size-9 shrink-0 items-center justify-center border",
            anchor ? "border-primary text-primary" : "border-border text-muted-foreground",
          )}
        >
          <Icon size={18} weight="regular" aria-hidden="true" />
        </span>
      ) : null}

      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span
          className={cx(
            "text-body-sm",
            done ? "text-muted-foreground" : anchor ? "text-h4" : "font-medium",
            !step.included && "line-through",
          )}
        >
          {step.title}
        </span>
        {/* A finished step does not need its promise explained again. */}
        {!done ? <span className="text-body-sm text-muted-foreground">{step.outcome}</span> : null}
      </span>

      {step.included && !done ? (
        <ButtonLink href={href} variant={anchor ? "primary" : "secondary"}>
          {ACTION_LABEL[step.status] ?? "Open"}
        </ButtonLink>
      ) : null}
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
  const tone = progressTone(percent);
  const blockedStep = included.find((s) => s.status === "blocked");
  const runningIndex = included.findIndex((s) => s.status === "in_progress");
  const needsYou = included.filter((s) => s.status === "blocked").length;
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
    <>
      {/* The one focal region on the page. Everything below it sits on --background. */}
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
        blocked={blockedStep ? { label: blockedStep.title } : undefined}
        total={included.length}
        completed={done}
        current={runningIndex >= 0 ? runningIndex : undefined}
        /* The figures live IN the block now. They were a separate tinted row below it,
           which read as conditional formatting and left the block with an empty half. */
        metrics={[
          { label: "Launch progress", value: `${percent}%` },
          { label: "Steps done", value: `${done}`, sub: `of ${included.length}` },
          { label: "Needs you", value: `${needsYou}` },
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
      <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
        <section className="flex flex-col gap-4">
          <SectionHeader
            title="What ZeroCorp is building"
            count={included.length}
            countTone="processing"
          />
          <ul className="border-border border">
            {/* Exactly one anchor: the blocked step if there is one, otherwise the step
                in flight, otherwise the first thing not yet started. A list with two
                "you are here" markers has none. */}
            {overview.steps.map((step) => (
              <StepRow key={step.id} step={step} anchor={step.id === anchorId} />
            ))}
          </ul>
        </section>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_20rem]">
          <section className="flex flex-col gap-4">
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

          <aside className="flex flex-col gap-4">
            <SectionHeader title="Your plan" />
            <div className="border-border bg-surface-sunken flex flex-col gap-3 border p-5">
              <span className="text-overline text-muted-foreground">Current plan</span>
              <span className="text-h3">{overview.subscriptionPlan ?? "No plan yet"}</span>
              <div className={cx("bg-muted h-1.5 w-full")} role="presentation">
                <div className={cx("h-full transition-[width] duration-modal ease-out", tone.bar)} style={{ width: `${percent}%` }} />
              </div>
              <span className={cx("text-caption font-mono", tone.text)}>{percent}% complete</span>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
