import { redirect } from "next/navigation";
import { DownloadSimpleIcon, ListBulletsIcon } from "@phosphor-icons/react/dist/ssr";
import {
  Alert,
  Avatar,
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
  Meter,
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
  initialsOf,
} from "@zerocorp/ui";
import { getBlocksRepository, getUnitOfWork } from "../../../server/container";
import { getViewer } from "../../../server/session";
import { BuildButton } from "../BuildButton";
import { defineTarget } from "../build-actions";

export const metadata = { title: "Customers · ZeroCorp" };

/**
 * Get Customers, Lite — PRODUCT_SPEC.md §29.3 block 9.
 *
 * V1 FINDS. It does not contact. No campaigns, no sequences, no automated follow-up:
 * those are V2, and shipping them early is how a prospecting tool becomes a spam tool.
 *
 * ---------------------------------------------------------------------------
 * 2026-09-04 — the screen a table screen should be.
 *
 * `full` width, not the 1280px column every screen shared. A prospect list is SCANNED,
 * not read, and every pixel of width is another column that fits.
 *
 * The rows were six raw spans with hard-coded widths — w-52, w-44, w-12 — written inline
 * in this file. They are typed cells now, so the widths are declared once in the design
 * system and this screen cannot invent a seventh one.
 * ---------------------------------------------------------------------------
 */
const LEAD_TONE: Record<string, "success" | "info" | "processing" | "neutral"> = {
  replied: "success",
  qualified: "info",
  contacted: "processing",
  enriched: "processing",
  discovered: "neutral",
};

/** How far through the funnel a stage is. Drives the inline meter on each row. */
const STAGE_PROGRESS: Record<string, number> = {
  discovered: 0.2,
  enriched: 0.4,
  qualified: 0.6,
  contacted: 0.8,
  replied: 1,
};

