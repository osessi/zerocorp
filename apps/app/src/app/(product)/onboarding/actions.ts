"use server";

import { revalidatePath } from "next/cache";
import type { OnboardingState } from "@zerocorp/contracts";
import { getOnboardingService } from "../../../server/container";
import { getViewer } from "../../../server/session";

/**
 * One answer, saved the moment it is given.
 *
 * Not batched to the end. This is the longest form in the product and a founder who
 * closes the tab on step six should resume at seven, not start again.
 */
export async function saveAnswer(input: unknown): Promise<OnboardingState> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Not found");
  const state = await getOnboardingService().answer(viewer.ctx, input);
  revalidatePath("/onboarding");
  return state;
}

/**
 * The voice path: one recording, eight fields back.
 *
 * The extraction can take a few seconds against a real model. That is acceptable here
 * and nowhere else in the product — this is the one screen a founder expects to wait on,
 * because they can see it is reading what they just said.
 */
export async function extractFromTranscript(transcript: string) {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Not found");
  const result = await getOnboardingService().fromTranscript(viewer.ctx, { transcript });
  revalidatePath("/onboarding");
  return result;
}

export async function finishOnboarding(): Promise<OnboardingState> {
  const viewer = await getViewer();
  if (!viewer) throw new Error("Not found");
  const state = await getOnboardingService().finish(viewer.ctx);
  // The dashboard changes shape once the brain is filled, so both are stale.
  revalidatePath("/onboarding");
  revalidatePath("/dashboard");
  return state;
}
