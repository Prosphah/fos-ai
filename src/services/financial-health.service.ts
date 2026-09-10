import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatCompactValue, formatPercent } from "@/lib/format";
import { toLocalDateString } from "@/lib/date";
import type { FinancialProfile, FinancialGoal, RiskAssessment } from "@/types/database";
import {
  calculateSavingsRate,
  calculateDebtRatio,
  calculateNetWorth,
  calculateEmergencyFundMonths,
  calculateFinancialHealthScore,
} from "./onboarding.service";

export { formatCompactValue } from "@/lib/format";

export type SnapshotPeriod = "daily" | "monthly" | "annually";

export interface SnapshotMetric {
  id: string;
  title: string;
  value: string;
  trend: string;
  positive: boolean;
  icon: "trending-up" | "trending-down" | "wallet" | "arrow-up-right";
}

export interface RiskItem {
  id: string;
  title: string;
  status: string;
  statusColor: "amber" | "green";
  description: string;
  sparklineData: number[];
}

export interface ActionItem {
  id: string;
  title: string;
  description: string;
  impact: "High Impact" | "Medium Impact";
  impactLevel: "high" | "medium";
  icon: "shield" | "trending-down" | "pie-chart";
  cta: string;
}

export interface ChartDataPoint {
  month: string;
  value: number;
}

export interface BriefingData {
  metrics: SnapshotMetric[];
  chartData: ChartDataPoint[];
  chartValue: string;
  chartTrend: string;
  currency: string;
  riskItems: RiskItem[];
  actionItems: ActionItem[];
  financialHealthScore: number;
  scoreDelta: number;
}

const emptyBriefing: BriefingData = {
  financialHealthScore: 0,
  scoreDelta: 0,
  metrics: [],
  chartData: [],
  chartValue: "",
  chartTrend: "",
  currency: "USD",
  riskItems: [],
  actionItems: [],
};

