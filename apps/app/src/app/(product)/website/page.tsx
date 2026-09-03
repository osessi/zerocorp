import { redirect } from "next/navigation";
import { BrowserIcon, GlobeHemisphereWestIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink, EmptyState, StatusBadge, StatusDot, Tabs } from "@zerocorp/ui";
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

      <Tabs
        defaultTab={view.pages.length > 0 ? "pages" : "domain"}
        tabs={[
          {
            id: "pages",
            label: "Pages",
            icon: <BrowserIcon size={17} aria-hidden="true" />,
            count: view.pages.length,
            content: (
              <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
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
                <span className="text-body-sm text-muted-foreground w-40 shrink-0 font-mono">/{page.slug}</span>
                <span className="text-caption text-muted-foreground min-w-0 flex-1">{page.type}</span>
                <StatusDot tone={live ? "success" : "processing"}>{page.status}</StatusDot>
                {!live ? <ButtonLink href="/website">Review</ButtonLink> : null}
                </Row>
                );
                })}
                </Rows>
                )}
                </Panel>

              </div>
            ),
          },
          {
            id: "domain",
            label: "Domain",
            icon: <GlobeHemisphereWestIcon size={17} aria-hidden="true" />,
            attention: !view.domain,
            content: (
              <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
                <Panel title="Domain">
                {view.domain ? (
                <FactGrid>
                <FactCell><Fact label="Hostname" value={view.domain.hostname} tone="font-mono text-chart-1" /></FactCell>
                <FactCell><Fact label="Domain" value={<StatusBadge tone={dnsTone(view.domain.status)}>{view.domain.status}</StatusBadge>} /></FactCell>
                <FactCell><Fact label="DNS" value={<StatusBadge tone={dnsTone(view.domain.dnsStatus)}>{view.domain.dnsStatus}</StatusBadge>} /></FactCell>
                <FactCell><Fact label="SSL" value={<StatusBadge tone={dnsTone(view.domain.sslStatus)}>{view.domain.sslStatus}</StatusBadge>} /></FactCell>
                </FactGrid>
                ) : (
                <EmptyState
                icon={GlobeHemisphereWestIcon}
                title="No domain connected"
                body="Your pages exist and can be edited now. A domain is what puts them at your own address, and it is also what email warm-up needs before it can start."
                action={<BuildButton action={buildWebsite} label="Connect a domain" busyLabel="Connecting" />}
                />
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
