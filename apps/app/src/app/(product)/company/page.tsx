import { redirect } from "next/navigation";
import { BuildingsIcon, FileTextIcon, QuestionIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink, EmptyState, PageHeader, StatusBadge } from "@zerocorp/ui";
import { getBlocksRepository, getFormationCatalog, getUnitOfWork } from "../../../server/container";
import { getViewer } from "../../../server/session";
import { Empty, Fact, FactCell, FactGrid, Panel, Row, Rows } from "../ui";

export const metadata = { title: "Company — ZeroCorp" };

/**
 * The legal entity — PRODUCT_SPEC.md §29.3 block 4.
 *
 * Customer-facing statuses only. A provider's own vocabulary never reaches this page:
 * `translateStatus` on the adapter is the one place it is allowed, and D14 keeps it
 * there. A founder is told "Submitted", not which partner is holding the filing.
 */

const ORDER_STATUS: Record<string, { label: string; tone: "success" | "processing" | "info" | "warning" | "danger" | "neutral" }> = {
  draft: { label: "Draft", tone: "neutral" },
  collecting_documents: { label: "Collecting documents", tone: "processing" },
  verifying_identity: { label: "Verifying identity", tone: "processing" },
  operator_review: { label: "In review", tone: "warning" },
  ready_to_file: { label: "Ready to file", tone: "processing" },
  awaiting_provider: { label: "Submitted", tone: "info" },
  information_requested: { label: "Information needed", tone: "warning" },
  filed: { label: "Filed", tone: "info" },
  formed: { label: "Formed", tone: "success" },
  rejected: { label: "Came back", tone: "danger" },
  cancelled: { label: "Cancelled", tone: "neutral" },
};

const REGISTRATION_LABEL: Record<string, string> = {
  tax_id: "Tax ID",
  vat: "VAT",
  payroll: "Payroll",
  state_registration: "State registration",
};

