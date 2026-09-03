import { redirect } from "next/navigation";
import { getOperatorRepository } from "../../server/container";
import { getViewer } from "../../server/session";
import { Queue } from "./Queue";

export const metadata = { title: "Formation queue · ZeroCorp Operator" };

/**
 * The operator console.
 *
 * Formation is operator-assisted (§44, D14): no provider adapter is verified, so a person
 * moves each order through its states and the console records every transition. When an
 * adapter exists it drives the same machine and this screen becomes the exception queue
 * rather than the only path.
 *
 * Access is `platform_operators`, never a tenant role. A customer's "admin" is an admin
 * of their own business; conflating the two would give a customer the cross-tenant view.
 */
export default async function Page() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const operators = getOperatorRepository();
  const allowed = viewer.ctx.userId ? await operators.isOperator(viewer.ctx.userId) : false;
  // Not found, not forbidden. A 403 confirms the console exists to anyone who guesses the
  // URL, which is the same reasoning behind NoAccessError reading "Not found".
  if (!allowed) redirect("/dashboard");

  const [queue, actions] = await Promise.all([operators.queue(), operators.recentActions()]);
  return <Queue rows={queue} actions={actions} />;
}
