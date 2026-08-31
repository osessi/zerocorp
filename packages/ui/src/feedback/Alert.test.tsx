/** @vitest-environment happy-dom */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Alert } from "./Alert";
import { TONE_GLYPH, type StatusTone } from "../tone";

afterEach(cleanup);

const TONES: StatusTone[] = ["success", "processing", "warning", "danger", "info", "neutral"];

describe("Alert — the role follows the tone", () => {
  it("interrupts for danger and warning", () => {
    for (const tone of ["danger", "warning"] as const) {
      cleanup();
      render(<Alert tone={tone} title="Filing rejected" />);
      expect(screen.getByRole("alert")).toBeInTheDocument();
    }
  });

  it("stays polite for success, info, processing and neutral", () => {
    for (const tone of ["success", "info", "processing", "neutral"] as const) {
      cleanup();
      render(<Alert tone={tone} title="EIN issued" />);
      expect(screen.getByRole("status")).toBeInTheDocument();
      expect(screen.queryByRole("alert")).toBeNull();
    }
  });

  it("does not let the caller choose the role", () => {
    // A caller who could choose would eventually make a success message abandon whatever
    // a screen reader was mid-sentence on. The tone decides.
    // @ts-expect-error role is not a prop
    const invalid = () => <Alert tone="success" title="Done" role="alert" />;
    expect(typeof invalid).toBe("function");
  });
});

describe("Alert — colour is never the only carrier", () => {
  it("gives every tone a glyph of a different shape", () => {
    const seen = new Set<string>();
    for (const tone of TONES) {
      cleanup();
      const { container } = render(<Alert tone={tone} title="Status" />);
      const shape = container.querySelector("svg")?.innerHTML ?? "";
      expect(shape).not.toBe("");
      expect(seen.has(shape)).toBe(false);
      seen.add(shape);
    }
    expect(seen.size).toBe(TONES.length);
  });

  it("reads the shared tone map, never its own copy", () => {
    // Three surfaces render this map — StatusBadge, Alert, Toast. Spelled out three
    // times it drifts one entry at a time, the way transition-colors and the inline
    // spinners did.
    expect(Object.keys(TONE_GLYPH).sort()).toEqual([...TONES].sort());
  });

  it("hides the glyph from assistive technology — the title already says it", () => {
    const { container } = render(<Alert tone="danger" title="Rejected" />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("cannot be built without a title", () => {
    // @ts-expect-error title is required
    const invalid = () => <Alert tone="success" />;
    expect(typeof invalid).toBe("function");
  });
});

describe("Alert — the body is not tinted", () => {
  it("colours the title but leaves the body --foreground", () => {
    // A whole paragraph in a status colour is harder to read and adds nothing — the same
    // finding as the Select label, where teal failed as text and passed as a border at
    // the identical 3.18:1.
    render(
      <Alert tone="warning" title="Renewal due">
        Northwind Studio LLC must file by 1 March.
      </Alert>,
    );
    expect(screen.getByText("Renewal due").className).toContain("text-warning");
    expect(screen.getByText(/Northwind Studio LLC must file/).className).toContain("text-foreground");
  });

  it("uses a left rule, never a tinted fill", () => {
    // There is no tint scale in the system, and a tinted panel changes the background
    // every piece of text inside it sits on.
    const { container } = render(<Alert tone="info" title="Note" />);
    const cls = (container.firstChild as HTMLElement).className;
    expect(cls).toContain("border-l-info");
    expect(cls).not.toContain("bg-info");
  });
});
