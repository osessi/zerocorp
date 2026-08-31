"use client";

import { Progress } from "@base-ui/react/progress";
import { Toast } from "@base-ui/react/toast";
import {
  CheckCircleIcon,
  CircleNotchIcon,
  InfoIcon,
  MagnifyingGlassIcon,
  MinusCircleIcon,
  PlusIcon,
  WarningIcon,
  XCircleIcon,
  XIcon,
} from "@phosphor-icons/react/dist/ssr";
import { Button, IconButton } from "@zerocorp/ui";
import { Demo, OVERLAY_MOTION, Row, SURFACE, cx } from "./shell";

/* ────────────────────────────────────────────────────────────────────────────
   One status system, three surfaces.

   StatusBadge, Alert and Toast all read from §4.3. The tone → colour → GLYPH map is
   written once here and shared, so a warning is the same warning in all three. §17.
   ──────────────────────────────────────────────────────────────────────────── */

export type Tone = "success" | "processing" | "warning" | "danger" | "info" | "neutral";

export const TONE_GLYPH = {
  success: CheckCircleIcon,
  processing: CircleNotchIcon,
  warning: WarningIcon,
  danger: XCircleIcon,
  info: InfoIcon,
  neutral: MinusCircleIcon,
} as const;

/** The accent edge. A 2px rule, not a tinted fill — we have no tint scale (§24.10). */
export const TONE_EDGE: Record<Tone, string> = {
  success: "border-l-success",
  processing: "border-l-processing",
  warning: "border-l-warning",
  danger: "border-l-destructive",
  info: "border-l-info",
  neutral: "border-l-muted-foreground",
};

export const TONE_INK: Record<Tone, string> = {
  success: "text-success",
  processing: "text-processing",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info",
  neutral: "text-muted-foreground",
};

/* ── Alert ────────────────────────────────────────────────────────────────── */

/**
 * Inline, in the flow of the page. No primitive needed — the semantics are a role.
 *
 * role="alert" for danger and warning (interrupts), role="status" for the rest (polite).
 * Getting that backwards either shouts over a screen reader or lets an error pass
 * silently, which is the same failure Field already solved.
 *
 * The title carries the tone colour; the body stays --foreground. A whole paragraph in a
 * status colour is harder to read and adds nothing — the same finding as the Select
 * label, where 3.18:1 teal text failed while a 3.18:1 teal border passed.
 */
export function Alert({
  tone,
  title,
  children,
  action,
}: {
  tone: Tone;
  title: string;
  children?: React.ReactNode;
  action?: React.ReactNode;
}) {
  const Glyph = TONE_GLYPH[tone];
  const assertive = tone === "danger" || tone === "warning";
  return (
    <div
      role={assertive ? "alert" : "status"}
      className={cx("border-border flex gap-3 border border-l-2 p-3", TONE_EDGE[tone])}
    >
      <Glyph size={20} weight="regular" aria-hidden="true" className={cx("mt-0.5 shrink-0", TONE_INK[tone])} />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className={cx("text-label", TONE_INK[tone])}>{title}</span>
        {children ? <div className="text-body-sm text-foreground">{children}</div> : null}
        {action ? <div className="mt-1 flex flex-wrap gap-2">{action}</div> : null}
      </div>
    </div>
  );
}

export function AlertDemo() {
  return (
    <Demo className="flex flex-col gap-3">
      <Alert tone="danger" title="Wyoming rejected the filing">
        The registered agent address is a PO box. Wyoming requires a street address.
      </Alert>
      <Alert
        tone="warning"
        title="Annual report due in 14 days"
        action={<Button size="sm" variant="secondary">File now</Button>}
      >
        Northwind Studio LLC must file by 1 March 2027 to stay in good standing.
      </Alert>
      <Alert tone="success" title="EIN issued">
        88-4192077 is on file and ready to use for banking.
      </Alert>
      <Alert tone="info" title="Le rapport annuel est inclus dans votre forfait Growth." />
      <Alert tone="processing" title="Filing in progress">
        Submitted to Wyoming on 2 March. Certificates usually arrive within two business days.
      </Alert>
    </Demo>
  );
}

/* ── Toast ────────────────────────────────────────────────────────────────── */

/**
 * Base UI Toast. Transient, bottom-right, and it never carries the ONLY record of
 * something important — §17 forbids a silent save, but a toast that vanishes is not a
 * receipt either. Anything durable also lands in the activity feed.
 */
const TOAST_TONE: Record<string, Tone> = { success: "success", error: "danger", warning: "warning", info: "info" };

