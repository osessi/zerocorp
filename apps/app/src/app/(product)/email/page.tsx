import { redirect } from "next/navigation";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { Avatar, EmptyState, PageHeader, SegmentedProgress, StatusBadge, StatusDot, SubNav } from "@zerocorp/ui";
import { ShieldCheckIcon, ThermometerSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { getBlocksRepository, getUnitOfWork } from "../../../server/container";
import { getViewer } from "../../../server/session";
import { dnsRecordsFor } from "@zerocorp/domain";
import { Empty, Fact, FactCell, FactGrid, Panel, Row, Rows } from "../ui";
import { SetUpEmail } from "./SetUpEmail";

export const metadata = { title: "Email — ZeroCorp" };

/** Warm-up is a calendar process, not a flag. It runs for weeks and its shape is a ramp. */
const WARMUP_DAYS = 28;

function recordTone(status: string) {
  if (status === "verified") return "success" as const;
  if (status === "failed") return "danger" as const;
  return "processing" as const;
}

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

      <SubNav
        items={[
          { id: "auth", label: "Authentication", icon: ShieldCheckIcon },
          {
            id: "warmup",
            label: "Warm-up",
            icon: ThermometerSimpleIcon,
            count: view.domain?.warmupDay ?? undefined,
            attention: view.domain?.warmupStatus === "warming",
          },
          { id: "mailboxes", label: "Mailboxes", count: view.mailboxes.length, icon: EnvelopeSimpleIcon },
        ]}
      />

      <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-10 px-5 py-8 sm:px-8">
        {/*
          Panels report their own state; none is gated on the sending domain.

          The previous version hid authentication, warm-up AND mailboxes behind
          `!view.domain`. Same defect as Website: a condition that hides working content
          instead of reporting its own absence.
        */}
        <div id="auth" className="scroll-mt-16" />
        <Panel title="Authentication">
          {view.domain ? (
            <FactGrid>
              <FactCell><Fact label="SPF" value={<StatusBadge tone={recordTone(view.domain.spfStatus)}>{view.domain.spfStatus}</StatusBadge>} /></FactCell>
              <FactCell><Fact label="DKIM" value={<StatusBadge tone={recordTone(view.domain.dkimStatus)}>{view.domain.dkimStatus}</StatusBadge>} /></FactCell>
              <FactCell><Fact label="DMARC" value={<StatusBadge tone={recordTone(view.domain.dmarcStatus)}>{view.domain.dmarcStatus}</StatusBadge>} /></FactCell>
              <FactCell>
                <Fact
                  label="Reputation"
                  value={view.domain.reputationScore === null ? "—" : `${view.domain.reputationScore} / 100`}
                  tone="font-mono tabular-nums text-success-ink"
                />
              </FactCell>
            </FactGrid>
          ) : (
            <EmptyState
              icon={EnvelopeSimpleIcon}
              title="No sending domain yet"
              body="Warm-up is a calendar process, not a switch: volume climbs over about four weeks so providers learn the domain sends real mail. Starting it early is the whole game."
              action={<SetUpEmail />}
            />
          )}
        </Panel>

        <div id="warmup" className="scroll-mt-16" />
        {view.domain && view.domain.warmupStatus !== "not_started" ? (
          <Panel title="Warm-up">
            <div className="bg-surface-sunken border-border flex flex-col gap-4 border p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-4">
                <span className="text-body-sm">
                  Day <span className="text-processing-ink font-mono tabular-nums">{view.domain.warmupDay}</span> of {WARMUP_DAYS}
                </span>
                {/* The number a founder actually wants: when does this end. */}
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
              <p className="text-caption text-muted-foreground">
                Nothing is required from you. The limit rises on its own as the domain earns it.
              </p>
            </div>
          </Panel>
        ) : null}

        {view.domain ? (
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
        ) : null}

        {/* Mailboxes are NOT gated: an address can exist before its domain is verified. */}
        <div id="mailboxes" className="scroll-mt-16" />
        <Panel title="Mailboxes" count={view.mailboxes.length}>
          {view.mailboxes.length === 0 ? (
            <Empty title="No mailboxes yet" body="Addresses are created once the domain is authenticated." />
          ) : (
            <Rows>
              {view.mailboxes.map((box) => (
                <Row key={box.id}>
                  <Avatar initials={box.address.slice(0, 2).toUpperCase()} name={box.address} size="sm" tone={box.status === "active" ? "success" : "processing"} />
                  <span className="text-body-sm min-w-0 flex-1 font-mono">{box.address}</span>
                  <span className="text-caption text-muted-foreground font-mono tabular-nums">{box.dailyLimit}/day</span>
                  <StatusDot tone={box.status === "active" ? "success" : "processing"}>{box.status}</StatusDot>
                </Row>
              ))}
            </Rows>
          )}
        </Panel>

      </div>
    </>
  );
}