async function buildMetrics(profile: FinancialProfile, currency: string, period: SnapshotPeriod): Promise<SnapshotMetric[]> {
  const supabase = await createClient();
  const userId = profile.user_id;
  const now = new Date();

  let periodStart: string;
  let periodEnd: string;
  let previousPeriodStart: string;
  let previousPeriodEnd: string;

  switch (period) {
    case "daily": {
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
      const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

      periodStart = toLocalDateString(today);
      periodEnd = toLocalDateString(tomorrow);

      previousPeriodStart = toLocalDateString(yesterday);
      previousPeriodEnd = toLocalDateString(today);
      break;
    }
    case "annually": {
      const currentYear = now.getFullYear();
      periodStart = `${currentYear}-01-01`;
      periodEnd = `${currentYear + 1}-01-01`;

      const previousYear = currentYear - 1;
      previousPeriodStart = `${previousYear}-01-01`;
      previousPeriodEnd = `${previousYear + 1}-01-01`;
      break;
    }
    case "monthly": {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      periodStart = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
      periodEnd = `${currentYear}-${String(currentMonth + 2).padStart(2, "0")}-01`;

      const previousMonth = currentMonth - 1 < 0 ? 11 : currentMonth - 1;
      const previousYear = currentMonth - 1 < 0 ? currentYear - 1 : currentYear;
      previousPeriodStart = `${previousYear}-${String(previousMonth + 1).padStart(2, "0")}-01`;
      previousPeriodEnd = `${previousYear}-${String(previousMonth + 2).padStart(2, "0")}-01`;
      break;
    }
    default: {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      periodStart = `${currentYear}-${String(currentMonth + 1).padStart(2, "0")}-01`;
      periodEnd = `${currentYear}-${String(currentMonth + 2).padStart(2, "0")}-01`;
      previousPeriodStart = `${currentYear}-01-01`;
      previousPeriodEnd = `${currentYear + 1}-01-01`;
    }
  }

  const [currentResults, previousResults, { data: accounts }] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", userId)
      .gte("transaction_date", periodStart)
      .lt("transaction_date", periodEnd),
    supabase
      .from("transactions")
      .select("type, amount")
      .eq("user_id", userId)
      .gte("transaction_date", previousPeriodStart)
      .lt("transaction_date", previousPeriodEnd),
    supabase.from("accounts").select("balance").eq("user_id", userId).eq("is_active", true),
  ]);

  const assets = (accounts ?? []).reduce((s, a) => s + Number(a.balance), 0);

  const currentIncome = (currentResults.data ?? [])
    .filter((t: { type: string }) => t.type === "income")
    .reduce((s: number, t: { amount: number | string }) => s + Number(t.amount), 0);
  const currentExpenses = (currentResults.data ?? [])
    .filter((t: { type: string }) => t.type === "expense")
    .reduce((s: number, t: { amount: number | string }) => s + Number(t.amount), 0);

  const previousIncome = (previousResults.data ?? [])
    .filter((t: { type: string }) => t.type === "income")
    .reduce((s: number, t: { amount: number | string }) => s + Number(t.amount), 0);
  const previousExpenses = (previousResults.data ?? [])
    .filter((t: { type: string }) => t.type === "expense")
    .reduce((s: number, t: { amount: number | string }) => s + Number(t.amount), 0);

  const currentNetWorth = assets;
  const previousNetWorth = assets - currentIncome + currentExpenses;

  const incomeChange = previousIncome > 0 ? ((currentIncome - previousIncome) / previousIncome) * 100 : currentIncome > 0 ? 100 : 0;
  const expensesChange = previousExpenses > 0 ? ((currentExpenses - previousExpenses) / previousExpenses) * 100 : currentExpenses > 0 ? 100 : 0;
  const netWorthChange = previousNetWorth > 0 ? ((currentNetWorth - previousNetWorth) / previousNetWorth) * 100 : currentNetWorth > 0 ? 100 : 0;

  const currentSavingsRate = currentIncome > 0
      ? ((currentIncome - currentExpenses) / currentIncome) * 100
      : 0;
  const previousSavingsRate = previousIncome > 0
    ? ((previousIncome - previousExpenses) / previousIncome) * 100
    : 0;

  return [
    {
      id: "income",
      title: "Income",
      value: formatCompactValue(currentIncome, currency),
      trend: formatPercent(Math.round(incomeChange)),
      positive: incomeChange >= 0,
      icon: "trending-up",
    },
    {
      id: "expenses",
      title: "Expenses",
      value: formatCompactValue(currentExpenses, currency),
      trend: formatPercent(Math.round(expensesChange)),
      positive: expensesChange <= 0,
      icon: "trending-down",
    },
    {
      id: "savings",
      title: "Savings Rate",
      value: `${Math.round(currentSavingsRate)}%`,
      trend: formatPercent(Math.round(currentSavingsRate - previousSavingsRate)),
      positive: currentSavingsRate >= previousSavingsRate,
      icon: "wallet",
    },
    {
      id: "networth",
      title: "Net Worth",
      value: formatCompactValue(currentNetWorth, currency),
      trend: formatPercent(Math.round(netWorthChange)),
      positive: netWorthChange >= 0,
      icon: "arrow-up-right",
    },
  ];
}

