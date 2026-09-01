import { redirect } from "next/navigation";
import {
  ArticleIcon,
  BrowserIcon,
  BuildingsIcon,
  CheckIcon,
  ClockIcon,
  EnvelopeSimpleIcon,
  GearIcon,
  GlobeHemisphereWestIcon,
  MagnifyingGlassIcon,
  PaletteIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader, StatusBadge, cx } from "@zerocorp/ui";
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

function Metric({ label, value, tone }: { label: string; value: string; tone?: string }) {
  return (
    <div className="bg-background flex flex-col gap-1 p-5">
      <span className="text-overline text-muted-foreground">{label}</span>
      {/* A quantity is never black. The rule the whole dashboard follows. */}
      <span className={cx("text-h2 font-mono tabular-nums", tone ?? "text-chart-1")}>{value}</span>
    </div>
  );
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
      <>
        <PageHeader title="Overview" subtitle="Nothing here yet" />
        <div className="px-5 py-8 sm:px-8">
          <p className="text-body-sm text-muted-foreground">
            Your business is being set up. This page fills in as ZeroCorp works.
          </p>
        </div>
      </>
    );
  }

  const included = overview.steps.filter((s) => s.included);
  const done = included.filter((s) => s.status === "done").length;
  const percent = included.length === 0 ? 0 : Math.round((done / included.length) * 100);
  const tone = progressTone(percent);
  const needsYou = included.filter((s) => s.status === "blocked").length;

  return (
    <>
      <PageHeader
        title={overview.businessName}
        subtitle={overview.planTitle ?? "Your ZeroCorp plan"}
        meta={
          overview.companyStatus ? (
            <StatusBadge tone={overview.companyStatus === "active" ? "success" : "processing"}>
              {overview.companyName ?? "Company"}
            </StatusBadge>
          ) : (
            <StatusBadge tone="neutral">No company yet</StatusBadge>
          )
        }
      />

      <div className="flex flex-col gap-8 px-5 py-8 sm:px-8">
        <section className="flex flex-col gap-4">
          <div className="border-border bg-border grid grid-cols-2 gap-px border lg:grid-cols-4">
            <Metric label="Launch progress" value={`${percent}%`} tone={tone.text} />
            <Metric label="Steps done" value={`${done} / ${included.length}`} tone="text-chart-3" />
            <Metric
              label="Needs you"
              value={`${needsYou}`}
              tone={needsYou > 0 ? "text-warning-ink" : "text-muted-foreground"}
            />
            <Metric label="Plan" value={overview.subscriptionPlan ?? "—"} tone="text-chart-5" />
          </div>

          <div className="bg-muted h-1.5 w-full" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
            <div className={cx("h-full transition-[width] duration-modal ease-out", tone.bar)} style={{ width: `${percent}%` }} />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <div className="flex items-baseline justify-between gap-4">
            <h2 className="text-h3">What ZeroCorp is building</h2>
            <span className="text-body-sm text-muted-foreground font-mono tabular-nums">
              {included.length} steps
            </span>
          </div>
          <ul className="border-border border">
            {overview.steps.map((step) => (
              <StepRow key={step.id} step={step} />
            ))}
          </ul>
        </section>

        <section className="flex flex-col gap-4">
          <h2 className="text-h3">Recent activity</h2>
          {overview.activity.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">Nothing has happened yet.</p>
          ) : (
            <ul className="border-border flex flex-col border">
              {overview.activity.map((event) => (
                <li key={event.id} className="border-border flex items-center gap-4 border-b px-5 py-3 last:border-b-0">
                  <span className="text-chart-1 flex size-7 shrink-0 items-center justify-center">
                    {event.eventType === "tenant.created" ? <CheckIcon size={16} /> : <ClockIcon size={16} />}
                  </span>
                  <span className="text-body-sm flex-1 truncate">{event.eventType.replace(/\./g, " ")}</span>
                  <time className="text-caption text-muted-foreground font-mono tabular-nums">
                    {event.createdAt.toISOString().slice(0, 10)}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
