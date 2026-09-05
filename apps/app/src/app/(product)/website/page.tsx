import { redirect } from "next/navigation";
import {
  ButtonLink,
  CellAction,
  CellIdentity,
  CellStamp,
  CellStatus,
  CellText,
  EmptyState,
  GhostRows,
  ICONS,
  Icon,
  Page,
  Panel,
  Row,
  Rows,
  Section,
  StatCard,
  StatGrid,
  StatusBadge,
  StatusDot,
  Tabs,
} from "@zerocorp/ui";
import { getBlocksRepository, getUnitOfWork } from "../../../server/container";
import { getViewer } from "../../../server/session";
import { BuildButton } from "../BuildButton";
import { buildWebsite } from "../build-actions";

export const metadata = { title: "Website · ZeroCorp" };

/**
 * The website block.
 *
 * 2026-09-04: `work` width, because this screen is a short list plus a status panel and
 * a full-bleed table would leave two thirds of the row empty. Leads is `full`; this is
 * not. That difference IS the point of having three widths.
 */

const DNS_TONE = { verified: "success", pending: "processing", failed: "danger" } as const;

function dnsTone(status: string) {
  return DNS_TONE[status as keyof typeof DNS_TONE] ?? "neutral";
}

export default async function WebsitePage() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const view = await getUnitOfWork().withTenant(viewer.ctx, (tx) =>
    getBlocksRepository().website(tx, viewer.ctx),
  );

  const published = view.pages.filter((p) => p.status === "published").length;

  return (
    <Tabs
      defaultTab={view.pages.length > 0 ? "pages" : "domain"}
      tabs={[
        {
          id: "pages",
          label: "Pages",
          icon: <Icon icon={ICONS.website.icon} size={16} />,
          count: view.pages.length,
          content: (
            <Page width="work">
              <StatGrid>
                <StatCard label="Pages" value={view.pages.length} detail="built from blocks" />
                <StatCard
                  label="Published"
                  value={published}
                  detail={`${view.pages.length - published} in draft`}
                />
                <StatCard
                  label="Domain"
                  value={view.domain ? "Connected" : "None"}
                  detail={view.domain?.hostname ?? "not yet at your own address"}
                  href="/website#domain"
                  attention={!view.domain}
                />
                <StatCard
                  label="SSL"
                  value={view.domain?.sslStatus ?? "Pending"}
                  detail={view.domain ? "certificate" : "waiting on a domain"}
                />
              </StatGrid>

              <Section title="Pages" count={view.pages.length}>
                {view.pages.length === 0 ? (
                  <EmptyState
                    cause="first-run"
                    icon={ICONS.website.icon}
                    title="No pages yet"
                    body="Pages are built from validated blocks and stored as data, never as generated code."
                    action={
                      <BuildButton action={buildWebsite} label="Build my site" busyLabel="Building" />
                    }
                    ghost={<GhostRows rows={5} columns={[190, 140, 110]} />}
                  />
                ) : (
                  <Panel>
                    <Panel.Header title="Pages" count={view.pages.length}>
                      <span className="text-caption text-muted-foreground">{published} live</span>
                    </Panel.Header>
                    <Panel.Body padded={false}>
                      <Rows>
                        {view.pages.map((page) => {
                          const live = page.status === "published";
                          return (
                            <Row key={page.id}>
                              <Icon
                                icon={ICONS.website.icon}
                                size={16}
                                className={live ? "text-muted-foreground" : "text-chart-1"}
                              />
                              <CellIdentity>{page.title}</CellIdentity>
                              <CellStamp width="identity">/{page.slug}</CellStamp>
                              <CellText>{page.type}</CellText>
                              <CellStatus>
                                <StatusDot tone={live ? "success" : "processing"}>
                                  {page.status}
                                </StatusDot>
                              </CellStatus>
                              <CellAction>
                                <ButtonLink href="/website">{live ? "View" : "Review"}</ButtonLink>
                              </CellAction>
                            </Row>
                          );
                        })}
                      </Rows>
                    </Panel.Body>
                    <Panel.Footer>
                      {published} of {view.pages.length} published
                    </Panel.Footer>
                  </Panel>
                )}
              </Section>
            </Page>
          ),
        },
        {
          id: "domain",
          label: "Domain",
          icon: <Icon icon={ICONS.domain.icon} size={16} />,
          attention: !view.domain,
          content: (
            /* `reading` width. One subject, four facts, one decision. A 1280px column
               for four status chips is what made this screen look empty. */
            <Page width="reading">
              <Section title="Domain">
                {view.domain ? (
                  <Panel>
                    <Panel.Header title={view.domain.hostname} />
                    <Panel.Body className="flex flex-col gap-(--gap-row)">
                      <Rows>
                        <Row density="compact">
                          <CellText width="identity">Domain</CellText>
                          <CellStatus>
                            <StatusBadge tone={dnsTone(view.domain.status)}>
                              {view.domain.status}
                            </StatusBadge>
                          </CellStatus>
                        </Row>
                        <Row density="compact">
                          <CellText width="identity">DNS</CellText>
                          <CellStatus>
                            <StatusBadge tone={dnsTone(view.domain.dnsStatus)}>
                              {view.domain.dnsStatus}
                            </StatusBadge>
                          </CellStatus>
                        </Row>
                        <Row density="compact">
                          <CellText width="identity">SSL</CellText>
                          <CellStatus>
                            <StatusBadge tone={dnsTone(view.domain.sslStatus)}>
                              {view.domain.sslStatus}
                            </StatusBadge>
                          </CellStatus>
                        </Row>
                      </Rows>
                    </Panel.Body>
                  </Panel>
                ) : (
                  <EmptyState
                    cause="first-run"
                    icon={ICONS.domain.icon}
                    title="No domain connected"
                    body="Your pages exist and can be edited now. A domain is what puts them at your own address, and it is also what email warm-up needs before it can start."
                    action={
                      <BuildButton
                        action={buildWebsite}
                        label="Connect a domain"
                        busyLabel="Connecting"
                      />
                    }
                    ghost={<GhostRows rows={3} columns={[140, 100]} />}
                  />
                )}
              </Section>
            </Page>
          ),
        },
      ]}
    />
  );
}
