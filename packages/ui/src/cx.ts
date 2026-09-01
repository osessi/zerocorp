/**
 * Class name concatenation.
 *
 * One definition. It had drifted to three — one in control-styles, one inline in a
 * layout component, one about to be written for ButtonLink — which is exactly how a
 * trivial helper ends up with three slightly different falsy checks.
 */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