function ToastList() {
  const { toasts } = Toast.useToastManager();
  return (
    <>
      {toasts.map((toast) => {
        const tone = TOAST_TONE[String(toast.type ?? "info")] ?? "info";
        const Glyph = TONE_GLYPH[tone];
        return (
          <Toast.Root
            key={toast.id}
            toast={toast}
            className={cx(
              SURFACE,
              "flex w-80 gap-3 border-l-2 p-3",
              TONE_EDGE[tone],
              OVERLAY_MOTION,
            )}
          >
            <Glyph size={20} weight="regular" aria-hidden="true" className={cx("mt-0.5 shrink-0", TONE_INK[tone])} />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              <Toast.Title className={cx("text-label", TONE_INK[tone])} />
              <Toast.Description className="text-body-sm text-foreground" />
            </div>
            <Toast.Close render={<IconButton label="Dismiss" icon={XIcon} size="sm" />} />
          </Toast.Root>
        );
      })}
    </>
  );
}

function ToastTriggers() {
  const manager = Toast.useToastManager();
  return (
    <Row label="fire one">
      {(
        [
          ["success", "Business created", "Northwind Studio LLC is filed with Wyoming."],
          ["error", "Filing rejected", "The agent address is a PO box."],
          ["warning", "Payment due", "Your card expires in 6 days."],
          ["info", "Draft saved", "Autosaved just now."],
        ] as const
      ).map(([type, title, description]) => (
        <Button
          key={type}
          size="sm"
          variant={type === "error" ? "danger" : "secondary"}
          onClick={() => manager.add({ type, title, description })}
        >
          {title}
        </Button>
      ))}
    </Row>
  );
}

export function ToastDemo() {
  return (
    <Toast.Provider>
      <Demo>
        <ToastTriggers />
      </Demo>
      <Toast.Portal>
        <Toast.Viewport className="fixed right-4 bottom-4 z-50 flex flex-col-reverse gap-2">
          <ToastList />
        </Toast.Viewport>
      </Toast.Portal>
    </Toast.Provider>
  );
}

/* ── Progress ─────────────────────────────────────────────────────────────── */

export function ProgressDemo() {
  return (
    <Demo className="flex flex-col gap-5">
      {[
        ["Uploading passport.pdf", 64, "processing"],
        ["Generating your website", 100, "success"],
      ].map(([label, value, tone]) => (
        <Progress.Root key={label as string} value={value as number} className="flex flex-col gap-2">
          <div className="flex items-baseline justify-between gap-3">
            <Progress.Label className="text-label text-foreground">{label as string}</Progress.Label>
            <Progress.Value className="text-caption text-muted-foreground font-mono" />
          </div>
          {/* A 4px rail. No radius, no gradient — §7, §8. */}
          <Progress.Track className="bg-muted border-border h-1 w-full border">
            <Progress.Indicator
              className={cx(
                "h-full transition-[width] duration-emphasis ease-out",
                tone === "success" ? "bg-success" : "bg-processing",
              )}
            />
          </Progress.Track>
        </Progress.Root>
      ))}
    </Demo>
  );
}

/* ── Empty state ──────────────────────────────────────────────────────────── */

/**
 * §17 requires every component to define an empty state, so the empty state itself is a
 * component. Three parts, always: what is missing, why, and the one action that fixes it.
 *
 * The icon is --muted-foreground, never a decorative illustration: an empty screen is
 * usually a person who is stuck, and a cartoon reads as the product being pleased with
 * itself.
 */
export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: typeof PlusIcon;
  title: string;
  description: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <Icon size={32} weight="regular" aria-hidden="true" className="text-muted-foreground" />
      <div className="flex flex-col gap-1">
        <p className="text-label text-foreground">{title}</p>
        <p className="text-body-sm text-muted-foreground max-w-sm">{description}</p>
      </div>
      {action ? <div className="mt-1">{action}</div> : null}
    </div>
  );
}

export function EmptyStateDemo() {
  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <Demo className="p-0">
        <EmptyState
          icon={PlusIcon}
          title="No businesses yet"
          description="Describe your business once and ZeroCorp files it, builds the site and keeps it running."
          action={<Button variant="primary" icon={PlusIcon}>Launch a business</Button>}
        />
      </Demo>
      <Demo className="p-0">
        <EmptyState
          icon={MagnifyingGlassIcon}
          title="Nothing matches “delaware llc 2024”"
          description="Try a shorter query, or clear the filters to see all 231 records."
          action={<Button variant="secondary">Clear filters</Button>}
        />
      </Demo>
      <Demo className="p-0">
        <EmptyState
          icon={XCircleIcon}
          title="Could not load your filings"
          description="Wyoming's filing service is not responding. Nothing has been lost."
          action={<Button variant="secondary">Try again</Button>}
        />
      </Demo>
    </div>
  );
}
