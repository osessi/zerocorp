"use client";

import { useEffect, useState } from "react";
import { Field, Input, Textarea, Select, Choice, Checkbox, Radio, RadioGroup, Switch, type SelectOption } from "@zerocorp/ui";
import { SwitchCurrent, SwitchIconic, SwitchLabelled, SwitchTwoCell } from "./_prototype/switch-variants";

/**
 * Design system review surface.
 *
 * NOT a product feature. This route exists so a human can look at the real components
 * — not a mockup — in every state and both themes before approving them.
 * docs/DESIGN_SYSTEM.md §22, design review process.
 *
 * Every component added to the registry gets a section here.
 */

function Case({ title, note, children }: { title: string; note?: string; children: React.ReactNode }) {
  return (
    <div className="border-border flex flex-col gap-3 border p-4">
      <div className="flex flex-col gap-1">
        <span className="text-overline text-muted-foreground uppercase">{title}</span>
        {note ? <span className="text-caption text-muted-foreground">{note}</span> : null}
      </div>
      {children}
    </div>
  );
}

function Matrix() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Case title="Default" note="border --input #949494 · 3.03:1">
        <Field label="Business name">
          <Input placeholder="Acme LLC" />
        </Field>
      </Case>

      <Case title="Filled" note="Geist Sans · 14px from sm, 16px on mobile">
        <Field label="Business name">
          <Input defaultValue="Acme Consulting LLC" />
        </Field>
      </Case>

      <Case title="With description" note="caption 12px · --muted-foreground">
        <Field label="Domain" description="Shown on your invoices and website">
          <Input defaultValue="acme.com" />
        </Field>
      </Case>

      <Case title="Required" note="visible indicator · aria-required">
        <Field label="Legal name" required>
          <Input required placeholder="As it appears on your passport" />
        </Field>
      </Case>

      <Case title="Hover" note="--input-hover #737373 · hover me">
        <Field label="Hover this control">
          <Input placeholder="Border darkens on hover" />
        </Field>
      </Case>

      <Case title="Focus" note="--ring #00786F · 2px, outside the border">
        <Field label="Focus this control">
          <Input placeholder="Tab or click here" />
        </Field>
      </Case>

      <Case title="Loading" note="aria-busy · still focusable, NOT disabled">
        <Field label="Domain" loading description="Checking availability">
          <Input defaultValue="acme.com" />
        </Field>
      </Case>

      <Case title="Disabled" note="inert · --muted background">
        <Field label="EIN" disabled description="Issued after formation">
          <Input disabled defaultValue="Pending" />
        </Field>
      </Case>

      <Case title="Error" note="--destructive · role=alert · description hidden">
        <Field label="EIN" description="Nine digits" error="Enter a valid nine-digit EIN">
          <Input defaultValue="12-345" />
        </Field>
      </Case>

      <Case title="Success" note="--success · role=status">
        <Field label="Domain" success="Domain verified and connected">
          <Input defaultValue="acme.com" />
        </Field>
      </Case>

      <Case title="Numbers" note="Geist Mono is mandatory for comparable values">
        <Field label="Credits remaining">
          <Input className="font-mono" defaultValue="1,284.00" />
        </Field>
      </Case>

      <Case title="Long label" note="i18n — French runs ~25% longer than English">
        <Field
          label="Nom légal complet de la société tel qu'il apparaît sur les documents"
          description="Aucune mise en page ne dépend d'une longueur de chaîne"
        >
          <Input placeholder="Acme LLC" />
        </Field>
      </Case>
    </div>
  );
}

