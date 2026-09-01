import {
  MAX_INTERVIEW_TURNS,
  interviewOutputSchema,
  isCountryCode,
  type ExtractedSlots,
  type InterviewInput,
  type InterviewOutput,
  type QuestionCard,
  type SlotId,
} from "@zerocorp/contracts";

/**
 * The deterministic interviewer.
 *
 * Not a mock. It is the documented fallback when no model is configured or the model
 * path fails, it drives the preview route, and it is what lets the whole conversational
 * experience be built and reviewed with no key, no network and no cost.
 *
 * It is deliberately simple and deliberately honest: it asks for the next missing slot
 * in a fixed order and extracts only what can be read without judgement. It does not
 * pretend to understand a sentence.
 */

/**
 * Ask in the order a person would.
 *
 * What you do, then where you are, then the company question, then where you are going,
 * then which markets. Markets last because the answer is more considered once the rest
 * has been said out loud.
 */
const ORDER: SlotId[] = [
  "business_description",
  "current_situation",
  "company_situation",
  "twelve_month_goal",
  "target_markets",
];

const MARKET_OPTIONS = [
  { value: "us", label: "United States" },
  { value: "gb", label: "United Kingdom" },
  { value: "ca", label: "Canada" },
  { value: "au", label: "Australia" },
  { value: "fr", label: "France" },
  { value: "de", label: "Germany" },
  { value: "es", label: "Spain" },
  { value: "nl", label: "Netherlands" },
  { value: "ae", label: "United Arab Emirates" },
  { value: "sg", label: "Singapore" },
];

const CARDS: Record<SlotId, QuestionCard> = {
  business_description: {
    kind: "free_text",
    slot: "business_description",
    question: "What are you building?",
    help: "A sentence or two. Say it the way you would to a friend.",
    placeholder: "I design brand identities for early-stage software companies.",
    suggestions: [],
  },
  current_situation: {
    kind: "free_text",
    slot: "current_situation",
    question: "Where are you today?",
    help: "Clients, revenue, what exists already. Be blunt: a vague answer produces a vague plan.",
    placeholder: "Three clients, invoiced personally, no company and no website.",
    suggestions: ["Just an idea so far", "A few clients, nothing formal", "Running and growing"],
  },
  company_situation: {
    kind: "single_choice",
    slot: "company_situation",
    question: "Do you already have a company?",
    help: "If you do, we will not suggest you create another one.",
    options: [
      { value: "none", label: "No, I do not have one" },
      { value: "existing", label: "Yes, I have one already" },
      { value: "in_progress", label: "One is being set up right now" },
    ],
    allowsOther: false,
  },
  twelve_month_goal: {
    kind: "free_text",
    slot: "twelve_month_goal",
    question: "Where do you want to be in twelve months?",
    help: "The outcome, not the tactics. We will work out the tactics.",
    placeholder: "Ten retained clients and a site that sells while I sleep.",
    suggestions: [],
  },
  target_markets: {
    kind: "multi_choice",
    slot: "target_markets",
    question: "Where do you want to operate and sell?",
    help: "This decides which structures make sense for you.",
    options: MARKET_OPTIONS,
    min: 1,
    max: 10,
  },
};

/** Countries named plainly enough that reading them needs no judgement. */
const COUNTRY_WORDS: Record<string, string> = {
  "united states": "US", "the us": "US", " usa": "US", america: "US",
  "united kingdom": "GB", " uk ": "GB", britain: "GB", england: "GB",
  france: "FR", germany: "DE", spain: "ES", netherlands: "NL",
  canada: "CA", australia: "AU", singapore: "SG", "united arab emirates": "AE", dubai: "AE",
};

function extractMarkets(text: string): string[] | undefined {
  const haystack = ` ${text.toLowerCase()} `;
  const found = new Set<string>();
  for (const [word, code] of Object.entries(COUNTRY_WORDS)) {
    if (haystack.includes(word)) found.add(code);
  }
  const codes = [...found].filter(isCountryCode);
  return codes.length > 0 ? codes : undefined;
}

/**
 * Only what can be read without judgement.
 *
 * A named country is a fact on the page. "They probably sell to enterprises" is an
 * inference, and a rules engine that guesses is a rules engine that is confidently
 * wrong. That work belongs to the model, which is why the model path exists.
 */
export function extractDeterministically(answer: string): ExtractedSlots {
  const markets = extractMarkets(answer);
  return markets ? { target_markets: markets } : {};
}

export class DeterministicInterviewer {
  readonly kind = "deterministic" as const;

  async next(input: InterviewInput): Promise<InterviewOutput> {
    const lastAnswer = input.transcript.at(-1)?.answer ?? "";
    const extracted = extractDeterministically(lastAnswer);

    const missing = ORDER.filter((id) => !input.slots[id]?.filled);
    const outOfTurns = input.turnsRemaining <= 0 || input.transcript.length >= MAX_INTERVIEW_TURNS;

    // An inferred slot is CONFIRMED in one click rather than asked again. That is the
    // difference between an interview and an interrogation.
    const inferred = ORDER.find((id) => input.slots[id]?.source === "inferred");
    if (inferred && !outOfTurns) {
      return interviewOutputSchema.parse({
        extracted,
        enrichment: {},
        next: {
          kind: "confirm",
          slot: inferred,
          question: "Have I got this right?",
          statement: confirmationFor(inferred, input),
        },
        acknowledgement: "Got it.",
      });
    }

    const nextSlot = missing[0];
    return interviewOutputSchema.parse({
      extracted,
      enrichment: {},
      next: nextSlot === undefined || outOfTurns ? null : CARDS[nextSlot],
      ...(input.transcript.length > 0 ? { acknowledgement: "Understood." } : {}),
    });
  }
}

function confirmationFor(slot: SlotId, input: InterviewInput): string {
  const value = input.transcript.at(-1)?.answer ?? "";
  switch (slot) {
    case "target_markets":
      return `You want to sell in ${value}.`;
    case "company_situation":
      return "You do not have a company yet.";
    default:
      return value.slice(0, 200);
  }
}

/** The fixed opening question, for the first turn, with no model call — D18. */
export function openingCard(): QuestionCard {
  return CARDS.business_description;
}
