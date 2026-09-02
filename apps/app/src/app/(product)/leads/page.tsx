import { redirect } from "next/navigation";
import { ListBulletsIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { Alert, PageHeader, StatusBadge } from "@zerocorp/ui";
import { getBlocksRepository, getUnitOfWork } from "../../../server/container";
import { getViewer } from "../../../server/session";
import { BuildButton } from "../BuildButton";
import { defineTarget } from "../build-actions";
import { Empty, Fact, FactCell, FactGrid, Panel, Row, Rows } from "../ui";

export const metadata = { title: "Customers — ZeroCorp" };

/**
 * Get Customers, Lite — PRODUCT_SPEC.md §29.3 block 9.
 *
 * V1 FINDS. It does not contact. No campaigns, no sequences, no automated follow-up:
 * those are V2, and shipping them early is how a prospecting tool becomes a spam tool.
 */
export default async function Page() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const view = await getUnitOfWork().withTenant(viewer.ctx, (tx) =>
    getBlocksRepository().customers(tx, viewer.ctx),
  );

  const withoutBasis = view.recent.filter((l) => l.consentBasis === null).length;

  return (
    <>
      <PageHeader
        title="Customers"
        subtitle="Companies that match who you sell to"
        meta={
          <span className="text-body-sm text-muted-foreground font-mono tabular-nums">
            {view.total} found
          </span>
        }
        actions={<BuildButton action={defineTarget} label="Define my target" busyLabel="Defining" />}
      />

      <div className="flex flex-col gap-10 px-5 py-8 sm:px-8">
        {withoutBasis > 0 ? (
          <Alert tone="warning" title="Some records have no lawful basis recorded">
            {withoutBasis} of these were stored without a reason we may hold them. A prospect
            row without one is a liability rather than a lead, and it will not be exported.
          </Alert>
        ) : null}

        <Panel title="Overview">
          <FactGrid>
            <FactCell><Fact label="Prospects" value={`${view.total}`} tone="font-mono tabular-nums text-chart-1" /></FactCell>
            <FactCell><Fact label="Lists" value={`${view.lists.length}`} tone="font-mono tabular-nums text-chart-2" /></FactCell>
            <FactCell><Fact label="Contactable" value={`${view.recent.filter((l) => l.consentBasis !== null).length}`} tone="font-mono tabular-nums text-chart-3" /></FactCell>
            <FactCell><Fact label="Outreach" value="V2" tone="text-muted-foreground" /></FactCell>
          </FactGrid>
        </Panel>

        <Panel title="Lists" count={view.lists.length}>
          {view.lists.length === 0 ? (
            <Empty
              title="No lists yet"
              body="Define who you sell to and ZeroCorp finds matching companies continuously. V1 finds them and lets you export; contacting them arrives with the campaign tools, deliberately later."
            />
          ) : (
            <Rows>
              {view.lists.map((list) => (
                <Row key={list.id}>
                  <ListBulletsIcon size={18} className="text-muted-foreground shrink-0" aria-hidden="true" />
                  <span className="text-body-sm min-w-0 flex-1 font-medium">{list.name}</span>
                  <span className="text-caption text-muted-foreground">{list.source ?? "—"}</span>
                  <span className="text-body-sm text-chart-1 font-mono tabular-nums">{list.leadCount}</span>
                </Row>
              ))}
            </Rows>
          )}
        </Panel>

        <Panel title="Recently found" count={view.recent.length}>
          {view.recent.length === 0 ? (
            <Empty
              title="Nothing found yet"
              body="Discovery starts once your target is defined. Every record carries why we may hold it, because a prospect stored without a lawful basis is a problem rather than an asset."
            />
          ) : (
            <Rows>
              {view.recent.map((lead) => (
                <Row key={lead.id} muted={lead.consentBasis === null}>
                  <span className="text-body-sm w-56 shrink-0 font-medium">{lead.companyName}</span>
                  <span className="text-body-sm text-muted-foreground w-48 shrink-0 truncate font-mono">
                    {lead.domain ?? "—"}
                  </span>
                  <span className="text-caption text-muted-foreground w-12 shrink-0 font-mono">
                    {lead.country ?? "—"}
                  </span>
                  <span className="text-caption text-muted-foreground min-w-0 flex-1 truncate">
                    {lead.industry ?? "—"}
                  </span>
                  {lead.consentBasis === null ? (
                    <StatusBadge tone="warning">
                      <WarningIcon size={12} weight="fill" aria-hidden="true" /> No basis
                    </StatusBadge>
                  ) : (
                    <StatusBadge tone="neutral">{lead.status}</StatusBadge>
                  )}
                </Row>
              ))}
            </Rows>
          )}
        </Panel>
      </div>
    </>
  );
}