function TextareaMatrix() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Case title="Default" note="4 rows · vertical resize only">
        <Field label="Business description">
          <Textarea placeholder="We help agencies launch faster…" />
        </Field>
      </Case>

      <Case title="Filled + description" note="same shell as Input">
        <Field label="Positioning" description="Two or three sentences is enough">
          <Textarea defaultValue="We give non-resident founders a US company and a working digital foundation in days, not months." />
        </Field>
      </Case>

      <Case title="Rows override" note="rows={8} — grows with content">
        <Field label="Voice transcript">
          <Textarea rows={8} defaultValue="Transcribed from the onboarding call…" />
        </Field>
      </Case>

      <Case title="Loading" note="spinner sits at the top, not centred">
        <Field label="Positioning" loading description="Extracting your Business Brain">
          <Textarea defaultValue="We help agencies…" />
        </Field>
      </Case>

      <Case title="Disabled" note="inert · resize also disabled">
        <Field label="Positioning" disabled description="Available after onboarding">
          <Textarea disabled defaultValue="Pending" />
        </Field>
      </Case>

      <Case title="Error" note="--destructive · role=alert">
        <Field
          label="Positioning"
          description="Two or three sentences"
          error="Describe what makes you different from competitors"
        >
          <Textarea defaultValue="We are the best" />
        </Field>
      </Case>
    </div>
  );
}

const STATES: SelectOption[] = [
  { value: "wy", label: "Wyoming" },
  { value: "de", label: "Delaware" },
  { value: "nm", label: "New Mexico" },
  { value: "fl", label: "Florida" },
  { value: "tx", label: "Texas" },
  { value: "ca", label: "California (not available for non-residents)", disabled: true },
];

const LONG: SelectOption[] = [
  { value: "llc", label: "Limited Liability Company (single member, foreign-owned)" },
  { value: "ccorp", label: "C Corporation — Delaware, standard for venture financing" },
  { value: "scorp", label: "S Corporation (US persons and residents only)", disabled: true },
];

function SelectMatrix() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Case title="Default" note="placeholder · --muted-foreground">
        <Field label="State of formation">
          <Select options={STATES} placeholder="Choose a state" />
        </Field>
      </Case>

      <Case title="Selected" note="renders the label, never the value">
        <Field label="State of formation" description="Wyoming is the usual choice">
          <Select options={STATES} defaultValue="wy" />
        </Field>
      </Case>

      <Case title="Open me" note="check highlight, selected indicator, disabled option">
        <Field label="Open this select">
          <Select options={STATES} defaultValue="de" />
        </Field>
      </Case>

      <Case title="Long options" note="wrap rather than truncate">
        <Field label="Entity type">
          <Select options={LONG} defaultValue="llc" />
        </Field>
      </Case>

      <Case title="Disabled" note="inert · --muted background">
        <Field label="State of formation" disabled description="Locked after filing">
          <Select options={STATES} defaultValue="wy" disabled />
        </Field>
      </Case>

      <Case title="Error" note="--destructive · role=alert">
        <Field label="State of formation" error="Choose a state of formation">
          <Select options={STATES} placeholder="Choose a state" />
        </Field>
      </Case>

      <Case title="Success" note="--success · role=status">
        <Field label="State of formation" success="Wyoming confirmed">
          <Select options={STATES} defaultValue="wy" />
        </Field>
      </Case>

      <Case title="Long label" note="i18n — trigger truncates, label wraps">
        <Field label="État d'immatriculation de la société aux États-Unis">
          <Select options={LONG} defaultValue="ccorp" />
        </Field>
      </Case>
    </div>
  );
}

