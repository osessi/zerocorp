/** @vitest-environment happy-dom */
import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { TrashIcon } from "@phosphor-icons/react/dist/ssr";
import { Button } from "../button/Button";
import { Dialog, DialogClose } from "./Dialog";
import { DropdownMenu, MenuItem } from "./DropdownMenu";
import { CommandMenu, type CommandItem } from "./CommandMenu";
import {
  OVERLAY_BACKDROP,
  OVERLAY_ITEM,
  OVERLAY_SURFACE,
  OVERLAY_SURFACE_MODAL,
} from "./overlay-styles";
import { ITEM as SELECT_ITEM, POPUP as SELECT_POPUP } from "../field/Select";

afterEach(cleanup);

describe("overlay-styles — one floating surface, not five", () => {
  it("draws every popup edge with --input, never --border", () => {
    // A popup edge separates a floating layer from the page: a meaningful graphical
    // object, so WCAG 1.4.11 asks 3:1. --border is 1.26:1 light and 1.31:1 dark.
    expect(OVERLAY_SURFACE).toContain("border-input");
    expect(OVERLAY_SURFACE).not.toMatch(/\bborder-border\b/);
  });

  it("keeps the Select popup and the menu popup on the same contract", () => {
    // A menu and a select popup that highlight differently teach two rules for one
    // gesture. Both must carry the same edge and the same item rules.
    expect(SELECT_POPUP).toContain("border-input");
    for (const rule of [
      "data-highlighted:bg-accent",
      "border border-transparent",
      "outline-hidden",
    ]) {
      expect(SELECT_ITEM).toContain(rule);
      expect(OVERLAY_ITEM).toContain(rule);
    }
  });

  it("marks the chosen item, not just the cursor, on every primitive", () => {
    // The Select shipped for a day with only data-highlighted, and the grey CURSOR band
    // read as "selected" — the louder visual on the less important meaning.
    //
    // Both attribute names: Select.Item sets data-selected, Menu and Combobox set
    // data-checked. Carrying one would reintroduce the same defect on the other two.
    for (const attr of ["data-selected", "data-checked"]) {
      expect(OVERLAY_ITEM).toContain(`${attr}:border-primary`);
      expect(OVERLAY_ITEM).toContain(`${attr}:font-medium`);
    }
  });

  it("gives a surface over a backdrop a different edge from one on the page", () => {
    // --input is validated at 3.03:1 against the PAGE. A modal sits on the page dimmed by
    // a 40% scrim, and against that ground (~#999) the same #949494 measures 1.06:1 — the
    // border was present, correct by its own rule, and invisible. Chrome, 2026-08-31.
    expect(OVERLAY_SURFACE).toContain("border-input");
    expect(OVERLAY_SURFACE_MODAL).toContain("border-foreground");
    expect(OVERLAY_SURFACE_MODAL).not.toContain("border-input");
  });

  it("flips the backdrop with the theme", () => {
    // A fixed black scrim washes out to nothing on a dark page.
    expect(OVERLAY_BACKDROP).toContain("bg-foreground/40");
  });
});

describe("Dialog", () => {
  it("takes its accessible name from the required title", async () => {
    render(
      <Dialog trigger={<Button>Open</Button>} title="Dissolve Vela Commerce LLC?">
        <p>Body</p>
      </Dialog>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() =>
      expect(screen.getByRole("dialog", { name: "Dissolve Vela Commerce LLC?" })).toBeInTheDocument(),
    );
  });

  it("cannot be built without a title", () => {
    // aria-labelledby on a modal is not optional.
    // @ts-expect-error title is required
    const invalid = () => <Dialog trigger={<Button>Open</Button>} />;
    expect(typeof invalid).toBe("function");
  });

  it("closes on Escape and returns focus to the trigger", async () => {
    render(<Dialog trigger={<Button>Open</Button>} title="Confirm" />);
    const trigger = screen.getByRole("button", { name: "Open" });
    await userEvent.click(trigger);
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
    expect(trigger).toHaveFocus();
  });

  it("closes from a DialogClose in the footer", async () => {
    render(
      <Dialog
        trigger={<Button>Open</Button>}
        title="Confirm"
        footer={<DialogClose><Button variant="secondary">Cancel</Button></DialogClose>}
      />,
    );
    await userEvent.click(screen.getByRole("button", { name: "Open" }));
    await waitFor(() => expect(screen.getByRole("dialog")).toBeInTheDocument());
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  });
});

