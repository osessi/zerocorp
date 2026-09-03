import { redirect } from "next/navigation";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { Avatar, EmptyState, PageHeader, SegmentedProgress, StatusBadge, StatusDot, Tabs } from "@zerocorp/ui";
import { BigFact, BigFactGrid } from "../ui-facts";
import { ShieldCheckIcon, ThermometerSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { getBlocksRepository, getUnitOfWork } from "../../../server/container";
import { getViewer } from "../../../server/session";
import { dnsRecordsFor } from "@zerocorp/domain";
import { Empty, Panel, Row, Rows } from "../ui";
import { SetUpEmail } from "./SetUpEmail";

export const metadata = { title: "Email — ZeroCorp" };

/** Warm-up is a calendar process, not a flag. It runs for weeks and its shape is a ramp. */
const WARMUP_DAYS = 28;


export default async function Page() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const view = await getUnitOfWork().withTenant(viewer.ctx, (tx) =>
    getBlocksRepository().email(tx, viewer.ctx),
  );


  return (
    <>
      <PageHeader
        title="Email"
        subtitle={view.domain?.hostname ?? "No sending domain yet"}
        meta={
          <StatusBadge tone={view.domain?.warmupStatus === "complete" ? "success" : "neutral"}>
            {view.domain ? view.domain.warmupStatus.replace(/_/g, " ") : "Not started"}
          </StatusBadge>
        }
      />

      <Tabs
        tabs={[
          {
            id: "auth",
            label: "Authentication",
            icon: <ShieldCheckIcon size={17} aria-hidden="true" />,
            content: (
              <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
                {view.domain ? (
                  <>
                    {/*
                      The four records, at a size that says they matter.

                      They were four grey labels with four grey badges, so SPF, DKIM,
                      DMARC and a reputation score — the four things that decide whether
                      your mail reaches an inbox at all — arrived with the weight of a
                      footer. Each now carries its own colour, and the colour belongs to
                      the FIELD so a founder learns where to look once.
                    */}
                    <BigFactGrid>
                      <BigFact
                        label="SPF"
                        value={view.domain.spfStatus}
                        hint="Who may send as you"
                        tone={view.domain.spfStatus === "verified" ? "success" : "warning"}
                      />
                      <BigFact
                        label="DKIM"
                        value={view.domain.dkimStatus}
                        hint="Proves the mail is really yours"
                        tone={view.domain.dkimStatus === "verified" ? "success" : "warning"}
                      />
                      <BigFact
                        label="DMARC"
                        value={view.domain.dmarcStatus}
                        hint="What to do with forgeries"
                        tone={view.domain.dmarcStatus === "verified" ? "success" : "warning"}
                      />
                      <BigFact
                        label="Reputation"
                        value={view.domain.reputationScore === null ? "—" : String(view.domain.reputationScore)}
                        hint="Out of 100, as providers see you"
                        tone="processing"
                        mono
                      />
                    </BigFactGrid>

                    <Panel title="Add these to your DNS" count={dnsRecordsFor(view.domain.hostname).length}>
                      <Rows>
                        {dnsRecordsFor(view.domain.hostname).map((record) => {
                          const waiting = record.value === "ISSUED_BY_PROVIDER";
                          return (
                            <Row key={`${record.kind}-${record.host}`} muted={!waiting}>
                              <span className="text-caption text-chart-3 w-16 shrink-0 font-mono">{record.kind}</span>
                              <span className="text-body-sm w-64 shrink-0 truncate font-mono">{record.host}</span>
                              <span className="text-caption text-muted-foreground min-w-0 flex-1 truncate font-mono">
                                {record.value}
                              </span>
                              {waiting ? (
                                <StatusBadge tone="warning">Awaiting key</StatusBadge>
                              ) : (
                                <StatusDot tone="neutral" muted>{record.purpose.toUpperCase()}</StatusDot>
                              )}
                            </Row>
                          );
                        })}
                      </Rows>
                    </Panel>
                  </>
                ) : (
                  <EmptyState
                    icon={EnvelopeSimpleIcon}
                    title="No sending domain yet"
                    body="Warm-up is a calendar process, not a switch: volume climbs over about four weeks so providers learn the domain sends real mail. Starting it early is the whole game."
                    action={<SetUpEmail />}
                  />
                )}
              </div>
            ),
          },
          {
            id: "warmup",
            label: "Warm-up",
            icon: <ThermometerSimpleIcon size={17} aria-hidden="true" />,
            count: view.domain?.warmupDay ?? undefined,
            attention: view.domain?.warmupStatus === "warming",
            content: (
              <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
                {view.domain && view.domain.warmupStatus !== "not_started" ? (
                  /* Dotted, not another grey box. A warm-up is a process still running,
                     and a dashed edge says "in progress" without spending a colour. */
                  <div className="border-processing bg-processing-wash flex flex-col gap-5 border border-dashed p-6">
                    <div className="flex flex-wrap items-baseline justify-between gap-4">
                      <span className="text-h3 text-processing-ink font-mono tabular-nums">
                        Day {view.domain.warmupDay}
                        <span className="text-body text-muted-foreground font-sans"> of {WARMUP_DAYS}</span>
                      </span>
                      <span className="text-body-sm text-muted-foreground font-mono tabular-nums">
                        {Math.max(0, WARMUP_DAYS - view.domain.warmupDay)} days left · {view.domain.dailyLimit} messages a day
                      </span>
                    </div>
                    <SegmentedProgress
                      total={WARMUP_DAYS}
                      completed={view.domain.warmupDay}
                      current={view.domain.warmupDay}
                      label={`Day ${view.domain.warmupDay} of ${WARMUP_DAYS}`}
                    />
                    <p className="text-body-sm text-muted-foreground">
                      Nothing is required from you. The limit rises on its own as the domain earns it.
                    </p>
                  </div>
                ) : (
                  <Empty
                    title="Not warming up yet"
                    body="It starts as soon as the domain is authenticated, and runs while the rest of the plan is being built."
                  />
                )}
              </div>
            ),
          },
          {
            id: "mailboxes",
            label: "Mailboxes",
            icon: <EnvelopeSimpleIcon size={17} aria-hidden="true" />,
            count: view.mailboxes.length,
            content: (
              <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
                <Panel title="Mailboxes" count={view.mailboxes.length}>
                  {view.mailboxes.length === 0 ? (
                    <Empty title="No mailboxes yet" body="Addresses are created once the domain is authenticated." />
                  ) : (
                    <Rows>
                      {view.mailboxes.map((box) => (
                        <Row key={box.id}>
                          <Avatar
                            initials={box.address.slice(0, 2).toUpperCase()}
                            name={box.address}
                            size="sm"
                            tone={box.status === "active" ? "success" : "processing"}
                          />
                          <span className="text-body-sm min-w-0 flex-1 font-mono">{box.address}</span>
                          <span className="text-caption text-muted-foreground font-mono tabular-nums">{box.dailyLimit}/day</span>
                          <StatusDot tone={box.status === "active" ? "success" : "processing"}>{box.status}</StatusDot>
                        </Row>
                      ))}
                    </Rows>
                  )}
                </Panel>
              </div>
            ),
          },
        ]}
      />
    </>
  );
}
