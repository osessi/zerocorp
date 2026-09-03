/**
 * Which stage of the journey a group belongs to — DESIGN_SYSTEM.md §4.9.
 *
 * The rail used to be nine grey rows under three grey labels, and the labels were the
 * only thing saying that Company and Website are different KINDS of work. A label is
 * read once and then skipped; a ground is seen without reading. Each group now sits on
 * its own tinted block, so the shape of the product survives a glance.
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
    rest: "border-transparent text-muted-foreground hover:bg-background hover:text-foreground",
    tile: "border-journey-build-edge bg-background group-hover:text-journey-build-ink",
    activeRow: "border-journey-build-edge bg-background text-foreground",
    activeTile: "border-journey-build-ink bg-journey-build-ink text-background",
    count: "border border-journey-build-edge bg-background text-muted-foreground",
    child: "text-muted-foreground hover:bg-background hover:text-foreground",
  },
  launch: {
    block: "border-journey-launch-edge bg-journey-launch-wash",
    label: "text-journey-launch-ink",
    rest: "border-transparent text-muted-foreground hover:bg-background hover:text-foreground",
    tile: "border-journey-launch-edge bg-background group-hover:text-journey-launch-ink",
    activeRow: "border-journey-launch-edge bg-background text-foreground",
    activeTile: "border-journey-launch-ink bg-journey-launch-ink text-background",
    count: "border border-journey-launch-edge bg-background text-muted-foreground",
    child: "text-muted-foreground hover:bg-background hover:text-foreground",
  },
  grow: {
    block: "border-journey-grow-edge bg-journey-grow-wash",
    label: "text-journey-grow-ink",
    rest: "border-transparent text-muted-foreground hover:bg-background hover:text-foreground",
    tile: "border-journey-grow-edge bg-background group-hover:text-journey-grow-ink",
    activeRow: "border-journey-grow-edge bg-background text-foreground",
    activeTile: "border-journey-grow-ink bg-journey-grow-ink text-background",
    count: "border border-journey-grow-edge bg-background text-muted-foreground",
    child: "text-muted-foreground hover:bg-background hover:text-foreground",
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

/**
 * The same three stages, one layer down.
 *
 * A screen belongs to exactly one stage, so its tab band is the sidebar block continued
 * across the workspace: Company is green because Build is green, Website is blue because
 * Launch is blue. Without it the rail and the screen were two unrelated colour systems
 * meeting at a hairline.
 *
 * The band's rule stays NEUTRAL `border-b`. A tone on a single edge is the accent bar
 * this codebase has now rejected four times — the tone lives in the fill, the selected
 * tab's underline and its label, all of which are the tab's own anatomy rather than a
 * border pretending to be structure.
 */
export interface TabToneClasses {
  readonly band: string;
  readonly rest: string;
  readonly active: string;
  readonly marker: string;
  readonly count: string;
}

export const JOURNEY_TABS: Record<JourneyTone, TabToneClasses> = {
  build: {
    band: "bg-journey-build-wash",
    rest: "text-muted-foreground hover:text-journey-build-ink hover:bg-background",
    active: "bg-background text-foreground font-medium",
    marker: "bg-journey-build-ink",
    count: "border border-journey-build-edge bg-background text-journey-build-ink",
  },
  launch: {
    band: "bg-journey-launch-wash",
    rest: "text-muted-foreground hover:text-journey-launch-ink hover:bg-background",
    active: "bg-background text-foreground font-medium",
    marker: "bg-journey-launch-ink",
    count: "border border-journey-launch-edge bg-background text-journey-launch-ink",
  },
  grow: {
    band: "bg-journey-grow-wash",
    rest: "text-muted-foreground hover:text-journey-grow-ink hover:bg-background",
    active: "bg-background text-foreground font-medium",
    marker: "bg-journey-grow-ink",
    count: "border border-journey-grow-edge bg-background text-journey-grow-ink",
  },
};

/** No stage declared — the brand teal, exactly as the tabs were before. */
export const NEUTRAL_TABS: TabToneClasses = {
  band: "bg-surface",
  rest: "text-muted-foreground hover:text-foreground hover:bg-accent/50",
  active: "text-foreground font-medium",
  marker: "bg-primary",
  count: "bg-muted text-muted-foreground",
};
