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

/**
 * Everything already answered, shaped so the client can hand each slice
 * straight back as that step's form defaults. Without this a resumed session
 * lands on the right step with an empty form and no currency prefix.
 */
export interface OnboardingSavedAnswers {
  about: StepAboutYouForm;
  month: StepMonthToMonthForm;
  own: StepOwnAndOweForm;
  goals: StepGoalsAndRiskForm;
}

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
    saved: null as OnboardingSavedAnswers | null,
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
        "id, onboarding_completed, date_of_birth, monthly_living_expenses, total_cash, risk_score, first_name, last_name, currency, monthly_income, debt_repayments_monthly, monthly_savings, total_investments, total_property_value, total_business_ownership, total_debt, investment_experience, risk_answers"
      )
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) return notOnboarded;

    // Fetched instead of counted, because a resumed session also needs the goal
    // back to prefill step 4 rather than only to know that step 4 exists.
    const { data: goals } = await supabase
      .from("financial_goals")
      .select("title, target_amount, target_date")
      .eq("user_id", user.id)
      .limit(1);

    const goal = goals?.[0] ?? null;
    const riskAnswers = Array.isArray(data.risk_answers) ? data.risk_answers : [];

    const saved: OnboardingSavedAnswers = {
      about: {
        firstName: data.first_name ?? "",
        lastName: data.last_name ?? "",
        dateOfBirth: data.date_of_birth ?? "",
        currency: data.currency ?? "",
        monthlyIncome: data.monthly_income ?? 0,
      },
      month: {
        monthlyLivingExpenses: data.monthly_living_expenses ?? 0,
        debtRepaymentsMonthly: data.debt_repayments_monthly ?? 0,
        monthlySavings: data.monthly_savings ?? 0,
      },
      own: {
        totalCash: data.total_cash ?? 0,
        totalInvestments: data.total_investments ?? 0,
        totalPropertyValue: data.total_property_value ?? 0,
        totalBusinessOwnership: data.total_business_ownership ?? 0,
        totalDebt: data.total_debt ?? 0,
      },
      goals: {
        goalTitle: goal?.title ?? "",
        goalAmount: goal?.target_amount ?? 0,
        goalTargetDate: goal?.target_date ?? "",
        riskAnswers,
        investmentExperience: data.investment_experience ?? "",
      },
    };

    return {
      onboarded: !!data.onboarding_completed,
      currentStep: determineCurrentStep(data, !!goal),
      profileId: data.id as string | null,
      saved,
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