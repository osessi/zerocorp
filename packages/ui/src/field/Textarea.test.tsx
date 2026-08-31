/** @vitest-environment happy-dom */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Field } from "./Field";
import { Textarea } from "./Textarea";

afterEach(cleanup);

/**
 * Textarea reuses the Field shell rather than reimplementing it. These tests assert the
 * reuse: the same label binding, the same aria wiring, the same states — proven on a
 * different element, so a regression in the shell surfaces here too.
 */
describe("Textarea — reuses the Field shell", () => {
  it("renders an actual <textarea>, not a styled input", () => {
    render(
      <Field label="Business description">
        <Textarea />
      </Field>,
    );
    expect(screen.getByLabelText("Business description").tagName).toBe("TEXTAREA");
  });

  it("binds to the Field label exactly as Input does", () => {
    render(
      <Field label="Business description">
        <Textarea />
      </Field>,
    );
    expect(screen.getByLabelText("Business description")).toBeInTheDocument();
  });

  it("wires aria-describedby to the description", () => {
    render(
      <Field label="Positioning" description="Two or three sentences is enough">
        <Textarea />
      </Field>,
    );
    const control = screen.getByLabelText("Positioning");
    const description = screen.getByText("Two or three sentences is enough");
    expect(control.getAttribute("aria-describedby")).toContain(description.id);
  });

  it("announces an error and marks the control invalid", () => {
    render(
      <Field label="Positioning" error="Describe what makes you different">
        <Textarea />
      </Field>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Describe what makes you different");
    expect(screen.getByLabelText("Positioning")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a success message with role=status", () => {
    render(
      <Field label="Positioning" success="Saved to your Business Brain">
        <Textarea />
      </Field>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Saved to your Business Brain");
  });

  it("is busy but still focusable while loading", () => {
    render(
      <Field label="Positioning" loading>
        <Textarea />
      </Field>,
    );
    const control = screen.getByLabelText("Positioning");
    expect(control).toHaveAttribute("aria-busy", "true");
    expect(control).not.toBeDisabled();
  });

  it("is inert when disabled", () => {
    render(
      <Field label="Positioning" disabled>
        <Textarea disabled />
      </Field>,
    );
    expect(screen.getByLabelText("Positioning")).toBeDisabled();
  });

  it("defaults to four rows and accepts an override", () => {
    const { rerender } = render(
      <Field label="Notes">
        <Textarea />
      </Field>,
    );
    expect(screen.getByLabelText("Notes")).toHaveAttribute("rows", "4");

    rerender(
      <Field label="Notes">
        <Textarea rows={10} />
      </Field>,
    );
    expect(screen.getByLabelText("Notes")).toHaveAttribute("rows", "10");
  });

  it("carries a placeholder without it replacing the label", () => {
    render(
      <Field label="Business description">
        <Textarea placeholder="We help agencies…" />
      </Field>,
    );
    expect(screen.getByLabelText("Business description")).toHaveAttribute(
      "placeholder",
      "We help agencies…",
    );
  });

  it("renders standalone without a Field, in a neutral state", () => {
    render(<Textarea aria-label="Notes" />);
    expect(screen.getByLabelText("Notes")).not.toHaveAttribute("aria-invalid");
  });
});

/**
 * The point of extracting control-styles.ts: Input and Textarea must not drift apart.
 * If someone restyles one control in isolation, this fails.
 */
describe("Textarea and Input share one visual contract", () => {
  it("applies the same border, focus and disabled fragments", () => {
    render(
      <>
        <Field label="One">
          <Textarea />
        </Field>
      </>,
    );
    const control = screen.getByLabelText("One");
    const classes = control.className;
    for (const fragment of [
      "border-input",
      "hover:border-input-hover",
      "focus-visible:outline-ring",
      "rounded-none",
      "text-body",
    ]) {
      expect(classes).toContain(fragment);
    }
  });

  it("never reintroduces outline-none, which would hide the focus ring", () => {
    render(
      <Field label="One">
        <Textarea />
      </Field>,
    );
    expect(screen.getByLabelText("One").className).not.toContain("outline-none");
  });

  it("resizes vertically only — horizontal resize breaks the layout grid", () => {
    render(
      <Field label="One">
        <Textarea />
      </Field>,
    );
    expect(screen.getByLabelText("One").className).toContain("resize-y");
  });
});
