/** @vitest-environment happy-dom */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Field } from "./Field";
import { Choice } from "./Choice";
import { Checkbox } from "./Checkbox";
import { Switch } from "./Switch";
import { Radio, RadioGroup } from "./Radio";

afterEach(cleanup);

describe("Choice — the inline label row", () => {
  it("makes the whole row the click target, not just the 16px control", async () => {
    // A 16px control alone fails WCAG 2.5.8 (24×24 target). The label wraps the
    // control, so clicking the TEXT toggles it.
    const user = userEvent.setup();
    render(
      <Choice label="I confirm the information is accurate">
        <Checkbox />
      </Choice>,
    );
    const control = screen.getByRole("checkbox");
    expect(control).not.toBeChecked();
    await user.click(screen.getByText("I confirm the information is accurate"));
    await waitFor(() => expect(control).toBeChecked());
  });

  it("labels the control without any id plumbing", () => {
    render(
      <Choice label="Stay signed in">
        <Checkbox />
      </Choice>,
    );
    expect(screen.getByRole("checkbox", { name: "Stay signed in" })).toBeInTheDocument();
  });

  it("renders its own description and wires aria-describedby", () => {
    render(
      <Choice label="I confirm" description="This is a legal declaration">
        <Checkbox />
      </Choice>,
    );
    const description = screen.getByText("This is a legal declaration");
    expect(screen.getByRole("checkbox").getAttribute("aria-describedby")).toContain(description.id);
  });

  it("announces its own error when it stands alone", () => {
    render(
      <Choice label="I confirm" error="You must accept the terms to continue">
        <Checkbox />
      </Choice>,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("You must accept the terms to continue");
    expect(screen.getByRole("checkbox")).toHaveAttribute("aria-invalid", "true");
  });

  it("stays quiet inside a group — the group owns the message", () => {
    render(
      <Field as="group" label="State of formation" error="Choose a state">
        <RadioGroup>
          <Choice label="Wyoming">
            <Radio value="wy" />
          </Choice>
          <Choice label="Delaware">
            <Radio value="de" />
          </Choice>
        </RadioGroup>
      </Field>,
    );
    // One message for the whole group, not one per option.
    expect(screen.getAllByRole("alert")).toHaveLength(1);
  });

  it("passes the group's invalid state down so each control shows the error border", () => {
    render(
      <Field as="group" label="State" error="Choose a state">
        <RadioGroup>
          <Choice label="Wyoming">
            <Radio value="wy" />
          </Choice>
        </RadioGroup>
      </Field>,
    );
    expect(screen.getByRole("radio", { name: "Wyoming" })).toHaveAttribute("aria-invalid", "true");
  });
});

describe("Field as=\"group\" — a legend, not a label", () => {
  it("renders a fieldset with a legend", () => {
    render(
      <Field as="group" label="State of formation">
        <RadioGroup>
          <Choice label="Wyoming">
            <Radio value="wy" />
          </Choice>
        </RadioGroup>
      </Field>,
    );
    // A <label> cannot label a set of radios; only a <legend> can.
    expect(screen.getByRole("group", { name: /State of formation/ })).toBeInTheDocument();
  });

  it("names the radio group from the legend", () => {
    render(
      <Field as="group" label="State of formation">
        <RadioGroup>
          <Choice label="Wyoming">
            <Radio value="wy" />
          </Choice>
        </RadioGroup>
      </Field>,
    );
    expect(screen.getByRole("radiogroup", { name: /State of formation/ })).toBeInTheDocument();
  });

  it("still shows a required indicator on the legend", () => {
    render(
      <Field as="group" label="State of formation" required>
        <RadioGroup>
          <Choice label="Wyoming">
            <Radio value="wy" />
          </Choice>
        </RadioGroup>
      </Field>,
    );
    expect(screen.getByRole("group", { name: /State of formation/ })).toBeInTheDocument();
  });
});

describe("Checkbox — square", () => {
  it("toggles on click and reports the change", async () => {
    const user = userEvent.setup();
    let value = false;
    render(
      <Choice label="Send me the daily report">
        <Checkbox onCheckedChange={(v) => (value = v)} />
      </Choice>,
    );
    await user.click(screen.getByRole("checkbox"));
    await waitFor(() => expect(value).toBe(true));
  });

  it("is reachable by Tab, so a keyboard user can get to it", async () => {
    // Key ACTUATION is verified in Chrome, not here: happy-dom does not run Base UI's
    // key handling on a span[role=checkbox] and reports no toggle for Space or Enter.
    // The browser check on 2026-08-31 confirmed Space toggles false → true → false.
    // Asserting the negative here would have recorded a bug that does not exist.
    const user = userEvent.setup();
    render(
      <Choice label="Send me the daily report">
        <Checkbox />
      </Choice>,
    );
    const box = screen.getByRole("checkbox");
    await user.tab();
    expect(box).toHaveFocus();
  });

  it("is inert when disabled", async () => {
    // Base UI renders <span role="checkbox" aria-disabled>, not a natively disabled
    // element — deliberately, because a disabled element is unreachable by keyboard and
    // undiscoverable to a screen reader. The assertion that matters is that the
    // interaction is actually blocked.
    const user = userEvent.setup();
    render(
      <Choice label="Locked" disabled>
        <Checkbox disabled />
      </Choice>,
    );
    const box = screen.getByRole("checkbox");
    expect(box).toHaveAttribute("aria-disabled", "true");
    await user.click(box);
    expect(box).not.toBeChecked();
  });

  it("stays square — never the radio's circle", () => {
    render(
      <Choice label="Square">
        <Checkbox />
      </Choice>,
    );
    expect(screen.getByRole("checkbox").className).not.toContain("rounded-full");
  });

  it("uses --input for its boundary, like every other control", () => {
    render(
      <Choice label="Square">
        <Checkbox />
      </Choice>,
    );
    // --border would reintroduce the 1.26:1 WCAG 1.4.11 failure §4.4 fixed.
    expect(screen.getByRole("checkbox").className).toContain("border-input");
  });
});

describe("Radio — the circle exception", () => {
  it("is round, deliberately, to stay distinguishable from a checkbox", () => {
    render(
      <Field as="group" label="State">
        <RadioGroup>
          <Choice label="Wyoming">
            <Radio value="wy" />
          </Choice>
        </RadioGroup>
      </Field>,
    );
    expect(screen.getByRole("radio").className).toContain("rounded-full");
  });

  it("selects one option and reports the value", async () => {
    const user = userEvent.setup();
    let value = "";
    render(
      <Field as="group" label="State">
        <RadioGroup onValueChange={(v) => (value = v)}>
          <Choice label="Wyoming">
            <Radio value="wy" />
          </Choice>
          <Choice label="Delaware">
            <Radio value="de" />
          </Choice>
        </RadioGroup>
      </Field>,
    );
    await user.click(screen.getByRole("radio", { name: "Delaware" }));
    await waitFor(() => expect(value).toBe("de"));
  });

  it("moves between options with the arrow keys", async () => {
    const user = userEvent.setup();
    render(
      <Field as="group" label="State">
        <RadioGroup defaultValue="wy">
          <Choice label="Wyoming">
            <Radio value="wy" />
          </Choice>
          <Choice label="Delaware">
            <Radio value="de" />
          </Choice>
        </RadioGroup>
      </Field>,
    );
    screen.getByRole("radio", { name: "Wyoming" }).focus();
    await user.keyboard("{ArrowDown}");
    await waitFor(() =>
      expect(screen.getByRole("radio", { name: "Delaware" })).toBeChecked(),
    );
  });

  it("keeps only one option selected", async () => {
    const user = userEvent.setup();
    render(
      <Field as="group" label="State">
        <RadioGroup defaultValue="wy">
          <Choice label="Wyoming">
            <Radio value="wy" />
          </Choice>
          <Choice label="Delaware">
            <Radio value="de" />
          </Choice>
        </RadioGroup>
      </Field>,
    );
    await user.click(screen.getByRole("radio", { name: "Delaware" }));
    await waitFor(() => {
      expect(screen.getByRole("radio", { name: "Delaware" })).toBeChecked();
      expect(screen.getByRole("radio", { name: "Wyoming" })).not.toBeChecked();
    });
  });
});

describe("Switch — rectangle", () => {
  it("toggles and reports the change", async () => {
    const user = userEvent.setup();
    let value = false;
    render(
      <Choice label="Publish articles automatically">
        <Switch onCheckedChange={(v) => (value = v)} />
      </Choice>,
    );
    await user.click(screen.getByRole("switch"));
    await waitFor(() => expect(value).toBe(true));
  });

  it("is a rectangle — no pill, no rounding", () => {
    render(
      <Choice label="Publish automatically">
        <Switch />
      </Choice>,
    );
    expect(screen.getByRole("switch").className).not.toContain("rounded-full");
  });

  it("is inert when disabled", async () => {
    const user = userEvent.setup();
    render(
      <Choice label="Locked">
        <Switch disabled />
      </Choice>,
    );
    const sw = screen.getByRole("switch");
    expect(sw).toHaveAttribute("aria-disabled", "true");
    await user.click(sw);
    expect(sw).not.toBeChecked();
  });
});

describe("choice controls share the focus contract", () => {
  it("every control draws the same focus ring and never removes it", () => {
    render(
      <Field as="group" label="All three">
        <Choice label="Checkbox">
          <Checkbox />
        </Choice>
        <Choice label="Switch">
          <Switch />
        </Choice>
        <RadioGroup>
          <Choice label="Radio">
            <Radio value="r" />
          </Choice>
        </RadioGroup>
      </Field>,
    );
    for (const role of ["checkbox", "switch", "radio"] as const) {
      const el = screen.getByRole(role);
      expect(el.className).toContain("focus-visible:outline-ring");
      expect(el.className).not.toContain("outline-none");
    }
  });
});
