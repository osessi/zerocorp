import { redirect } from "next/navigation";
import { BuildingsIcon, FileTextIcon, QuestionIcon } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink, StatusBadge, StatusStamp, Tabs, cx } from "@zerocorp/ui";
import { Intake } from "./Intake";
import { BigFact, BigFactGrid, FACT_TONE } from "../ui-facts";

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

/**
 * A colour per STRUCTURE, so four filings do not read as four grey rows.
 *
 * Keyed by the catalogue code rather than by position, so adding a fifth structure does
 * not repaint the other four. The five tones are the §4.3 status hues used here as
 * CATEGORY colour, which is the same licence `ui-facts` already takes: the tone belongs
 * to the field, never to the value, so nothing here can be misread as a status.
 */
const STRUCTURE_TONE: Record<string, (typeof FACT_TONE)[keyof typeof FACT_TONE]> = {
  us_llc: FACT_TONE.processing,
  us_ccorp: FACT_TONE.ai,
  gb_ltd: FACT_TONE.info,
  gb_llp: FACT_TONE.success,
};
const STRUCTURE_TONE_FALLBACK = FACT_TONE.neutral;

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
              {/*
                RED, and dotted.

                This was a filled amber panel with brown headings, which is both the wrong
                colour and the wrong look: yellow is the non-semantic accent (§4.8) and
                something the founder must act on is destructive tone. The amber fill with
                #92400E text was also called out by name as the pairing every generated
                interface ships. Dotted, because an outline that is waiting for something
                should look provisional.
              */}
              <section className="border-destructive bg-destructive-wash flex flex-col gap-4 border border-dashed p-5">
              <div className="flex items-center gap-3">
              <QuestionIcon size={20} weight="fill" className="text-destructive shrink-0" aria-hidden="true" />
              <h2 className="text-h4 text-destructive-ink">
              {view.openRfis.length === 1
              ? "One thing is needed before we can file"
              : `${view.openRfis.length} things are needed before we can file`}
              </h2>
              </div>
              <ul className="flex flex-col gap-3">
              {view.openRfis.map((rfi) => (
              <li key={rfi.id} className="border-destructive/40 bg-surface flex flex-wrap items-center gap-4 border p-4">
              <span className="text-body-sm min-w-0 flex-1">{rfi.question}</span>
              <ButtonLink href="/help" variant="primary">Send it</ButtonLink>
              </li>
              ))}
              </ul>
              <p className="text-caption text-destructive-ink">
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
                tone="processing"
                mono
                />
                <BigFact
                label="Structure"
                value={ENTITY_LABEL[view.request?.entityTypeCode ?? ""] ?? view.request?.entityTypeCode ?? "—"}
                tone="ai"
                />
                <BigFact
                label="Filed by"
                value="A ZeroCorp operator"
                tone="info"
                />
                <BigFact
                label="Open questions"
                value={String(view.openRfis.length)}
                tone={view.openRfis.length > 0 ? "danger" : "success"}
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

      <div className="mx-auto flex w-full max-w-(--container-content) flex-col gap-4 px-5 pb-10 sm:px-8">
        <Panel title="What ZeroCorp can form" count={entities.length}>
          {/*
            One card per structure, each in its OWN colour.

            It was four rows welded into a bordered slab, in one grey, and a founder
            comparing an LLC in Wyoming against a Ltd in the UK could not tell the four
            apart without reading every line. The tone is keyed to the STRUCTURE, so the
            same structure is the same colour wherever it appears on this screen —
            including the "Structure" fact above. A colour that tracked the data would be
            a status; this is a category.

            Separated, not welded. Standing rule.
          */}
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {entities.map((entity) => {
              const t = STRUCTURE_TONE[entity.code] ?? STRUCTURE_TONE_FALLBACK;
              return (
                <li
                  key={`${entity.jurisdictionCode}-${entity.code}`}
                  className={cx(
                    "flex flex-col gap-3 border p-4",
                    "duration-glide ease-glide transition-transform motion-safe:hover:-translate-y-0.5",
                    t.edge,
                    t.wash,
                  )}
                >
                  <div className="flex items-center gap-2.5">
                    <BuildingsIcon size={20} weight="duotone" className={cx("shrink-0", t.ink)} aria-hidden="true" />
                    <span className={cx("text-h4 leading-none", t.ink)}>{entity.customerLabel}</span>
                  </div>
                  <span className={cx("text-caption w-fit border px-2 py-1 font-mono tracking-wide", t.edge, t.ink)}>
                    {entity.jurisdictionCode.toUpperCase()}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    Typically {entity.typicalDaysMin} to {entity.typicalDaysMax} days
                  </span>
                  {/*
                    The honesty field, rendered. A founder is never told a filing is
                    automatic when a ZeroCorp operator does it by hand.
                  */}
                  <StatusBadge tone={entity.automationLevel === "automated" ? "success" : "info"}>
                    {entity.automationLevel === "automated" ? "Automated" : "Filed by an operator"}
                  </StatusBadge>
                </li>
              );
            })}
          </ul>
        </Panel>
      </div>

    </>
  );
}
