"use client";

import { useState } from "react";
import {
  ArrowLeftIcon, EnvelopeSimpleIcon, PhoneIcon, DotsThreeIcon, PlusIcon,
  CheckCircleIcon, CircleIcon, BellIcon, BuildingsIcon, CurrencyDollarIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "../../_prototype/shell";
import { ActivityPanel, Avatar, AvatarStack, Button, PanelLabel, SectionHeader, StatusBadge, Tabs, cx } from "../../_prototype/primitives";
import { ACTIVITY, TASKS, TASK_HISTORY } from "../../_prototype/data";

/**
 * Screen 3 — SplitDetailLayout (§21.9) + RecordCardList (§21.12).
 *
 * Context column ≈30% of the content area, separated by a single vertical rule. Each
 * column owns its own tab strip — two independent navigations that must never be
 * visually merged. Tasks are cards, not table rows, because each carries several lines
 * and its own actions.
 */
export default function BusinessScreen() {
  const [ctxTab, setCtxTab] = useState("activity");
  const [mainTab, setMainTab] = useState("tasks");

  return (
    <>
      <PageHeader
        breadcrumb={<><ArrowLeftIcon size={16} /><span>Businesses</span><span aria-hidden="true">›</span><span className="text-foreground">Northbridge Studio LLC</span></>}
        meta={<span className="flex items-center gap-2"><span className="bg-success size-1.5" aria-hidden="true" />Last activity today at 09:12</span>}
        avatar={<Avatar initials="AO" size="lg" />}
        title="Northbridge Studio LLC"
        subtitle="Wyoming · Growth · Created 12 Aug, 2026"
        people={<AvatarStack people={["AO", "TK", "OK"]} />}
        actions={<><Button><EnvelopeSimpleIcon size={16} /> Email</Button><Button><PhoneIcon size={16} /> Call</Button><Button><DotsThreeIcon size={16} /> More</Button></>}
      />

      {/*
        flex-1 makes the split fill the remaining viewport height, so the vertical rule
        between the two columns runs to the bottom instead of stopping wherever the
        taller column's content happens to end. Found in review 2026-08-31.
      */}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* Context column — ~30% */}
        <div className="border-border shrink-0 overflow-y-auto border-b px-8 lg:w-[30%] lg:border-r lg:border-b-0">
          <Tabs items={[{ id: "info", label: "Business" }, { id: "activity", label: "Activity" }]} active={ctxTab} onSelect={setCtxTab} />
          <div className="flex flex-col gap-6 py-6">
            <div className="flex flex-col gap-4">
              <PanelLabel>Recent activity</PanelLabel>
              <ActivityPanel events={ACTIVITY.slice(0, 3)} />
            </div>
            <div className="border-border flex flex-col gap-4 border-t pt-6">
              <PanelLabel>Formation</PanelLabel>
              <ul className="flex flex-col gap-4">
                {[
                  { icon: <BuildingsIcon size={16} />, label: "Entity type", value: "LLC — single member" },
                  { icon: <BuildingsIcon size={16} />, label: "State", value: "Wyoming" },
                  { icon: <CurrencyDollarIcon size={16} />, label: "Plan", value: "Growth · $399/mo" },
                ].map((m) => (
                  <li key={m.label} className="flex items-start gap-3">
                    <span className="border-border text-muted-foreground flex size-8 shrink-0 items-center justify-center border">{m.icon}</span>
                    <span className="flex min-w-0 flex-col">
                      <span className="text-caption text-muted-foreground">{m.label}</span>
                      <span className="text-body-sm">{m.value}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Main column */}
        <div className="min-w-0 flex-1 overflow-y-auto px-8">
          <Tabs
            items={[
              { id: "details", label: "Details" }, { id: "documents", label: "Documents" },
              { id: "tasks", label: "Tasks", count: TASKS.length }, { id: "content", label: "Content" },
              { id: "agents", label: "Agents" }, { id: "billing", label: "Billing" },
            ]}
            active={mainTab}
            onSelect={setMainTab}
          />

          <div className="flex flex-col gap-8 py-6">
            <section className="flex flex-col gap-4">
              <SectionHeader title="Open tasks" action={<Button variant="primary"><PlusIcon size={16} /> Create task</Button>} />
              <div className="flex flex-col gap-4">
                {TASKS.map((t) => (
                  <article key={t.id} className={cx("border-border flex flex-col gap-3 border p-4", t.done && "bg-muted")}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        {t.done ? <CheckCircleIcon size={20} weight="fill" className="text-success shrink-0" /> : <CircleIcon size={20} className="text-muted-foreground shrink-0" />}
                        <div className="flex min-w-0 flex-col gap-1">
                          <h3 className={cx("text-body", t.done && "text-muted-foreground line-through")}>{t.title}</h3>
                          <p className="text-body-sm text-muted-foreground">{t.detail}</p>
                        </div>
                      </div>
                      <span className="text-caption text-muted-foreground shrink-0">Due {t.due}</span>
                    </div>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <span className="text-caption text-muted-foreground flex items-center gap-2">
                        <Avatar initials={t.creator.slice(0, 2).toUpperCase()} size="sm" /> Created by {t.creator}
                      </span>
                      <span className="flex items-center gap-2">
                        {t.priority ? <StatusBadge tone="danger">{t.priority}</StatusBadge> : null}
                        <Button><BellIcon size={16} /> Remind</Button>
                      </span>
                    </div>
                  </article>
                ))}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <SectionHeader title="Task history" subtitle="28 August, 2026" />
              {TASK_HISTORY.map((t) => (
                <article key={t.id} className="border-border bg-muted flex items-start justify-between gap-4 border p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    <CheckCircleIcon size={20} weight="fill" className="text-success shrink-0" />
                    <div className="flex min-w-0 flex-col gap-1">
                      <h3 className="text-body text-muted-foreground line-through">{t.title}</h3>
                      <p className="text-body-sm text-muted-foreground">{t.detail}</p>
                    </div>
                  </div>
                  <span className="text-caption text-muted-foreground shrink-0">{t.due}</span>
                </article>
              ))}
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
