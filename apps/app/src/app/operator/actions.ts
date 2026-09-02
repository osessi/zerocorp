"use server";

import { revalidatePath } from "next/cache";
import { FORMATION_ORDER_STATUSES, canTransitionOrder, type FormationOrderStatus } from "@zerocorp/contracts";
import { getOperatorRepository } from "../../server/container";
import { getViewer } from "../../server/session";

/**
 * Move one order to one state, by hand.
 *
 * Authorised on every call rather than once at page load: a server action is a public
 * endpoint, and "the page checked" is not an access control.
 */
export async function transitionOrder(input: {
  orderId: string;
  tenantId: string;
  from: string;
  to: string;
  note?: string;
}): Promise<{ ok: boolean; error?: string }> {
  const viewer = await getViewer();
  if (!viewer?.ctx.userId) return { ok: false, error: "Not found" };

  const operators = getOperatorRepository();
  if (!(await operators.isOperator(viewer.ctx.userId))) return { ok: false, error: "Not found" };

  // Two checks, and both earn their place. The enum stops a typo; the MACHINE stops a
  // legal state reached illegally — `formed → draft` is a valid status and an invalid
  // move, and only the second check catches it. The database CHECK constraint is the
  // third barrier and would still reject a bad value if both of these were removed.
  const list = FORMATION_ORDER_STATUSES as readonly string[];
  if (!list.includes(input.to) || !list.includes(input.from)) {
    return { ok: false, error: `"${input.to}" is not a formation state` };
  }
  if (!canTransitionOrder(input.from as FormationOrderStatus, input.to as FormationOrderStatus)) {
    return { ok: false, error: `An order cannot go from ${input.from} to ${input.to}` };
  }

  await operators.transition({
    operatorId: viewer.ctx.userId,
    tenantId: input.tenantId,
    orderId: input.orderId,
    to: input.to,
    ...(input.note ? { note: input.note } : {}),
  });
  revalidatePath("/operator");
  return { ok: true };
}
