import { describe, it, expect, vi } from "vitest";
import {
  MAX_INTERVIEW_TURNS,
  interviewInputSchema,
  questionCardSchema,
  type InterviewInput,
  type InterviewOutput,
} from "@zerocorp/contracts";
import { emptySlots, slotsFrom } from "@zerocorp/domain";
import type { AITextProvider, StructuredResponse } from "@zerocorp/application";
import { DeterministicInterviewer, extractDeterministically } from "./deterministic";
import { FallbackInterviewer, ModelInterviewer, enforceLimits } from "./model";
import { buildInterviewMessage } from "./prompt";

function input(over: Partial<InterviewInput> = {}): InterviewInput {
  return interviewInputSchema.parse({
    slots: emptySlots(),
    transcript: [],
    turnsRemaining: MAX_INTERVIEW_TURNS,
    ...over,
  });
}

describe("DeterministicInterviewer", () => {
  it("asks for the first missing slot", async () => {
    const out = await new DeterministicInterviewer().next(input());
    expect(out.next?.slot).toBe("business_description");
    expect(questionCardSchema.safeParse(out.next).success).toBe(true);
  });

  it("stops the moment every slot is filled, not one question later", async () => {
    const slots = slotsFrom({
      business_description: "a", current_situation: "b", company_situation: "none",
      twelve_month_goal: "c", target_markets: ["US"],
    });
    const out = await new DeterministicInterviewer().next(input({ slots, turnsRemaining: 5 }));
    expect(out.next).toBeNull();
  });

  it("confirms an inferred slot instead of asking again", async () => {
    // The difference between an interview and an interrogation.
    const slots = slotsFrom({ target_markets: ["FR"] }, { target_markets: "inferred" });
    const out = await new DeterministicInterviewer().next(input({ slots }));
    expect(out.next?.kind).toBe("confirm");
    expect(out.next?.slot).toBe("target_markets");
  });

  it("never asks a ninth question", async () => {
    const out = await new DeterministicInterviewer().next(input({ turnsRemaining: 0 }));
    expect(out.next).toBeNull();
  });

  it("produces one card of each kind across the five slots", async () => {
    // The four shapes the UI renders are all reachable, which is what the preview route
    // needs and what stops a kind existing in the contract and nowhere else.
    const kinds = new Set<string>();
    let answers: Record<string, unknown> = {};
    for (let i = 0; i < 5; i += 1) {
      const out = await new DeterministicInterviewer().next(input({ slots: slotsFrom(answers) }));
      if (!out.next) break;
      kinds.add(out.next.kind);
      answers = { ...answers, [out.next.slot!]: fakeAnswerFor(out.next.slot!) };
    }
    expect(kinds).toContain("free_text");
    expect(kinds).toContain("single_choice");
    expect(kinds).toContain("multi_choice");
  });
});

function fakeAnswerFor(slot: string): unknown {
  if (slot === "target_markets") return ["US"];
  if (slot === "company_situation") return "none";
  return "an answer";
}

describe("deterministic extraction reads only what is on the page", () => {
  it("reads a country named plainly", () => {
    expect(extractDeterministically("I am a developer in France")).toEqual({ target_markets: ["FR"] });
  });

  it("reads several", () => {
    const out = extractDeterministically("Selling to the United States and Germany");
    expect(out.target_markets?.sort()).toEqual(["DE", "US"]);
  });

  it("extracts nothing when nothing is named", () => {
    // A rules engine that guesses is a rules engine that is confidently wrong.
    expect(extractDeterministically("I want to grow a lot next year")).toEqual({});
  });
});

describe("the limits are enforced in code, not by asking the model nicely", () => {
  const card = { kind: "free_text", slot: "twelve_month_goal", question: "Where to?", suggestions: [] } as const;

  it("drops a question when the turn budget is spent", () => {
    // A model told it has zero turns left can still return a question. A cap that
    // depends on the model obeying it is not a cap.
    const out = enforceLimits({ extracted: {}, enrichment: {}, next: card } as InterviewOutput, input({ turnsRemaining: 0 }));
    expect(out.next).toBeNull();
  });

  it("drops a question about a slot that is already answered", () => {
    const slots = slotsFrom({ twelve_month_goal: "Ten clients" });
    const out = enforceLimits({ extracted: {}, enrichment: {}, next: card } as InterviewOutput, input({ slots }));
    expect(out.next).toBeNull();
  });

  it("allows a confirm on a slot that was only inferred", () => {
    const slots = slotsFrom({ twelve_month_goal: "Ten clients" }, { twelve_month_goal: "inferred" });
    const out = enforceLimits({ extracted: {}, enrichment: {}, next: card } as InterviewOutput, input({ slots }));
    expect(out.next).not.toBeNull();
  });

  it("leaves a legitimate question alone", () => {
    const out = enforceLimits({ extracted: {}, enrichment: {}, next: card } as InterviewOutput, input());
    expect(out.next).toEqual(card);
  });
});

function fakeProvider(responses: unknown[]): AITextProvider & { calls: number } {
  let calls = 0;
  return {
    provider: "fake",
    get calls() { return calls; },
    async generateStructured(): Promise<StructuredResponse> {
      const json = responses[calls] ?? responses[responses.length - 1];
      calls += 1;
      return { json, provider: "fake", model: "test", inputTokens: 800, outputTokens: 200, costMicros: 1_800 };
    },
  } as AITextProvider & { calls: number };
}

describe("ModelInterviewer", () => {
  const valid = { extracted: {}, enrichment: {}, next: { kind: "free_text", slot: "current_situation", question: "Where are you?", suggestions: [] } };

  it("returns a validated card and the run's real cost", async () => {
    const out = await new ModelInterviewer({ provider: fakeProvider([valid]) }).next(input());
    expect(out.next?.question).toBe("Where are you?");
    expect(out.costMicros).toBe(1_800);
  });

  it("retries once on invalid output, then fails without repairing", async () => {
    const provider = fakeProvider([{ garbage: 1 }]);
    await expect(new ModelInterviewer({ provider }).next(input())).rejects.toMatchObject({ reason: "invalid_output" });
    expect(provider.calls).toBe(2);
  });

  it("rejects an unknown question kind rather than rendering it", async () => {
    // The UI renders exactly four shapes. A fifth is a design decision, so the model
    // cannot invent one.
    const provider = fakeProvider([{ extracted: {}, enrichment: {}, next: { kind: "slider", slot: null, question: "How much?" } }]);
    await expect(new ModelInterviewer({ provider }).next(input())).rejects.toMatchObject({ reason: "invalid_output" });
  });
});

describe("FallbackInterviewer", () => {
  it("keeps the interview going when the model is down", async () => {
    const dead: AITextProvider = { provider: "dead", generateStructured: vi.fn(async () => { throw new Error("ECONNREFUSED"); }) };
    const reasons: string[] = [];
    const out = await new FallbackInterviewer(new ModelInterviewer({ provider: dead }), new DeterministicInterviewer(), (r) => reasons.push(r)).next(input());
    expect(out.next).not.toBeNull();
    expect(out.model).toBe("deterministic");
    expect(reasons).toEqual(["provider_unavailable"]);
  });
});

describe("the prompt", () => {
  it("shows the model which slots are already filled", async () => {
    // The whole no-repeat rule depends on it seeing this.
    const message = buildInterviewMessage(input({ slots: slotsFrom({ business_description: "x" }) }));
    expect(message).toContain("business_description: filled");
    expect(message).toContain("target_markets: EMPTY");
  });

  it("never asks the model for contact details", () => {
    expect(buildInterviewMessage(input())).not.toMatch(/email|phone|address/i);
  });
});
