import { notFound } from "next/navigation";
import { CheckIcon } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Alert, ButtonLink, FocusedFlowLayout, StatusBadge } from "@zerocorp/ui";
import { DEFAULT_PRICING, setupPrice, subscriptionPrice } from "@zerocorp/config";
import { formatMoney } from "@zerocorp/contracts";
import { getAssessmentService } from "../../../../server/container";

/**
 * The price of the recommended path.
 *
 * The path is DERIVED from the approved plan on the server, never sent by the client.
 * A price the browser can choose is a price the browser can lower.
 *
 * Prices come from @zerocorp/config, which is where PRODUCT_SPEC.md §29.3 requires them
 * to live: every one is a hypothesis to validate, and validating one has to be an edit
 * to configuration rather than a change to code.
 */

const PLAN_LABEL = { launch: "Launch", growth: "Growth", autopilot: "Autopilot" } as const;

export default async function Page({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;

  let data;
  try {
    data = await getAssessmentService().get(token);
  } catch {
    notFound();
  }

  const { assessment, plan } = data;
  if (!plan) notFound();

  const { proposal } = plan;
  const path = proposal.recommendedSetupPath;
  const setup = setupPrice(DEFAULT_PRICING, path);
  const subscription = subscriptionPrice(DEFAULT_PRICING, proposal.recommendedSubscriptionPlan);
  const included = proposal.steps.filter((s) => s.included);

  return (
    <FocusedFlowLayout
      width="reading"
      forward={
        <ButtonLink as={Link} href={`/welcome/${token}`} variant="primary" icon={CheckIcon}>
          Create my account
        </ButtonLink>
      }
    >
      <div className="flex flex-col gap-3 pb-8">
        <p className="text-overline text-muted-foreground">Your plan is approved</p>
        <h1 className="text-h1 text-balance">
          {path === "launch" ? "Business Launch Setup" : "Business Activation Setup"}
        </h1>
        <p className="text-body text-muted-foreground max-w-prose">{proposal.recommendationReason}</p>
      </div>

      <div className="border-border grid grid-cols-1 gap-px border bg-border sm:grid-cols-2">
        <section className="bg-background flex flex-col gap-2 p-6">
          <p className="text-overline text-muted-foreground">One-time setup</p>
          <p className="text-h1 font-mono tabular-nums">{formatMoney(setup)}</p>
          <p className="text-body-sm text-muted-foreground">
            {included.length} steps, from where you are today to a first list of prospects.
          </p>
        </section>
        <section className="bg-background flex flex-col gap-2 p-6">
          <p className="text-overline text-muted-foreground">Then, monthly</p>
          <p className="text-h1 font-mono tabular-nums">
            {formatMoney(subscription)}
            <span className="text-body-sm text-muted-foreground font-sans"> / month</span>
          </p>
          <div className="pt-1">
            <StatusBadge tone="info">{PLAN_LABEL[proposal.recommendedSubscriptionPlan]} plan</StatusBadge>
          </div>
        </section>
      </div>

      <section className="border-border border-t pt-8">
        <h2 className="text-overline text-muted-foreground pb-4">What you approved</h2>
        <ul className="flex flex-col gap-3">
          {included.map((step) => (
            <li key={step.key} className="flex gap-3">
              <CheckIcon size={16} weight="regular" className="text-success mt-1 shrink-0" />
              <div className="flex min-w-0 flex-col">
                <span className="text-body-sm">{step.title}</span>
                <span className="text-caption text-muted-foreground">{step.outcome}</span>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <div className="pt-8">
        <Alert tone="warning" title="No payment is taken yet">
          Card payment is not connected in this build. Everything else is real: the
          assessment, the analysis, the plan and the approval are stored, and creating your
          account gives you the product with the plan you just approved.
          {assessment.contactEmail ? " Your email is already on file." : ""}
        </Alert>
      </div>
    </FocusedFlowLayout>
  );
}
