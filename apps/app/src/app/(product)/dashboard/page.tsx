import { redirect } from "next/navigation";
import {
  ArticleIcon,
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
  MetricGrid,
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

const STATUS: Record<string, { label: string; tone: "success" | "processing" | "neutral" | "warning" }> = {
  done: { label: "Done", tone: "success" },
  in_progress: { label: "In progress", tone: "processing" },
  blocked: { label: "Needs you", tone: "warning" },
  pending: { label: "Not started", tone: "neutral" },
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

function StepRow({ step }: { step: PlanStepRow }) {
  const Icon = CATEGORY_ICON[step.category] ?? GearIcon;
  const status = STATUS[step.status] ?? STATUS.pending!;

  return (
    <li
      className={cx(
        "border-border hover:bg-accent flex items-start gap-4 border-b px-5 py-4 last:border-b-0",
        "transition-[background-color] duration-normal ease-out",
        !step.included && "opacity-55",
      )}
    >
      <span className="border-border text-muted-foreground flex size-9 shrink-0 items-center justify-center border">
        <Icon size={18} weight="regular" aria-hidden="true" />
      </span>
      <span className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cx("text-body-sm font-medium", !step.included && "line-through")}>{step.title}</span>
        <span className="text-body-sm text-muted-foreground">{step.outcome}</span>
      </span>
      <StatusBadge tone={step.included ? status.tone : "neutral"}>
        {step.included ? status.label : "Excluded"}
      </StatusBadge>
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
        /* The company name, not the business description. `businessName` holds the
           founder's own sentence about what they do, which the command bar already
           shows — printing it twice on one screen made the focal block read as an echo. */
        greeting={overview.companyName ?? "Your business"}
        headline={
          needsYou === 0
            ? `ZeroCorp is building your business. Nothing needs you right now.`
            : `${needsYou} steps are waiting on you`
        }
        blocked={blockedStep ? { label: blockedStep.title } : undefined}
        total={included.length}
        completed={done}
        current={runningIndex >= 0 ? runningIndex : undefined}
        actions={
          overview.companyStatus === "active" && overview.companyName ? (
            <StatusStamp milestone="formed" date={overview.companyName} />
          ) : (
            <StatusBadge tone="processing">{overview.companyName ?? "Company forming"}</StatusBadge>
          )
        }
      />

      <div className="mx-auto flex max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
        <MetricGrid
          items={[
            { label: "Launch progress", value: `${percent}%`, tone: percent >= 75 ? "success" : percent >= 50 ? "warning" : "danger" },
            { label: "Steps done", value: `${done}`, sub: `of ${included.length}`, tone: "info" },
            { label: "Needs you", value: `${needsYou}`, tone: needsYou > 0 ? "warning" : "neutral" },
          ]}
        />

        <section className="flex flex-col gap-4">
          <SectionHeader
            title="What ZeroCorp is building"
            count={included.length}
            countTone="processing"
          />
          <ul className="border-border border">
            {overview.steps.map((step) => (
              <StepRow key={step.id} step={step} />
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
