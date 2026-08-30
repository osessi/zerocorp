/** Base class for violations of a business invariant. Never used for infrastructure failures. */
export abstract class DomainError extends Error {
  abstract readonly code: string;
  constructor(message: string) {
    super(message);
    this.name = new.target.name;
  }
}

export class InvalidTransitionError extends DomainError {
  readonly code = "domain/invalid-transition";
  constructor(
    readonly machine: string,
    readonly from: string,
    readonly event: string,
  ) {
    super(`${machine}: no transition from "${from}" on "${event}"`);
  }
}
