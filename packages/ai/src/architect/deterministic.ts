import {
  architectOutputSchema,
  type ArchitectEntityOption,
  type ArchitectInput,
  type ArchitectRun,
  type CompanyRecommendation,
  type PlanCategory,
  type PlanStep,
} from "@zerocorp/contracts";
import type { BusinessArchitect } from "@zerocorp/application";

/**
 * The deterministic Business Architect — ADR 0002, "Fallbacks".
 *
 * NOT a mock. It is a real fallback path with real tests, and it is what makes the whole
 * funnel demonstrable and testable with no API key, no network and no cost. Every
 * assertion it makes is derived from something the visitor actually said or from the
 * catalog; it invents nothing.
 *
 * It is honest about what it is. `deterministic: true` travels with the run, and the UI
 * is required to label it. Presenting a rules-based summary as an AI analysis would be
 * the exact dishonesty this repository keeps refusing elsewhere.
 */

const MAX_LINE = 160;
const MAX_PARAGRAPH = 900;

/** Cuts at a word boundary rather than mid-word, and never exceeds the schema limit. */
function clamp(text: string, limit: number): string {
  const clean = text.trim().replace(/\s+/g, " ");
  if (clean.length <= limit) return clean;
  const cut = clean.slice(0, limit - 1);
  const lastSpace = cut.lastIndexOf(" ");
  return `${(lastSpace > limit * 0.6 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
}

function firstSentence(text: string): string {
  const match = /^(.+?[.!?])(\s|$)/.exec(text.trim());
  return (match?.[1] ?? text).trim();
}

function recommendationFor(input: ArchitectInput): CompanyRecommendation {
  switch (input.answers.company_situation) {
    case "existing":
      return "use_existing";
    // A company already being formed elsewhere does not need a second one.
    case "in_progress":
      return "none_needed";
    case "none":
      return "form_new";
  }
}

/** The first eligible entity in a market the founder actually named, else any eligible one. */
function pickEntity(input: ArchitectInput): ArchitectEntityOption | null {
  const eligible = input.catalog.filter((c) => c.eligible);
  const excluded = new Set(
    input.constraints.filter((c) => c.kind === "exclude_jurisdiction").map((c) => c.jurisdictionCode),
  );
  const allowed = eligible.filter((c) => !excluded.has(c.jurisdictionCode));
  const inMarket = allowed.find((c) =>
    input.answers.target_markets.some((m) => c.jurisdictionCode.toUpperCase().startsWith(m)),
  );
  return inMarket ?? allowed[0] ?? null;
}

interface Template {
  key: string;
  title: string;
  outcome: string;
  rationale: string;
  phase: PlanStep["phase"];
  category: PlanCategory;
  priority: 1 | 2 | 3;
}

function templates(input: ArchitectInput, entity: ArchitectEntityOption | null): Template[] {
  const markets = input.answers.target_markets.join(", ");
  const steps: Template[] = [];

  if (entity) {
    steps.push({
      key: "form_company",
      title: `Form your ${entity.customerLabel}`,
      outcome: `A registered company you can invoice and bank through`,
      rationale: clamp(
        `You said you sell into ${markets} and have no company yet. ` +
          (entity.automationLevel === "automated"
            ? "This filing is automated."
            : "A ZeroCorp operator files this for you; it is not automated."),
        MAX_PARAGRAPH,
      ),
      phase: "build",
      category: "company",
      priority: 1,
    });
  }

  steps.push(
    {
      key: "brand_foundation",
      title: "Set your positioning and brand basics",
      outcome: "A name, a positioning line and a look everything else is built from",
      rationale: clamp(
        "Every page, article and email you publish afterwards has to say the same thing. " +
          "Deciding it once is what stops the site and the content disagreeing.",
        MAX_PARAGRAPH,
      ),
      phase: "plan",
      category: "brand",
      priority: 1,
    },
    {
      key: "domain",
      title: "Register and connect your domain",
      outcome: "A domain you own, with working DNS and SSL",
      rationale: clamp(
        "The site and the email both need it, and email warm-up takes weeks, so it goes early.",
        MAX_PARAGRAPH,
      ),
      phase: "build",
      category: "domain",
      priority: 1,
    },
    {
      key: "website",
      title: "Build and publish your website",
      outcome: "A live site that explains what you do and lets someone contact you",
      rationale: clamp(
        `You told us: ${clamp(firstSentence(input.answers.business_description), 200)} ` +
          "The site has to make that legible to someone who has never met you.",
        MAX_PARAGRAPH,
      ),
      phase: "build",
      category: "website",
      priority: 1,
    },
    {
      key: "email_infrastructure",
      title: "Set up email that reaches the inbox",
      outcome: "A professional address with SPF, DKIM and DMARC configured, warmed up",
      rationale: clamp(
        "Sending from a new domain without warm-up puts you in spam, and reputation is " +
          "much harder to repair than to build.",
        MAX_PARAGRAPH,
      ),
      phase: "launch",
      category: "email",
      priority: 2,
    },
    {
      key: "seo_foundation",
      title: "Decide what you want to be found for",
      outcome: "A keyword strategy and the technical SEO to support it",
      rationale: clamp(
        `Being found in ${markets} starts with choosing the handful of things worth ranking for.`,
        MAX_PARAGRAPH,
      ),
      phase: "launch",
      category: "seo",
      priority: 2,
    },
    {
      key: "content_engine",
      title: "Start publishing on a schedule",
      outcome: "An editorial calendar and articles going out without you writing them",
      rationale: clamp(
        "Search results follow consistency more than volume. A schedule you keep beats a burst you abandon.",
        MAX_PARAGRAPH,
      ),
      phase: "find_customers",
      category: "content",
      priority: 2,
    },
    {
      key: "first_prospects",
      title: "Build your first prospect list",
      outcome: "A filtered list of companies that match who you sell to, exportable",
      rationale: clamp(
        `You said you want ${clamp(firstSentence(input.answers.twelve_month_goal), 200)} ` +
          "That needs prospects, not just a website.",
        MAX_PARAGRAPH,
      ),
      phase: "find_customers",
      category: "leads",
      priority: 2,
    },
  );

  return steps;
}

const REASONS: Record<CompanyRecommendation, string> = {
  form_new: "You have no company and you are selling. That is the first thing to fix.",
  use_existing: "You already have a company. Nothing here needs a second one.",
  none_needed: "You do not need a new company for this yet. The rest of the plan does not depend on one.",
  unavailable:
    "You likely need a company, and ZeroCorp cannot form one in the markets you named yet. " +
    "Everything else in this plan still applies, and we will tell you when we can help with the entity.",
};

export class DeterministicArchitect implements BusinessArchitect {
  readonly kind = "deterministic" as const;

  async analyze(input: ArchitectInput): Promise<ArchitectRun> {
    const wanted = recommendationFor(input);
    const entity = wanted === "form_new" ? pickEntity(input) : null;
    // They have no company and nothing in the catalog is open to them. Saying
    // "none_needed" here would be a lie: they may well need one, and we cannot form it.
    const recommendation: CompanyRecommendation =
      wanted === "form_new" && entity === null ? "unavailable" : wanted;
    const markets = input.answers.target_markets.join(", ");

    const skipped = new Set(
      input.constraints.filter((c) => c.kind === "skip_category").map((c) => c.category),
    );
    const owned = new Set(
      input.constraints.filter((c) => c.kind === "already_have").map((c) => c.category),
    );

    const steps: PlanStep[] = templates(input, entity)
      .filter((t) => !skipped.has(t.category))
      .map((t, i) => ({
        key: t.key,
        title: clamp(t.title, MAX_LINE),
        outcome: clamp(t.outcome, MAX_LINE),
        rationale: t.rationale,
        phase: t.phase,
        category: t.category,
        // A category the founder already has stays in the plan, excluded, so a later
        // regeneration does not resurrect it and they can see it was considered.
        included: !owned.has(t.category),
        priority: t.priority,
        ...(i === -1 ? {} : {}),
      }));

    const gaps = [
      ...(recommendation === "form_new"
        ? [
            {
              title: clamp("No legal entity to sell through", MAX_LINE),
              why: clamp(
                `You are selling into ${markets} without a company. That limits who will contract ` +
                  "with you and how you get paid.",
                MAX_PARAGRAPH,
              ),
              severity: "blocking" as const,
            },
          ]
        : []),
      {
        title: clamp("No site you control", MAX_LINE),
        why: clamp(
          "Everything else here points somewhere. Without a site of your own, the pointing has no destination.",
          MAX_PARAGRAPH,
        ),
        severity: "blocking" as const,
      },
      {
        title: clamp("No way to be found by someone who is not already looking for you", MAX_LINE),
        why: clamp(
          "Referrals do not compound. Search and outbound do, and both take months to start, which is why they start now.",
          MAX_PARAGRAPH,
        ),
        severity: "important" as const,
      },
    ];

    const output = architectOutputSchema.parse({
      analysis: {
        headline: clamp(firstSentence(input.answers.business_description), MAX_LINE),
        whereYouAre: clamp(input.answers.current_situation, MAX_PARAGRAPH),
        whereYouWantToGo: clamp(
          `${input.answers.twelve_month_goal} Operating and selling in ${markets}.`,
          MAX_PARAGRAPH,
        ),
        whatIsMissing: gaps,
      },
      plan: {
        // Not "ZeroCorp plan for <their whole first sentence>". That title becomes the
        // page heading right underneath the business name, and reading the same sentence
        // twice in a row makes the screen look like a template that failed to fill in.
        title: recommendation === "form_new" ? "Your launch plan" : "Your activation plan",
        summary: clamp(
          `${steps.filter((s) => s.included).length} steps, from ` +
            `${entity ? "forming your company" : "your existing setup"} to a first list of prospects.`,
          MAX_PARAGRAPH,
        ),
        companyRecommendation: recommendation,
        recommendedJurisdictionCode: entity?.jurisdictionCode ?? null,
        recommendedEntityTypeCode: entity?.entityTypeCode ?? null,
        recommendedSetupPath: recommendation === "form_new" ? "launch" : "activation",
        // The deterministic path never upsells. Choosing the middle plan by rule would
        // be a commercial decision made by a fallback, which is not where those belong.
        recommendedSubscriptionPlan: "launch",
        recommendationReason: clamp(REASONS[recommendation], MAX_PARAGRAPH),
        steps,
        constraints: input.constraints,
        decisions: [],
      },
    });

    return {
      output,
      usage: {
        provider: "zerocorp",
        model: "deterministic",
        inputTokens: 0,
        outputTokens: 0,
        costMinor: 0,
        durationMs: 0,
      },
      attempts: 1,
      deterministic: true,
    };
  }
}
