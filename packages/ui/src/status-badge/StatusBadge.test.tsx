/** @vitest-environment happy-dom */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { StatusBadge, type StatusTone } from "./StatusBadge";

afterEach(cleanup);

const TONES: StatusTone[] = ["success", "processing", "warning", "danger", "info", "neutral"];

describe("StatusBadge — one component, two emphases", () => {
  it("renders the label, which is what a screen reader reads", () => {
    render(<StatusBadge tone="success">Active</StatusBadge>);
    expect(screen.getByText("Active")).toBeInTheDocument();
  });

  it("defaults to the outlined emphasis", () => {
    render(<StatusBadge tone="success">Active</StatusBadge>);
    const badge = screen.getByText("Active").closest("span");
    expect(badge?.className).toContain("border-success");
    expect(badge?.className).not.toContain("bg-success");
  });

  it("fills the container when emphasis is prominent", () => {
    render(
      <StatusBadge tone="success" emphasis="prominent">
        Active
      </StatusBadge>,
    );
    const badge = screen.getByText("Active").closest("span");
    expect(badge?.className).toContain("bg-success");
  });

  it("stays square in both emphases — radius 0 is the signature", () => {
    for (const emphasis of ["default", "prominent"] as const) {
      cleanup();
      render(
        <StatusBadge tone="info" emphasis={emphasis}>
          EIN on file
        </StatusBadge>,
      );
      const badge = screen.getByText("EIN on file").closest("span");
      expect(badge?.className).not.toContain("rounded-full");
      expect(badge?.className).toContain("rounded-none");
    }
  });
});

describe("StatusBadge — colour is never the only carrier of meaning", () => {
  it("gives every tone an icon whose SHAPE differs, not only its colour", () => {
    // §4.3 tuned the five status colours to 4.83:1–5.36:1, a deliberately even set.
    // Even contrast means they collapse to nearly the same grey. The greyscale review
    // confirmed it: in every treatment, colour alone separated nothing. The glyph is
    // what a colour-blind reader actually gets.
    const seen = new Set<string>();
    for (const tone of TONES) {
      cleanup();
      const { container } = render(<StatusBadge tone={tone}>Status</StatusBadge>);
      const svg = container.querySelector("svg");
      expect(svg).not.toBeNull();
      // Phosphor names the glyph in the rendered markup; two tones must never share one.
      const shape = svg?.innerHTML ?? "";
      expect(shape).not.toBe("");
      expect(seen.has(shape)).toBe(false);
      seen.add(shape);
    }
    expect(seen.size).toBe(TONES.length);
  });

  it("hides the icon from assistive technology — the label already says it", () => {
    const { container } = render(<StatusBadge tone="danger">Rejected</StatusBadge>);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("cannot be built without a label", () => {
    // `children` is required by the type. This records the intent so nobody relaxes it:
    // an icon-only status badge would make colour the only carrier of meaning (§14).
    // @ts-expect-error children is required
    const invalid = () => <StatusBadge tone="success" />;
    expect(typeof invalid).toBe("function");
  });
});

describe("StatusBadge — contrast", () => {
  it("never uses --border for the neutral outline", () => {
    // --border measures 1.26:1 in light and 1.31:1 in dark. A badge boundary is a
    // meaningful graphical object, so WCAG 1.4.11 asks for 3:1. The review prototype
    // had inherited this failure from before §4.4 was fixed.
    render(<StatusBadge tone="neutral">Draft</StatusBadge>);
    const badge = screen.getByText("Draft").closest("span");
    expect(badge?.className).toContain("border-muted-foreground");
    expect(badge?.className).not.toMatch(/\bborder-border\b/);
  });

  it("inks the solid fill with --background, which flips with the theme", () => {
    // A theme-stable near-white on flipping status colours measured 1.78:1–3.61:1 in
    // dark — all six below 4.5:1. The ink has to flip with the fill.
    for (const tone of TONES) {
      cleanup();
      render(
        <StatusBadge tone={tone} emphasis="prominent">
          Status
        </StatusBadge>,
      );
      const badge = screen.getByText("Status").closest("span");
      expect(badge?.className).toContain("text-background");
      expect(badge?.className).not.toContain("text-primary-foreground");
    }
  });
});

describe("StatusBadge — i18n and layout", () => {
  it("lets a long label wrap instead of overflowing its column", () => {
    // §5: no layout may depend on a specific string length, and French runs ~25% longer.
    // "Renews in 14 days" becomes "Renouvellement dans 14 jours".
    render(<StatusBadge tone="warning">Renouvellement dans 14 jours</StatusBadge>);
    const badge = screen.getByText("Renouvellement dans 14 jours").closest("span");
    expect(badge?.className).not.toContain("whitespace-nowrap");
  });

  it("keeps the icon on the first line when the label wraps", () => {
    render(<StatusBadge tone="warning">Renouvellement dans 14 jours</StatusBadge>);
    const badge = screen.getByText("Renouvellement dans 14 jours").closest("span");
    expect(badge?.className).toContain("items-start");
    const { container } = render(<StatusBadge tone="warning">Wraps</StatusBadge>);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain("shrink-0");
  });

  it("accepts a className without losing its tone", () => {
    render(
      <StatusBadge tone="danger" className="mt-2">
        Rejected
      </StatusBadge>,
    );
    const badge = screen.getByText("Rejected").closest("span");
    expect(badge?.className).toContain("mt-2");
    expect(badge?.className).toContain("border-destructive");
  });
});