export default async function Page() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const view = await getUnitOfWork().withTenant(viewer.ctx, (tx) =>
    getBlocksRepository().company(tx, viewer.ctx),
  );
  const entities = await getFormationCatalog().listEntityTypes();

  const order = view.orders[0];
  const status = order ? (ORDER_STATUS[order.status] ?? ORDER_STATUS.draft!) : null;

  return (
    <>
      <PageHeader
        title="Company"
        subtitle={view.company?.legalName ?? "No company yet"}
        meta={
          view.company ? (
            <StatusBadge tone={view.company.status === "active" ? "success" : "processing"}>
              {view.company.status === "active" ? "Active" : "Being formed"}
            </StatusBadge>
          ) : status ? (
            <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
          ) : (
            <StatusBadge tone="neutral">Not started</StatusBadge>
          )
        }
      />

      <div className="flex flex-col gap-10 px-5 py-8 sm:px-8">
        {view.openRfis.length > 0 ? (
          <Panel title="We need something from you" count={view.openRfis.length}>
            <Rows>
              {view.openRfis.map((rfi) => (
                <Row key={rfi.id}>
                  <QuestionIcon size={18} className="text-warning-ink shrink-0" aria-hidden="true" />
                  <span className="text-body-sm min-w-0 flex-1">{rfi.question}</span>
                  <StatusBadge tone="warning">Open</StatusBadge>
                </Row>
              ))}
            </Rows>
          </Panel>
        ) : null}

        {view.company ? (
          <>
            <Panel title="Your entity">
              <FactGrid>
                <FactCell><Fact label="Legal name" value={view.company.legalName} /></FactCell>
                <FactCell><Fact label="Jurisdiction" value={view.company.jurisdictionCode.toUpperCase()} tone="text-chart-1" /></FactCell>
                <FactCell><Fact label="Status" value={view.company.status} /></FactCell>
                <FactCell>
                  <Fact
                    label="Origin"
                    value={view.company.origin === "imported" ? "Imported" : "Formed by ZeroCorp"}
                  />
                </FactCell>
              </FactGrid>
            </Panel>

            {/* Registrations and documents exist only once an entity does. Rendering them
                as two more empty panels before that was three empty states stacked, which
                reads as a broken product rather than an early one. */}
            <Panel title="Registrations" count={view.registrations.length}>
              {view.registrations.length === 0 ? (
                <Empty
                  title="Nothing requested yet"
                  body="A tax ID follows the entity rather than arriving with it: separate filing, separate authority, separate clock."
                />
              ) : (
                <Rows>
                  {view.registrations.map((r) => (
                    <Row key={`${r.kind}-${r.authority}`}>
                      <span className="text-body-sm w-32 shrink-0">{REGISTRATION_LABEL[r.kind] ?? r.kind}</span>
                      <span className="text-body-sm text-muted-foreground w-32 shrink-0">{r.authority}</span>
                      <span className="text-body-sm min-w-0 flex-1 font-mono">{r.identifier ?? "—"}</span>
                      <StatusBadge tone={r.status === "issued" ? "success" : r.status === "rejected" ? "danger" : "processing"}>
                        {r.status.replace(/_/g, " ")}
                      </StatusBadge>
                    </Row>
                  ))}
                </Rows>
              )}
            </Panel>

            <Panel title="Documents" count={view.documents.length}>
              {view.documents.length === 0 ? (
                <Empty
                  title="No documents yet"
                  body="Certificates land here as the filing progresses. Anything you upload goes to private storage with short-lived links."
                />
              ) : (
                <Rows>
                  {view.documents.map((d) => (
                    <Row key={d.id}>
                      <FileTextIcon size={18} className="text-chart-3 shrink-0" aria-hidden="true" />
                      <span className="text-body-sm min-w-0 flex-1">{d.type.replace(/_/g, " ")}</span>
                      <span className="text-caption text-muted-foreground font-mono tabular-nums">
                        {d.issuedAt ? d.issuedAt.toISOString().slice(0, 10) : "—"}
                      </span>
                    </Row>
                  ))}
                </Rows>
              )}
            </Panel>
          </>
        ) : (
          /*
            ONE empty state, not four.
            
            There was no company, so "Your entity", "Registrations" and "Documents" each
            rendered their own empty panel and the catalog sat under them as a fourth
            block. Four empty states stacked is what a broken product looks like; a
            founder cannot tell which one is the thing they are supposed to act on.
            
            Registrations and documents are now hidden entirely until an entity exists,
            because they are not empty — they are not yet possible.
          */
          <EmptyState
            icon={BuildingsIcon}
            title={view.request ? "Your company is being formed" : "You have no company yet"}
            body={
              view.request
                ? "The filing is in progress. Your entity, registrations and documents all appear here the moment the authority registers it."
                : "ZeroCorp forms it for you, or connects one you already have. Nothing is filed until you have chosen a structure and signed."
            }
            action={
              view.request ? (
                <ButtonLink href="/dashboard">See what is in progress</ButtonLink>
              ) : (
                <ButtonLink href="/onboarding" variant="primary">
                  Tell us about your business
                </ButtonLink>
              )
            }
          />
        )}

        <Panel title="What ZeroCorp can form" count={entities.length}>
          <Rows>
            {entities.map((entity) => (
              <Row key={`${entity.jurisdictionCode}-${entity.code}`}>
                <BuildingsIcon size={18} className="text-muted-foreground shrink-0" aria-hidden="true" />
                <span className="text-body-sm w-40 shrink-0 font-medium">{entity.customerLabel}</span>
                <span className="text-body-sm text-muted-foreground w-32 shrink-0">
                  {entity.jurisdictionCode.toUpperCase()}
                </span>
                <span className="text-caption text-muted-foreground min-w-0 flex-1">
                  Typically {entity.typicalDaysMin} to {entity.typicalDaysMax} days
                </span>
                {/*
                  The honesty field, rendered. A founder is never told a filing is
                  automatic when a ZeroCorp operator does it by hand.
                */}
                <StatusBadge tone={entity.automationLevel === "automated" ? "success" : "info"}>
                  {entity.automationLevel === "automated" ? "Automated" : "Filed by an operator"}
                </StatusBadge>
              </Row>
            ))}
          </Rows>
        </Panel>
      </div>
    </>
  );
}
