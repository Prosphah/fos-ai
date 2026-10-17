"use server";

import { createClient } from "@/lib/supabase/server";
import {
  stepAboutYouSchema,
  stepMonthToMonthSchema,
  stepOwnAndOweSchema,
  stepGoalsAndRiskSchema,
} from "@/lib/validation/onboarding";
import {
  saveStepAboutYou,
  saveStepMonthToMonth,
  saveStepOwnAndOwe,
  saveStepGoalsAndRisk,
  completeOnboarding,
} from "@/services/onboarding.service";
import type {
  StepAboutYouForm,
  StepMonthToMonthForm,
  StepOwnAndOweForm,
  StepGoalsAndRiskForm,
} from "@/lib/validation/onboarding";

const DB_ERROR =
  "Database error saving your data. Please make sure the required tables exist in Supabase.";

async function getUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

async function saveData<T>(
  saveFn: (
    userId: string,
    data: T,
    profileId?: string | null
  ) => Promise<{ error?: unknown; profileId?: string }>,
  data: T,
  profileId?: string | null
) {
  const userId = await getUserId();
  const result = await saveFn(userId, data, profileId);
  if (result.error) {
    return { error: DB_ERROR };
  }
  return { success: true, profileId: result.profileId };
}

export async function saveAboutYou(data: StepAboutYouForm) {
  const parsed = stepAboutYouSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  return saveData(saveStepAboutYou, parsed.data);
}

export async function saveMonthToMonth(
  data: StepMonthToMonthForm,
  profileId?: string | null
) {
  const parsed = stepMonthToMonthSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  return saveData(saveStepMonthToMonth, parsed.data, profileId);
}

export async function saveOwnAndOwe(
  data: StepOwnAndOweForm,
  profileId?: string | null
) {
  const parsed = stepOwnAndOweSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  return saveData(saveStepOwnAndOwe, parsed.data, profileId);
}

export async function saveGoalsAndRisk(
  data: StepGoalsAndRiskForm,
  profileId?: string | null
) {
  const parsed = stepGoalsAndRiskSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  return saveData(saveStepGoalsAndRisk, parsed.data, profileId);
}

export async function finishOnboarding(profileId?: string | null) {
  const userId = await getUserId();
  if (profileId) {
    return completeOnboarding(userId, profileId);
  }
  return completeOnboarding(userId);
}

/**
 * Where a returning visitor should land. The first step with a missing answer wins,
 * so the ladder is ordered by the sequence they are asked in.
 */
function determineCurrentStep(
  profile: {
    date_of_birth: string | null;
    monthly_living_expenses: number | null;
    total_cash: number | null;
    risk_score: number | null;
  },
  hasGoal: boolean
): number {
  if (!profile.date_of_birth) return 1;
  if (profile.monthly_living_expenses == null) return 2;
  if (profile.total_cash == null) return 3;
  if (!hasGoal || profile.risk_score == null) return 4;
  return 4;
}

export async function getOnboardingStatus() {
  const notOnboarded = {
    onboarded: false,
    currentStep: 1,
    profileId: null as string | null,
  };

  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return notOnboarded;

    const { data } = await supabase
      .from("financial_profiles")
      .select(
        "id, onboarding_completed, date_of_birth, monthly_living_expenses, total_cash, risk_score"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) return notOnboarded;

    const { count } = await supabase
      .from("financial_goals")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id);

    return {
      onboarded: !!data.onboarding_completed,
      currentStep: determineCurrentStep(data, (count ?? 0) > 0),
      profileId: data.id as string | null,
    };
  } catch {
    return notOnboarded;
  }
}

/** Reads the score the success page shows. */
export async function getOnboardingScore() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { score: null as number | null };

    const { data } = await supabase
      .from("financial_profiles")
      .select("financial_health_score")
      .eq("user_id", user.id)
      .maybeSingle();

    return { score: (data?.financial_health_score as number | null) ?? null };
  } catch {
    return { score: null as number | null };
  }
}