import { eq, sql } from "drizzle-orm";
import type { TenantContext, OnboardingState, OnboardingStepKey } from "@zerocorp/contracts";
import { ONBOARDING_STEPS, isListStep } from "@zerocorp/contracts";
import type { OnboardingRepository } from "@zerocorp/application";
import { businessProfiles, activityEvents } from "../schema/tenant";
import type { Tx } from "../types";

/**
 * Each onboarding step writes ONE column of the Business Brain.
 *
 * The mapping is explicit rather than derived from the key, because two of the eight are
 * jsonb arrays and the rest are text. A clever generic writer would need the same table
 * anyway, one branch deeper.
 */
const COLUMN: Record<OnboardingStepKey, string> = {
  business_name: "business_name",
  description: "description",
  industry: "industry",
  icp_description: "icp_description",
  positioning: "positioning",
  unique_selling_points: "unique_selling_points",
  target_keywords: "target_keywords",
  tone_of_voice: "tone_of_voice",
};

export function createOnboardingRepository(): OnboardingRepository<Tx> {
  return {
    async read(tx, ctx: TenantContext): Promise<OnboardingState> {
      const [profile] = await tx
        .select()
        .from(businessProfiles)
        .where(eq(businessProfiles.tenantId, ctx.tenantId))
        .limit(1);

      if (!profile) return { answers: {}, completedAt: null };

      // Only steps the FOUNDER answered are reported. The assessment seeds the name and
      // the description, and reporting those as answered would skip the two questions
      // whose answers everything else is generated from.
      const answered = new Set((profile.onboardingAnswered as string[]) ?? []);
      const answers: Partial<Record<OnboardingStepKey, string[]>> = {};

      for (const step of ONBOARDING_STEPS) {
        if (!answered.has(step)) continue;
        if (isListStep(step)) {
          const raw = step === "target_keywords" ? profile.targetKeywords : profile.uniqueSellingPoints;
          answers[step] = ((raw as string[]) ?? []).filter(Boolean);
        } else {
          const raw =
            step === "business_name" ? profile.businessName
            : step === "description" ? profile.description
            : step === "industry" ? profile.industry
            : step === "icp_description" ? profile.icpDescription
            : step === "positioning" ? profile.positioning
            : profile.toneOfVoice;
          if (raw) answers[step] = [raw];
        }
      }

      return { answers, completedAt: profile.onboardingCompletedAt ?? null };
    },

    async saveAnswer(tx, ctx: TenantContext, step, values, transcript) {
      const column = COLUMN[step];
      const value = isListStep(step) ? JSON.stringify(values) : values[0]!;

      // The column name comes from a closed map keyed by a zod enum, never from input.
      await tx.execute(sql`
        update business_profiles
        set ${sql.raw(column)} = ${isListStep(step) ? sql`${value}::jsonb` : sql`${value}`},
            onboarding_answered = (
              select coalesce(jsonb_agg(distinct e), '[]'::jsonb)
              from jsonb_array_elements(onboarding_answered || ${JSON.stringify([step])}::jsonb) e
            ),
            voice_transcript = coalesce(${transcript ?? null}, voice_transcript),
            updated_at = now()
        where tenant_id = ${ctx.tenantId}`);
    },

    async complete(tx, ctx: TenantContext) {
      await tx
        .update(businessProfiles)
        .set({ onboardingCompletedAt: new Date(), status: "active" })
        .where(eq(businessProfiles.tenantId, ctx.tenantId));

      // The feed names its actor, and here the actor is the founder.
      await tx.insert(activityEvents).values({
        tenantId: ctx.tenantId,
        eventType: "onboarding.completed",
        actorType: "user",
        payload: { title: "finished Launch your business" },
      });
    },
  };
}
