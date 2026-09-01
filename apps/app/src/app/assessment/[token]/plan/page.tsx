import { notFound } from "next/navigation";
import { Alert, FocusedFlowLayout, StatusBadge } from "@zerocorp/ui";
import { getAssessmentService } from "../../../../server/container";
import { PlanEditor } from "./PlanEditor";

const RECOMMENDATION_LABEL = {
  form_new: "We recommend forming a company",
  use_existing: "Use the company you already have",
  none_needed: "You do not need a company yet",
  unavailable: "You likely need a company we cannot form yet",
} as const;

const RECOMMENDATION_TONE = {
  form_new: "processing",
  use_existing: "info",
  none_needed: "neutral",
  unavailable: "warning",
} as const;

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let data;
  try {
    data = await getAssessmentService().get(token);
  } catch {
    notFound();
  }

  const { plan } = data;
  if (!plan) {
    return (
      <FocusedFlowLayout width="reading">
        <Alert tone="warning" title="No plan yet">Finish your assessment first.</Alert>
      </FocusedFlowLayout>
    );
  }

  const { proposal } = plan;

  return (
    <FocusedFlowLayout width="reading">
      <div className="flex flex-col gap-3 pb-8">
        <p className="text-overline text-muted-foreground">Your ZeroCorp plan · version {plan.version}</p>
        <h1 className="text-h1 text-balance">{proposal.title}</h1>
        <p className="text-body text-muted-foreground max-w-prose">{proposal.summary}</p>
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <StatusBadge tone={RECOMMENDATION_TONE[proposal.companyRecommendation]}>
            {RECOMMENDATION_LABEL[proposal.companyRecommendation]}
          </StatusBadge>
          {proposal.recommendedEntityTypeCode ? (
            <span className="text-body-sm text-muted-foreground">
              {proposal.recommendedEntityTypeCode} · {proposal.recommendedJurisdictionCode}
            </span>
          ) : null}
        </div>
        <p className="text-body-sm text-muted-foreground max-w-prose pt-1">{proposal.recommendationReason}</p>
      </div>

      <PlanEditor token={token} proposal={proposal} deterministic={!process.env["ANTHROPIC_API_KEY"]} />
    </FocusedFlowLayout>
  );
}
