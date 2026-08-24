import { createClient } from "@/lib/supabase/server";
import type { FinancialProfile } from "@/types/database";
import { randomUUID } from "crypto";

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

function totalLiabilities(p: Partial<FinancialProfile>): number {
  return (
    (p.credit_card_debt ?? 0) +
    (p.personal_loan_debt ?? 0) +
    (p.student_loan_debt ?? 0) +
    (p.mortgage_debt ?? 0) +
    (p.car_loan_debt ?? 0) +
    (p.other_debts ?? 0)
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
  const rsScore = riskScore * 20 * 0.2;
  return Math.round(Math.min(srScore + drScore + efScore + rsScore, 100));
}

export function calculateRiskProfile(answers: { score: number }[]): {
  score: number;
  profile: string;
} {
  if (answers.length === 0) return { score: 50, profile: "moderate" };
  const avg =
    answers.reduce((sum, a) => sum + a.score, 0) / answers.length;
  const score = Math.round((avg / 3) * 100);
  const profile = score >= 66 ? "aggressive" : score >= 33 ? "moderate" : "conservative";
  return { score, profile };
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

export async function saveStepPersonal(
  userId: string,
  data: {
    age: number;
    country: string;
    currency: string;
    employmentStatus: string;
    monthlyIncome: number;
    incomeFrequency: string;
  },
  profileId?: string | null
): Promise<{ error?: unknown; profileId?: string }> {
  const supabase = await getServerClient();
  const existingId = await getExistingProfileId(supabase, userId);
  const id = resolveProfileId(existingId, profileId);

  const result = await supabase.from("financial_profiles").upsert({
    id,
    user_id: userId,
    age: data.age,
    country: data.country,
    currency: data.currency,
    employment_status: data.employmentStatus,
    monthly_income: data.monthlyIncome,
    income_frequency: data.incomeFrequency,
    updated_at: new Date().toISOString(),
  });

  await supabase.rpc("upsert_user_settings", {
    p_user_id: userId,
    p_currency: data.currency,
  });

  return { error: result.error, profileId: id };
}

export async function saveStepCashflow(
  userId: string,
  data: {
    monthlyLivingExpenses: number;
    debtRepaymentsMonthly: number;
    monthlySavings: number;
    otherIncome: number;
    expectedMajorExpenses: string[];
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
    other_income: data.otherIncome,
    monthly_expenses: monthlyExpenses({
      monthly_living_expenses: data.monthlyLivingExpenses,
      debt_repayments_monthly: data.debtRepaymentsMonthly,
    }),
    expected_major_expenses: data.expectedMajorExpenses,
    updated_at: new Date().toISOString(),
  });

  return { error: result.error, profileId: id };
}

export async function saveStepAssets(
  userId: string,
  data: {
    totalCash: number;
    totalInvestments: number;
    totalRetirementAccounts: number;
    totalPropertyValue: number;
    totalBusinessOwnership: number;
    totalOtherAssets: number;
    creditCardDebt: number;
    personalLoanDebt: number;
    studentLoanDebt: number;
    mortgageDebt: number;
    carLoanDebt: number;
    otherDebts: number;
  },
  profileId?: string | null
): Promise<{ error?: unknown; profileId?: string }> {
  const supabase = await getServerClient();
  const existingId = await getExistingProfileId(supabase, userId);
  const id = resolveProfileId(existingId, profileId);

  const totalLiab =
    (data.creditCardDebt ?? 0) +
    (data.personalLoanDebt ?? 0) +
    (data.studentLoanDebt ?? 0) +
    (data.mortgageDebt ?? 0) +
    (data.carLoanDebt ?? 0) +
    (data.otherDebts ?? 0);

  const totalSavings =
    (data.totalCash ?? 0) +
    (data.totalInvestments ?? 0) +
    (data.totalRetirementAccounts ?? 0) +
    (data.totalPropertyValue ?? 0) +
    (data.totalBusinessOwnership ?? 0) +
    (data.totalOtherAssets ?? 0);

  const result = await supabase.from("financial_profiles").upsert({
    id,
    user_id: userId,
    total_cash: data.totalCash,
    total_investments: data.totalInvestments,
    total_retirement_accounts: data.totalRetirementAccounts,
    total_property_value: data.totalPropertyValue,
    total_business_ownership: data.totalBusinessOwnership,
    total_other_assets: data.totalOtherAssets,
    credit_card_debt: data.creditCardDebt,
    personal_loan_debt: data.personalLoanDebt,
    student_loan_debt: data.studentLoanDebt,
    mortgage_debt: data.mortgageDebt,
    car_loan_debt: data.carLoanDebt,
    other_debts: data.otherDebts,
    total_savings: totalSavings,
    total_debt: totalLiab,
    updated_at: new Date().toISOString(),
  });

  return { error: result.error, profileId: id };
}

export async function saveStepGoals(
  userId: string,
  data: {
    goals: { title: string; targetAmount: number }[];
    retirementAgeTarget: number | null;
    emergencyFundTargetMonths: number;
    investmentHorizonYears: number;
    majorPurchasesPlanned: string[];
  },
  profileId?: string | null
): Promise<{ error?: unknown; profileId?: string }> {
  const supabase = await getServerClient();
  const existingId = await getExistingProfileId(supabase, userId);
  const id = resolveProfileId(existingId, profileId);

  const profileResult = await supabase.from("financial_profiles").upsert({
    id,
    user_id: userId,
    retirement_age_target: data.retirementAgeTarget,
    emergency_fund_target_months: data.emergencyFundTargetMonths,
    investment_horizon_years: data.investmentHorizonYears,
    major_purchases_planned: data.majorPurchasesPlanned,
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

  const goalInserts = data.goals.map((g, i) => ({
    user_id: userId,
    title: g.title,
    target_amount: g.targetAmount,
    current_amount: 0,
    priority: String(i + 1),
    status: "active",
  }));

  if (goalInserts.length > 0) {
    await supabase.from("financial_goals").insert(goalInserts);
  }

  return { error: profileResult.error, profileId: id };
}

export async function saveStepRisk(
  userId: string,
  data: {
    answers: { questionKey: string; answer: string; score: number }[];
  },
  profileId?: string | null
): Promise<{ error?: unknown; profileId?: string }> {
  const supabase = await getServerClient();
  const existingId = await getExistingProfileId(supabase, userId);
  const id = resolveProfileId(existingId, profileId);

  const { score, profile } = calculateRiskProfile(data.answers);

  const profileResult = await supabase.from("financial_profiles").upsert({
    id,
    user_id: userId,
    risk_answers: data.answers,
    risk_score: score,
    risk_profile: profile,
    updated_at: new Date().toISOString(),
  });

  const existing = await supabase
    .from("risk_assessments")
    .select("id")
    .eq("user_id", userId);

  if (existing.data && existing.data.length > 0) {
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

  return { error: profileResult.error, profileId: id };
}

export async function completeOnboarding(userId: string, profileId?: string) {
  const supabase = await getServerClient();

  const query = supabase
    .from("financial_profiles")
    .select("*");

  if (profileId) {
    query.eq("id", profileId);
  } else {
    query.eq("user_id", userId);
  }

  const { data: profile } = await query.maybeSingle();

  if (!profile) {
    return { error: "Financial profile not found. The financial_profiles table may not exist in your Supabase project — run the setup migration first." };
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