describe("DropdownMenu", () => {
  it("opens and exposes its items", async () => {
    render(
      <DropdownMenu trigger={<Button>Actions</Button>}>
        <MenuItem>Edit details</MenuItem>
        <MenuItem icon={TrashIcon} destructive>Dissolve company</MenuItem>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    await waitFor(() => expect(screen.getByRole("menu")).toBeInTheDocument());
    expect(screen.getByRole("menuitem", { name: "Edit details" })).toBeInTheDocument();
  });

  it("inks a destructive item, never fills it", async () => {
    // A menu is a list. One filled red band would out-shout every other row in it.
    render(
      <DropdownMenu trigger={<Button>Actions</Button>}>
        <MenuItem destructive>Dissolve company</MenuItem>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    const item = await screen.findByRole("menuitem", { name: "Dissolve company" });
    expect(item.className).toContain("text-destructive");
    expect(item.className).not.toContain("bg-destructive");
  });

  it("hides a menu item's icon from assistive technology", async () => {
    render(
      <DropdownMenu trigger={<Button>Actions</Button>}>
        <MenuItem icon={TrashIcon}>Dissolve company</MenuItem>
      </DropdownMenu>,
    );
    await userEvent.click(screen.getByRole("button", { name: "Actions" }));
    const item = await screen.findByRole("menuitem", { name: "Dissolve company" });
    expect(item.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });
});

const COMMANDS: CommandItem[] = [
  { id: "b1", group: "Businesses", label: "Northwind Studio LLC" },
  { id: "b2", group: "Businesses", label: "Bluepine Labs LLC" },
  { id: "a1", group: "Actions", label: "Start a new formation" },
];

describe("CommandMenu — a combobox, not a list of buttons", () => {
  it("exposes real listbox semantics", async () => {
    // The first version was a bare input over plain <button>s. They never receive
    // data-highlighted, carry no role, and give the input nothing to point
    // aria-activedescendant at — it looked like a different component because it was one.
    render(<CommandMenu items={COMMANDS} open onOpenChange={() => {}} />);
    await waitFor(() => expect(screen.getByRole("listbox")).toBeInTheDocument());
    expect(screen.getAllByRole("option")).toHaveLength(3);
  });

  it("gives its rows the same contract as the Select and the menu", async () => {
    render(<CommandMenu items={COMMANDS} open onOpenChange={() => {}} />);
    const option = await screen.findByRole("option", { name: /Northwind/ });
    for (const rule of ["data-highlighted:bg-accent", "border border-transparent"]) {
      expect(option.className).toContain(rule);
      expect(SELECT_ITEM).toContain(rule);
    }
    // Base UI names the chosen state differently per primitive — data-selected on
    // Select.Item, data-checked on Menu and Combobox. The shared contract carries both,
    // or it silently stops marking the choice on two of the three.
    expect(option.className).toContain("data-selected:border-primary");
    expect(option.className).toContain("data-checked:border-primary");
  });

  it("filters as you type, and drops a group that empties", async () => {
    render(<CommandMenu items={COMMANDS} open onOpenChange={() => {}} />);
    const input = await screen.findByRole("combobox");
    await userEvent.type(input, "nor");
    await waitFor(() => expect(screen.getAllByRole("option")).toHaveLength(1));
    expect(screen.queryByText("Actions")).toBeNull();
  });

  it("indicates focus with a surface change, not a ring around the input", async () => {
    // The input is auto-focused and keeps DOM focus for the palette's whole life —
    // Combobox drives the list through aria-activedescendant. A ring that is always on
    // indicates nothing; it just draws a teal box around the search field.
    //
    // It used to thicken the bottom border to 2px in the primary colour. That is a
    // single-edge accent, which the design system bans outright — see the CI rule in
    // tests/architecture. A tinted surface says the same thing on all four sides.
    render(<CommandMenu items={COMMANDS} open onOpenChange={() => {}} />);
    const input = await screen.findByRole("combobox");
    const row = input.parentElement;
    expect(row?.className).toContain("has-[:focus-visible]:bg-accent");
    expect(row?.className).not.toContain("border-b-2");
  });

  it("hides that ring without removing it", async () => {
    // outline-hidden, not outline-none. Tailwind v4 renamed it for exactly this case: it
    // keeps a transparent outline so Windows High Contrast Mode still renders one.
    render(<CommandMenu items={COMMANDS} open onOpenChange={() => {}} />);
    const input = await screen.findByRole("combobox");
    expect(input.className).not.toContain("outline-none");
    expect(input.className).toContain("outline-hidden");
  });

  it("takes a translated empty message rather than hard-coding English", async () => {
    render(
      <CommandMenu items={[]} open onOpenChange={() => {}} emptyMessage="Aucun résultat." />,
    );
    expect(await screen.findByText("Aucun résultat.")).toBeInTheDocument();
  });
});
