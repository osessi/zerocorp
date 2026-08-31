"use client";

import { Combobox } from "@base-ui/react/combobox";
import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import { CheckIcon, MagnifyingGlassIcon } from "@phosphor-icons/react/dist/ssr";
import { useEffect } from "react";
import type { GlyphComponent } from "../button/Button";
import { cx } from "../field/control-styles";
import {
  OVERLAY_BACKDROP,
  OVERLAY_GROUP_LABEL,
  OVERLAY_ITEM,
  OVERLAY_ITEM_INDICATOR,
  OVERLAY_MOTION,
  OVERLAY_SURFACE,
} from "./overlay-styles";

/**
 * CommandMenu — ⌘K.
 *
 * Built on Base UI **Combobox**, not on a bare input and a list of buttons.
 *
 * That was the first attempt and it was wrong in a way that showed immediately: plain
 * `<button>`s never receive `data-highlighted`, so the rows could not participate in the
 * item contract that Select and DropdownMenu share. They looked like a different
 * component because they *were* one. Reported in review 2026-08-31.
 *
 * Combobox is the same primitive family as Select, so the rows get keyboard highlighting,
 * `role="option"`, type-ahead and active-descendant wiring for free — and they compose
 * OVERLAY_ITEM, the identical rules the Select popup and the menu use.
 *
 * cmdk was not adopted: it would be a second overlay system beside Base UI, for a
 * component Base UI already covers. §2.
 *
 * docs/DESIGN_SYSTEM.md §17, §19.
 */

export interface CommandItem {
  id: string;
  label: string;
  group: string;
  icon?: GlyphComponent;
  /** Shown right-aligned — a shortcut, a state, a count. */
  hint?: string;
}

export interface CommandMenuProps {
  items: CommandItem[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect?: (item: CommandItem) => void;
  placeholder?: string;
  /** Announced and shown when nothing matches. i18n: pass a translated string. */
  emptyMessage?: string;
}

export function CommandMenu({
  items,
  open,
  onOpenChange,
  onSelect,
  placeholder = "Search businesses, documents, actions…",
  emptyMessage = "Nothing matches that search.",
}: CommandMenuProps) {
  // ⌘K / Ctrl+K. Registered here so every surface that mounts the palette gets the
  // shortcut, and only one listener exists per mounted palette.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        onOpenChange(!open);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  /*
    Grouped for Base UI's Collection, which is what actually makes filtering work.

    The first version mapped `items` by hand inside Combobox.Group. That renders, but
    Base UI never sees the collection, so typing filtered nothing — the palette showed all
    six rows for any query. Reported in review 2026-08-31.
  */
  const groups = [...new Set(items.map((i) => i.group))].map((group) => ({
    value: group,
    items: items.filter((i) => i.group === group),
  }));

  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={OVERLAY_BACKDROP} />
        <BaseDialog.Popup
          className={cx(
            OVERLAY_SURFACE,
            // Top-anchored, not centred: a palette that grows and shrinks while you type
            // would jump around a vertical centre.
            "fixed top-24 left-1/2 z-50 flex w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 flex-col",
            OVERLAY_MOTION,
          )}
        >
          <BaseDialog.Title className="sr-only">Search</BaseDialog.Title>
          <Combobox.Root
            items={groups}
            open
            onValueChange={(value: CommandItem | null) => {
              if (!value) return;
              onSelect?.(value);
              onOpenChange(false);
            }}
            itemToStringLabel={(item: CommandItem) => item.label}
          >
            <div className="border-border flex items-center gap-2 border-b px-3">
              <MagnifyingGlassIcon
                size={16}
                className="text-muted-foreground shrink-0"
                aria-hidden="true"
              />
              <Combobox.Input
                autoFocus
                placeholder={placeholder}
                aria-label="Search"
                /*
                  Inset ring, never outline-none. The input fills the popup edge to edge,
                  so an outset ring would spill past the border.
                */
                className={cx(
                  "text-body sm:text-body-sm text-foreground placeholder:text-muted-foreground",
                  "h-12 w-full bg-transparent",
                  "focus-visible:outline-ring focus-visible:outline-2 focus-visible:-outline-offset-2",
                )}
              />
            </div>

            <Combobox.List className="max-h-80 overflow-y-auto px-1 py-1">
              <Combobox.Collection>
                {(group: { value: string; items: CommandItem[] }) => (
                  <Combobox.Group key={group.value} items={group.items}>
                    <Combobox.GroupLabel className={OVERLAY_GROUP_LABEL}>
                      {group.value}
                    </Combobox.GroupLabel>
                    <Combobox.Collection>
                      {(item: CommandItem) => {
                        const Icon = item.icon;
                        return (
                          <Combobox.Item
                            key={item.id}
                            value={item}
                            className={cx(OVERLAY_ITEM, "justify-between")}
                          >
                            {/*
                              Same badge as the Select and the menu. Base UI renders the
                              indicator only for the chosen item, so it is a shape and not
                              a colour — it survives greyscale.
                            */}
                            <Combobox.ItemIndicator className={OVERLAY_ITEM_INDICATOR}>
                              <CheckIcon size={12} weight="bold" />
                            </Combobox.ItemIndicator>
                            <span className="flex min-w-0 items-center gap-2">
                              {Icon ? (
                                <Icon size={16} aria-hidden="true" className="shrink-0" />
                              ) : null}
                              {item.label}
                            </span>
                            {item.hint ? (
                              <span className="text-caption text-muted-foreground shrink-0 font-mono">
                                {item.hint}
                              </span>
                            ) : null}
                          </Combobox.Item>
                        );
                      }}
                    </Combobox.Collection>
                  </Combobox.Group>
                )}
              </Combobox.Collection>
              <Combobox.Empty className="text-body-sm text-muted-foreground px-3 py-6 text-center">
                {emptyMessage}
              </Combobox.Empty>
            </Combobox.List>
          </Combobox.Root>
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}