function ChoiceMatrix() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Case title="Checkbox" note="square · radius 0 · click the text">
        <Choice label="Send me the daily business report">
          <Checkbox />
        </Choice>
      </Case>

      <Case title="Checkbox + description" note="indented under the label">
        <Choice
          label="I confirm the information is accurate"
          description="This is a legal declaration made under penalty of perjury"
        >
          <Checkbox />
        </Choice>
      </Case>

      <Case title="Checkbox error" note="standalone owns its message">
        <Choice label="I accept the terms" error="You must accept the terms to continue">
          <Checkbox />
        </Choice>
      </Case>

      <Case title="Checkbox disabled" note="aria-disabled, still discoverable">
        <Choice label="Locked after filing" disabled>
          <Checkbox disabled defaultChecked />
        </Choice>
      </Case>

      <Case title="Switch" note="rectangle · square thumb · radius 0">
        <Choice label="Publish articles automatically">
          <Switch defaultChecked />
        </Choice>
      </Case>

      <Case title="Switch + description" note="applies immediately">
        <Choice
          label="Autopilot"
          description="Agents act without waiting for your approval"
        >
          <Switch />
        </Choice>
      </Case>

      <Case title="Radio group" note="circle — the deliberate exception">
        <Field as="group" label="State of formation" description="Wyoming is the usual choice">
          <RadioGroup defaultValue="wy">
            <Choice label="Wyoming"><Radio value="wy" /></Choice>
            <Choice label="Delaware"><Radio value="de" /></Choice>
            <Choice label="New Mexico"><Radio value="nm" /></Choice>
          </RadioGroup>
        </Field>
      </Case>

      <Case title="Radio group error" note="one message for the whole group">
        <Field as="group" label="Entity type" error="Choose an entity type">
          <RadioGroup>
            <Choice label="LLC — single member"><Radio value="llc" /></Choice>
            <Choice label="C Corporation"><Radio value="ccorp" /></Choice>
          </RadioGroup>
        </Field>
      </Case>

      <Case title="Checkbox group" note="Field as=group with checkboxes">
        <Field as="group" label="Notify me about" description="Choose as many as you like">
          <Choice label="Formation status changes"><Checkbox defaultChecked /></Choice>
          <Choice label="Documents awaiting review"><Checkbox /></Choice>
          <Choice label="Agent activity"><Checkbox /></Choice>
        </Field>
      </Case>

      <Case title="Long option label" note="i18n — wraps, control stays aligned">
        <Field as="group" label="Type d'entité">
          <RadioGroup defaultValue="a">
            <Choice label="Société à responsabilité limitée à membre unique détenue par un non-résident">
              <Radio value="a" />
            </Choice>
            <Choice label="Corporation"><Radio value="b" /></Choice>
          </RadioGroup>
        </Field>
      </Case>

      <Case title="All three together" note="same box size, same focus ring">
        <Field as="group" label="Mixed controls">
          <Choice label="Checkbox"><Checkbox /></Choice>
          <Choice label="Switch"><Switch /></Choice>
          <RadioGroup defaultValue="one">
            <Choice label="Radio"><Radio value="one" /></Choice>
          </RadioGroup>
        </Field>
      </Case>
    </div>
  );
}

const VARIANTS = [
  { id: "current", name: "Current (validated)", note: "36×20 · colour + position only", Comp: SwitchCurrent },
  { id: "a", name: "A — Iconic thumb", note: "36×20 · check / minus in the thumb", Comp: SwitchIconic },
  { id: "b", name: "B — Labelled track", note: "56×20 · the word is inside", Comp: SwitchLabelled },
  { id: "c", name: "C — Two-cell track", note: "40×20 · mechanical two-position", Comp: SwitchTwoCell },
] as const;

