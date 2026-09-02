import { redirect } from "next/navigation";
import { BrowserIcon, GlobeHemisphereWestIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink, EmptyState, PageHeader, StatusBadge, StatusDot } from "@zerocorp/ui";
import { getBlocksRepository, getUnitOfWork } from "../../../server/container";
import { getViewer } from "../../../server/session";
import { BuildButton } from "../BuildButton";
import { buildWebsite } from "../build-actions";
import { Empty, Fact, FactCell, FactGrid, Panel, Row, Rows } from "../ui";

export const metadata = { title: "Website — ZeroCorp" };

const DNS_TONE = { verified: "success", pending: "processing", failed: "danger" } as const;

function dnsTone(status: string) {
  return DNS_TONE[status as keyof typeof DNS_TONE] ?? "neutral";
}

export default async function Page() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const view = await getUnitOfWork().withTenant(viewer.ctx, (tx) =>
    getBlocksRepository().website(tx, viewer.ctx),
  );

  return (
    <>
      <PageHeader
        title="Website"
        subtitle={view.domain?.hostname ?? "No domain yet"}
        meta={
          <StatusBadge tone={view.site?.status === "published" ? "success" : "neutral"}>
            {view.site?.status === "published" ? "Live" : view.site ? "Draft" : "Not started"}
          </StatusBadge>
        }
        actions={<BuildButton action={buildWebsite} label="Build my website" busyLabel="Building" />}
      />

      <div className="flex flex-col gap-10 px-5 py-8 sm:px-8">
        {/*
          One empty state when nothing exists, not two.

          A domain and pages are sequential, not parallel: pages cannot be built before a
          domain resolves. Rendering both as empty panels invited a founder to act on the
          second when only the first is possible.
        */}
        {!view.domain ? (
          <EmptyState
            icon={GlobeHemisphereWestIcon}
            title="Start with the domain"
            body="It comes before the site and before the email, because warm-up needs two to three weeks of calendar time and cannot begin without one."
            action={<BuildButton action={buildWebsite} label="Build my website" busyLabel="Building" />}
          />
        ) : (
          <>
            <Panel title="Domain">
              <FactGrid>
                <FactCell><Fact label="Hostname" value={view.domain.hostname} tone="font-mono text-chart-1" /></FactCell>
                <FactCell><Fact label="Domain" value={<StatusBadge tone={dnsTone(view.domain.status)}>{view.domain.status}</StatusBadge>} /></FactCell>
                <FactCell><Fact label="DNS" value={<StatusBadge tone={dnsTone(view.domain.dnsStatus)}>{view.domain.dnsStatus}</StatusBadge>} /></FactCell>
                <FactCell><Fact label="SSL" value={<StatusBadge tone={dnsTone(view.domain.sslStatus)}>{view.domain.sslStatus}</StatusBadge>} /></FactCell>
              </FactGrid>
            </Panel>

            <Panel title="Pages" count={view.pages.length}>
              {view.pages.length === 0 ? (
                <Empty
                  title="No pages yet"
                  body="Pages are built from validated blocks and stored as data, never as generated code."
                />
              ) : (
                <Rows>
                  {view.pages.map((page) => {
                    const live = page.status === "published";
                    return (
                      <Row key={page.id} muted={live}>
                        <BrowserIcon
                          size={18}
                          className={live ? "text-muted-foreground shrink-0" : "text-chart-1 shrink-0"}
                          aria-hidden="true"
                        />
                        <span className={live ? "text-body-sm w-48 shrink-0" : "text-body-sm w-48 shrink-0 font-medium"}>
                          {page.title}
                        </span>
                        <span className="text-body-sm text-muted-foreground min-w-0 flex-1 font-mono">/{page.slug}</span>
                        <StatusDot tone={live ? "success" : "processing"}>{page.status}</StatusDot>
                        {!live ? <ButtonLink href="/website">Review</ButtonLink> : null}
                      </Row>
                    );
                  })}
                </Rows>
              )}
            </Panel>
          </>
        )}

      </div>
    </>
  );
}
