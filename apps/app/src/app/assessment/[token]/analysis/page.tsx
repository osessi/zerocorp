import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowRightIcon, WarningIcon, TargetIcon, MapPinIcon } from "@phosphor-icons/react/dist/ssr";
import { Alert, ButtonLink, FocusedFlowLayout, StatusBadge } from "@zerocorp/ui";
import type { AnalysisGap } from "@zerocorp/contracts";
import { getAssessmentService } from "../../../../server/container";

/**
 * Where you are · Where you want to go · What is missing.
 *
 * The three panels the funnel promised. A Server Component: it reads through the use
 * case and renders. No business logic here — ARCHITECTURE.md §3.
 */

const SEVERITY_TONE = {
  blocking: "danger",
  important: "warning",
  nice_to_have: "info",
} as const;

const SEVERITY_LABEL = {
  blocking: "Blocking",
  important: "Important",
  nice_to_have: "Worth doing",
} as const;

function Panel({
  icon: Icon,
  eyebrow,
  children,
}: {
  icon: typeof MapPinIcon;
  eyebrow: string;
  children: React.ReactNode;
}) {
  return (
    <section className="border-border border-t py-8">
      <div className="flex items-center gap-2 pb-3">
        <Icon size={16} className="text-muted-foreground" weight="regular" />
        <h2 className="text-overline text-muted-foreground">{eyebrow}</h2>
      </div>
      {children}
    </section>
  );
}

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let data;
  try {
    data = await getAssessmentService().get(token);
  } catch {
    notFound();
  }

  const { assessment, plan } = data;
  if (!assessment.analysis) {
    return (
      <FocusedFlowLayout width="reading">
        <Alert tone="warning" title="Your assessment is not ready">
          {assessment.status === "failed"
            ? "We could not finish it. Your answers are saved, so you can try again."
            : "It is still being prepared. Refresh in a moment."}
        </Alert>
      </FocusedFlowLayout>
    );
  }

  const { analysis } = assessment;

  return (
    <FocusedFlowLayout
      width="reading"
      forward={
        plan ? (
          <ButtonLink
            as={Link}
            href={`/assessment/${token}/plan`}
            variant="primary"
            icon={ArrowRightIcon}
            iconPosition="end"
          >
            See your plan
          </ButtonLink>
        ) : null
      }
    >
      <div className="flex flex-col gap-2 pb-4">
        <p className="text-overline text-muted-foreground">Your assessment</p>
        <h1 className="text-h1 text-balance">{analysis.headline}</h1>
      </div>

      <Panel icon={MapPinIcon} eyebrow="Where you are">
        <p className="text-body max-w-prose">{analysis.whereYouAre}</p>
      </Panel>

      <Panel icon={TargetIcon} eyebrow="Where you want to go">
        <p className="text-body max-w-prose">{analysis.whereYouWantToGo}</p>
      </Panel>

      <Panel icon={WarningIcon} eyebrow="What is missing">
        <ul className="flex flex-col gap-2">
          {analysis.whatIsMissing.map((gap: AnalysisGap) => (
            <li key={gap.title} className="border-border flex flex-col gap-2 border p-5">
              <div className="flex flex-wrap items-center gap-3">
                <h3 className="text-h4">{gap.title}</h3>
                <StatusBadge tone={SEVERITY_TONE[gap.severity]}>{SEVERITY_LABEL[gap.severity]}</StatusBadge>
              </div>
              <p className="text-body-sm text-muted-foreground max-w-prose">{gap.why}</p>
            </li>
          ))}
        </ul>
      </Panel>
    </FocusedFlowLayout>
  );
}