function SwitchVariants() {
  return (
    <div className="flex flex-col gap-6">
      {/* Side by side, both states, so the OFF/ON difference is judged at a glance. */}
      <div className="border-border overflow-x-auto border">
        <table className="w-full min-w-[40rem] border-collapse">
          <thead>
            <tr className="border-border border-b">
              {["Variant", "Off", "On", "Disabled off", "Disabled on"].map((h) => (
                <th key={h} className="text-overline text-muted-foreground px-4 py-3 text-left font-medium uppercase">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {VARIANTS.map(({ id, name, note, Comp }, i) => (
              <tr key={id} className={i > 0 ? "border-border border-t" : ""}>
                <td className="px-4 py-4">
                  <span className="flex flex-col">
                    <span className="text-body-sm">{name}</span>
                    <span className="text-caption text-muted-foreground">{note}</span>
                  </span>
                </td>
                <td className="px-4 py-4"><Comp /></td>
                <td className="px-4 py-4"><Comp defaultChecked /></td>
                <td className="px-4 py-4"><Comp disabled /></td>
                <td className="px-4 py-4"><Comp disabled defaultChecked /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* In context: a consequential toggle inside a settings list. */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {VARIANTS.map(({ id, name, Comp }) => (
          <div key={id} className="border-border flex flex-col gap-3 border p-4">
            <span className="text-overline text-muted-foreground uppercase">{name} — in context</span>
            <div className="flex flex-col gap-1">
              {[
                { label: "Autopilot", desc: "Agents act without waiting for your approval", on: true },
                { label: "Publish articles automatically", desc: "New posts go live without review", on: false },
                { label: "Outbound email sequences", desc: "Send from your warmed domain", on: false },
              ].map((r) => (
                <label key={r.label} className="hover:bg-accent flex cursor-pointer items-start gap-3 py-1 transition-colors duration-fast">
                  <span className="mt-0.5"><Comp defaultChecked={r.on} /></span>
                  <span className="flex min-w-0 flex-col">
                    <span className="text-body-sm">{r.label}</span>
                    <span className="text-caption text-muted-foreground">{r.desc}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Greyscale: the test colour cannot pass. */}
      <div className="border-border flex flex-col gap-3 border p-4">
        <span className="text-overline text-muted-foreground uppercase">
          Greyscale — can you still read the state?
        </span>
        <div className="flex flex-wrap items-center gap-8 grayscale">
          {VARIANTS.map(({ id, name, Comp }) => (
            <span key={id} className="flex items-center gap-3">
              <span className="text-caption text-muted-foreground">{name.split(" ")[0]}</span>
              <Comp />
              <Comp defaultChecked />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function DesignSystemPage() {
  const [dark, setDark] = useState(false);

  /**
   * The theme class goes on <html>, never on a wrapper element.
   *
   * Portalled components — Select's popup, and later Dialog, Drawer, Popover, Tooltip,
   * Dropdown and Toast — mount on document.body, outside any wrapper. A theme class on a
   * div leaves every one of them rendering light-mode tokens on a dark page.
   * Found by visual review on 2026-08-31. docs/DESIGN_SYSTEM.md §13.
   */
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <div>
      <div className="bg-background text-foreground min-h-screen">
        <div className="mx-auto flex max-w-(--container-content) flex-col gap-8 p-8">
          <header className="border-border flex items-center justify-between border-b pb-6">
            <div className="flex flex-col gap-2">
              <h1 className="text-h2">Field + Input</h1>
              <p className="text-body-sm text-muted-foreground">
                Lyra · Base UI · Geist · radius 0 · teal #00786F — the reference form control
              </p>
            </div>
            <button
              type="button"
              onClick={() => setDark((d) => !d)}
              className="border-input hover:border-input-hover text-label focus-visible:outline-ring h-10 border px-4 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {dark ? "Light" : "Dark"}
            </button>
          </header>

          <section className="flex flex-col gap-4">
            <h2 className="text-h4">Input</h2>
            <Matrix />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-h4">Textarea</h2>
            <p className="text-body-sm text-muted-foreground">
              Same Field shell, same tokens, same states. No new pattern.
            </p>
            <TextareaMatrix />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-h4">Select</h2>
            <p className="text-body-sm text-muted-foreground">
              Same Field shell and control contract. The trigger is a button, so it takes
              aria-labelledby from the Field.
            </p>
            <SelectMatrix />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-h4">Choice controls</h2>
            <p className="text-body-sm text-muted-foreground">
              Checkbox square, Radio circle, Switch rectangle. Same Field shell, label beside
              the control, the whole row is the click target.
            </p>
            <ChoiceMatrix />
          </section>

          <section className="flex flex-col gap-4">
            <h2 className="text-h4">Switch variants — proposals</h2>
            <p className="text-body-sm text-muted-foreground">
              The validated switch reads its state from colour and thumb position only,
              which conflicts with §14. Three proposals, all Lyra, radius 0, teal.
            </p>
            <SwitchVariants />
          </section>

          <footer className="border-border text-caption text-muted-foreground border-t pt-6">
            Development surface. Not a product feature — see docs/DESIGN_SYSTEM.md §22.
          </footer>
        </div>
      </div>
    </div>
  );
}
