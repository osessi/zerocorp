/** @vitest-environment happy-dom */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Spinner } from "./Spinner";
import { Skeleton, SkeletonText } from "./Skeleton";
import { Button } from "../button/Button";
import { Input } from "../field/Input";
import { Field } from "../field/Field";

afterEach(cleanup);

describe("Spinner — one busy indicator, written once", () => {
  it("defaults to the §11 standard UI size", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("svg")).toHaveAttribute("width", "20");
  });

  it("respects prefers-reduced-motion", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain(
      "motion-safe:animate-spin",
    );
  });

  it("is silent by default — the container that owns aria-busy does the announcing", () => {
    const { container } = render(<Spinner />);
    expect(screen.queryByRole("status")).toBeNull();
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("announces itself when it stands alone and is given a label", () => {
    render(<Spinner label="Submitting filing" />);
    expect(screen.getByRole("status")).toHaveTextContent("Submitting filing");
  });

  it("never announces the glyph twice", () => {
    const { container } = render(<Spinner label="Loading" />);
    // The svg stays aria-hidden; only the sr-only text carries the name.
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByRole("status").textContent).toBe("Loading");
  });

  it("never becomes the only signal that something is loading", () => {
    // A static glyph under reduced motion cannot distinguish loading from loaded. That
    // is only acceptable because something else always carries the state: a Button keeps
    // its label and sets aria-busy, an Input sets aria-busy, a standalone Spinner takes
    // a label. Recorded so nobody drops the label "because there is a spinner".
    cleanup();
    render(<Button loading>Submitting</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveAttribute("aria-busy", "true");
    expect(button).toHaveTextContent("Submitting");

    cleanup();
    render(
      <Field label="Domain" loading>
        <Input />
      </Field>,
    );
    expect(screen.getByLabelText("Domain")).toHaveAttribute("aria-busy", "true");
  });
});

describe("Skeleton — a placeholder shaped like its content", () => {
  it("is hidden from assistive technology", () => {
    const { container } = render(<Skeleton className="h-10 w-full" />);
    expect(container.firstChild).toHaveAttribute("aria-hidden", "true");
  });

  it("takes its size from the caller, so the page does not jump when data lands", () => {
    const { container } = render(<Skeleton className="h-10 w-full" />);
    const cls = (container.firstChild as HTMLElement).className;
    expect(cls).toContain("h-10");
    expect(cls).toContain("w-full");
  });

  it("stays square — radius 0 is the signature", () => {
    const { container } = render(<Skeleton className="h-4" />);
    expect((container.firstChild as HTMLElement).className).not.toContain("rounded-full");
  });

  it("uses --muted, never a shimmering gradient", () => {
    const { container } = render(<Skeleton className="h-4" />);
    const cls = (container.firstChild as HTMLElement).className;
    expect(cls).toContain("bg-muted");
    expect(cls).not.toContain("gradient");
  });

  it("respects prefers-reduced-motion", () => {
    const { container } = render(<Skeleton className="h-4" />);
    expect((container.firstChild as HTMLElement).className).toContain(
      "motion-safe:animate-pulse",
    );
  });
});

describe("SkeletonText", () => {
  it("renders the number of lines asked for", () => {
    const { container } = render(<SkeletonText lines={4} />);
    expect(container.querySelectorAll("[aria-hidden='true']")).toHaveLength(4);
  });

  it("shortens the last line, so it reads as a paragraph and not a table", () => {
    const { container } = render(<SkeletonText lines={3} />);
    const bars = [...container.querySelectorAll("[aria-hidden='true']")];
    expect(bars[0].className).toContain("w-full");
    expect(bars[2].className).toContain("w-3/5");
  });
});
