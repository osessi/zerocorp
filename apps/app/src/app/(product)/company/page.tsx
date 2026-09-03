import { redirect } from "next/navigation";
import { BuildingsIcon, FileTextIcon, QuestionIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink, StatusBadge, StatusStamp, Tabs } from "@zerocorp/ui";
import { Intake } from "./Intake";
import { BigFact, BigFactGrid } from "../ui-facts";

/** The catalog code, in the words a founder used when they chose it. */
const ENTITY_LABEL: Record<string, string> = {
  us_llc: "LLC",
  us_ccorp: "C-Corporation",
  gb_ltd: "Private Limited",
  gb_llp: "LLP",
};
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


      {/*
        REAL tabs, one panel at a time.

        The first version was anchors down one long page, so a "tab" scrolled you rather
        than changing what you were looking at. Entity now shows the entity and nothing
        else, which is the whole point of a second level.
      */}
      <Tabs
        banner={
          view.openRfis.length > 0 ? (
            <div className="mx-auto w-full max-w-(--container-content) px-5 py-4 sm:px-8">
              <section className="border-warning bg-warning-subtle flex flex-col gap-4 border p-5">
              <div className="flex items-center gap-3">
              <QuestionIcon size={20} weight="fill" className="text-warning-ink shrink-0" aria-hidden="true" />
              <h2 className="text-h4 text-warning-ink">
              {view.openRfis.length === 1
              ? "One thing is needed before we can file"
              : `${view.openRfis.length} things are needed before we can file`}
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
            </div>
          ) : null
        }
        defaultTab={view.openRfis.length > 0 ? "filing" : view.company ? "entity" : "filing"}
        tabs={[
          {
            id: "filing",
            label: "Filing",
            icon: <QuestionIcon size={17} aria-hidden="true" />,
            count: view.openRfis.length,
            attention: view.openRfis.length > 0,
            content: (
              <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
                <Panel title="Your formation">
                <div className="flex flex-col gap-5 p-5">
                <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                <span className="text-overline text-muted-foreground">Filing</span>
                <span className="text-h4">{view.request?.proposedNames?.[0] ?? view.company?.legalName ?? "Your company"}</span>
                </div>
                {status ? <StatusBadge tone={status.tone}>{status.label}</StatusBadge> : null}
                </div>
                {/*
                The four facts that matter, at a size that says so.

                They were four grey labels above four grey values, so the jurisdiction of
                a company being formed carried exactly the weight of everything around it
                and nobody read any of it. Each field now has its own colour — the colour
                belongs to the FIELD, not the value, so jurisdiction is always teal and a
                founder learns where to look once.
                */}
                <BigFactGrid>
                <BigFact
                label="Jurisdiction"
                value={(view.request?.jurisdictionCode ?? "—").toUpperCase()}
                hint="Where the entity is registered"
                tone="processing"
                mono
                />
                <BigFact
                label="Structure"
                value={ENTITY_LABEL[view.request?.entityTypeCode ?? ""] ?? view.request?.entityTypeCode ?? "—"}
                hint="What you will own"
                tone="ai"
                />
                <BigFact
                label="Filed by"
                value="A ZeroCorp operator"
                hint="Not an API — a person files this"
                tone="info"
                />
                <BigFact
                label="Open questions"
                value={String(view.openRfis.length)}
                hint={view.openRfis.length > 0 ? "Your filing is paused" : "Nothing is waiting"}
                tone={view.openRfis.length > 0 ? "warning" : "success"}
                mono
                />
                </BigFactGrid>
                </div>
                </Panel>
                {!order ? (
                  <Panel title="Form your company">
                  <div className="p-5">
                  <Intake entities={[...entities]} targetMarkets={[]} />
                  </div>
                  </Panel>
                ) : null}
              </div>
            ),
          },
          {
            id: "entity",
            label: "Entity",
            icon: <BuildingsIcon size={17} aria-hidden="true" />,
            content: (
              <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
                {view.company ? (
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
                ) : (
                  <Empty
                    title="No entity yet"
                    body="It appears the moment the authority registers your company. The Filing tab has the current status."
                  />
                )}
              </div>
            ),
          },
          {
            id: "registrations",
            label: "Registrations",
            count: view.registrations.length,
            content: (
              <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
                {view.company ? (
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
                ) : (
                  <Empty
                    title="Nothing to register yet"
                    body="A tax ID follows the entity rather than arriving with it: separate filing, separate authority, separate clock."
                  />
                )}
              </div>
            ),
          },
          {
            id: "documents",
            label: "Documents",
            icon: <FileTextIcon size={17} aria-hidden="true" />,
            count: view.documents.length,
            content: (
              <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-8 px-5 py-8 sm:px-8">
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
              </div>
            ),
          },
        ]}
      />

      <div className="mx-auto w-full max-w-(--container-content) px-5 pb-10 sm:px-8">
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