export default async function Page_() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const view = await getUnitOfWork().withTenant(viewer.ctx, (tx) =>
    getBlocksRepository().customers(tx, viewer.ctx),
  );

  const withoutBasis = view.recent.filter((l) => l.consentBasis === null).length;
  const contactable = view.recent.filter((l) => l.consentBasis !== null).length;
  const replied = view.recent.filter((l) => l.status === "replied").length;
  const maxCount = Math.max(1, ...view.lists.map((l) => l.leadCount));

  /*
    The funnel, computed from the rows already fetched. No second query: the Overview tab
    was four cards and 650px of nothing, which is the flattest a screen can be, and the
    data to fill it was already in memory.

    Ordered by the stage sequence rather than by count, because a funnel read out of
    order is not a funnel.
  */
  const STAGE_ORDER = ["discovered", "enriched", "qualified", "contacted", "replied"] as const;
  const funnel = STAGE_ORDER.map((stage) => ({
    stage,
    count: view.recent.filter((l) => l.status === stage).length,
  }));
  const funnelMax = Math.max(1, ...funnel.map((f) => f.count));

  return (
    <Tabs
      banner={
        withoutBasis > 0 ? (
          <Page width="full" className="!py-4">
            <Alert tone="warning" title="Some records have no lawful basis recorded">
              {withoutBasis} of these were stored without a reason we may hold them. A prospect row
              without one is a liability rather than a lead, and it is left out of the export.
            </Alert>
          </Page>
        ) : null
      }
      action={
        <div className="flex items-center gap-2">
          <BuildButton action={defineTarget} label="Define my target" busyLabel="Defining" />
          {view.recent.length > 0 ? (
            /* A real link, not a script-driven save: the browser performs the GET itself,
               which also means it works from a bookmark. */
            <ButtonLink href="/api/leads/export" icon={DownloadSimpleIcon}>
              Export CSV
            </ButtonLink>
          ) : null}
        </div>
      }
      tabs={[
        {
          id: "overview",
          label: "Overview",
          icon: <Icon icon={ICONS.leads.icon} size={16} />,
          content: (
            <Page width="work">
              <StatGrid>
                <StatCard
                  label="Prospects"
                  value={view.total}
                  detail="found so far"
                  href="/leads#leads"
                />
                <StatCard
                  label="Lists"
                  value={view.lists.length}
                  detail={view.lists.length === 1 ? "target defined" : "targets defined"}
                  href="/leads#lists"
                />
                <StatCard
                  label="Contactable"
                  value={contactable}
                  detail={withoutBasis > 0 ? `${withoutBasis} without basis` : "all cleared"}
                  attention={withoutBasis > 0}
                />
                <StatCard
                  label="Replied"
                  value={replied}
                  detail={replied > 0 ? "needs a person" : "none yet"}
                  attention={replied > 0}
                />
              </StatGrid>

              <div className="grid grid-cols-1 gap-(--gap-block) lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <Section title="Pipeline" count={`${view.recent.length} tracked`}>
                  <Panel>
                    <Panel.Header title="Where every prospect stands" />
                    <Panel.Body padded={false}>
                      <Rows>
                        {funnel.map((f) => (
                          /* The same bar device as Keywords, which is the one thing on
                             this product that already reads as populated. */
                          <Row key={f.stage} density="compact" proportion={f.count / funnelMax}>
                            <CellIdentity width="content">
                              {f.stage.charAt(0).toUpperCase() + f.stage.slice(1)}
                            </CellIdentity>
                            <CellStatus width="marker">
                              <Meter value={f.count / funnelMax} size={12} />
                            </CellStatus>
                            <span className="text-body-sm w-12 shrink-0 text-right font-mono tabular-nums">
                              {f.count}
                            </span>
                          </Row>
                        ))}
                      </Rows>
                    </Panel.Body>
                    <Panel.Footer>
                      {replied} of {view.recent.length} have replied
                    </Panel.Footer>
                  </Panel>
                </Section>

                <Section title="Recently found" count={Math.min(6, view.recent.length)}>
                  <Panel>
                    <Panel.Header title="Newest prospects">
                      <ButtonLink href="/leads#leads">See all</ButtonLink>
                    </Panel.Header>
                    <Panel.Body padded={false}>
                      <Rows>
                        {view.recent.slice(0, 6).map((lead) => (
                          <Row key={lead.id} density="compact" waiting={lead.status === "replied"}>
                            <Avatar
                              initials={initialsOf(lead.companyName)}
                              name={lead.companyName}
                              size="sm"
                            />
                            <CellIdentity width="content">{lead.companyName}</CellIdentity>
                            <CellStatus>
                              <StatusDot tone={LEAD_TONE[lead.status] ?? "neutral"}>
                                {lead.status}
                              </StatusDot>
                            </CellStatus>
                          </Row>
                        ))}
                      </Rows>
                    </Panel.Body>
                  </Panel>
                </Section>
              </div>
            </Page>
          ),
        },
        {
          id: "lists",
          label: "Lists",
          icon: <Icon icon={ListBulletsIcon} size={16} />,
          count: view.lists.length,
          content: (
            <Page width="work">
              <Section title="Lists" count={view.lists.length}>
                {view.lists.length === 0 ? (
                  <EmptyState
                    cause="first-run"
                    icon={ListBulletsIcon}
                    title="No lists yet"
                    body="Define who you sell to and ZeroCorp finds matching companies continuously."
                    action={
                      <BuildButton action={defineTarget} label="Define my target" busyLabel="Defining" />
                    }
                    ghost={<GhostRows rows={5} columns={[220, 120]} />}
                  />
                ) : (
                  <Panel>
                    <Panel.Header title="Lists" count={view.lists.length} />
                    <Panel.Body padded={false}>
                      <Rows>
                        {view.lists.map((list) => (
                          /* The bar behind the row is the list's share of the largest
                             list. Ten rows with it read as populated; the same ten
                             without it read as empty. */
                          <Row key={list.id} proportion={list.leadCount / maxCount}>
                            <Icon icon={ListBulletsIcon} size={16} className="text-muted-foreground" />
                            <CellIdentity width="identityWide">{list.name}</CellIdentity>
                            <CellText>{list.source ?? "Not set"}</CellText>
                            <CellStatus width="marker">
                              <Meter value={list.leadCount / maxCount} size={12} />
                            </CellStatus>
                            <span className="text-body-sm w-16 shrink-0 text-right font-mono tabular-nums">
                              {list.leadCount}
                            </span>
                            <CellAction>
                              <ButtonLink href="/leads#leads">Open</ButtonLink>
                            </CellAction>
                          </Row>
                        ))}
                      </Rows>
                    </Panel.Body>
                    <Panel.Footer>
                      {view.lists.length} lists · {view.total} prospects
                    </Panel.Footer>
                  </Panel>
                )}
              </Section>
            </Page>
          ),
        },
        {
          id: "leads",
          label: "Prospects",
          count: view.total,
          content: (
            /* FULL BLEED. This is the screen the width was bought for. */
            <Page width="full">
              {view.recent.length === 0 ? (
                <EmptyState
                  cause="first-run"
                  icon={ICONS.leads.icon}
                  title="Nothing found yet"
                  body="Discovery starts once your target is defined. Every record carries why we may hold it, because a prospect stored without a lawful basis is a problem rather than an asset."
                  action={
                    <BuildButton action={defineTarget} label="Define my target" busyLabel="Defining" />
                  }
                  ghost={<GhostRows rows={9} columns={[180, 150, 60, 200]} />}
                />
              ) : (
                <Panel>
                  <Panel.Header title="Recently found" count={view.recent.length}>
                    <span className="text-caption text-muted-foreground">
                      {contactable} contactable
                    </span>
                  </Panel.Header>
                  <Panel.Body padded={false} scroll>
                    <Rows>
                      {view.recent.map((lead) => {
                        const tone = LEAD_TONE[lead.status] ?? "neutral";
                        const answered = lead.status === "replied";
                        return (
                          <Row
                            key={lead.id}
                            muted={lead.consentBasis === null}
                            waiting={answered}
                            density="comfortable"
                          >
                            <Avatar
                              initials={initialsOf(lead.companyName)}
                              name={lead.companyName}
                              size="sm"
                            />
                            <CellIdentity sub={lead.domain ?? undefined}>
                              {lead.companyName}
                            </CellIdentity>
                            <CellStamp width="marker">{lead.country ?? "Not set"}</CellStamp>
                            <CellText>{lead.industry ?? "Not set"}</CellText>
                            <CellStatus width="marker">
                              <Meter
                                value={STAGE_PROGRESS[lead.status] ?? 0}
                                size={12}
                                label={`${lead.status} stage`}
                              />
                            </CellStatus>
                            <CellStatus>
                              {lead.consentBasis === null ? (
                                <StatusBadge tone="warning">No basis</StatusBadge>
                              ) : (
                                <StatusDot tone={tone}>{lead.status}</StatusDot>
                              )}
                            </CellStatus>
                            <CellAction>
                              <ButtonLink href="/leads">{answered ? "Reply" : "Open"}</ButtonLink>
                            </CellAction>
                          </Row>
                        );
                      })}
                    </Rows>
                  </Panel.Body>
                  <Panel.Footer>
                    Showing {view.recent.length} of {view.total} · {replied} replied
                  </Panel.Footer>
                </Panel>
              )}
            </Page>
          ),
        },
      ]}
    />
  );
}
