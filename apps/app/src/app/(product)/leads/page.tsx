import { redirect } from "next/navigation";
import { ListBulletsIcon, WarningIcon } from "@phosphor-icons/react/dist/ssr";
import { Alert, Avatar, ButtonLink, StatusBadge, StatusDot, initialsOf , Tabs } from "@zerocorp/ui";
import { DownloadSimpleIcon, ListBulletsIcon as ListsIcon, UsersThreeIcon as PeopleIcon } from "@phosphor-icons/react/dist/ssr";
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
/**
 * A lead's stage, in the one status vocabulary (§17).
 *
 * `replied` is success because it is the outcome the whole block exists to produce;
 * `qualified` is info because it is a fact about the record rather than a step forward;
 * discovery and enrichment are the machine working, which is `processing`.
 */
const LEAD_TONE: Record<string, "success" | "info" | "processing" | "neutral"> = {
  replied: "success",
  qualified: "info",
  contacted: "processing",
  enriched: "processing",
  discovered: "neutral",
};

export default async function Page() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const view = await getUnitOfWork().withTenant(viewer.ctx, (tx) =>
    getBlocksRepository().customers(tx, viewer.ctx),
  );

  const withoutBasis = view.recent.filter((l) => l.consentBasis === null).length;
  const replied = view.recent.filter((l) => l.status === "replied").length;

  return (
    <>


      <Tabs
        banner={
          withoutBasis > 0 ? (
            <div className="mx-auto w-full max-w-(--container-content) px-5 py-4 sm:px-8">
              <Alert tone="warning" title="Some records have no lawful basis recorded">
              {withoutBasis} of these were stored without a reason we may hold them. A prospect row
              without one is a liability rather than a lead, and it is left out of the export.
              </Alert>
            </div>
          ) : null
        }
        action={
          <div className="flex items-center gap-2">
            <BuildButton action={defineTarget} label="Define my target" busyLabel="Defining" />
            {view.recent.length > 0 ? (
            /* A real link, not a script-driven save: the browser performs the GET itself,
               which also means it works from a bookmark. */
            <a
              href="/api/leads/export"
              className="text-body-sm text-foreground border-input hover:bg-accent focus-visible:outline-ring inline-flex items-center gap-2 border px-3 py-2 transition-[color,background-color,transform] duration-glide ease-glide focus-visible:outline-2 focus-visible:outline-offset-2 motion-safe:hover:-translate-y-px"
            >
              <DownloadSimpleIcon size={16} aria-hidden="true" /> Export CSV
            </a>
            ) : null}
          </div>
        }
        tabs={[
          {
            id: "overview",
            label: "Overview",
            icon: <PeopleIcon size={17} aria-hidden="true" />,
            content: (
              <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
                <Panel title="Overview">
                <FactGrid>
                <FactCell><Fact label="Prospects" value={`${view.total}`} tone="font-mono tabular-nums text-chart-1" /></FactCell>
                <FactCell><Fact label="Lists" value={`${view.lists.length}`} tone="font-mono tabular-nums text-chart-2" /></FactCell>
                <FactCell><Fact label="Contactable" value={`${view.recent.filter((l) => l.consentBasis !== null).length}`} tone="font-mono tabular-nums text-chart-3" /></FactCell>
                <FactCell>
                <Fact
                label="Replied"
                value={`${replied}`}
                tone={replied > 0 ? "font-mono tabular-nums text-success-ink" : "font-mono tabular-nums text-muted-foreground"}
                />
                </FactCell>
                </FactGrid>
                </Panel>
              </div>
            ),
          },
          {
            id: "lists",
            label: "Lists",
            icon: <ListsIcon size={17} aria-hidden="true" />,
            count: view.lists.length,
            content: (
              <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
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
              </div>
            ),
          },
          {
            id: "leads",
            label: "Prospects",
            count: view.total,
            content: (
              <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
                <Panel title="Recently found" count={view.recent.length}>
                {view.recent.length === 0 ? (
                <Empty
                title="Nothing found yet"
                body="Discovery starts once your target is defined. Every record carries why we may hold it, because a prospect stored without a lawful basis is a problem rather than an asset."
                />
                ) : (
                <Rows>
                {view.recent.map((lead) => {
                const tone = LEAD_TONE[lead.status] ?? "neutral";
                // A reply is the only row on this screen that needs a person today.
                const answered = lead.status === "replied";
                return (
                <Row key={lead.id} muted={lead.consentBasis === null}>
                {/* Faces, or the nearest thing a company has to one. §4.5: a product
                with no faces reads flat regardless of the palette. */}
                <Avatar initials={initialsOf(lead.companyName)} name={lead.companyName} size="sm" tone={tone} />
                <span className="text-body-sm w-52 shrink-0 truncate font-medium">{lead.companyName}</span>
                <span className="text-body-sm text-muted-foreground w-44 shrink-0 truncate font-mono">
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
                /* The status was `neutral` on every row, so fifteen leads at five
                different stages arrived looking identical. The stage IS the
                information on this screen. */
                <StatusDot tone={tone}>{lead.status}</StatusDot>
                )}
                {answered ? <ButtonLink href="/leads">Open</ButtonLink> : null}
                </Row>
                );
                })}
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
