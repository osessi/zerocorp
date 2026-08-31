"use client";

import { useState } from "react";
import { Dialog } from "@base-ui/react/dialog";
import { Drawer } from "@base-ui/react/drawer";
import { Menu } from "@base-ui/react/menu";
import { Popover } from "@base-ui/react/popover";
import { Tooltip } from "@base-ui/react/tooltip";
import {
  ArrowRightIcon,
  BellIcon,
  BuildingsIcon,
  CaretRightIcon,
  CheckIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button, IconButton, StatusBadge } from "@zerocorp/ui";
import { Demo, OVERLAY_MOTION, Row, SURFACE, cx } from "./shell";

/* ────────────────────────────────────────────────────────────────────────────
   The one popup list idiom. Select already ships it; Menu, Popover and the
   command palette reuse the SAME item rules rather than inventing three.
   ──────────────────────────────────────────────────────────────────────────── */

const MENU_ITEM = [
  "relative flex cursor-default items-center gap-2",
  "border border-transparent",
  "py-2 pr-3 pl-8",
  "text-body sm:text-body-sm text-foreground",
  "data-highlighted:bg-accent data-highlighted:text-accent-foreground",
  "data-checked:border-primary data-checked:font-medium",
  "data-disabled:text-muted-foreground data-disabled:cursor-not-allowed",
  "outline-hidden",
].join(" ");

const POPUP = cx(SURFACE, "min-w-56 px-1 py-1", OVERLAY_MOTION, "origin-(--transform-origin)");

/* ── Tooltip ──────────────────────────────────────────────────────────────── */

function Tip({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <Tooltip.Root>
      <Tooltip.Trigger render={<span className="inline-flex" />}>{children}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Positioner sideOffset={6} className="z-50">
          {/*
            Inverted: --foreground ground, --background ink. A tooltip is the one surface
            that must read as "not the page", and inversion flips correctly in both
            themes with no new token. 19.8:1 light, 18.97:1 dark.
          */}
          <Tooltip.Popup
            className={cx(
              "bg-foreground text-background text-caption px-2 py-1",
              OVERLAY_MOTION,
            )}
          >
            {label}
          </Tooltip.Popup>
        </Tooltip.Positioner>
      </Tooltip.Portal>
    </Tooltip.Root>
  );
}

export function TooltipDemo() {
  // 400ms: long enough not to fire while the pointer crosses a toolbar, short enough to
  // feel deliberate. Provider-level, so every tooltip in a screen agrees.
  return (
    <Tooltip.Provider delay={400}>
      <Demo>
        <Row label="on an IconButton">
          <Tip label="Edit business">
            <IconButton label="Edit" icon={PencilSimpleIcon} />
          </Tip>
          <Tip label="Download all documents">
            <IconButton label="Download" icon={DownloadSimpleIcon} />
          </Tip>
          <Tip label="Supprimer définitivement — action irréversible">
            <IconButton label="Delete" icon={TrashIcon} />
          </Tip>
        </Row>
        <div className="border-border mt-4 border-t pt-4">
          <Row label="on text">
            <span className="text-body-sm">
              EIN{" "}
              <Tip label="Employer Identification Number — the IRS tax ID for your company">
                <span className="border-input text-foreground cursor-help border-b border-dashed">
                  88-4192077
                </span>
              </Tip>
            </span>
          </Row>
        </div>
      </Demo>
    </Tooltip.Provider>
  );
}

/* ── Dropdown menu ────────────────────────────────────────────────────────── */

