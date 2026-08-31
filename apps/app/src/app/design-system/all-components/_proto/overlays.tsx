"use client";

import { useState } from "react";
import { Drawer } from "@base-ui/react/drawer";
import { Popover } from "@base-ui/react/popover";
import { Tooltip } from "@base-ui/react/tooltip";
import {
  ArrowRightIcon,
  BellIcon,
  BuildingsIcon,
  PlusIcon,
  UserPlusIcon,
  DotsThreeIcon,
  DownloadSimpleIcon,
  FileTextIcon,
  MagnifyingGlassIcon,
  PencilSimpleIcon,
  TrashIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  Button,
  Dialog,
  DialogClose,
  DropdownMenu,
  IconButton,
  MenuCheckboxItem,
  MenuGroupLabel,
  MenuItem,
  MenuRadioGroup,
  MenuRadioItem,
  MenuSeparator,
  OVERLAY_BACKDROP,
  StatusBadge,
  CommandMenu,
  type CommandItem,
} from "@zerocorp/ui";
import { Demo, OVERLAY_MOTION, Row, SURFACE, cx } from "./shell";





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

/** The SHIPPED component. Reuses the Select popup contract exactly — a test asserts it. */
export function MenuDemo() {
  const [density, setDensity] = useState("cosy");
  const [dissolved, setDissolved] = useState(true);
  return (
    <Demo>
      <Row label="row actions">
        <DropdownMenu
          trigger={<Button variant="secondary" icon={DotsThreeIcon} iconPosition="end">Actions</Button>}
        >
          <MenuGroupLabel>Northwind Studio LLC</MenuGroupLabel>
          <MenuItem icon={PencilSimpleIcon}>Edit details</MenuItem>
          <MenuItem icon={DownloadSimpleIcon}>Download documents</MenuItem>
          <MenuItem icon={FileTextIcon}>File annual report</MenuItem>
          <MenuSeparator />
          <MenuItem icon={TrashIcon} destructive>Dissolve company</MenuItem>
        </DropdownMenu>

        <DropdownMenu
          align="end"
          trigger={<IconButton label="View options" icon={DotsThreeIcon} variant="secondary" />}
        >
          <MenuGroupLabel>Density</MenuGroupLabel>
          <MenuRadioGroup value={density} onValueChange={setDensity}>
            {([["compact", "Compact"], ["cosy", "Cosy"], ["comfortable", "Comfortable"]] as const).map(
              ([value, label]) => (
                <MenuRadioItem key={value} value={value}>
                  {label}
                </MenuRadioItem>
              ),
            )}
          </MenuRadioGroup>
          <MenuSeparator />
          <MenuCheckboxItem checked={dissolved} onCheckedChange={setDissolved}>
            Show dissolved
          </MenuCheckboxItem>
        </DropdownMenu>
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

/**
 * The SHIPPED component — promoted into packages/ui on 2026-08-31. Focus trap, scroll
 * lock, Escape and focus return to the trigger all come from Base UI; the surface, the
 * backdrop and the motion come from packages/ui/src/overlay/overlay-styles.ts, shared
 * with DropdownMenu and the Select popup.
 */
export function DialogDemo() {
  return (
    <Demo>
      <Row label="confirmation">
        <Dialog
          trigger={<Button variant="danger" icon={TrashIcon}>Dissolve company</Button>}
          title="Dissolve Vela Commerce LLC?"
          description="This files a certificate of dissolution with New Mexico. It cannot be undone."
          footer={
            <>
              <DialogClose><Button variant="secondary">Cancel</Button></DialogClose>
              <DialogClose><Button variant="danger">Dissolve company</Button></DialogClose>
            </>
          }
        />
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
            <Drawer.Backdrop className={OVERLAY_BACKDROP} />
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

const COMMANDS: CommandItem[] = [
  { id: "b1", group: "Businesses", label: "Northwind Studio LLC", icon: BuildingsIcon, hint: "Wyoming" },
  { id: "b2", group: "Businesses", label: "Bluepine Labs LLC", icon: BuildingsIcon, hint: "Delaware" },
  { id: "b3", group: "Businesses", label: "Auric Freight LLC", icon: BuildingsIcon, hint: "Wyoming" },
  { id: "a1", group: "Actions", label: "Start a new formation", icon: PlusIcon },
  { id: "a2", group: "Actions", label: "Upload a document", icon: FileTextIcon },
  { id: "a3", group: "Actions", label: "Invite a teammate", icon: UserPlusIcon },
];

/**
 * The SHIPPED component. Rebuilt on Base UI Combobox after review, 2026-08-31.
 *
 * The first version was a bare input over a list of plain <button>s. They never receive
 * `data-highlighted`, so they could not join the item contract Select and DropdownMenu
 * share — they looked like a different component because they were one.
 */
export function CommandDemo() {
  const [open, setOpen] = useState(false);
  return (
    <Demo>
      <Row label="⌘K palette">
        <Button variant="secondary" icon={MagnifyingGlassIcon} onClick={() => setOpen(true)}>
          Search everything
        </Button>
        <span className="text-caption text-muted-foreground">
          or press <span className="font-mono">⌘K</span>
        </span>
        <CommandMenu items={COMMANDS} open={open} onOpenChange={setOpen} />
      </Row>
    </Demo>
  );
}
