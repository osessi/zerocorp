import { describe, it, expect } from "vitest";
import {
  COMPANY_STATUSES,
  COMPANY_TERMINAL,
  COMPANY_TRANSITIONS,
  EIN_STATUSES,
  EIN_TERMINAL,
  EIN_TRANSITIONS,
  FORMATION_ORDER_STATUSES,
  FORMATION_ORDER_TERMINAL,
  FORMATION_ORDER_TRANSITIONS,
  canTransitionCompany,
  canTransitionEin,
  canTransitionOrder,
  type CompanyStatus,
  type EinStatus,
  type FormationOrderStatus,
} from "./formation.js";

/**
 * D2, decided 2026-08-31. These tests exist because the repository carried three
 * different formation state lists for months and no mechanical check could tell that
 * they disagreed.
 */

type Machine<S extends string> = {
  name: string;
  states: readonly S[];
  transitions: Record<S, readonly S[]>;
  terminal: readonly S[];
  initial: S;
};

const MACHINES = [
  {
    name: "formation_orders.status",
    states: FORMATION_ORDER_STATUSES,
    transitions: FORMATION_ORDER_TRANSITIONS,
    terminal: FORMATION_ORDER_TERMINAL,
    initial: "draft",
  } as Machine<FormationOrderStatus>,
  {
    name: "companies.status",
    states: COMPANY_STATUSES,
    transitions: COMPANY_TRANSITIONS,
    terminal: COMPANY_TERMINAL,
    initial: "pending",
  } as Machine<CompanyStatus>,
  {
    name: "ein_status",
    states: EIN_STATUSES,
    transitions: EIN_TRANSITIONS,
    terminal: EIN_TERMINAL,
    initial: "not_started",
  } as Machine<EinStatus>,
];

describe.each(MACHINES)("$name — structural soundness", (m) => {
  it("gives every state a transition list", () => {
    for (const s of m.states) expect(m.transitions[s]).toBeDefined();
  });

  it("never names a state that does not exist", () => {
    for (const s of m.states) {
      for (const target of m.transitions[s]) {
        expect(m.states).toContain(target);
      }
    }
  });

  it("lets nothing leave a terminal state", () => {
    for (const s of m.terminal) expect(m.transitions[s]).toEqual([]);
  });

  it("leaves no state stranded — every one is reachable from the initial state", () => {
    // A state nobody can reach is a state nobody implemented, and it will be discovered
    // by a support ticket rather than by a test.
    const seen = new Set<string>([m.initial]);
    const queue = [m.initial as string];
    while (queue.length) {
      const at = queue.shift() as (typeof m.states)[number];
      for (const next of m.transitions[at]) {
        if (!seen.has(next)) {
          seen.add(next);
          queue.push(next);
        }
      }
    }
    expect([...m.states].filter((s) => !seen.has(s))).toEqual([]);
  });

  it("lets every non-terminal state go somewhere", () => {
    for (const s of m.states) {
      if (m.terminal.includes(s)) continue;
      expect(m.transitions[s].length).toBeGreaterThan(0);
    }
  });

  it("never lets a state transition to itself", () => {
    for (const s of m.states) expect(m.transitions[s]).not.toContain(s);
  });
});

describe("formation order — the rules D2 was decided on", () => {
  it("makes rejection reparable, not terminal", () => {
    // A state rejecting a filing is ordinary — a PO box as the agent address, a name
    // already taken. None of the three earlier lists had this state at all, so a
    // rejection had nowhere to go.
    expect(FORMATION_ORDER_TERMINAL).not.toContain("rejected");
    expect(canTransitionOrder("rejected", "collecting_documents")).toBe(true);
  });

  it("keeps an operator review step, which §21 had dropped", () => {
    // §21 says V1 is a manually assisted operator workflow. That review is where the work
    // happens, so it needs a state.
    expect(FORMATION_ORDER_STATUSES).toContain("operator_review");
    expect(canTransitionOrder("operator_review", "ready_to_file")).toBe(true);
    expect(canTransitionOrder("operator_review", "collecting_documents")).toBe(true);
  });

  it("holds no EIN state at all", () => {
    // EIN is an IRS filing on a separate clock that fails separately. Keeping it here
    // would hold the order open for weeks after the company legally exists.
    for (const s of FORMATION_ORDER_STATUSES) expect(s).not.toContain("ein");
  });

  it("stops cancelling once the filing is with the state", () => {
    // After filing, the outcome belongs to the state, not to us.
    expect(canTransitionOrder("ready_to_file", "cancelled")).toBe(true);
    expect(canTransitionOrder("filed", "cancelled")).toBe(false);
  });

  it("refuses to go backwards out of a terminal state", () => {
    expect(canTransitionOrder("formed", "draft")).toBe(false);
    expect(canTransitionOrder("cancelled", "draft")).toBe(false);
  });
});

describe("company — the entity, not the job", () => {
  it("starts pending and only becomes active once formed", () => {
    expect(canTransitionCompany("pending", "active")).toBe(true);
    expect(canTransitionCompany("pending", "delinquent")).toBe(false);
  });

  it("allows reinstatement from delinquent", () => {
    // A real US concept: pay the fee, file the report, the state restores the entity.
    expect(canTransitionCompany("delinquent", "active")).toBe(true);
  });

  it("shares no state name with the order machine, so the two can never be confused", () => {
    const overlap = COMPANY_STATUSES.filter((s) =>
      (FORMATION_ORDER_STATUSES as readonly string[]).includes(s),
    );
    expect(overlap).toEqual([]);
  });
});

describe("EIN — its own track", () => {
  it("distinguishes 'not asked yet' from 'waiting'", () => {
    // Two different things to show a founder, and a null cannot tell them apart.
    expect(EIN_STATUSES).toContain("not_started");
    expect(canTransitionEin("not_started", "requested")).toBe(true);
    expect(canTransitionEin("not_started", "issued")).toBe(false);
  });

  it("makes an IRS rejection reparable too", () => {
    expect(canTransitionEin("rejected", "requested")).toBe(true);
    expect(EIN_TERMINAL).not.toContain("rejected");
  });
});
