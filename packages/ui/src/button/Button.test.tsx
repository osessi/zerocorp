/** @vitest-environment happy-dom */
import { describe, it, expect, afterEach, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { PlusIcon, TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "./Button";
import { IconButton } from "./IconButton";
import { CONTROL_HEIGHT } from "../field/control-styles";
import {
  BUTTON_BASE,
  BUTTON_INERT,
  BUTTON_SIZE,
  BUTTON_VARIANT,
  type ButtonVariant,
} from "./button-styles";

afterEach(cleanup);

const VARIANTS: ButtonVariant[] = ["primary", "secondary", "tertiary", "ghost", "danger"];

describe("Button — the native element, done properly", () => {
  it("renders its label", () => {
    render(<Button>Create business</Button>);
    expect(screen.getByRole("button", { name: "Create business" })).toBeInTheDocument();
  });

  it('defaults to type="button"', () => {
    // A <button> inside a <form> submits it by default. Every Cancel that forgot to say
    // type="button" is an accidental submit. The default is the fix.
    render(<Button>Cancel</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });

  it("still lets a form submit ask for it explicitly", () => {
    render(<Button type="submit">Save</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "submit");
  });

  it("does not fire when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        Submit
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});

describe("Button — loading", () => {
  it("disables itself, so a submit cannot be fired twice", () => {
    render(<Button loading>Submit filing</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
  });

  it("keeps the label visible — the spinner takes the icon slot, not the text", () => {
    render(
      <Button loading icon={PlusIcon}>
        Submit filing
      </Button>,
    );
    expect(screen.getByText("Submit filing")).toBeVisible();
  });

  it("shows exactly one glyph while loading, so the button does not grow", () => {
    const { container } = render(
      <Button loading icon={PlusIcon}>
        Submit filing
      </Button>,
    );
    expect(container.querySelectorAll("svg")).toHaveLength(1);
  });

  it("hides the spinner from assistive technology — aria-busy already says it", () => {
    const { container } = render(<Button loading>Submit</Button>);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("does NOT dim while busy — a working button is not an inactive one", () => {
    // The first implementation put `disabled:opacity-60` in the base. Because loading
    // also sets the disabled attribute, the loading label measured 1.76:1 on primary and
    // 1.86:1 on danger in Chrome — the state where the user is waiting was the least
    // legible on the screen. WCAG 1.4.3 exempts an INACTIVE component, not a busy one.
    render(
      <Button variant="primary" loading>
        Submitting
      </Button>,
    );
    const cls = screen.getByRole("button").className;
    expect(cls).not.toContain("opacity-60");
    expect(cls).toContain("cursor-progress");
    // And the base must carry no `disabled:` cursor either. It out-specifies a bare
    // `cursor-progress`, so the busy cursor never rendered while this test still passed
    // on the class name alone. Chrome reported not-allowed. 2026-08-31.
    expect(BUTTON_BASE).not.toContain("disabled:");
  });

  it("keeps every disabled-state style off the base, so no future state inherits it", () => {
    expect(BUTTON_BASE).not.toContain("opacity");
    expect(BUTTON_BASE).not.toContain("cursor");
  });

  it("still dims a genuinely disabled button", () => {
    render(<Button disabled>Submit</Button>);
    expect(screen.getByRole("button").className).toContain(BUTTON_INERT);
  });

  it("respects prefers-reduced-motion on the spin", () => {
    const { container } = render(<Button loading>Submit</Button>);
    expect(container.querySelector("svg")?.getAttribute("class")).toContain(
      "motion-safe:animate-spin",
    );
  });
});

describe("Button — contrast findings that must not be undone", () => {
  it("never inks tertiary with --primary", () => {
    // --primary has no dark value, so teal TEXT measures 3.69:1 on #0A0A0A. That clears
    // 3:1 for a fill or a border and fails the 4.5:1 floor for text. Measured 2026-08-31.
    expect(BUTTON_VARIANT.tertiary).not.toContain("text-primary");
    expect(BUTTON_VARIANT.tertiary).toContain("text-foreground");
  });

  it("fills secondary with --background, never --secondary", () => {
    // --input is tuned against the page colour: 3.03:1 there, 2.76:1 on --secondary
    // (#F4F4F5). A button edge is a control boundary and owes WCAG 1.4.11 3:1. §4.4.
    expect(BUTTON_VARIANT.secondary).toContain("bg-background");
    expect(BUTTON_VARIANT.secondary).not.toMatch(/\bbg-secondary\b/);
    expect(BUTTON_VARIANT.secondary).toContain("border-input");
  });

  it("gives every filled variant a hover that is a token, not an opacity trick", () => {
    expect(BUTTON_VARIANT.primary).toContain("hover:bg-primary-hover");
    expect(BUTTON_VARIANT.danger).toContain("hover:bg-destructive-hover");
    for (const v of VARIANTS) expect(BUTTON_VARIANT[v]).not.toMatch(/\/\d0\b/);
  });

  it("never animates the focus ring", () => {
    // `transition-colors` includes outline-color in Tailwind v4, so the ring faded in
    // over 150ms carrying the label colour for the first frames. Measured in Chrome
    // 2026-08-31: outline-color was rgb(240,253,250) at 0ms and rgb(0,120,111) at 150ms.
    expect(BUTTON_BASE).not.toContain("transition-colors");
    expect(BUTTON_BASE).toContain("transition-[color,background-color,border-color]");
  });

  it("never removes the focus outline", () => {
    // outline-none leaves the ring with a width and a colour but no style — invisible.
    for (const v of VARIANTS) {
      cleanup();
      render(<Button variant={v}>Go</Button>);
      const cls = screen.getByRole("button").className;
      expect(cls).not.toContain("outline-none");
      expect(cls).toContain("focus-visible:outline-ring");
    }
  });
});

describe("Button — size and layout", () => {
  it("matches the form control height at md, so it sits flush beside an Input", () => {
    expect(BUTTON_SIZE.md).toContain(CONTROL_HEIGHT);
  });

  it("keeps the smallest size above the 24x24 target minimum", () => {
    // h-8 is 32px. WCAG 2.5.8 asks for 24. sm is the floor; there is no xs.
    expect(BUTTON_SIZE.sm).toContain("h-8");
  });

  it("stays on one line", () => {
    render(<Button>Soumettre la demande de formation</Button>);
    expect(screen.getByRole("button").className).toContain("whitespace-nowrap");
  });

  it("never truncates or fixes its width", () => {
    render(<Button>Soumettre la demande de formation</Button>);
    const cls = screen.getByRole("button").className;
    expect(cls).not.toContain("truncate");
    expect(cls).not.toMatch(/\bw-\d/);
  });

  it("accepts a className without losing its variant", () => {
    render(
      <Button variant="danger" className="mt-2">
        Delete
      </Button>,
    );
    const cls = screen.getByRole("button").className;
    expect(cls).toContain("mt-2");
    expect(cls).toContain("bg-destructive");
  });
});

describe("IconButton — a button with no text still needs a name", () => {
  it("takes its accessible name from the required label", () => {
    render(<IconButton label="Delete business" icon={TrashIcon} />);
    expect(screen.getByRole("button", { name: "Delete business" })).toBeInTheDocument();
  });

  it("cannot be built without a label", () => {
    // The whole reason IconButton exists rather than <Button variant="icon">. A variant
    // string cannot require a prop; a required prop can.
    // @ts-expect-error label is required
    const invalid = () => <IconButton icon={TrashIcon} />;
    expect(typeof invalid).toBe("function");
  });

  it("hides the glyph, so the name is announced once and not twice", () => {
    const { container } = render(<IconButton label="Add" icon={PlusIcon} />);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("is square at every size, and never smaller than 32px", () => {
    for (const [size, expected] of [
      ["sm", "size-8"],
      ["md", "size-10"],
      ["lg", "size-12"],
    ] as const) {
      cleanup();
      render(<IconButton label="Add" icon={PlusIcon} size={size} />);
      expect(screen.getByRole("button").className).toContain(expected);
    }
  });

  it("defaults to ghost — an icon-only control lives in toolbars and dense rows", () => {
    render(<IconButton label="Add" icon={PlusIcon} />);
    expect(screen.getByRole("button").className).toContain("text-muted-foreground");
  });
});
