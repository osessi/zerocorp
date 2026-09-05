import { redirect } from "next/navigation";
import { UserIcon } from "@phosphor-icons/react/dist/ssr";
import { Alert, PageHeader, StatusBadge } from "@zerocorp/ui";
import { DEFAULT_PRICING, subscriptionPrice } from "@zerocorp/config";
import { formatMoney } from "@zerocorp/contracts";
import type { SubscriptionPlan } from "@zerocorp/config";
import { getSettingsRepository, getSystemUnitOfWork, getUnitOfWork } from "../../../server/container";
import { getViewer } from "../../../server/session";
import { Fact, FactCell, FactGrid, Panel, Row, Rows } from "../ui";

export const metadata = { title: "Settings · ZeroCorp" };

export default async function Page() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  // Two transactions, because the two halves live behind different doors: the tenant and
  // its members are global, the subscription and the ledger are tenant-owned. Inventing
  // one door that reaches both would be inventing the second door NN-2 forbids.
  const view = await getSystemUnitOfWork().withSystem(`settings-${Date.now()}`, (systemTx) =>
    getUnitOfWork().withTenant(viewer.ctx, (tenantTx) =>
      getSettingsRepository().settings(systemTx, tenantTx, viewer.ctx),
    ),
  );

  const price = subscriptionPrice(DEFAULT_PRICING, view.plan as SubscriptionPlan);

  return (
    <>
      <PageHeader title="Settings" subtitle={view.tenantName} />

      <div className="flex flex-col gap-10 px-5 py-8 sm:px-8">
        <Panel title="Plan">
          <FactGrid>
            <FactCell><Fact label="Plan" value={view.plan} tone="text-chart-1" /></FactCell>
            <FactCell><Fact label="Monthly" value={formatMoney(price)} tone="font-mono tabular-nums text-chart-3" /></FactCell>
            <FactCell>
              <Fact
                label="Subscription"
                value={
                  <StatusBadge tone={view.subscriptionStatus === "active" ? "success" : "neutral"}>
                    {view.subscriptionStatus ?? "Not connected"}
                  </StatusBadge>
                }
              />
            </FactCell>
            <FactCell>
              {/* SUM(delta), never a stored balance — DATABASE.md §14. */}
              <Fact label="Credits" value={`${view.creditBalance}`} tone="font-mono tabular-nums text-chart-5" />
            </FactCell>
          </FactGrid>
        </Panel>

        <Panel title="People" count={view.members.length}>
          <Rows>
            {view.members.map((member) => (
              <Row key={member.email}>
                <UserIcon size={16} className="text-muted-foreground shrink-0" aria-hidden="true" />
                <span className="text-body-sm min-w-0 flex-1 truncate">{member.email}</span>
                <StatusBadge tone={member.role === "owner" ? "processing" : "neutral"}>{member.role}</StatusBadge>
              </Row>
            ))}
          </Rows>
        </Panel>

        <Alert tone="info" title="Billing is not connected in this build">
          The plan and the price shown here are the ones you approved, read from
          configuration. No card is on file and nothing is charged.
        </Alert>
      </div>
    </>
  );
}