async function buildChartData(
  userId: string,
  currency: string,
  period: SnapshotPeriod
): Promise<{ chartData: ChartDataPoint[]; chartValue: string; chartTrend: string }> {
  const supabase = await createClient();
  const now = new Date();

  const buckets: { label: string; startDate: string; endDate: string }[] = [];

  if (period === "daily") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i);
      const nextDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i + 1);
      buckets.push({
        label: d.toLocaleString("en-US", { weekday: "short" }),
        startDate: toLocalDateString(d),
        endDate: toLocalDateString(nextDay),
      });
    }
  } else if (period === "annually") {
    for (let i = 4; i >= 0; i--) {
      const year = now.getFullYear() - i;
      buckets.push({
        label: String(year),
        startDate: `${year}-01-01`,
        endDate: `${year + 1}-01-01`,
      });
    }
  } else {
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const nextMonth = new Date(d.getFullYear(), d.getMonth() + 1, 1);
      buckets.push({
        label: d.toLocaleString("en-US", { month: "short" }),
        startDate: toLocalDateString(d),
        endDate: toLocalDateString(nextMonth),
      });
    }
  }

  const graphStart = buckets[0].startDate;
  const graphEnd = buckets[buckets.length - 1].endDate;

  const [{ data: accounts }, { data: transactions }] = await Promise.all([
    supabase
      .from("accounts")
      .select("id, balance, created_at")
      .eq("user_id", userId)
      .eq("is_active", true),
    supabase
      .from("transactions")
      .select("account_id, transfer_to_id, type, amount, transaction_date")
      .eq("user_id", userId)
      .gte("transaction_date", graphStart)
      .lte("transaction_date", graphEnd),
  ]);

  const accountList = (accounts ?? []).map((a) => ({
    id: a.id,
    balance: Number(a.balance),
    createdDate: a.created_at ? a.created_at.split("T")[0] : "0000-01-01",
  }));

  const txByAccount = new Map<string, { date: string; delta: number }[]>();
  for (const tx of transactions ?? []) {
    if (!tx.account_id) continue;
    const amount = Number(tx.amount);
    const deltas = tx.type === "transfer"
      ? [{ accountId: tx.account_id, delta: -amount }, ...(tx.transfer_to_id ? [{ accountId: tx.transfer_to_id, delta: amount }] : [])]
      : [{ accountId: tx.account_id, delta: tx.type === "income" ? amount : -amount }];
    for (const { accountId, delta } of deltas) {
      const existing = txByAccount.get(accountId) ?? [];
      existing.push({ date: tx.transaction_date, delta });
      txByAccount.set(accountId, existing);
    }
  }
  for (const [, txs] of txByAccount) {
    txs.sort((a, b) => b.date.localeCompare(a.date));
  }

  const chartData: ChartDataPoint[] = buckets.map((bucket) => {
    const endpoint = bucket.endDate;
    let netWorth = 0;

    for (const account of accountList) {
      if (account.createdDate > endpoint) continue;

      const txs = txByAccount.get(account.id) ?? [];
      let futureDeltaSum = 0;
      for (const tx of txs) {
        if (tx.date > endpoint) {
          futureDeltaSum += tx.delta;
        } else {
          break;
        }
      }

      netWorth += account.balance - futureDeltaSum;
    }

    return { month: bucket.label, value: Math.max(netWorth, 0) };
  });

  const latestNetWorth = chartData.length > 0 ? chartData[chartData.length - 1].value : 0;
  const chartValue = formatCompactValue(latestNetWorth, currency);

  const firstVal = chartData[0]?.value ?? 0;
  const lastVal = chartData[chartData.length - 1]?.value ?? 0;
  const pctChange = firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0;
  const chartTrend = chartData.length > 0 && (firstVal > 0 || lastVal > 0)
    ? formatPercent(pctChange)
    : "\u2014";

  return { chartData, chartValue, chartTrend };
}

function buildRiskItems(risk: RiskAssessment[]): RiskItem[] {
  if (risk.length === 0) return [];

  const latest = risk.reduce((a, b) => (new Date(a.created_at) > new Date(b.created_at) ? a : b));

  const score = latest.score ?? 50;

  const portfolioStatus = score > 70 ? "High" : score > 40 ? "Moderate" : "Low";
  const portfolioColor: "amber" | "green" = score > 40 ? "amber" : "green";
  const portfolioDesc = score > 70
    ? "Your portfolio has elevated risk. Consider rebalancing toward more stable assets."
    : score > 40
    ? "Your portfolio has moderate concentration in tech stocks. Consider diversifying across sectors."
    : "Your portfolio risk is well-managed. Continue your current strategy.";

  return [
    { id: "portfolio", title: "Portfolio Risk", status: portfolioStatus, statusColor: portfolioColor, description: portfolioDesc, sparklineData: [65, 68, 64, 70, 72, 68, 71] },
    { id: "debt", title: "Debt", status: "Low", statusColor: "green", description: "Your debt-to-income ratio is healthy. Continue your current repayment schedule.", sparklineData: [45, 40, 38, 32, 28, 25, 22] },
    { id: "liquidity", title: "Liquidity", status: "Good", statusColor: "green", description: "You have 4.2 months of emergency savings. You're on track to reach your 6-month goal.", sparklineData: [30, 35, 38, 42, 45, 48, 52] },
  ];
}

