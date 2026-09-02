import type { OnboardingStepKey } from "@zerocorp/contracts";
import {
  BuildingsIcon,
  ChatCircleTextIcon,
  CompassIcon,
  MagnifyingGlassIcon,
  SealCheckIcon,
  StackIcon,
  TargetIcon,
  UsersThreeIcon,
} from "@phosphor-icons/react/dist/ssr";

/**
 * The eight questions, in the founder's language.
 *
 * Each one asks for a thing a person can say out loud, because the microphone is the
 * primary input. "Describe your ideal customer profile" is a form; "Who is the best
 * client you have ever had, and what made them the best?" is a question someone answers
 * in a sentence without stopping to think about what the field wants.
 *
 * The `why` line is not decoration. Eight questions is a lot to ask before anything is
 * built, and a founder who can see what each answer is FOR keeps going.
 */
export const STEP_COPY: Record<
  OnboardingStepKey,
  { title: string; help: string; why: string; placeholder: string; icon: typeof BuildingsIcon }
> = {
  business_name: {
    title: "What is the business called?",
    help: "The name you would say on a call. If you have not settled on one, say what you would use today.",
    why: "It goes on the site, the invoices and the company filing.",
    placeholder: "Northwind Studio",
    icon: BuildingsIcon,
  },
  description: {
    title: "In one sentence, what does it do?",
    help: "As if a friend asked. Skip the industry words.",
    why: "This is the sentence the homepage opens with.",
    placeholder: "I design brand identities for early-stage software companies.",
    icon: CompassIcon,
  },
  industry: {
    title: "What field is that in?",
    help: "Two or three words is plenty.",
    why: "It decides which templates, keywords and competitors ZeroCorp looks at.",
    placeholder: "Brand and design services",
    icon: StackIcon,
  },
  icp_description: {
    title: "Who is the best client you could have?",
    help: "Describe a real one if you have had one. Size, stage, what they were trying to do.",
    why: "Every prospect ZeroCorp finds is matched against this.",
    placeholder: "A funded seed-stage SaaS team, 5 to 20 people, rebranding before a launch.",
    icon: UsersThreeIcon,
  },
  positioning: {
    title: "Why do they choose you over the alternative?",
    help: "The honest reason, not the one that sounds good.",
    why: "This becomes the line that sits under your headline.",
    placeholder: "I have shipped 40 launches, so I know what breaks before it breaks.",
    icon: TargetIcon,
  },
  unique_selling_points: {
    title: "What proof do you have?",
    help: "Results, names, numbers, years. One per line.",
    why: "These are what the site and the outreach cite. Without them both sound like everyone else.",
    placeholder: "40+ brand launches shipped\n8 years in the field\nClients raised $60M after rebrand",
    icon: SealCheckIcon,
  },
  target_keywords: {
    title: "What should people find you for?",
    help: "The phrases someone types when they need what you do. One per line.",
    why: "The content plan and the SEO work are built from these.",
    placeholder: "brand identity for startups\nseed stage rebrand\nSaaS visual identity",
    icon: MagnifyingGlassIcon,
  },
  tone_of_voice: {
    title: "How should ZeroCorp sound when it writes as you?",
    help: "Say it the way you would brief a writer. Direct? Warm? Technical? Funny?",
    why: "Every article, email and post is written to this. It is the one that makes it sound like you.",
    placeholder: "Direct and warm. Short sentences. No jargon, and never salesy.",
    icon: ChatCircleTextIcon,
  },
};

/** The reveal headings, in the order the founder will check them. */
export const GROUP_COPY = {
  business: { title: "Your business", tone: "processing" as const },
  clients: { title: "Who you sell to", tone: "info" as const },
  markets: { title: "What you get found for", tone: "ai" as const },
  voice: { title: "How you sound", tone: "success" as const },
};
