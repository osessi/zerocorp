"use client";

import { useEffect, useState } from "react";
import {
  Button,
  IconButton,
  StatusBadge,
  type ButtonSize,
  type ButtonVariant,
} from "@zerocorp/ui";
import {
  PlusIcon,
  ArrowRightIcon,
  TrashIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  PencilSimpleIcon,
} from "@phosphor-icons/react/dist/ssr";

/**
 * Button and IconButton — visual review surface.
 *
 * Renders the real components from @zerocorp/ui. What this page has to prove before the
 * registry entry: five variants read as a prominence ladder, the two new hover tokens
 * behave in both themes, loading does not move the button, focus is visible on every
 * variant, and nothing depends on colour alone. docs/DESIGN_SYSTEM.md §19.
 */

const cx = (...p: Array<string | false | undefined>) => p.filter(Boolean).join(" ");

const VARIANTS: { key: ButtonVariant; note: string }[] = [
  { key: "primary", note: "one per screen — the thing to do" },
  { key: "danger", note: "destructive, and it must look it" },
  { key: "secondary", note: "has an edge, does not compete" },
  { key: "tertiary", note: "reads as a button on hover" },
  { key: "ghost", note: "recedes until hovered" },
];

const SIZES: ButtonSize[] = ["sm", "md", "lg"];

function Section({
  title,
  note,
  children,
}: {
  title: string;
  note: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4">
      <div className="flex flex-col gap-1">
        <h2 className="text-h4">{title}</h2>
        <p className="text-body-sm text-muted-foreground">{note}</p>
      </div>
      {children}
    </section>
  );
}

export default function ButtonReviewPage() {
  const [dark, setDark] = useState(false);
  const [grey, setGrey] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    return () => document.documentElement.classList.remove("dark");
  }, [dark]);

  return (
    <div className="bg-background text-foreground min-h-screen">
      <div
        className={cx(
          "mx-auto flex max-w-(--container-content) flex-col gap-10 p-4 sm:p-8",
          grey && "grayscale",
        )}
      >
        <header className="border-border flex flex-wrap items-start justify-between gap-4 border-b pb-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-h2">Button · IconButton</h1>
            <p className="text-body-sm text-muted-foreground">
              Five variants as a prominence ladder. Hierarchy from borders and type, not
              from shadows.
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button onClick={() => setGrey((g) => !g)}>{grey ? "Colour" : "Greyscale"}</Button>
            <Button onClick={() => setDark((d) => !d)}>{dark ? "Light" : "Dark"}</Button>
          </div>
        </header>

        <Section
          title="The prominence ladder"
          note="Read top to bottom: filled, filled-destructive, bordered, ink-only, muted. Each step gives up one device."
        >
          <div className="border-border flex flex-col divide-y divide-(--border) border">
            {VARIANTS.map(({ key, note }) => (
              <div key={key} className="flex flex-wrap items-center gap-4 p-4">
                <div className="flex w-40 shrink-0 flex-col gap-0.5">
                  <span className="text-label">{key}</span>
                  <span className="text-caption text-muted-foreground">{note}</span>
                </div>
                <Button variant={key}>Create business</Button>
                <Button variant={key} icon={PlusIcon}>
                  With icon
                </Button>
                <Button variant={key} icon={ArrowRightIcon} iconPosition="end">
                  Continue
                </Button>
                <Button variant={key} loading>
                  Submitting
                </Button>
                <Button variant={key} disabled>
                  Disabled
                </Button>
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Sizes"
          note="md is 40px — the same as every form control, so a button sits flush beside an Input. sm is 32px, still above the 24x24 target minimum."
        >
          <div className="border-border flex flex-col gap-4 border p-4">
            {SIZES.map((size) => (
              <div key={size} className="flex flex-wrap items-center gap-3">
                <span className="text-label text-muted-foreground w-12">{size}</span>
                {VARIANTS.map(({ key }) => (
                  <Button key={key} variant={key} size={size} icon={PlusIcon}>
                    Add
                  </Button>
                ))}
                <IconButton label="More" icon={DotsThreeIcon} size={size} variant="secondary" />
              </div>
            ))}
          </div>
        </Section>

        <Section
          title="Beside an Input"
          note="The reason md is 40px. Any other height and the row is visibly off."
        >
          <div className="border-border flex flex-wrap items-center gap-2 border p-4">
            <input
              className="border-input hover:border-input-hover text-body sm:text-body-sm bg-background text-foreground placeholder:text-muted-foreground focus-visible:outline-ring h-10 flex-1 border px-3 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              placeholder="northwind-studio.com"
              aria-label="Domain"
            />
            <Button variant="primary">Check availability</Button>
          </div>
        </Section>

        <Section
          title="In a toolbar"
          note="Where ghost earns its keep: five controls that must not each shout. IconButton defaults to ghost for the same reason."
        >
          <div className="border-border flex flex-wrap items-center justify-between gap-3 border p-3">
            <div className="flex items-center gap-3">
              <h3 className="text-h4">Northwind Studio LLC</h3>
              <StatusBadge tone="success">Active</StatusBadge>
            </div>
            <div className="flex items-center gap-1">
              <IconButton label="Edit" icon={PencilSimpleIcon} />
              <IconButton label="Download documents" icon={DownloadSimpleIcon} />
              <IconButton label="Delete" icon={TrashIcon} variant="ghost" />
              <IconButton label="More actions" icon={DotsThreeIcon} />
              <Button variant="primary" size="sm" icon={PlusIcon}>
                New filing
              </Button>
            </div>
          </div>
        </Section>

        <Section
          title="A destructive confirmation"
          note="danger and secondary side by side. The destructive action must never be the calmer of the two."
        >
          <div className="border-border flex flex-col gap-4 border p-4 sm:p-6">
            <div className="flex flex-col gap-1">
              <h3 className="text-h4">Dissolve Vela Commerce LLC?</h3>
              <p className="text-body-sm text-muted-foreground">
                This files a certificate of dissolution with New Mexico. It cannot be undone.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="danger" icon={TrashIcon}>
                Dissolve company
              </Button>
              <Button variant="secondary">Cancel</Button>
            </div>
          </div>
        </Section>

        <Section
          title="Without colour"
          note="Always on. primary and danger become the same dark fill — so a destructive action never relies on red alone. It carries its own verb and its own icon."
        >
          <div className="border-border flex flex-wrap items-center gap-3 border p-4 grayscale">
            {VARIANTS.map(({ key }) => (
              <Button key={key} variant={key} icon={key === "danger" ? TrashIcon : PlusIcon}>
                {key === "danger" ? "Dissolve" : "Create"}
              </Button>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
