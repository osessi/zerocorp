"use client";

import { Progress } from "@base-ui/react/progress";
import {
  MagnifyingGlassIcon,
  PlusIcon,
  XCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import {
  Alert,
  Button,
  ToastProvider,
  useToast,
  TONE_EDGE,
  TONE_GLYPH,
  TONE_INK,
  type StatusTone,
} from "@zerocorp/ui";
import { Demo, Row, cx } from "./shell";

/**
 * Alert and Toast are now the SHIPPED components — promoted into packages/ui on
 * 2026-08-31. What is rendered here is @zerocorp/ui, not a copy. The tone map they read
 * is packages/ui/src/tone.ts, shared with StatusBadge: one status system, three surfaces.
 */

/** Re-exported so the data and zerocorp prototypes read the same map the components do. */
export type Tone = StatusTone;
export { TONE_GLYPH, TONE_INK, TONE_EDGE };

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

function ToastTriggers() {
  const manager = useToast();
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
    <ToastProvider>
      <Demo>
        <ToastTriggers />
      </Demo>
    </ToastProvider>
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
            {/*
              The value is rendered explicitly, not by Progress.Value's default.

              Its default formats with the BROWSER locale, so the server produced "64%"
              and a French client produced "64 %" — a non-breaking space — and React threw
              a hydration mismatch. Found in the console during the all-components review,
              2026-08-31.

              English-first and USD-first means the locale is a product decision that goes
              through the i18n layer, never the browser default. An explicit locale is not
              a workaround here; it is the rule.
            */}
            <span className="text-caption text-muted-foreground font-mono">
              {new Intl.NumberFormat("en-US", { style: "percent" }).format((value as number) / 100)}
            </span>
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
