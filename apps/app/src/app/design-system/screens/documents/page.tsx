"use client";

import { useState } from "react";
import {
  ArrowLeftIcon, ArrowRightIcon, FileArrowDownIcon, FilePdfIcon, FileTextIcon,
  PlusIcon, CheckCircleIcon, XCircleIcon, DotsThreeVerticalIcon, ClockIcon, WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "../../_prototype/shell";
import { Avatar, AvatarStack, Button, MetricGrid, StatusBadge, Tabs, cx } from "../../_prototype/primitives";
import { DOCUMENTS } from "../../_prototype/data";

/**
 * Screen 4 — MetricGrid (§21.11) + segmented scope + RecordCardList (§21.12).
 *
 * Metrics sit in ONE bordered container divided by internal rules. Documents are
 * separate bordered cards with a gap, because each carries a meta line and its own
 * accept / reject / overflow controls.
 */
export default function DocumentsScreen() {
  const [tab, setTab] = useState("documents");
  const [scope, setScope] = useState("all");

  const counts = {
    owed: DOCUMENTS.filter((d) => d.state === "owed").length,
    pending: DOCUMENTS.filter((d) => d.state === "pending").length,
    accepted: DOCUMENTS.filter((d) => d.state === "accepted").length,
  };

  return (
    <>
      <PageHeader
        breadcrumb={<><ArrowLeftIcon size={16} /><span>Businesses</span><span aria-hidden="true">›</span><span className="text-foreground">Northbridge Studio LLC</span></>}
        meta="Identity documents are held in a private bucket"
        avatar={<Avatar initials="AO" size="lg" />}
        title="Document vault"
        subtitle="Wyoming LLC · founder Amara Osei"
        people={<AvatarStack people={["AO", "TK", "OK"]} />}
        actions={<Button variant="primary"><PlusIcon size={16} /> Request document</Button>}
      />

      <div className="px-8">
        <Tabs
          items={[{ id: "details", label: "Details" }, { id: "documents", label: "Documents", count: DOCUMENTS.length, tone: "info" as const }, { id: "tasks", label: "Tasks", count: 3, tone: "warning" as const }, { id: "billing", label: "Billing" }]}
          active={tab}
          onSelect={setTab}
        />
      </div>

      <div className="mx-auto flex max-w-(--container-content) flex-col gap-8 p-8">
        <MetricGrid
          items={[
            {
              label: "Documents owed",
              value: String(counts.owed),
              icon: <WarningCircleIcon size={14} />,
              tone: "danger",
              delta: { text: "blocks the Wyoming filing", direction: "down" },
            },
            {
              label: "Pending review",
              value: String(counts.pending),
              icon: <ClockIcon size={14} />,
              tone: "warning",
              delta: { text: "oldest waiting 2 days", direction: "flat" },
            },
            {
              label: "Accepted",
              value: String(counts.accepted),
              sub: `of ${DOCUMENTS.length}`,
              icon: <FileTextIcon size={14} />,
              tone: "success",
              delta: { text: "3 this week", direction: "up" },
            },
          ]}
          link={<button className="text-body-sm text-foreground focus-visible:outline-ring inline-flex w-fit items-center gap-1 focus-visible:outline-2 focus-visible:outline-offset-2">Go to formation <ArrowRightIcon size={14} /></button>}
        />

        <section className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Segmented scope control */}
            <div className="border-input flex h-9 shrink-0 items-center border">
              {[{ id: "all", label: "All documents" }, { id: "milestones", label: "Portal milestones" }].map((s, i) => (
                <button key={s.id} onClick={() => setScope(s.id)} className={cx("text-label focus-visible:outline-ring h-full px-3 transition-[color,background-color,border-color] duration-normal focus-visible:outline-2 focus-visible:-outline-offset-2", i > 0 && "border-input border-l", scope === s.id ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}>
                  {s.label}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Button><PlusIcon size={16} /> Add template</Button>
              <Button><FileArrowDownIcon size={16} /> Download zip</Button>
              <Button><FilePdfIcon size={16} /> Convert to PDF</Button>
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {DOCUMENTS.map((d) => (
              <article key={d.id} className="border-border flex flex-wrap items-center gap-4 border p-4">
                <span className="border-border text-muted-foreground flex size-10 shrink-0 items-center justify-center border">
                  <FileTextIcon size={20} />
                </span>
                <div className="flex min-w-0 flex-1 flex-col gap-1">
                  <h3 className="text-body truncate">{d.title}</h3>
                  <p className="text-caption text-muted-foreground truncate">
                    {d.file} · {d.size} · {d.date}
                  </p>
                </div>
                <StatusBadge tone={d.state === "accepted" ? "success" : d.state === "pending" ? "processing" : "warning"}>
                  {d.state === "accepted" ? "Accepted" : d.state === "pending" ? "In review" : "Owed"}
                </StatusBadge>
                <span className="flex shrink-0 items-center gap-1">
                  <button aria-label={`Accept ${d.title}`} disabled={d.state === "owed"} className="hover:bg-accent focus-visible:outline-ring flex size-9 items-center justify-center transition-[color,background-color,border-color] duration-normal focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40">
                    <CheckCircleIcon size={20} />
                  </button>
                  <button aria-label={`Reject ${d.title}`} disabled={d.state === "owed"} className="hover:bg-accent focus-visible:outline-ring flex size-9 items-center justify-center transition-[color,background-color,border-color] duration-normal focus-visible:outline-2 focus-visible:-outline-offset-2 disabled:cursor-not-allowed disabled:opacity-40">
                    <XCircleIcon size={20} />
                  </button>
                  <button aria-label={`More actions for ${d.title}`} className="hover:bg-accent focus-visible:outline-ring flex size-9 items-center justify-center transition-[color,background-color,border-color] duration-normal focus-visible:outline-2 focus-visible:-outline-offset-2">
                    <DotsThreeVerticalIcon size={20} />
                  </button>
                </span>
              </article>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
