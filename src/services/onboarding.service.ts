import { createClient } from "@/lib/supabase/server";
import type { FinancialProfile } from "@/types/database";
import { randomUUID } from "crypto";

/**
 * Liabilities come from the single total recorded at onboarding. The six per
 * category columns are the legacy shape and are still read for rows written
 * before the questionnaire was shortened. This mirrors the COALESCE in
 * supabase/migrations/20261015000005_fix_sync_financial_profile.sql; the two
 * must stay in step or a person's score changes the moment a sync runs.
 */
function totalLiabilities(p: Partial<FinancialProfile>): number {
  if (p.total_debt != null) return p.total_debt;
  return (
    (p.credit_card_debt ?? 0) +
    (p.personal_loan_debt ?? 0) +
    (p.student_loan_debt ?? 0) +
    (p.mortgage_debt ?? 0) +
    (p.car_loan_debt ?? 0) +
    (p.other_debts ?? 0)
  );
}

function totalAssets(p: Partial<FinancialProfile>): number {
  return (
    (p.total_cash ?? 0) +
    (p.total_investments ?? 0) +
    (p.total_retirement_accounts ?? 0) +
    (p.total_property_value ?? 0) +
    (p.total_business_ownership ?? 0) +
    (p.total_other_assets ?? 0)
  );
}

export function calculateNetWorth(p: Partial<FinancialProfile>): number {
  return totalAssets(p) - totalLiabilities(p);
}

export function calculateDebtRatio(p: Partial<FinancialProfile>): number {
  const ta = totalAssets(p);
  if (ta === 0) return 0;
  return Math.round((totalLiabilities(p) / ta) * 100) / 100;
}

