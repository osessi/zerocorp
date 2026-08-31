/** @vitest-environment happy-dom */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { Field } from "./Field.js";
import { Input } from "./Input.js";

afterEach(cleanup);

describe("Field — the form shell", () => {
  it("always renders a real label bound to the control", () => {
    render(
      <Field label="Business name">
        <Input />
      </Field>,
    );
    // getByLabelText only succeeds when label and control are actually associated.
    expect(screen.getByLabelText("Business name")).toBeInTheDocument();
  });

  it("marks the control required and shows a visible indicator", () => {
    render(
      <Field label="Legal name" required>
        <Input required />
      </Field>,
    );
    expect(screen.getByLabelText(/Legal name/)).toBeRequired();
  });

  it("renders description text and wires aria-describedby", () => {
    render(
      <Field label="Domain" description="Shown on your invoices">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("Domain");
    const description = screen.getByText("Shown on your invoices");
    expect(input.getAttribute("aria-describedby")).toContain(description.id);
  });

  it("announces an error and marks the control invalid", () => {
    render(
      <Field label="EIN" error="Enter a valid EIN">
        <Input />
      </Field>,
    );
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Enter a valid EIN");
    const input = screen.getByLabelText("EIN");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input.getAttribute("aria-describedby")).toContain(alert.id);
  });

  it("hides the description while an error is shown, so the two never compete", () => {
    render(
      <Field label="EIN" description="Nine digits" error="Enter a valid EIN">
        <Input />
      </Field>,
    );
    expect(screen.queryByText("Nine digits")).not.toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("renders a success message with role=status, not alert", () => {
    render(
      <Field label="Domain" success="Domain verified">
        <Input />
      </Field>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Domain verified");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("lets an error win over a success message", () => {
    render(
      <Field label="Domain" success="Verified" error="DNS not propagated">
        <Input />
      </Field>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("DNS not propagated");
    expect(screen.queryByText("Verified")).not.toBeInTheDocument();
  });
});

describe("Input — states", () => {
  it("is not invalid or busy by default", () => {
    render(
      <Field label="Company">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("Company");
    expect(input).not.toHaveAttribute("aria-invalid");
    expect(input).not.toHaveAttribute("aria-busy");
  });

  it("is busy but still readable while loading", () => {
    render(
      <Field label="Domain" loading>
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("Domain");
    expect(input).toHaveAttribute("aria-busy", "true");
    expect(input).not.toBeDisabled();
  });

  it("is inert when disabled — a different state from loading", () => {
    render(
      <Field label="EIN" disabled>
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("EIN");
    expect(input).toBeDisabled();
    expect(input).not.toHaveAttribute("aria-busy");
  });

  it("carries the placeholder without it ever replacing the label", () => {
    render(
      <Field label="Business name">
        <Input placeholder="Acme LLC" />
      </Field>,
    );
    const input = screen.getByLabelText("Business name");
    expect(input).toHaveAttribute("placeholder", "Acme LLC");
  });

  it("renders standalone without a Field, in a neutral state", () => {
    render(<Input aria-label="Search" />);
    const input = screen.getByLabelText("Search");
    expect(input).not.toHaveAttribute("aria-invalid");
  });
});
