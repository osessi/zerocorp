import { redirect } from "next/navigation";
import { PageHeader, StatusBadge, cx } from "@zerocorp/ui";
import { getBlocksRepository, getUnitOfWork } from "../../../server/container";
import { getViewer } from "../../../server/session";
import { BuildButton } from "../BuildButton";
import { buildBrand } from "../build-actions";
import { Empty, Fact, FactCell, FactGrid, Panel } from "../ui";

export const metadata = { title: "Brand · ZeroCorp" };

export default async function Page() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const view = await getUnitOfWork().withTenant(viewer.ctx, (tx) =>
    getBlocksRepository().brand(tx, viewer.ctx),
  );

  return (
    <>
      <PageHeader
        title="Brand"
        subtitle={view?.businessName ?? "Your brand"}
        meta={
          <StatusBadge tone={view?.identity ? "success" : "neutral"}>
            {view?.identity ? "Drafted" : "Not started"}
          </StatusBadge>
        }
        actions={<BuildButton action={buildBrand} label="Build my brand" busyLabel="Building" />}
      />

      <div className="flex flex-col gap-10 px-5 py-8 sm:px-8">
        <Panel title="Positioning">
          {view?.identity ? (
            <FactGrid>
              <FactCell><Fact label="Name" value={view.identity.name ?? "Not set"} /></FactCell>
              <FactCell><Fact label="Positioning" value={view.identity.positioning ?? "Not set"} /></FactCell>
              <FactCell><Fact label="Ideal customer" value={view.identity.icp ?? "Not set"} /></FactCell>
              <FactCell><Fact label="Tone of voice" value={view.identity.toneOfVoice ?? "Not set"} /></FactCell>
            </FactGrid>
          ) : (
            <Empty
              title="Nothing drafted yet"
              body="Your brand is generated from the Business Brain and approved by you before anything is built on it. Everything the website and the content say afterwards traces back to what you approve here."
            />
          )}
        </Panel>

        <Panel title="Colours" count={view?.identity?.colors.length ?? 0}>
          {view?.identity && view.identity.colors.length > 0 ? (
            <div className="flex flex-wrap gap-3">
              {view.identity.colors.map((color) => (
                <div key={color} className="border-border flex items-center gap-3 border p-3">
                  {/*
                    A customer's brand colour is DATA, not a token. It is the one place an
                    arbitrary colour value is correct, and it is why customer sites and the
                    ZeroCorp UI have separate theme systems — DESIGN_SYSTEM.md §16.
                  */}
                  <span className="border-border size-8 border" style={{ backgroundColor: color }} aria-hidden="true" />
                  <span className="text-caption font-mono">{color}</span>
                </div>
              ))}
            </div>
          ) : (
            <Empty
              title="No palette yet"
              body="Colours are picked from your positioning, not from a template. They become the customer theme your website renders with, which is a separate system from the one this dashboard uses."
            />
          )}
        </Panel>

        <Panel title="What you told us">
          <div className={cx("border-border border p-5")}>
            <p className="text-body-sm text-muted-foreground max-w-prose text-pretty">
              {view?.description ?? "Nothing yet."}
            </p>
          </div>
        </Panel>
      </div>
    </>
  );
}
