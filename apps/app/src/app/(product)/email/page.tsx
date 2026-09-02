import { redirect } from "next/navigation";
import { EnvelopeSimpleIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader, StatusBadge, cx } from "@zerocorp/ui";
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

  const percent = view.domain ? Math.min(100, Math.round((view.domain.warmupDay / WARMUP_DAYS) * 100)) : 0;

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

      <div className="flex flex-col gap-10 px-5 py-8 sm:px-8">
        <Panel title="Authentication">
          {view.domain ? (
            <FactGrid>
              <FactCell><Fact label="SPF" value={<StatusBadge tone={recordTone(view.domain.spfStatus)}>{view.domain.spfStatus}</StatusBadge>} /></FactCell>
              <FactCell><Fact label="DKIM" value={<StatusBadge tone={recordTone(view.domain.dkimStatus)}>{view.domain.dkimStatus}</StatusBadge>} /></FactCell>
              <FactCell><Fact label="DMARC" value={<StatusBadge tone={recordTone(view.domain.dmarcStatus)}>{view.domain.dmarcStatus}</StatusBadge>} /></FactCell>
              <FactCell>
                <Fact
                  label="Reputation"
                  value={view.domain.reputationScore === null ? "—" : `${view.domain.reputationScore}`}
                  tone="font-mono tabular-nums text-chart-3"
                />
              </FactCell>
            </FactGrid>
          ) : (
            <SetUpEmail />
          )}
        </Panel>

        {view.domain ? (
          <Panel title="Add these to your DNS" count={dnsRecordsFor(view.domain.hostname).length}>
            <Rows>
              {dnsRecordsFor(view.domain.hostname).map((record) => (
                <Row key={`${record.kind}-${record.host}`}>
                  <span className="text-caption text-chart-3 w-16 shrink-0 font-mono">{record.kind}</span>
                  <span className="text-body-sm w-64 shrink-0 truncate font-mono">{record.host}</span>
                  <span className="text-caption text-muted-foreground min-w-0 flex-1 truncate font-mono">
                    {record.value}
                  </span>
                  <StatusBadge tone={record.value === "ISSUED_BY_PROVIDER" ? "warning" : "neutral"}>
                    {record.value === "ISSUED_BY_PROVIDER" ? "Awaiting key" : record.purpose.toUpperCase()}
                  </StatusBadge>
                </Row>
              ))}
            </Rows>
          </Panel>
        ) : null}

        <Panel title="Warm-up">
          {view.domain && view.domain.warmupStatus !== "not_started" ? (
            <div className="border-border flex flex-col gap-4 border p-5">
              <div className="flex items-baseline justify-between gap-4">
                <span className="text-body-sm">
                  Day <span className="text-chart-1 font-mono tabular-nums">{view.domain.warmupDay}</span> of {WARMUP_DAYS}
                </span>
                <span className="text-body-sm text-muted-foreground font-mono tabular-nums">
                  {view.domain.dailyLimit} messages a day
                </span>
              </div>
              <div className="bg-muted h-1.5 w-full" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
                <div className={cx("bg-chart-1 h-full transition-[width] duration-modal ease-out")} style={{ width: `${percent}%` }} />
              </div>
            </div>
          ) : (
            <Empty
              title="Not warming up yet"
              body="Warm-up is a calendar process rather than a switch: volume climbs over about four weeks so mailbox providers learn the domain sends real mail. It starts as soon as the domain is authenticated, and runs while the rest of the plan is being built."
            />
          )}
        </Panel>

        <Panel title="Mailboxes" count={view.mailboxes.length}>
          {view.mailboxes.length === 0 ? (
            <Empty title="No mailboxes yet" body="Addresses are created once the domain is authenticated." />
          ) : (
            <Rows>
              {view.mailboxes.map((box) => (
                <Row key={box.id}>
                  <EnvelopeSimpleIcon size={18} className="text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="text-body-sm min-w-0 flex-1 font-mono">{box.address}</span>
                  <span className="text-caption text-muted-foreground font-mono tabular-nums">{box.dailyLimit}/day</span>
                  <StatusBadge tone={box.status === "active" ? "success" : "processing"}>{box.status}</StatusBadge>
                </Row>
              ))}
            </Rows>
          )}
        </Panel>
      </div>
    </>
  );
}
