"use server";

import { revalidatePath } from "next/cache";
import { formationIntakeSchema } from "@zerocorp/contracts";
import { screenResidency } from "@zerocorp/domain";
import { getFormationRequestService } from "../../../server/container";
import { getViewer } from "../../../server/session";

/**
 * The formation intake.
 *
 * Residency gates: a resident of a comprehensively sanctioned country is declined here,
 * before any money moves, rather than refunded afterwards. The schema is in contracts,
 * because an app is a thin adapter.
 */
export type IntakeResult = { ok: true; requestId: string } | { ok: false; error: string };

export async function requestFormation(input: unknown): Promise<IntakeResult> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Not found");

  const parsed = formationIntakeSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Those answers are not complete." };
  }
  const { entityTypeCode, jurisdictionCode, proposedNames, ...founder } = parsed.data;

  // The gate, server-side. The client screens too, so the founder is told early rather
  // than after filling a form, but a client-side check is a courtesy and not a control.
  const screening = screenResidency(founder.residencyCountry);
  if (screening.outcome === "blocked") {
    return { ok: false, error: screening.reason };
  }

  try {
    const { requestId } = await getFormationRequestService().execute(viewer.ctx, {
      entityTypeCode,
      jurisdictionCode,
      proposedNames,
      founder,
    });
    revalidatePath("/company");
    revalidatePath("/dashboard");
    return { ok: true, requestId };
  } catch (cause) {
    // Ineligibility is an ANSWER, not a crash: the founder asked whether they can form
    // this structure and the system said no, with reasons. It belongs on the screen.
    return { ok: false, error: cause instanceof Error ? cause.message : "That structure could not be requested." };
  }
}
