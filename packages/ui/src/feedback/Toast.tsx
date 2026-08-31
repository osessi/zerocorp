"use client";

import { Toast as BaseToast } from "@base-ui/react/toast";
import { XIcon } from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";
import { IconButton } from "../button/IconButton";
import { cx } from "../field/control-styles";
import { COLOR_TRANSITION } from "../motion";
import { TONE_EDGE, TONE_GLYPH, TONE_INK, isAssertive, type StatusTone } from "../tone";

/**
 * Toast — transient status, bottom right.
 *
 * The other half of the pair. A toast is a receipt, never a record: it disappears, so it
 * must never be the ONLY place something important was said. §17 forbids a silent save,
 * and a message that vanishes after five seconds is close to silent for anyone who
 * looked away. Anything durable also lands in the activity feed or an Alert.
 *
 * Same tone map as Alert and StatusBadge — one status system, three surfaces. ../tone.ts.
 *
 * Mount `<ToastProvider>` once, near the root of the authenticated app. Fire with
 * `useToast()`. docs/DESIGN_SYSTEM.md §17, §19.
 */

/** Base UI's toast type strings, mapped onto the ZeroCorp status system. */
const TYPE_TONE: Record<string, StatusTone> = {
  success: "success",
  error: "danger",
  warning: "warning",
  info: "info",
  loading: "processing",
};

function toneOf(type: unknown): StatusTone {
  return TYPE_TONE[String(type ?? "info")] ?? "info";
}

function ToastList() {
  const { toasts } = BaseToast.useToastManager();
  return (
    <>
      {toasts.map((toast) => {
        const tone = toneOf(toast.type);
        const Glyph = TONE_GLYPH[tone];
        return (
          <BaseToast.Root
            key={toast.id}
            toast={toast}
            /*
              role follows the tone, exactly as Alert does. Base UI already manages the
              live region; this decides whether it interrupts.
            */
            role={isAssertive(tone) ? "alert" : "status"}
            className={cx(
              "bg-surface-elevated border-input shadow-floating flex w-80 max-w-[calc(100vw-2rem)] gap-3 border border-l-2 p-3",
              TONE_EDGE[tone],
              COLOR_TRANSITION,
              "transition-[opacity,transform] duration-emphasis ease-out",
              "data-starting-style:opacity-0 data-ending-style:opacity-0",
            )}
          >
            <Glyph
              size={20}
              weight="regular"
              aria-hidden="true"
              className={cx("mt-0.5 shrink-0", TONE_INK[tone])}
            />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <BaseToast.Title className={cx("text-label", TONE_INK[tone])} />
              <BaseToast.Description className="text-body-sm text-foreground" />
              {/*
                An action, when the toast is about something the user can fix. This is the
                difference between a notification and a dead end: "card expiring" with no
                way to update it is just anxiety.

                Rendered as a tertiary Button so it does not compete with the toast's own
                left rule, and only when actionProps carries a label.
              */}
              {toast.actionProps ? (
                <BaseToast.Action
                  className={cx(
                    "text-label mt-1 self-start underline underline-offset-2",
                    TONE_INK[tone],
                    COLOR_TRANSITION,
                    "hover:no-underline",
                    "focus-visible:outline-ring focus-visible:outline-2 focus-visible:outline-offset-2",
                  )}
                />
              ) : null}
            </div>
            <BaseToast.Close
              render={<IconButton label="Dismiss notification" icon={XIcon} size="sm" />}
            />
          </BaseToast.Root>
        );
      })}
    </>
  );
}

export interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <BaseToast.Provider>
      {children}
      <BaseToast.Portal>
        {/*
          Bottom right, and newest nearest the corner — flex-col-reverse. Stacking upward
          means an arriving toast never displaces the one being read.

          max-w on the toast itself, not here: at 375px a fixed 320px panel plus the 16px
          inset would overflow, which is the defect the all-components pass just spent an
          hour tracking down in a table.
        */}
        <BaseToast.Viewport className="fixed right-4 bottom-4 z-50 flex flex-col-reverse gap-2">
          <ToastList />
        </BaseToast.Viewport>
      </BaseToast.Portal>
    </BaseToast.Provider>
  );
}

/** Fire a toast. `useToast().add({ type, title, description })`. */
export const useToast = BaseToast.useToastManager;