function buildActionItems(goals: FinancialGoal[], currency: string): ActionItem[] {
  if (goals.length === 0) return [];

  const items: ActionItem[] = [];

  const incompleteGoals = goals.filter((g) => g.status !== "completed");
  for (const goal of incompleteGoals.slice(0, 3)) {
    const target = goal.target_amount ?? 0;
    const current = goal.current_amount ?? 0;
    const progress = target > 0 ? Math.round((current / target) * 100) : 0;

    items.push({
      id: `goal-${goal.id}`,
      title: goal.title ?? "Financial Goal",
      description: `You're ${progress}% toward your goal of ${formatCurrency(target, currency)}. Consider increasing your contribution to stay on track.`,
      impact: progress < 50 ? "High Impact" : "Medium Impact",
      impactLevel: progress < 50 ? "high" : "medium",
      icon: "shield",
      cta: "View Goal",
    });
  }

  return items;
}

function monthlyExpenses(p: Partial<FinancialProfile>): number {
  return (p.monthly_living_expenses ?? 0) + (p.debt_repayments_monthly ?? 0);
}

async function fetchProfile(supabase: ReturnType<typeof createClient> extends Promise<infer R> ? R : never, userId: string) {
  const [profileRes, goalsRes, riskRes] = await Promise.all([
    supabase.from("financial_profiles").select("*").eq("user_id", userId).maybeSingle(),
    supabase.from("financial_goals").select("*").eq("user_id", userId),
    supabase.from("risk_assessments").select("*").eq("user_id", userId),
  ]);

  return { profile: profileRes.data, goals: goalsRes.data ?? [], risk: riskRes.data ?? [] };
}

export async function getBriefingData(userId?: string): Promise<BriefingData> {
  if (!userId) return emptyBriefing;

  const supabase = await createClient();
  const { profile, goals, risk } = await fetchProfile(supabase, userId);

  if (!profile) return emptyBriefing;

  if (!profile.onboarding_completed && profile.risk_score != null) {
    const p = profile as Partial<FinancialProfile>;
    const income = p.monthly_income ?? 0;
    const exp = monthlyExpenses(p);
    const sr = calculateSavingsRate(income, exp);
    const dr = calculateDebtRatio(p as FinancialProfile);
    const nw = calculateNetWorth(p as FinancialProfile);
    const ef = calculateEmergencyFundMonths(p.total_cash ?? 0, exp);
    const rs = p.risk_score ?? 50;
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

    profile.financial_health_score = fhs;
    profile.onboarding_completed = true;
  }

  const currency = profile.currency ?? "USD";
  const [metrics, { chartData, chartValue, chartTrend }] = await Promise.all([
    buildMetrics(profile as FinancialProfile, currency, "monthly"),
    buildChartData(userId, currency, "monthly"),
  ]);
  const riskItems = buildRiskItems(risk);
  const actionItems = buildActionItems(goals, currency);

  const scoreDelta = (profile.financial_health_score ?? 0) - (profile.previous_financial_health_score ?? profile.financial_health_score ?? 0);

  return {
    metrics,
    chartData,
    chartValue,
    chartTrend,
    currency,
    riskItems,
    actionItems,
    financialHealthScore: profile.financial_health_score ?? 0,
    scoreDelta,
  };
}

export async function getBriefingDataByPeriod(userId: string, period: SnapshotPeriod): Promise<{ metrics: SnapshotMetric[]; chartData: ChartDataPoint[]; chartValue: string; chartTrend: string; currency: string }> {
  if (!userId) return { metrics: [], chartData: [], chartValue: "", chartTrend: "", currency: "USD" };

  const supabase = await createClient();
  const { profile } = await fetchProfile(supabase, userId);

  if (!profile) return { metrics: [], chartData: [], chartValue: "", chartTrend: "", currency: "USD" };

  const currency = profile.currency ?? "USD";
  const [metrics, { chartData, chartValue, chartTrend }] = await Promise.all([
    buildMetrics(profile as FinancialProfile, currency, period),
    buildChartData(userId, currency, period),
  ]);

  return { metrics, chartData, chartValue, chartTrend, currency };
}

export async function getFinancialSnapshot(userId?: string): Promise<SnapshotMetric[]> {
  const data = await getBriefingData(userId);
  return data.metrics;
}