export function calculateSavingsRate(
  monthlyIncome: number,
  monthlyExpenses: number
): number {
  if (monthlyIncome === 0) return 0;
  return Math.round(((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100);
}

export function calculateEmergencyFundMonths(
  totalCash: number,
  monthlyExpenses: number
): number {
  if (monthlyExpenses === 0) return 0;
  return Math.round((totalCash / monthlyExpenses) * 10) / 10;
}

export function calculateFinancialHealthScore(
  savingsRate: number,
  debtRatio: number,
  emergencyFundMonths: number,
  riskScore: number
): number {
  const srScore = Math.min(savingsRate, 100) * 0.3;
  const drScore = Math.max(0, (1 - debtRatio) * 100) * 0.25;
  const efScore = Math.min(emergencyFundMonths * 10, 100) * 0.25;
  const rsScore = riskScore * 0.2;
  return Math.round(Math.min(srScore + drScore + efScore + rsScore, 100));
}

export function calculateRiskProfile(answers: { score: number }[]): {
  score: number;
  profile: string;
} {
  if (answers.length === 0) return { score: 50, profile: "moderate" };
  const avg = answers.reduce((sum, a) => sum + a.score, 0) / answers.length;
  const score = Math.round((avg / 3) * 100);
  const profile =
    score >= 66 ? "aggressive" : score >= 33 ? "moderate" : "conservative";
  return { score, profile };
}

/**
 * Whole years from now until the goal's target date, rounded down and never
 * negative. This feeds investment_horizon_years, which the stock analysis prompt
 * reads, so it is derived from the one date the person actually gave us rather
 * than asking a second question.
 */
export function calculateInvestmentHorizonYears(
  targetDate: string,
  now: Date = new Date()
): number {
  const [year, month, day] = targetDate.split("-").map(Number);
  if (!year || !month || !day) return 0;

  const target = new Date(year, month - 1, day);
  if (target.getTime() <= now.getTime()) return 0;

  // Counted on the calendar rather than by dividing milliseconds, because a
  // span of two calendar years is 730 or 731 days depending on leap years, and
  // dividing by 365.25 would floor an exact two year goal down to one.
  let years = target.getFullYear() - now.getFullYear();
  const hadAnniversary =
    target.getMonth() > now.getMonth() ||
    (target.getMonth() === now.getMonth() && target.getDate() >= now.getDate());
  if (!hadAnniversary) years -= 1;

  return Math.max(0, years);
}

function monthlyExpenses(p: Partial<FinancialProfile>): number {
  return (
    (p.monthly_living_expenses ?? 0) + (p.debt_repayments_monthly ?? 0)
  );
}

async function getServerClient() {
  return await createClient();
}

async function getExistingProfileId(
  supabase: Awaited<ReturnType<typeof getServerClient>>,
  userId: string
): Promise<string | null> {
  const { data } = await supabase
    .from("financial_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return data?.id ?? null;
}

function resolveProfileId(
  existingId: string | null | undefined,
  profileId: string | undefined | null
): string {
  return profileId ?? existingId ?? randomUUID();
}

export async function saveStepAboutYou(
  userId: string,
  data: {
    firstName: string;
    lastName: string;
    dateOfBirth: string;
    currency: string;
    monthlyIncome: number;
  },
  profileId?: string | null
): Promise<{ error?: unknown; profileId?: string }> {
  const supabase = await getServerClient();
  const existingId = await getExistingProfileId(supabase, userId);
  const id = resolveProfileId(existingId, profileId);

  const result = await supabase.from("financial_profiles").upsert({
    id,
    user_id: userId,
    first_name: data.firstName,
    last_name: data.lastName,
    date_of_birth: data.dateOfBirth,
    currency: data.currency,
    monthly_income: data.monthlyIncome,
    updated_at: new Date().toISOString(),
  });

  await supabase.rpc("upsert_user_settings", {
    p_user_id: userId,
    p_currency: data.currency,
  });

  return { error: result.error, profileId: id };
}

export async function saveStepMonthToMonth(
  userId: string,
  data: {
    monthlyLivingExpenses: number;
    debtRepaymentsMonthly: number;
    monthlySavings: number;
  },
  profileId?: string | null
): Promise<{ error?: unknown; profileId?: string }> {
  const supabase = await getServerClient();
  const existingId = await getExistingProfileId(supabase, userId);
  const id = resolveProfileId(existingId, profileId);

  const result = await supabase.from("financial_profiles").upsert({
    id,
    user_id: userId,
    monthly_living_expenses: data.monthlyLivingExpenses,
    debt_repayments_monthly: data.debtRepaymentsMonthly,
    monthly_savings: data.monthlySavings,
    monthly_expenses: monthlyExpenses({
      monthly_living_expenses: data.monthlyLivingExpenses,
      debt_repayments_monthly: data.debtRepaymentsMonthly,
    }),
    updated_at: new Date().toISOString(),
  });

  return { error: result.error, profileId: id };
}

export async function saveStepOwnAndOwe(
  userId: string,
  data: {
    totalCash: number;
    totalInvestments: number;
    totalPropertyValue: number;
    totalBusinessOwnership: number;
    totalDebt: number;
  },
  profileId?: string | null
): Promise<{ error?: unknown; profileId?: string }> {
  const supabase = await getServerClient();
  const existingId = await getExistingProfileId(supabase, userId);
  const id = resolveProfileId(existingId, profileId);

  // total_savings keeps the same meaning it always had: the running total of the
  // asset columns above. The sync trigger still reads it, and dropping the write
  // would make its net worth figure collapse for people with no linked accounts.
  const totalSavings =
    data.totalCash +
    data.totalInvestments +
    data.totalPropertyValue +
    data.totalBusinessOwnership;

  const result = await supabase.from("financial_profiles").upsert({
    id,
    user_id: userId,
    total_cash: data.totalCash,
    total_investments: data.totalInvestments,
    total_property_value: data.totalPropertyValue,
    total_business_ownership: data.totalBusinessOwnership,
    total_debt: data.totalDebt,
    total_savings: totalSavings,
    updated_at: new Date().toISOString(),
  });

  return { error: result.error, profileId: id };
}

export async function saveStepGoalsAndRisk(
  userId: string,
  data: {
    goalTitle: string;
    goalAmount: number;
    goalTargetDate: string;
    riskAnswers: { questionKey: string; answer: string; score: number }[];
    investmentExperience?: string;
  },
  profileId?: string | null
): Promise<{ error?: unknown; profileId?: string }> {
  const supabase = await getServerClient();
  const existingId = await getExistingProfileId(supabase, userId);
  const id = resolveProfileId(existingId, profileId);

  const { score, profile } = calculateRiskProfile(data.riskAnswers);
  const horizonYears = calculateInvestmentHorizonYears(data.goalTargetDate);

  const profileResult = await supabase.from("financial_profiles").upsert({
    id,
    user_id: userId,
    investment_horizon_years: horizonYears,
    investment_experience: data.investmentExperience || null,
    risk_answers: data.riskAnswers,
    risk_score: score,
    risk_profile: profile,
    updated_at: new Date().toISOString(),
  });

  const existing = await supabase
    .from("financial_goals")
    .select("id")
    .eq("user_id", userId);

  if (existing.data && existing.data.length > 0) {
    await supabase
      .from("financial_goals")
      .delete()
      .eq("user_id", userId);
  }

  const { error: goalError } = await supabase.from("financial_goals").insert({
    user_id: userId,
    title: data.goalTitle,
    target_amount: data.goalAmount,
    target_date: data.goalTargetDate,
    current_amount: 0,
    priority: "1",
    status: "active",
  });

  const existingAssessment = await supabase
    .from("risk_assessments")
    .select("id")
    .eq("user_id", userId);

  if (existingAssessment.data && existingAssessment.data.length > 0) {
    await supabase
      .from("risk_assessments")
      .update({ score, category: profile })
      .eq("user_id", userId);
  } else {
    await supabase.from("risk_assessments").insert({
      user_id: userId,
      score,
      category: profile,
    });
  }

  return { error: profileResult.error ?? goalError, profileId: id };
}

export async function completeOnboarding(userId: string, profileId?: string) {
  const supabase = await getServerClient();

  const query = supabase.from("financial_profiles").select("*");

  if (profileId) {
    query.eq("id", profileId);
  } else {
    query.eq("user_id", userId);
  }

  const { data: profile } = await query.maybeSingle();

  if (!profile) {
    return {
      error:
        "Financial profile not found. The financial_profiles table may not exist in your Supabase project, run the setup migration first.",
    };
  }

  const me = profile as Partial<FinancialProfile>;
  const income = me.monthly_income ?? 0;
  const expenses = monthlyExpenses(me);
  const sr = calculateSavingsRate(income, expenses);
  const dr = calculateDebtRatio(me);
  const nw = calculateNetWorth(me);
  const ef = calculateEmergencyFundMonths(me.total_cash ?? 0, expenses);
  const rs = me.risk_score ?? 50;
  const fhs = calculateFinancialHealthScore(sr, dr, ef, rs);

  await supabase.from("financial_profiles").upsert({
    id: profile.id,
    user_id: userId,
    net_worth: nw,
    debt_ratio: dr,
    savings_rate: sr,
    emergency_fund_months: ef,
    financial_health_score: fhs,
    onboarding_completed: true,
    onboarding_completed_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  });

  return { success: true, financialHealthScore: fhs };
}