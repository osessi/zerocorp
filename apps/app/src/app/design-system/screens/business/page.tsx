"use client";

import { useState } from "react";
import type { FormationOrderStatus } from "@zerocorp/contracts";
import {
  ArrowLeftIcon, EnvelopeSimpleIcon, PhoneIcon, DotsThreeIcon, PlusIcon,
  CheckCircleIcon, CircleIcon, BellIcon, BuildingsIcon, CurrencyDollarIcon,
  ClockIcon, WarningCircleIcon,
} from "@phosphor-icons/react/dist/ssr";
import { PageHeader } from "../../_prototype/shell";
import { ActivityPanel, Avatar, AvatarStack, Button, ButtonGroup, GroupButton, PanelLabel, SectionHeader, StatusBadge, Tabs, cx } from "../../_prototype/primitives";
import { ACTIVITY, TASKS, TASK_HISTORY } from "../../_prototype/data";

/** The seven states a formation order passes through. packages/contracts owns them. */
const STEP_ORDER = [
  "draft",
  "collecting_documents",
  "verifying_identity",
  "operator_review",
  "ready_to_file",
  "filed",
  "formed",
] as const satisfies readonly FormationOrderStatus[];

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
        actions={
          <ButtonGroup>
            <GroupButton emphasis="loud"><EnvelopeSimpleIcon size={16} /> Email</GroupButton>
            <GroupButton><PhoneIcon size={16} /> Call</GroupButton>
            <GroupButton aria-label="More actions"><DotsThreeIcon size={16} /></GroupButton>
          </ButtonGroup>
        }
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
              {/*
                This block is the D2 state machine rendered, which makes it the most
                important fact on the screen. It was three grey tiles reading entity type,
                state and plan: true, inert, and easy to scroll past.

                What a founder needs first is WHERE THEIR COMPANY IS, and D2 says that is
                two answers, not one. The filing job and the EIN run on separate clocks and
                fail separately, so they are shown side by side. A company can be formed
                while its EIN is still weeks away, and neither fact may hide the other.
              */}
              <div className="flex flex-col gap-3">
                <div className="border-processing bg-processing-subtle flex flex-col gap-2 border p-3">
                  <span className="text-overline text-processing-ink uppercase">Filing</span>
                  <span className="text-h4 text-foreground">Filed with Wyoming</span>
                  <span className="text-caption text-muted-foreground font-mono">
                    2 Mar · ref WY-2026-88214
                  </span>
                  {/* Seven states, and the one you are on. A bar of seven segments says
                      "there is an end to this" in a way a status word cannot. */}
                  <span className="mt-1 flex gap-0.5" aria-hidden="true">
                    {STEP_ORDER.map((step, i) => (
                      <span
                        key={step}
                        className={cx(
                          "h-1 flex-1",
                          i < 5 ? "bg-processing" : i === 5 ? "bg-processing" : "bg-border",
                        )}
                      />
                    ))}
                  </span>
                  <span className="text-caption text-muted-foreground">Step 6 of 7</span>
                </div>

                <div className="border-warning bg-warning-subtle flex flex-col gap-1 border p-3">
                  <span className="text-overline text-warning-ink uppercase">EIN, separate track</span>
                  <span className="text-body text-foreground">Requested from the IRS</span>
                  <span className="text-caption text-muted-foreground">
                    Usually 2 to 6 weeks after formation. The company is active without it.
                  </span>
                </div>
              </div>

              <ul className="border-border flex flex-col gap-4 border-t pt-4">
                {[
                  { icon: <BuildingsIcon size={16} />, label: "Entity type", value: "LLC, single member" },
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
              { id: "details", label: "Details" }, { id: "documents", label: "Documents", count: 6, tone: "info" as const },
              { id: "tasks", label: "Tasks", count: TASKS.length, tone: "warning" as const }, { id: "content", label: "Content" },
              { id: "agents", label: "Agents", count: 3, tone: "processing" as const }, { id: "billing", label: "Billing" },
            ]}
            active={mainTab}
            onSelect={setMainTab}
          />

          <div className="flex flex-col gap-8 py-6">
            <section className="flex flex-col gap-4">
              <SectionHeader title="Open tasks" count={TASKS.length} countTone="warning" action={<Button variant="primary"><PlusIcon size={16} /> Create task</Button>} />
              <div className="flex flex-col gap-4">
                {TASKS.map((t) => {
                  /*
                    A task card carries three facts and was telling all three in flat grey:
                    is it done, is it blocked, is it due today.

                    The first attempt put a coloured bar down the left edge. Reported the
                    same day as reading machine-generated, and the objection is fair: a
                    left bar is the house style of every AI-built dashboard, and it decorates
                    the container rather than saying anything about the task.

                    So the state lives in the CONTENT instead, where it is read:

                      done       muted ground, filled check, struck title
                      blocked    an alert glyph and a tinted badge
                      due today  warning ink and a clock on the date, because
                                 "Due Today 12:00" and "Due 3 Sep" were the same colour
                                 and are not the same fact

                    The card itself only responds to the pointer: a very light ground and
                    a dashed outline on all four sides, which reads as "this is a handle"
                    without claiming a state it does not have.
                  */
                  const blocked = Boolean(t.priority);
                  const urgent = t.due.startsWith("Today") && !t.done;
                  return (
                  <article
                    key={t.id}
                    className={cx(
                      "flex flex-col gap-3 border border-dashed p-4",
                      "transition-[color,background-color,border-color] duration-normal ease-out",
                      /*
                        The whole card carries the state, not just a glyph inside it. A
                        WASH rather than the chip tint: body text here is muted, over a far
                        larger area, and at the chip tint it measured 4.05:1 on the red.
                      */
                      t.done
                        ? "bg-success-wash border-success"
                        : blocked
                          ? "bg-destructive-wash border-destructive"
                          : "border-border hover:border-input hover:bg-accent",
                    )}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex min-w-0 items-start gap-3">
                        {t.done ? (
                          <CheckCircleIcon size={20} weight="fill" className="text-success shrink-0" />
                        ) : blocked ? (
                          <WarningCircleIcon size={20} className="text-destructive shrink-0" />
                        ) : (
                          <CircleIcon size={20} className="text-muted-foreground shrink-0" />
                        )}
                        <div className="flex min-w-0 flex-col gap-1">
                          <h3 className={cx("text-body", t.done && "text-muted-foreground line-through")}>{t.title}</h3>
                          <p className="text-body-sm text-muted-foreground">{t.detail}</p>
                        </div>
                      </div>
                      <span
                        className={cx(
                          "text-caption shrink-0 inline-flex items-center gap-1.5 whitespace-nowrap",
                          urgent ? "text-warning-ink" : "text-muted-foreground",
                        )}
                      >
                        {urgent ? <ClockIcon size={14} weight="regular" aria-hidden="true" /> : null}
                        Due {t.due}
                      </span>
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
                  );
                })}
              </div>
            </section>

            <section className="flex flex-col gap-4">
              <SectionHeader title="Task history" subtitle="28 August, 2026" />
              {TASK_HISTORY.map((t) => (
                <article key={t.id} className="border-border bg-muted flex items-start justify-between gap-4 border border-dashed p-4">
                  <div className="flex min-w-0 items-start gap-3">
                    {/* Filled check on its own tint: history is done, and should read as
                        settled rather than as a second list of open work. */}
                    <span className="bg-success-subtle border-success text-success-ink flex size-6 shrink-0 items-center justify-center border">
                      <CheckCircleIcon size={14} weight="fill" />
                    </span>
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
