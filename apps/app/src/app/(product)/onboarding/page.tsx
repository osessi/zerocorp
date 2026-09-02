import { redirect } from "next/navigation";
import { getOnboardingService } from "../../../server/container";
import { getViewer } from "../../../server/session";
import { Onboarding } from "./Onboarding";

export const metadata = { title: "Tell us about your business — ZeroCorp" };

/**
 * Tell us about your business — the deep onboarding.
 *
 * The assessment decided WHAT to build. This decides how it sounds, who it is for and
 * why anyone would choose it. Everything the product generates afterwards reads what is
 * collected here, which is why it is eight real questions and not a settings form.
 */
export default async function Page() {
  const viewer = await getViewer();
  if (!viewer) redirect("/signin");

  const state = await getOnboardingService().state(viewer.ctx);
  return <Onboarding initial={state} />;
}
