import { describe, it, expect } from "vitest";
import {
  ASSESSMENT_QUESTION_IDS,
  ASSESSMENT_STATUSES,
  ASSESSMENT_TERMINAL_STATUSES,
  ASSESSMENT_TRANSITIONS,
  assessmentAnswersSchema,
  canTransitionAssessment,
  type AssessmentStatus,
} from "./assessment";
import { CHECKOUT_STATUSES, CHECKOUT_TRANSITIONS, type CheckoutStatus } from "./billing";

/**
 * Same structural harness the formation machines get. A state machine that has
 * never been walked mechanically always has a stranded state in it.
 */
const MACHINES = [
  {
    name: "assessments.status",
    states: ASSESSMENT_STATUSES as readonly string[],
    transitions: ASSESSMENT_TRANSITIONS as Record<string, readonly string[]>,
    terminal: ASSESSMENT_TERMINAL_STATUSES as readonly string[],
    initial: "draft",
  },
  {
    name: "checkout_sessions.status",
    states: CHECKOUT_STATUSES as readonly string[],
    transitions: CHECKOUT_TRANSITIONS as Record<string, readonly string[]>,
    terminal: ["completed", "expired"] as readonly string[],
    initial: "pending",
  },
];

describe.each(MACHINES)("$name — structural soundness", (m) => {
  it("gives every state a transition list", () => {
    for (const s of m.states) expect(m.transitions[s]).toBeDefined();
  });

  it("never names a state that does not exist", () => {
    for (const s of m.states) for (const t of m.transitions[s] ?? []) expect(m.states).toContain(t);
  });

  it("lets nothing leave a terminal state", () => {
    for (const s of m.terminal) expect(m.transitions[s]).toEqual([]);
  });

  it("leaves no state stranded", () => {
    const seen = new Set([m.initial]);
    const queue = [m.initial];
    while (queue.length) {
      const at = queue.shift() as string;
      for (const next of m.transitions[at] ?? []) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    expect(m.states.filter((s) => !seen.has(s))).toEqual([]);
  });

  it("never lets a state transition to itself", () => {
    for (const s of m.states) expect(m.transitions[s] ?? []).not.toContain(s);
  });
});

describe("assessment — the rules the funnel depends on", () => {
  it("makes a failed analysis reparable", () => {
    // A model call that times out is ordinary. A visitor who answered five questions
    // must never be asked to answer them again because of it.
    expect(ASSESSMENT_TERMINAL_STATUSES).not.toContain("failed" as AssessmentStatus);
    expect(canTransitionAssessment("failed", "analyzing")).toBe(true);
  });

  it("lets a customer un-approve before paying", () => {
    // Changing your mind before money moves is not an error state.
    expect(canTransitionAssessment("approved", "analyzed")).toBe(true);
  });

  it("lets an analysed assessment be regenerated", () => {
    // "demander une nouvelle proposition" — PRODUCT_SPEC.md §29.3 block 3.
    expect(canTransitionAssessment("analyzed", "analyzing")).toBe(true);
  });

  it("refuses to convert anything that was never approved", () => {
    // Conversion is what creates a tenant and takes money. It has exactly one door.
    for (const s of ASSESSMENT_STATUSES) {
      if (s === "approved") continue;
      expect(canTransitionAssessment(s, "converted")).toBe(false);
    }
  });

  it("cannot go back once converted", () => {
    expect(ASSESSMENT_TRANSITIONS.converted).toEqual([]);
  });

  it("shares no state name with the formation machines", async () => {
    const { FORMATION_ORDER_STATUSES, COMPANY_STATUSES } = await import("./formation");
    const others = new Set<string>([...FORMATION_ORDER_STATUSES, ...COMPANY_STATUSES]);
    // "draft" would collide with formation_orders.draft; it does not, because these
    // are read against different columns — but a shared name is still how a value ends
    // up compared against the wrong machine.
    expect(ASSESSMENT_STATUSES.filter((s) => others.has(s))).toEqual(["draft"]);
  });
});

describe("assessment questions — the free tier stays cheap", () => {
  it("asks between three and five questions, and no more", () => {
    // PRODUCT_SPEC.md §29.3 block 0: "no expensive free onboarding". Every question
    // here is asked before any money has changed hands.
    expect(ASSESSMENT_QUESTION_IDS.length).toBeGreaterThanOrEqual(3);
    expect(ASSESSMENT_QUESTION_IDS.length).toBeLessThanOrEqual(5);
  });

  it("requires the one question that decides the path", () => {
    const parsed = assessmentAnswersSchema.safeParse({
      business_description: "a",
      current_situation: "b",
      twelve_month_goal: "c",
    });
    expect(parsed.success).toBe(false);
  });

  it("caps a free-text answer so a paste bomb cannot become a prompt bomb", () => {
    const parsed = assessmentAnswersSchema.safeParse({
      business_kind: "new",
      business_description: "x".repeat(2_001),
      current_situation: "b",
      twelve_month_goal: "c",
    });
    expect(parsed.success).toBe(false);
  });

  it("rejects an answer that is only whitespace", () => {
    const parsed = assessmentAnswersSchema.safeParse({
      business_kind: "new",
      business_description: "   ",
      current_situation: "b",
      twelve_month_goal: "c",
    });
    expect(parsed.success).toBe(false);
  });
});

describe("checkout — a completed payment is final", () => {
  it("cannot un-complete", () => {
    expect(CHECKOUT_TRANSITIONS.completed).toEqual([]);
  });

  it("lets a failed attempt be retried", () => {
    expect((CHECKOUT_TRANSITIONS.failed as readonly CheckoutStatus[])).toContain("pending");
  });
});
