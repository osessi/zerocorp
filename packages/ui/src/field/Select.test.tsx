/** @vitest-environment happy-dom */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field } from "./Field";
import { ITEM, POPUP, Select, type SelectOption } from "./Select";

afterEach(cleanup);

const STATES: SelectOption[] = [
  { value: "wy", label: "Wyoming" },
  { value: "de", label: "Delaware" },
  { value: "nm", label: "New Mexico" },
  { value: "ca", label: "California", disabled: true },
];

describe("Select — reuses the Field shell", () => {
  it("is labelled by the Field, even though the trigger is a button", () => {
    // <label for> cannot address a <button>, so the trigger takes aria-labelledby from
    // the Field context. If that wiring breaks, this query fails.
    render(
      <Field label="State of formation">
        <Select options={STATES} />
      </Field>,
    );
    const trigger = screen.getByLabelText("State of formation");
    expect(trigger.tagName).toBe("BUTTON");
  });

  it("shows the placeholder when nothing is selected", () => {
    render(
      <Field label="State of formation">
        <Select options={STATES} placeholder="Choose a state" />
      </Field>,
    );
    expect(screen.getByText("Choose a state")).toBeInTheDocument();
  });

  it("renders the selected option's label, not its value", () => {
    render(
      <Field label="State of formation">
        <Select options={STATES} defaultValue="wy" />
      </Field>,
    );
    expect(screen.getByText("Wyoming")).toBeInTheDocument();
    expect(screen.queryByText("wy")).not.toBeInTheDocument();
  });

  it("wires aria-describedby to the description", () => {
    render(
      <Field label="State" description="Wyoming is the usual choice">
        <Select options={STATES} />
      </Field>,
    );
    const trigger = screen.getByLabelText("State");
    const description = screen.getByText("Wyoming is the usual choice");
    expect(trigger.getAttribute("aria-describedby")).toContain(description.id);
  });

  it("announces an error and marks the trigger invalid", () => {
    render(
      <Field label="State" error="Choose a state of formation">
        <Select options={STATES} />
      </Field>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Choose a state of formation");
    expect(screen.getByLabelText("State")).toHaveAttribute("aria-invalid", "true");
  });

  it("shows a success message with role=status", () => {
    render(
      <Field label="State" success="Wyoming selected">
        <Select options={STATES} defaultValue="wy" />
      </Field>,
    );
    expect(screen.getByRole("status")).toHaveTextContent("Wyoming selected");
  });

  it("is inert when disabled", () => {
    render(
      <Field label="State">
        <Select options={STATES} disabled />
      </Field>,
    );
    expect(screen.getByLabelText("State")).toBeDisabled();
  });
});

describe("Select — open, choose, close", () => {
  it("opens on click and lists every option", async () => {
    const user = userEvent.setup();
    render(
      <Field label="State">
        <Select options={STATES} />
      </Field>,
    );
    await user.click(screen.getByLabelText("State"));
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    for (const option of STATES) {
      expect(screen.getByRole("option", { name: option.label })).toBeInTheDocument();
    }
  });

  it("marks a disabled option as disabled rather than hiding it", async () => {
    const user = userEvent.setup();
    render(
      <Field label="State">
        <Select options={STATES} />
      </Field>,
    );
    await user.click(screen.getByLabelText("State"));
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    expect(screen.getByRole("option", { name: "California" })).toHaveAttribute(
      "aria-disabled",
      "true",
    );
  });

  it("selects an option and closes", async () => {
    const user = userEvent.setup();
    render(
      <Field label="State">
        <Select options={STATES} />
      </Field>,
    );
    const trigger = screen.getByLabelText("State");
    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    await user.click(screen.getByRole("option", { name: "Delaware" }));
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(trigger).toHaveTextContent("Delaware");
  });

  it("reports the chosen value to onValueChange", async () => {
    const user = userEvent.setup();
    let received: string | null = null;
    render(
      <Field label="State">
        <Select options={STATES} onValueChange={(v) => (received = v)} />
      </Field>,
    );
    await user.click(screen.getByLabelText("State"));
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    await user.click(screen.getByRole("option", { name: "New Mexico" }));
    await waitFor(() => expect(received).toBe("nm"));
  });

  it("closes on Escape without changing the value", async () => {
    const user = userEvent.setup();
    render(
      <Field label="State">
        <Select options={STATES} defaultValue="wy" />
      </Field>,
    );
    const trigger = screen.getByLabelText("State");
    await user.click(trigger);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    await user.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
    expect(trigger).toHaveTextContent("Wyoming");
  });

  it("marks the current option as selected", async () => {
    const user = userEvent.setup();
    render(
      <Field label="State">
        <Select options={STATES} defaultValue="de" />
      </Field>,
    );
    await user.click(screen.getByLabelText("State"));
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    expect(screen.getByRole("option", { name: "Delaware" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });
});

describe("Select shares the control contract with Input and Textarea", () => {
  it("applies the same border, focus and geometry fragments", () => {
    render(
      <Field label="State">
        <Select options={STATES} />
      </Field>,
    );
    const classes = screen.getByLabelText("State").className;
    for (const fragment of [
      "border-input",
      "hover:border-input-hover",
      "focus-visible:outline-ring",
      "rounded-none",
      "h-10",
      "text-body",
    ]) {
      expect(classes).toContain(fragment);
    }
  });

  it("never reintroduces outline-none on the trigger", () => {
    render(
      <Field label="State">
        <Select options={STATES} />
      </Field>,
    );
    expect(screen.getByLabelText("State").className).not.toContain("outline-none");
  });

  it("lets the trigger value shrink, so a long option cannot push the page wider", () => {
    // A flex child defaults to min-width:auto and refuses to shrink below its content.
    // Without min-w-0 the `truncate` never fires and a long option widens the trigger
    // past the viewport. Found on a 375px screen, 2026-08-31.
    render(
      <Field label="Entity type">
        <Select
          options={[
            { value: "llc", label: "Limited Liability Company (single member, foreign-owned)" },
          ]}
          defaultValue="llc"
        />
      </Field>,
    );
    const value = screen.getByLabelText("Entity type").querySelector("span");
    expect(value?.className).toContain("min-w-0");
    expect(value?.className).toContain("truncate");
  });

  it("greys the trigger text only while it shows a placeholder", () => {
    render(
      <Field label="State">
        <Select options={STATES} />
      </Field>,
    );
    // A <button> has no ::placeholder — the empty state is data-placeholder.
    expect(screen.getByLabelText("State").className).toContain(
      "data-placeholder:text-muted-foreground",
    );
  });
});

describe("Select — selection is not the cursor", () => {
  it("gives the selected option a rule of its own", async () => {
    // Until 2026-08-31 ITEM had a data-highlighted rule and NO data-selected rule, so
    // selection rode on a 16px tick while the grey CURSOR band read as "selected".
    expect(ITEM).toContain("data-selected:border-primary");
    expect(ITEM).toContain("data-selected:font-medium");
  });

  it("never inks the selected label with --primary", () => {
    // Teal text measures 3.18:1 on --surface-elevated in dark, below the 4.5:1 floor,
    // and in greyscale it made the selected row the dimmest text in the list. The box
    // and the tick badge carry the teal; a border owes 3:1, which 3.18 clears. §24.15.
    expect(ITEM).not.toContain("data-selected:text-primary");
    expect(ITEM).toContain("text-foreground");
  });

  it("keeps the border present but transparent, so selecting shifts nothing", () => {
    // Adding a border on selection would move every row by 2px the moment a value lands.
    expect(ITEM).toContain("border border-transparent");
  });

  it("carries selection on more than colour", () => {
    // §14. The weight change and the filled badge both survive greyscale.
    expect(ITEM).toContain("data-selected:font-medium");
  });

  it("draws the popup edge with --input, never --border", () => {
    // A popup edge separates a floating layer from the page: a meaningful graphical
    // object, so WCAG 1.4.11 asks 3:1. --border is 1.26:1 light and 1.31:1 dark, and the
    // popup read as edgeless. Same failure §4.4 fixed for controls.
    expect(POPUP).toContain("border-input");
    expect(POPUP).not.toMatch(/\bborder-border\b/);
  });
});
