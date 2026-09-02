import { redirect } from "next/navigation";
import { BrowserIcon } from "@phosphor-icons/react/dist/ssr";
import { PageHeader, StatusBadge } from "@zerocorp/ui";
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
        <Panel title="Domain">
          {view.domain ? (
            <FactGrid>
              <FactCell><Fact label="Hostname" value={view.domain.hostname} tone="font-mono text-chart-1" /></FactCell>
              <FactCell><Fact label="Domain" value={<StatusBadge tone={dnsTone(view.domain.status)}>{view.domain.status}</StatusBadge>} /></FactCell>
              <FactCell><Fact label="DNS" value={<StatusBadge tone={dnsTone(view.domain.dnsStatus)}>{view.domain.dnsStatus}</StatusBadge>} /></FactCell>
              <FactCell><Fact label="SSL" value={<StatusBadge tone={dnsTone(view.domain.sslStatus)}>{view.domain.sslStatus}</StatusBadge>} /></FactCell>
            </FactGrid>
          ) : (
            <Empty
              title="No domain connected"
              body="The domain comes before the site and before the email, because email warm-up takes two to three weeks of calendar time and it cannot start without one."
            />
          )}
        </Panel>

        <Panel title="Pages" count={view.pages.length}>
          {view.pages.length === 0 ? (
            <Empty
              title="No pages yet"
              body="Pages are built from validated blocks and stored as data, never as generated code. One renderer, one block registry, and a published version that never changes under its own URL."
            />
          ) : (
            <Rows>
              {view.pages.map((page) => (
                <Row key={page.id}>
                  <BrowserIcon size={18} className="text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="text-body-sm w-48 shrink-0 font-medium">{page.title}</span>
                  <span className="text-body-sm text-muted-foreground min-w-0 flex-1 font-mono">/{page.slug}</span>
                  <StatusBadge tone={page.status === "published" ? "success" : "neutral"}>{page.status}</StatusBadge>
                </Row>
              ))}
            </Rows>
          )}
        </Panel>
      </div>
    </>
  );
}
