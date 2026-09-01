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

  it("defaults to the outlined emphasis, tinted but not filled", () => {
    // Direction B, 2026-08-31. The default carries its own tint now — colour reached a
    // surface exactly once across the whole dashboard before this, which is why it read
    // monotone. `bg-success-subtle` is the tint; `bg-success` remains the solid fill and
    // belongs to `prominent` alone, or the two emphases stop meaning different things.
    render(<StatusBadge tone="success">Active</StatusBadge>);
    const badge = screen.getByText("Active").closest("span");
    expect(badge?.className).toContain("border-success");
    expect(badge?.className).toContain("bg-success-subtle");
    expect(badge?.className).not.toMatch(/bg-success(?![-\w])/);
  });

  it("inks the default with the -ink step, never the §4.3 colour", () => {
    // §4.3 is tuned as text on WHITE. On a coloured tint it falls short: measured, --info
    // reached 4.24 and --destructive 3.95, both under 4.5, while their borders passed.
    // The -ink step is one darker and measures 5.30–6.80:1. Splitting the roles is what
    // makes a bright tint safe.
    for (const [tone, ink] of [
      ["success", "text-success-ink"],
      ["info", "text-info-ink"],
      ["danger", "text-destructive-ink"],
    ] as const) {
      cleanup();
      render(<StatusBadge tone={tone}>Status</StatusBadge>);
      const badge = screen.getByText("Status").closest("span");
      expect(badge?.className).toContain(ink);
    }
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
  it("stays on one line", () => {
    // A status that wraps to three lines reads as a paragraph in a box, not a status.
    // Reported in review 2026-08-31.
    render(<StatusBadge tone="warning">Renouvellement dans 14 jours</StatusBadge>);
    const badge = screen.getByText("Renouvellement dans 14 jours").closest("span");
    expect(badge?.className).toContain("whitespace-nowrap");
  });

  it("never clips or truncates the label, in any language", () => {
    // One line is a constraint on how short a status label must be. It is not a licence
    // to hide text: a status the reader cannot finish is worse than a wide badge.
    render(<StatusBadge tone="warning">Renouvellement dans 14 jours</StatusBadge>);
    const badge = screen.getByText("Renouvellement dans 14 jours").closest("span");
    expect(badge?.className).not.toContain("truncate");
    expect(badge?.className).not.toContain("overflow-hidden");
    expect(badge?.className).not.toMatch(/\bw-\d/);
  });

  it("keeps the icon from being squeezed by a long label", () => {
    const { container } = render(<StatusBadge tone="warning">Renouvellement</StatusBadge>);
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