export function MenuDemo() {
  return (
    <Demo>
      <Row label="row actions">
        <Menu.Root>
          <Menu.Trigger
            render={<Button variant="secondary" icon={DotsThreeIcon} iconPosition="end">Actions</Button>}
          />
          <Menu.Portal>
            <Menu.Positioner sideOffset={4} align="start" className="z-50">
              <Menu.Popup className={POPUP}>
                <Menu.GroupLabel className="text-overline text-muted-foreground px-3 py-2 uppercase">
                  Northwind Studio LLC
                </Menu.GroupLabel>
                <Menu.Item className={MENU_ITEM}>
                  <PencilSimpleIcon size={16} className="absolute left-2" aria-hidden="true" />
                  Edit details
                </Menu.Item>
                <Menu.Item className={MENU_ITEM}>
                  <DownloadSimpleIcon size={16} className="absolute left-2" aria-hidden="true" />
                  Download documents
                </Menu.Item>
                <Menu.SubmenuRoot>
                  <Menu.SubmenuTrigger className={cx(MENU_ITEM, "justify-between")}>
                    <FileTextIcon size={16} className="absolute left-2" aria-hidden="true" />
                    File a report
                    <CaretRightIcon size={14} aria-hidden="true" />
                  </Menu.SubmenuTrigger>
                  <Menu.Portal>
                    <Menu.Positioner sideOffset={4} align="start" className="z-50">
                      <Menu.Popup className={POPUP}>
                        <Menu.Item className={MENU_ITEM}>Annual report</Menu.Item>
                        <Menu.Item className={MENU_ITEM}>Beneficial ownership</Menu.Item>
                      </Menu.Popup>
                    </Menu.Positioner>
                  </Menu.Portal>
                </Menu.SubmenuRoot>
                <Menu.Separator className="bg-border my-1 h-px" />
                {/*
                  Destructive items take --destructive as TEXT, which flips with the theme
                  and clears 4.5:1 in both. Not a red fill: a menu is a list, and one red
                  band would out-shout the whole popup.
                */}
                <Menu.Item className={cx(MENU_ITEM, "text-destructive")}>
                  <TrashIcon size={16} className="absolute left-2" aria-hidden="true" />
                  Dissolve company
                </Menu.Item>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>

        <Menu.Root>
          <Menu.Trigger render={<IconButton label="More actions" icon={DotsThreeIcon} variant="secondary" />} />
          <Menu.Portal>
            <Menu.Positioner sideOffset={4} align="end" className="z-50">
              <Menu.Popup className={POPUP}>
                <Menu.GroupLabel className="text-overline text-muted-foreground px-3 py-2 uppercase">
                  Density
                </Menu.GroupLabel>
                <Menu.RadioGroup defaultValue="cosy">
                  {["Compact", "Cosy", "Comfortable"].map((d) => (
                    <Menu.RadioItem key={d} value={d.toLowerCase()} className={MENU_ITEM}>
                      <Menu.RadioItemIndicator className="bg-primary text-primary-foreground absolute left-2 flex size-4 items-center justify-center">
                        <CheckIcon size={12} weight="bold" />
                      </Menu.RadioItemIndicator>
                      {d}
                    </Menu.RadioItem>
                  ))}
                </Menu.RadioGroup>
                <Menu.Separator className="bg-border my-1 h-px" />
                <Menu.CheckboxItem defaultChecked className={MENU_ITEM}>
                  <Menu.CheckboxItemIndicator className="bg-primary text-primary-foreground absolute left-2 flex size-4 items-center justify-center">
                    <CheckIcon size={12} weight="bold" />
                  </Menu.CheckboxItemIndicator>
                  Show dissolved
                </Menu.CheckboxItem>
              </Menu.Popup>
            </Menu.Positioner>
          </Menu.Portal>
        </Menu.Root>
      </Row>
    </Demo>
  );
}

/* ── Popover ──────────────────────────────────────────────────────────────── */

export function PopoverDemo() {
  return (
    <Demo>
      <Row label="notification centre">
        <Popover.Root>
          <Popover.Trigger render={<IconButton label="Notifications" icon={BellIcon} variant="secondary" />} />
          <Popover.Portal>
            <Popover.Positioner sideOffset={4} align="end" className="z-50">
              <Popover.Popup className={cx(SURFACE, "w-80", OVERLAY_MOTION)}>
                <div className="border-border flex items-center justify-between border-b px-3 py-2">
                  <Popover.Title className="text-label">Notifications</Popover.Title>
                  <Popover.Close render={<IconButton label="Close" icon={XIcon} size="sm" />} />
                </div>
                <div className="max-h-72 overflow-y-auto">
                  {[
                    ["Wyoming accepted the filing", "processing", "2h ago"],
                    ["EIN issued for Bluepine Labs", "success", "yesterday"],
                    ["Annual report due in 14 days", "warning", "3 days ago"],
                  ].map(([text, tone, when]) => (
                    <div key={text} className="border-border hover:bg-accent flex flex-col gap-1 border-b px-3 py-2 last:border-b-0">
                      <span className="text-body-sm text-foreground">{text}</span>
                      <span className="text-caption text-muted-foreground flex items-center gap-2">
                        <StatusBadge tone={tone as "success"}>{tone as string}</StatusBadge>
                        {when}
                      </span>
                    </div>
                  ))}
                </div>
              </Popover.Popup>
            </Popover.Positioner>
          </Popover.Portal>
        </Popover.Root>
      </Row>
    </Demo>
  );
}

/* ── Dialog ───────────────────────────────────────────────────────────────── */

const BACKDROP = cx(
  "fixed inset-0 z-50 bg-foreground/40",
  "transition-opacity duration-emphasis ease-out",
  "data-starting-style:opacity-0 data-ending-style:opacity-0",
);

export function DialogDemo() {
  return (
    <Demo>
      <Row label="confirmation">
        <Dialog.Root>
          <Dialog.Trigger render={<Button variant="danger" icon={TrashIcon}>Dissolve company</Button>} />
          <Dialog.Portal>
            <Dialog.Backdrop className={BACKDROP} />
            <Dialog.Popup
              className={cx(
                SURFACE,
                "fixed top-1/2 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 flex-col gap-4 p-6",
                OVERLAY_MOTION,
              )}
            >
              <div className="flex flex-col gap-1">
                <Dialog.Title className="text-h4">Dissolve Vela Commerce LLC?</Dialog.Title>
                <Dialog.Description className="text-body-sm text-muted-foreground">
                  This files a certificate of dissolution with New Mexico. It cannot be undone.
                </Dialog.Description>
              </div>
              <div className="flex flex-wrap justify-end gap-2">
                <Dialog.Close render={<Button variant="secondary">Cancel</Button>} />
                <Dialog.Close render={<Button variant="danger">Dissolve company</Button>} />
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </Row>
    </Demo>
  );
}

