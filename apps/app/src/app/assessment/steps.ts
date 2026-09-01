import {
  BriefcaseIcon,
  BuildingsIcon,
  GlobeHemisphereWestIcon,
  MapPinIcon,
  TargetIcon,
} from "@phosphor-icons/react/dist/ssr";
import type { SlotId } from "@zerocorp/contracts";

/**
 * A label and a glyph per interview step.
 *
 * The glyph is what the step IS, not decoration: a pin for where you are, a globe for
 * where you sell. Shared by the rail, the timeline and the question card so all three
 * name the same step the same way — three views drifting apart is how a reader ends up
 * doing the matching themselves.
 */
export const SLOT_STEPS: Record<SlotId, { label: string; icon: typeof BriefcaseIcon }> = {
  business_description: { label: "Business", icon: BriefcaseIcon },
  current_situation: { label: "Situation", icon: MapPinIcon },
  company_situation: { label: "Company", icon: BuildingsIcon },
  twelve_month_goal: { label: "Goals", icon: TargetIcon },
  target_markets: { label: "Markets", icon: GlobeHemisphereWestIcon },
};
