import { architectOutputSchema, type ArchitectOutput } from "@zerocorp/contracts";

/**
 * A fixed plan for the gallery.
 *
 * Parsed through the real schema, so a contract change breaks this page rather than
 * leaving a preview that shows a shape the product can no longer produce.
 */
export const SAMPLE_PLAN: ArchitectOutput = architectOutputSchema.parse({
  analysis: {
    headline: "A solo brand designer billing three US clients from a personal account",
    whereYouAre:
      "You design brand identities for early-stage software companies. Three clients pay you, all through a personal account, and there is no company, no site and nothing that brings you work you did not already know about.",
    whereYouWantToGo:
      "Ten retained clients and a site that sells while you sleep. Operating and selling in the United States and the United Kingdom.",
    whatIsMissing: [
      {
        title: "No legal entity to sell through",
        why: "You are selling into the US and the UK without a company. That limits who will contract with you, and it is the first question a larger client asks.",
        severity: "blocking",
      },
      {
        title: "No site you control",
        why: "Everything else here points somewhere. Without a site of your own, the pointing has no destination.",
        severity: "blocking",
      },
      {
        title: "No way to be found by someone not already looking for you",
        why: "Referrals do not compound. Search and outbound do, and both take months to start, which is why they start now.",
        severity: "important",
      },
    ],
  },
  plan: {
    title: "ZeroCorp plan for a brand identity studio",
    summary: "Seven steps, from forming your company to a first list of prospects who match the clients you already enjoy.",
    companyRecommendation: "form_new",
    recommendedJurisdictionCode: "us-wy",
    recommendedEntityTypeCode: "us_llc",
    recommendedSetupPath: "launch",
    recommendedSubscriptionPlan: "growth",
    recommendationReason:
      "You need the content engine, which the launch plan does not include. Everything you sell is bought after someone reads something you wrote.",
    steps: [
      { key: "form_company", title: "Form your Wyoming LLC", outcome: "A registered US company you can invoice and bank through", rationale: "You already bill US clients personally. A US entity removes the question larger clients ask before signing, and it is what a US bank account requires. A ZeroCorp operator files this; it is not automated.", phase: "build", category: "company", included: true, priority: 1 },
      { key: "brand_foundation", title: "Set your positioning and brand basics", outcome: "A positioning line and a look everything else is built from", rationale: "You sell brand identity. A studio whose own positioning is vague is the hardest possible sale, and every page and article afterwards has to say the same thing.", phase: "plan", category: "brand", included: true, priority: 1 },
      { key: "domain", title: "Register and connect your domain", outcome: "A domain you own, with working DNS and SSL", rationale: "The site and the email both need it, and email warm-up takes weeks, so it goes early rather than when it is needed.", phase: "build", category: "domain", included: true, priority: 1 },
      { key: "website", title: "Build and publish your website", outcome: "A live site that shows the work and lets someone start a conversation", rationale: "Three clients found you by referral. A site is what lets the fourth find you without an introduction.", phase: "build", category: "website", included: true, priority: 1 },
      { key: "email_infrastructure", title: "Set up email that reaches the inbox", outcome: "A professional address with SPF, DKIM and DMARC, warmed up", rationale: "Sending from a new domain without warm-up puts you in spam, and reputation is much harder to repair than to build.", phase: "launch", category: "email", included: true, priority: 2 },
      { key: "content_engine", title: "Start publishing on a schedule", outcome: "An editorial calendar and articles going out without you writing them", rationale: "Founders buy brand work after reading someone who clearly thinks about it. Consistency matters more than volume here.", phase: "find_customers", category: "content", included: true, priority: 2 },
      { key: "first_prospects", title: "Build your first prospect list", outcome: "A filtered list of early-stage software companies, exportable", rationale: "Ten retained clients needs a pipeline, not a website. This is where the pipeline starts.", phase: "find_customers", category: "leads", included: true, priority: 2 },
    ],
    constraints: [],
    decisions: [],
  },
});