/* ── Drawer ───────────────────────────────────────────────────────────────── */

export function DrawerDemo() {
  return (
    <Demo>
      <Row label="record detail">
        <Drawer.Root>
          <Drawer.Trigger render={<Button variant="secondary" icon={BuildingsIcon}>Open record</Button>} />
          <Drawer.Portal>
            <Drawer.Backdrop className={BACKDROP} />
            <Drawer.Popup
              className={cx(
                "bg-surface-elevated border-input fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l",
                "transition-transform duration-modal ease-out",
                "data-starting-style:translate-x-full data-ending-style:translate-x-full",
              )}
            >
              <div className="border-border flex items-start justify-between gap-3 border-b p-4">
                <div className="flex flex-col gap-2">
                  <Drawer.Title className="text-h4">Northwind Studio LLC</Drawer.Title>
                  <StatusBadge tone="success">Active</StatusBadge>
                </div>
                <Drawer.Close render={<IconButton label="Close" icon={XIcon} />} />
              </div>
              <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4">
                <dl className="grid grid-cols-2 gap-x-6 gap-y-3">
                  {[["State", "Wyoming"], ["Formed", "Mar 4, 2026"], ["EIN", "88-4192077"], ["Agent", "Paid to 2027"]].map(
                    ([k, v]) => (
                      <div key={k} className="flex flex-col gap-1">
                        <dt className="text-overline text-muted-foreground uppercase">{k}</dt>
                        <dd className="text-body-sm text-foreground font-mono">{v}</dd>
                      </div>
                    ),
                  )}
                </dl>
              </div>
              <div className="border-border flex justify-end gap-2 border-t p-4">
                <Drawer.Close render={<Button variant="secondary">Close</Button>} />
                <Button variant="primary" icon={ArrowRightIcon} iconPosition="end">Open full record</Button>
              </div>
            </Drawer.Popup>
          </Drawer.Portal>
        </Drawer.Root>
      </Row>
    </Demo>
  );
}

/* ── Command menu ─────────────────────────────────────────────────────────── */

const COMMANDS = [
  { group: "Businesses", items: ["Northwind Studio LLC", "Bluepine Labs LLC", "Auric Freight LLC"] },
  { group: "Actions", items: ["Start a new formation", "Upload a document", "Invite a teammate"] },
];

export function CommandDemo() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const groups = COMMANDS.map((g) => ({
    ...g,
    items: g.items.filter((i) => i.toLowerCase().includes(q.toLowerCase())),
  })).filter((g) => g.items.length > 0);

  return (
    <Demo>
      <Row label="⌘K palette">
        <Button variant="secondary" icon={MagnifyingGlassIcon} onClick={() => setOpen(true)}>
          Search everything
        </Button>
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Portal>
            <Dialog.Backdrop className={BACKDROP} />
            <Dialog.Popup
              className={cx(
                SURFACE,
                "fixed top-24 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 flex-col",
                OVERLAY_MOTION,
              )}
            >
              <Dialog.Title className="sr-only">Search</Dialog.Title>
              <div className="border-border flex items-center gap-2 border-b px-3">
                <MagnifyingGlassIcon size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
                <input
                  autoFocus
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search businesses, documents, actions…"
                  aria-label="Search"
                  // Inset ring, not outline-none. The input fills the dialog edge to edge, so an
                  // outset ring would spill past the popup border; -outline-offset draws it
                  // inside. Removing it entirely is the defect the CI rule exists to catch.
                  className="text-body sm:text-body-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-ring h-12 w-full bg-transparent focus-visible:outline-2 focus-visible:-outline-offset-2"
                />
              </div>
              <div className="max-h-80 overflow-y-auto px-1 py-1">
                {groups.length === 0 ? (
                  <p className="text-body-sm text-muted-foreground px-3 py-6 text-center">
                    Nothing matches “{q}”.
                  </p>
                ) : (
                  groups.map((g) => (
                    <div key={g.group}>
                      <p className="text-overline text-muted-foreground px-3 py-2 uppercase">{g.group}</p>
                      {g.items.map((i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => setOpen(false)}
                          className={cx(MENU_ITEM, "w-full text-left", "hover:bg-accent focus-visible:bg-accent")}
                        >
                          {i}
                        </button>
                      ))}
                    </div>
                  ))
                )}
              </div>
            </Dialog.Popup>
          </Dialog.Portal>
        </Dialog.Root>
      </Row>
    </Demo>
  );
}
