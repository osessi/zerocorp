"use server";

import { revalidatePath } from "next/cache";
import { getBuildService } from "../../server/container";
import { requireViewer } from "../../server/session";

/**
 * Building a block, from its own page.
 *
 * Thin adapters: authenticate, invoke a use case, revalidate. The generators are pure
 * and live in @zerocorp/domain, so what each of these produces is covered by a unit test
 * rather than by clicking the button.
 */
export interface BuildResult {
  readonly ok: boolean;
  readonly error?: string;
}

function message(cause: unknown): string {
  if (cause instanceof Error) {
    if (cause.name === "NothingToBuildFromError") return cause.message;
    if (cause.name === "NotAuthenticatedError") return "Sign in to continue.";
  }
  console.error("[build] unexpected failure", cause);
  return "That did not work. Nothing was changed.";
}

export async function buildBrand(): Promise<BuildResult> {
  try {
    const { ctx } = await requireViewer();
    await getBuildService().buildBrand(ctx);
    revalidatePath("/brand");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (cause) {
    return { ok: false, error: message(cause) };
  }
}

export async function buildWebsite(): Promise<BuildResult> {
  try {
    const { ctx } = await requireViewer();
    await getBuildService().buildWebsite(ctx);
    revalidatePath("/website");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (cause) {
    return { ok: false, error: message(cause) };
  }
}

export async function setUpEmail(hostname: string): Promise<BuildResult> {
  try {
    const { ctx } = await requireViewer();
    await getBuildService().setUpEmail(ctx, hostname);
    revalidatePath("/email");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (cause) {
    return { ok: false, error: message(cause) };
  }
}

export async function buildContentPlan(): Promise<BuildResult> {
  try {
    const { ctx } = await requireViewer();
    await getBuildService().buildContentPlan(ctx);
    revalidatePath("/content");
    revalidatePath("/dashboard");
    return { ok: true };
  } catch (cause) {
    return { ok: false, error: message(cause) };
  }
}

export async function defineTarget(): Promise<BuildResult> {
  try {
    const { ctx } = await requireViewer();
    await getBuildService().defineTarget(ctx);
    revalidatePath("/leads");
    return { ok: true };
  } catch (cause) {
    return { ok: false, error: message(cause) };
  }
}
