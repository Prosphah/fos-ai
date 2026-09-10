"use server";

import { createClient } from "@/lib/supabase/server";
import {
  stepPersonalSchema,
  stepCashflowSchema,
  stepAssetsSchema,
  stepGoalsSchema,
  stepRiskSchema,
} from "@/lib/validation/onboarding";
import {
  saveStepPersonal,
  saveStepCashflow,
  saveStepAssets,
  saveStepGoals,
  saveStepRisk,
  completeOnboarding,
} from "@/services/onboarding.service";
import type {
  StepPersonalForm,
  StepCashflowForm,
  StepAssetsForm,
  StepGoalsForm,
  StepRiskForm,
} from "@/lib/validation/onboarding";

async function getUserId(): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

async function saveData<T>(
  saveFn: (userId: string, data: T, profileId?: string | null) => Promise<{ error?: unknown; profileId?: string }>,
  data: T,
  profileId?: string | null
) {
  const userId = await getUserId();
  const result = await saveFn(userId, data, profileId);
  if (result.error) {
    return { error: "Database error saving your data. Please make sure the required tables exist in Supabase." };
  }
  return { success: true, profileId: result.profileId };
}

export async function savePersonal(data: StepPersonalForm) {
  const parsed = stepPersonalSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  return saveData(saveStepPersonal, parsed.data);
}

export async function saveCashflow(data: StepCashflowForm, profileId?: string | null) {
  const parsed = stepCashflowSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  return saveData(saveStepCashflow, parsed.data, profileId);
}

export async function saveAssets(data: StepAssetsForm, profileId?: string | null) {
  const parsed = stepAssetsSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  return saveData(saveStepAssets, parsed.data, profileId);
}

export async function saveGoals(data: StepGoalsForm, profileId?: string | null) {
  const parsed = stepGoalsSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  return saveData(saveStepGoals, parsed.data, profileId);
}

export async function saveRisk(data: StepRiskForm, profileId?: string | null) {
  const parsed = stepRiskSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  return saveData(saveStepRisk, parsed.data, profileId);
}

export async function finishOnboarding(profileId?: string | null) {
  const userId = await getUserId();
  if (profileId) {
    return completeOnboarding(userId, profileId);
  }
  return completeOnboarding(userId);
}

export async function getOnboardingStatus() {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { onboarded: false };

    const { data } = await supabase
      .from("financial_profiles")
      .select("id, onboarding_completed, first_name, last_name, age, country, currency, employment_status, income_frequency, monthly_income, monthly_living_expenses, debt_repayments_monthly, monthly_savings, other_income, expected_major_expenses, total_cash, total_investments, total_retirement_accounts, total_property_value, total_business_ownership, total_other_assets, credit_card_debt, personal_loan_debt, student_loan_debt, mortgage_debt, car_loan_debt, other_debts, retirement_age_target, emergency_fund_target_months, investment_horizon_years, major_purchases_planned, risk_answers, risk_score, risk_profile")
      .eq("user_id", user.id)
      .maybeSingle();

    if (!data) return { onboarded: false };

    return {
      onboarded: !!data.onboarding_completed,
      currentStep: determineCurrentStep(data),
      savedData: data,
      profileId: (data as Record<string, unknown>).id as string | undefined,
    };
  } catch {
    return { onboarded: false };
  }
}

function determineCurrentStep(data: Record<string, unknown>): number {
  if (data.age == null) return 1;
  if (data.monthly_living_expenses == null) return 2;
  if (data.total_cash == null) return 3;
  if (data.retirement_age_target == null) return 4;
  if (data.risk_score == null) return 5;
  return 5;
}
