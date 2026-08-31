"use client";

import { Dialog as BaseDialog } from "@base-ui/react/dialog";
import type { ReactNode } from "react";
import { cx } from "../field/control-styles";
import { OVERLAY_BACKDROP, OVERLAY_MOTION, OVERLAY_SURFACE } from "./overlay-styles";

/**
 * Dialog — a modal that takes the whole screen's attention.
 *
 * Base UI Dialog: focus trap, scroll lock, Escape, `aria-modal`, and focus returned to
 * the trigger on close. All of that is why this is a primitive and not a `<div>`.
 *
 * A title is REQUIRED. `aria-labelledby` on a modal is not optional, and a dialog nobody
 * can name is a dialog nobody can describe when it goes wrong.
 *
 * docs/DESIGN_SYSTEM.md §17, §19.
 */

export interface DialogProps {
  trigger: ReactNode;
  /** Required — becomes the accessible name. */
  title: string;
  description?: string;
  children?: ReactNode;
  /** Buttons. Put the confirming action LAST, so it sits nearest the reading edge. */
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
}

export function Dialog({
  trigger,
  title,
  description,
  children,
  footer,
  open,
  onOpenChange,
  className,
}: DialogProps) {
  return (
    <BaseDialog.Root open={open} onOpenChange={onOpenChange}>
      <BaseDialog.Trigger render={trigger as React.ReactElement} />
      <BaseDialog.Portal>
        <BaseDialog.Backdrop className={OVERLAY_BACKDROP} />
        <BaseDialog.Popup
          className={cx(
            OVERLAY_SURFACE,
            // w-[calc(100vw-2rem)] with a max: at 375px a fixed max-w-md would overflow
            // and scroll the page sideways. The gutter is the §12 mobile gutter, twice.
            "fixed top-1/2 left-1/2 z-50 flex max-h-[calc(100vh-2rem)] w-[calc(100vw-2rem)] max-w-md",
            "-translate-x-1/2 -translate-y-1/2 flex-col gap-4 overflow-y-auto p-6",
            OVERLAY_MOTION,
            className,
          )}
        >
          <div className="flex flex-col gap-1">
            <BaseDialog.Title className="text-h4">{title}</BaseDialog.Title>
            {description ? (
              <BaseDialog.Description className="text-body-sm text-muted-foreground">
                {description}
              </BaseDialog.Description>
            ) : null}
          </div>
          {children}
          {footer ? <div className="flex flex-wrap justify-end gap-2">{footer}</div> : null}
        </BaseDialog.Popup>
      </BaseDialog.Portal>
    </BaseDialog.Root>
  );
}

/** Closes the surrounding Dialog. Wrap a Button: `<DialogClose><Button>Cancel</Button></DialogClose>`. */
export function DialogClose({ children }: { children: ReactNode }) {
  return <BaseDialog.Close render={children as React.ReactElement} />;
}
