import { InvalidTransitionError } from "./errors";

/**
 * Pure, declarative state machine.
 *
 * ARCHITECTURE.md requires long-running business processes to be explicit state
 * machines rather than ad-hoc booleans. Company formation, email warm-up, domain
 * provisioning and content publication all build on this.
 *
 * It is deliberately IO-free: it computes the next state, it never persists it.
 */
export type Transitions<S extends string, E extends string> = {
  readonly [From in S]?: { readonly [Event in E]?: S };
};

export interface StateMachine<S extends string, E extends string> {
  readonly name: string;
  readonly initial: S;
  readonly terminal: readonly S[];
  can(from: S, event: E): boolean;
  next(from: S, event: E): S;
  isTerminal(state: S): boolean;
}

export function defineStateMachine<S extends string, E extends string>(spec: {
  name: string;
  initial: S;
  terminal?: readonly S[];
  transitions: Transitions<S, E>;
}): StateMachine<S, E> {
  const terminal = spec.terminal ?? [];
  return {
    name: spec.name,
    initial: spec.initial,
    terminal,
    can: (from, event) => spec.transitions[from]?.[event] !== undefined,
    next: (from, event) => {
      const to = spec.transitions[from]?.[event];
      if (to === undefined) throw new InvalidTransitionError(spec.name, from, event);
      return to;
    },
    isTerminal: (state) => terminal.includes(state),
  };
}
