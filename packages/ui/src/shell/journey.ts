/**
 * Which stage of the journey a group belongs to — DESIGN_SYSTEM.md §4.10.
 *
 * The rail used to be nine grey rows under three grey labels, and the labels were the
 * only thing saying that Company and Website are different KINDS of work. A label is
 * read once and then skipped; a ground is seen without reading. Each group now sits on
 * its own tinted block, so the shape of the product survives a glance.
 *
 * ---------------------------------------------------------------------------
 * 2026-09-04, second pass: the active tile steps UP to --surface, not --background.
 *
 * The rail sits on --background, and --background moved from #FFFFFF to #FAFAF9 in the
 * same pass. `bg-background` on the active row was therefore the EXACT colour of the rail
 * behind it, so the active tile rendered and could not be seen. The square outline was
 * always there; it had nothing to sit against.
 *
 * --surface is the card white. An active nav tile is a card on a receded ground, which is
 * the same rule the rest of the product now follows.
 * ---------------------------------------------------------------------------
 *
 * These are NOT status tones. Nothing here means healthy, blocked or pending — the five
 * semantic tones are untouched and still own that. A journey tint is a GROUND and a
 * LABEL; it never marks an object, because an object marked with a colour is making a
 * status claim whether it meant to or not.
 */
export type JourneyTone = "build" | "launch" | "grow";

/**
 * Every class name written out in full, three times over.
 *
 * `bg-journey-${tone}-wash` typechecks, renders, and produces nothing: Tailwind scans
 * source files for LITERAL class names, so a utility assembled at runtime is never
 * generated and the colour silently never appears. A thirty-line map is cheaper than a
 * bug you can only find by looking at the screen —
 * tests/architecture/design-tokens.test.ts fails the build over it.
 */
export interface ToneClasses {
  readonly block: string;
  readonly label: string;
  readonly rest: string;
  readonly tile: string;
  readonly activeRow: string;
  readonly activeTile: string;
  readonly count: string;
  readonly child: string;
}

export const JOURNEY: Record<JourneyTone, ToneClasses> = {
  build: {
    block: "border-journey-build-edge bg-journey-build-wash",
    label: "text-journey-build-ink",
    rest: "border-transparent text-muted-foreground hover:bg-surface hover:text-foreground",
    tile: "border-journey-build-edge bg-surface group-hover:text-journey-build-ink",
    activeRow: "border-journey-build-edge bg-surface text-foreground shadow-floating",
    activeTile: "border-journey-build-ink bg-journey-build-ink text-background",
    count: "border border-journey-build-edge bg-surface text-muted-foreground",
    child: "text-muted-foreground hover:bg-surface hover:text-foreground",
  },
  launch: {
    block: "border-journey-launch-edge bg-journey-launch-wash",
    label: "text-journey-launch-ink",
    rest: "border-transparent text-muted-foreground hover:bg-surface hover:text-foreground",
    tile: "border-journey-launch-edge bg-surface group-hover:text-journey-launch-ink",
    activeRow: "border-journey-launch-edge bg-surface text-foreground shadow-floating",
    activeTile: "border-journey-launch-ink bg-journey-launch-ink text-background",
    count: "border border-journey-launch-edge bg-surface text-muted-foreground",
    child: "text-muted-foreground hover:bg-surface hover:text-foreground",
  },
  grow: {
    block: "border-journey-grow-edge bg-journey-grow-wash",
    label: "text-journey-grow-ink",
    rest: "border-transparent text-muted-foreground hover:bg-surface hover:text-foreground",
    tile: "border-journey-grow-edge bg-surface group-hover:text-journey-grow-ink",
    activeRow: "border-journey-grow-edge bg-surface text-foreground shadow-floating",
    activeTile: "border-journey-grow-ink bg-journey-grow-ink text-background",
    count: "border border-journey-grow-edge bg-surface text-muted-foreground",
    child: "text-muted-foreground hover:bg-surface hover:text-foreground",
  },
};

/** The footer rail carries no journey — it is not part of one. Brand teal, as before. */
export const NEUTRAL: ToneClasses = {
  block: "",
  label: "",
  rest: "border-transparent text-muted-foreground hover:bg-accent/50 hover:text-foreground",
  tile: "border-border group-hover:border-input-hover group-hover:text-foreground",
  activeRow: "border-border bg-accent text-foreground",
  activeTile: "border-primary bg-primary text-primary-foreground",
  count: "bg-muted text-muted-foreground",
  child: "text-muted-foreground hover:bg-accent hover:text-foreground",
};
