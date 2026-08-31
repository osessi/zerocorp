"use client";

import { useEffect, useState } from "react";
import { Field, Input, Textarea, Select, type SelectOption } from "@zerocorp/ui";

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

          <footer className="border-border text-caption text-muted-foreground border-t pt-6">
            Development surface. Not a product feature — see docs/DESIGN_SYSTEM.md §22.
          </footer>
        </div>
      </div>
    </div>
  );
}
