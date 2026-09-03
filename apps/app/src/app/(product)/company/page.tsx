import { redirect } from "next/navigation";
import { BuildingsIcon, FileTextIcon, QuestionIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink, PageHeader, StatusBadge, StatusStamp, SubNav } from "@zerocorp/ui";
import { Intake } from "./Intake";
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

      <SubNav
        items={[
          { id: "entity", label: "Entity", icon: BuildingsIcon },
          { id: "filing", label: "Filing", count: view.openRfis.length, attention: view.openRfis.length > 0, icon: QuestionIcon },
          { id: "registrations", label: "Registrations", count: view.registrations.length },
          { id: "documents", label: "Documents", count: view.documents.length, icon: FileTextIcon },
        ]}
      />

      <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
        {/*
          The RFI comes FIRST and is gated on nothing.

          It used to sit behind a test on `companies` being non-empty. During formation
          `companies` is empty BY DEFINITION — the company does not exist yet, that is
          the whole point of the order — so the one thing actually blocking the customer
          was the one thing the screen could never show. Same defect as Website, with a
          worse consequence.
        */}
        {view.openRfis.length > 0 ? (
          <section className="border-warning bg-warning-subtle flex flex-col gap-4 border p-5">
            <div className="flex items-center gap-3">
              <QuestionIcon size={20} weight="fill" className="text-warning-ink shrink-0" aria-hidden="true" />
              <h2 className="text-h4 text-warning-ink">
                {view.openRfis.length === 1 ? "One thing is needed before we can file" : `${view.openRfis.length} things are needed before we can file`}
              </h2>
            </div>
            <ul className="flex flex-col gap-3">
              {view.openRfis.map((rfi) => (
                <li key={rfi.id} className="border-warning/40 bg-surface flex flex-wrap items-center gap-4 border p-4">
                  <span className="text-body-sm min-w-0 flex-1">{rfi.question}</span>
                  <ButtonLink href="/help" variant="primary">Send it</ButtonLink>
                </li>
              ))}
            </ul>
            <p className="text-caption text-warning-ink">
              Your filing is paused until this arrives. Nothing else is blocked.
            </p>
          </section>
        ) : null}

        {/* The order, whether or not a company exists yet. This IS the company page while
            a formation is in flight, and hiding it until the entity exists meant showing
            nothing during the only period where the customer is anxious about it. */}
        <div id="filing" className="scroll-mt-16" />
        {order && status ? (
          <Panel title="Your formation">
            <div className="flex flex-col gap-5 p-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                  <span className="text-overline text-muted-foreground">Filing</span>
                  <span className="text-h4">{view.request?.proposedNames?.[0] ?? view.company?.legalName ?? "Your company"}</span>
                </div>
                <StatusBadge tone={status.tone}>{status.label}</StatusBadge>
              </div>
              <FactGrid>
                <FactCell><Fact label="Jurisdiction" value={(view.request?.jurisdictionCode ?? "—").toUpperCase()} tone="font-mono text-chart-1" /></FactCell>
                <FactCell><Fact label="Structure" value={view.request?.entityTypeCode ?? "—"} /></FactCell>
                <FactCell><Fact label="Filed by" value="A ZeroCorp operator" /></FactCell>
                <FactCell>
                  <Fact
                    label="Open questions"
                    value={`${view.openRfis.length}`}
                    tone={view.openRfis.length > 0 ? "font-mono tabular-nums text-warning-ink" : "font-mono tabular-nums text-muted-foreground"}
                  />
                </FactCell>
              </FactGrid>
            </div>
          </Panel>
        ) : null}

        {view.company ? (
          <>
            <div id="entity" className="scroll-mt-16" />
            <Panel title="Your entity">
              {view.company.status === "active" ? (
                <div className="flex justify-end px-5 pt-5">
                  <StatusStamp
                    milestone="formed"
                    {...(view.company.formationDate ? { date: String(view.company.formationDate) } : {})}
                  />
                </div>
              ) : null}
              <FactGrid>
                <FactCell><Fact label="Legal name" value={view.company.legalName} /></FactCell>
                <FactCell><Fact label="Jurisdiction" value={view.company.jurisdictionCode.toUpperCase()} tone="text-chart-1" /></FactCell>
                <FactCell><Fact label="Status" value={view.company.status} /></FactCell>
                <FactCell><Fact label="Origin" value={view.company.origin === "imported" ? "Imported" : "Formed by ZeroCorp"} /></FactCell>
              </FactGrid>
            </Panel>

            <div id="registrations" className="scroll-mt-16" />
            <Panel title="Registrations" count={view.registrations.length}>
              {view.registrations.length === 0 ? (
                <Empty title="Nothing requested yet" body="A tax ID follows the entity rather than arriving with it: separate filing, separate authority, separate clock." />
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
          </>
        ) : order ? null : (
          <Panel title="Form your company">
            <div className="p-5">
              <Intake entities={[...entities]} targetMarkets={[]} />
            </div>
          </Panel>
        )}

        <div id="documents" className="scroll-mt-16" />
        <Panel title="Documents" count={view.documents.length}>
          {view.documents.length === 0 ? (
            <Empty title="No documents yet" body="Certificates land here as the filing progresses. Anything you upload goes to private storage with short-lived links." />
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

        {/* Reference material, not content. It was a full panel of four rows competing
            with the customer's own filing; it is now a disclosure at the bottom. */}
        <details className="border-border border">
          <summary className="text-body-sm hover:bg-accent cursor-pointer px-5 py-3 font-medium">
            What ZeroCorp can form <span className="text-muted-foreground font-mono">{entities.length}</span>
          </summary>
          <div className="border-border border-t">
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
          </div>
        </details>
      </div>
    </>
  );
}
