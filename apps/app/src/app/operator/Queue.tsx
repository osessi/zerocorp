"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ClockIcon, QuestionIcon } from "@phosphor-icons/react/dist/ssr";
import {
  FORMATION_ORDER_TRANSITIONS,
  type FormationOrderStatus,
} from "@zerocorp/contracts";
import { Avatar, Button, EmptyState, PageHeader, SectionHeader, StatusDot, initialsOf, cx } from "@zerocorp/ui";
import { transitionOrder } from "./actions";

/**
 * The formation queue.
 *
 * Every order that is not finished, oldest first, with the moves that are legal from
 * where it actually is. The buttons are generated from FORMATION_ORDER_TRANSITIONS rather
 * than written out, so an operator is never offered a move the machine will refuse — and
 * so the screen cannot drift from the state machine when a transition is added.
 */
const LABEL: Record<string, string> = {
  draft: "Draft",
  collecting_documents: "Collecting documents",
  verifying_identity: "Verifying identity",
  operator_review: "Needs review",
  ready_to_file: "Ready to file",
  awaiting_provider: "Submitted",
  information_requested: "Information needed",
  filed: "Filed",
  formed: "Formed",
  rejected: "Came back",
  cancelled: "Cancelled",
};

/** §4.6: colour says WHO HOLDS IT. Yellow is always "a person must act". */
const TONE: Record<string, "success" | "processing" | "warning" | "info" | "danger" | "neutral" | "ai"> = {
  draft: "neutral",
  collecting_documents: "ai",
  verifying_identity: "processing",
  operator_review: "warning",
  ready_to_file: "processing",
  awaiting_provider: "info",
  information_requested: "warning",
  filed: "info",
  formed: "success",
  rejected: "danger",
  cancelled: "neutral",
};

const DAY = 86_400_000;

export function Queue({
  rows,
  actions,
}: {
  rows: {
    orderId: string;
    tenantId: string;
    businessName: string | null;
    legalNames: string[];
    jurisdictionCode: string;
    status: string;
    providerCode: string;
    openRfis: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
  actions: { at: Date; action: string; detail: string | null; tenantId: string }[];
}) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const waiting = rows.filter((r) => r.status === "operator_review" || r.openRfis > 0).length;

  function move(row: (typeof rows)[number], to: string) {
    setError(null);
    start(async () => {
      const result = await transitionOrder({
        orderId: row.orderId,
        tenantId: row.tenantId,
        from: row.status,
        to,
      });
      if (result.ok) router.refresh();
      else setError(result.error ?? "That move was refused.");
    });
  }

  return (
    <>
      <PageHeader
        title="Formation queue"
        subtitle="Every filing that is not finished, oldest first"
        meta={
          <span className="text-body-sm text-muted-foreground font-mono tabular-nums">
            {rows.length} open · {waiting} waiting on us
          </span>
        }
      />

      <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
        {error ? (
          <p className="border-destructive bg-destructive-subtle text-destructive-ink border px-4 py-3" role="alert">
            {error}
          </p>
        ) : null}

        {rows.length === 0 ? (
          <EmptyState
            title="Nothing in the queue"
            body="Every formation is either finished or cancelled. New requests appear here the moment a founder submits one."
            action={<Button onClick={() => router.refresh()}>Check again</Button>}
          />
        ) : (
          <section className="flex flex-col gap-4">
            <SectionHeader title="Open filings" count={rows.length} countTone="warning" />
            <ul className="border-border border">
              {rows.map((row) => {
                const age = Math.floor((Date.now() - row.createdAt.getTime()) / DAY);
                const next = FORMATION_ORDER_TRANSITIONS[row.status as FormationOrderStatus] ?? [];
                const name = row.legalNames[0] ?? row.businessName ?? "Unnamed";
                // Anything a person is holding is the anchor. Everything else is waiting
                // on a provider or an authority and needs no attention today.
                const ours = row.status === "operator_review" || row.openRfis > 0;

                return (
                  <li
                    key={row.orderId}
                    className={cx(
                      "border-border flex flex-col gap-3 border-b px-5 py-4 last:border-b-0",
                      ours ? "bg-surface-sunken" : "hover:bg-accent",
                    )}
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <Avatar initials={initialsOf(name)} name={name} size="sm" tone={TONE[row.status] ?? "neutral"} />
                      <span className={cx("text-body-sm w-56 shrink-0 truncate", ours && "font-medium")}>{name}</span>
                      <span className="text-caption text-muted-foreground w-16 shrink-0 font-mono">
                        {row.jurisdictionCode.toUpperCase()}
                      </span>
                      <StatusDot tone={TONE[row.status] ?? "neutral"}>{LABEL[row.status] ?? row.status}</StatusDot>

                      {row.openRfis > 0 ? (
                        <span className="text-caption text-warning-ink inline-flex items-center gap-1">
                          <QuestionIcon size={14} weight="fill" aria-hidden="true" />
                          {row.openRfis} open
                        </span>
                      ) : null}

                      {/* Age, not date. "Nine days" is what tells an operator to act; a
                          date makes them do the arithmetic. */}
                      <span
                        className={cx(
                          "text-caption ml-auto inline-flex items-center gap-1 font-mono tabular-nums",
                          age >= 7 ? "text-warning-ink" : "text-muted-foreground",
                        )}
                      >
                        <ClockIcon size={14} aria-hidden="true" />
                        {age}d
                      </span>
                    </div>

                    {next.length > 0 ? (
                      <div className="flex flex-wrap items-center gap-2 pl-10">
                        <span className="text-caption text-muted-foreground mr-1">Move to</span>
                        {next.map((to) => (
                          <Button
                            key={to}
                            onClick={() => move(row, to)}
                            disabled={pending}
                            variant={to === "cancelled" ? "secondary" : "primary"}
                          >
                            {LABEL[to] ?? to}
                          </Button>
                        ))}
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="flex flex-col gap-4">
          <SectionHeader title="Recent operator actions" count={actions.length} countTone="ai" />
          {actions.length === 0 ? (
            <p className="text-body-sm text-muted-foreground">Nothing recorded yet.</p>
          ) : (
            <ul className="border-border border">
              {actions.map((a, i) => (
                <li key={i} className="border-border flex items-center gap-4 border-b px-5 py-3 last:border-b-0">
                  <span className="text-body-sm min-w-0 flex-1 font-mono">{a.action}</span>
                  <span className="text-caption text-muted-foreground truncate">{a.detail ?? ""}</span>
                  <time className="text-caption text-muted-foreground font-mono tabular-nums">
                    {a.at.toISOString().slice(0, 16).replace("T", " ")}
                  </time>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
