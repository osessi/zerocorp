import { describe, it, expect } from "vitest";
import { MAX_INTERVIEW_TURNS, type SlotId } from "@zerocorp/contracts";
import { emptySlots, filledCount, isComplete, mergeExtraction, missingSlots, shouldStop, slotsFrom } from "./slots";

const FULL = {
  business_description: "I design brand identities for early-stage software companies.",
  current_situation: "Three clients, invoiced personally.",
  company_situation: "none" as const,
  twelve_month_goal: "Ten retained clients.",
  target_markets: ["US", "GB"],
};

describe("slot state is derived, never tracked in parallel", () => {
  it("starts empty", () => {
    expect(filledCount(emptySlots())).toBe(0);
    expect(missingSlots(emptySlots())).toHaveLength(5);
  });

  it("counts a slot filled only when it would pass the assessment's own schema", () => {
    // A slot is not filled because something was written into it. Whitespace, an empty
    // market list or a bad country code all fail the analysis later, so they are not
    // "understood" now.
    expect(filledCount(slotsFrom({ business_description: "   " }))).toBe(0);
    expect(filledCount(slotsFrom({ target_markets: [] }))).toBe(0);
    expect(filledCount(slotsFrom({ target_markets: ["UK"] }))).toBe(0);
    expect(filledCount(slotsFrom({ target_markets: ["GB"] }))).toBe(1);
  });

  it("reaches five on a complete answer set", () => {
    expect(filledCount(slotsFrom(FULL))).toBe(5);
    expect(isComplete(slotsFrom(FULL))).toBe(true);
  });

  it("does not call an inferred slot complete", () => {
    // We guessed. Until it is confirmed, the interview is not finished.
    const slots = slotsFrom(FULL, { company_situation: "inferred" });
    expect(filledCount(slots)).toBe(5);
    expect(isComplete(slots)).toBe(false);
  });
});

describe("stopping", () => {
  it("keeps going while a slot is missing and budget remains", () => {
    expect(shouldStop(slotsFrom({ business_description: "x" }), 1)).toEqual({ done: false });
  });

  it("stops as soon as every slot is filled, even with budget left", () => {
    // The point is the fewest questions, not the most.
    expect(shouldStop(slotsFrom(FULL), 1)).toEqual({ done: true, reason: "complete" });
  });

  it("distinguishes running out of turns from being finished", () => {
    // Three different things to show a visitor. A boolean would show a budget limit as
    // a failure.
    const stop = shouldStop(slotsFrom({ business_description: "x" }), MAX_INTERVIEW_TURNS);
    expect(stop).toMatchObject({ done: true, reason: "cannot_proceed" });
    expect((stop as { missing: SlotId[] }).missing).toContain("target_markets");
  });

  it("never allows a ninth question", () => {
    expect(shouldStop(emptySlots(), MAX_INTERVIEW_TURNS + 5).done).toBe(true);
  });
});

describe("extraction never overwrites what the visitor said", () => {
  it("fills an empty slot from an inference", () => {
    const { answers, inferred } = mergeExtraction({}, { company_situation: "none" }, new Set());
    expect(answers.company_situation).toBe("none");
    expect(inferred).toEqual(["company_situation"]);
  });

  it("refuses to overwrite a slot the visitor stated", () => {
    // A model reading "three clients in France" and rewriting an explicitly chosen
    // market list is the failure this guards. Their words outrank an inference from them.
    const stated = new Set<SlotId>(["target_markets"]);
    const { answers, inferred } = mergeExtraction(
      { target_markets: ["US"] },
      { target_markets: ["FR"] },
      stated,
    );
    expect(answers.target_markets).toEqual(["US"]);
    expect(inferred).toEqual([]);
  });

  it("refuses to overwrite anything already present, stated or not", () => {
    const { inferred } = mergeExtraction({ business_description: "mine" }, { business_description: "theirs" }, new Set());
    expect(inferred).toEqual([]);
  });

  it("ignores a slot the extraction did not mention", () => {
    const { answers } = mergeExtraction({}, {}, new Set());
    expect(Object.keys(answers)).toEqual([]);
  });
});
