import { createClient } from "@/lib/supabase/server";
import { formatCurrency, formatCompactValue, formatPercent } from "@/lib/format";
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
}

const emptyBriefing: BriefingData = {
  financialHealthScore: 0,
  metrics: [],
  chartData: [],
  chartValue: "",
  chartTrend: "",
  currency: "USD",
  riskItems: [],
  actionItems: [],
};

function netWorth(profile: FinancialProfile): number {
  return (profile.total_savings ?? 0) - (profile.total_debt ?? 0);
}

function buildMetrics(profile: FinancialProfile, currency: string, period: SnapshotPeriod): SnapshotMetric[] {
  const monthlyIncome = profile.monthly_income ?? 0;
  const monthlyExpenses = profile.monthly_expenses ?? 0;
  const nw = netWorth(profile);
  const sr = profile.savings_rate ?? 0;

  let income: number;
  let expenses: number;

  switch (period) {
    case "daily":
      income = Math.round(monthlyIncome / 30);
      expenses = Math.round(monthlyExpenses / 30);
      break;
    case "annually":
      income = monthlyIncome * 12;
      expenses = monthlyExpenses * 12;
      break;
    default:
      income = monthlyIncome;
      expenses = monthlyExpenses;
  }

  return [
    { id: "income", title: "Income", value: formatCompactValue(income, currency), trend: "\u2014", positive: true, icon: "trending-up" },
    { id: "expenses", title: "Expenses", value: formatCompactValue(expenses, currency), trend: "\u2014", positive: true, icon: "trending-down" },
    { id: "savings", title: "Savings Rate", value: `${sr}%`, trend: "\u2014", positive: true, icon: "wallet" },
    { id: "networth", title: "Net Worth", value: formatCompactValue(nw, currency), trend: "\u2014", positive: true, icon: "arrow-up-right" },
  ];
}

async function buildChartData(
  userId: string,
  nw: number,
  currency: string,
  period: SnapshotPeriod
): Promise<{ chartData: ChartDataPoint[]; chartValue: string; chartTrend: string }> {
  const supabase = await createClient();
  const now = new Date();

  let buckets: { label: string; startDate: string; endDate: string }[] = [];

  if (period === "daily") {
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const nextDay = new Date(d);
      nextDay.setDate(nextDay.getDate() + 1);
      buckets.push({
        label: d.toLocaleString("en-US", { weekday: "short" }),
        startDate: d.toISOString().split("T")[0],
        endDate: nextDay.toISOString().split("T")[0],
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
        startDate: d.toISOString().split("T")[0],
        endDate: nextMonth.toISOString().split("T")[0],
      });
    }
  }

  const results = await Promise.all(
    buckets.map((b) =>
      supabase
        .from("transactions")
        .select("type, amount")
        .eq("user_id", userId)
        .gte("transaction_date", b.startDate)
        .lt("transaction_date", b.endDate)
    )
  );

  const bucketNet = results.map((res, i) => {
    const txs = res.data ?? [];
    const income = txs
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + Number(t.amount), 0);
    const expenses = txs
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Number(t.amount), 0);
    return { label: buckets[i].label, net: income - expenses };
  });

  const hasRealData = bucketNet.some((m) => m.net !== 0);

  let chartData: ChartDataPoint[];
  if (hasRealData) {
    const base = nw > 0 ? nw : 0;
    let cumulative = base - bucketNet.reduce((s, m) => s + m.net, 0);
    chartData = bucketNet.map((m) => {
      cumulative += m.net;
      return { month: m.label, value: Math.max(cumulative, 0) };
    });
  } else {
    const base = nw > 0 ? nw : 48200;
    const start = Math.round(base * 0.8);
    const step = Math.round((base - start) / (buckets.length - 1 || 1));
    chartData = buckets.map((m, i) => ({ month: m.label, value: start + step * i }));
  }

  const chartValue = formatCompactValue(nw > 0 ? nw : chartData[chartData.length - 1]?.value ?? 0, currency);
  const firstVal = chartData[0]?.value ?? 0;
  const lastVal = chartData[chartData.length - 1]?.value ?? 0;
  const pctChange = firstVal > 0 ? ((lastVal - firstVal) / firstVal) * 100 : 0;
  const chartTrend = hasRealData ? formatPercent(pctChange) : "\u2014";

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
  const metrics = buildMetrics(profile as FinancialProfile, currency, "monthly");
  const nw = netWorth(profile as FinancialProfile);
  const { chartData, chartValue, chartTrend } = await buildChartData(userId, nw, currency, "monthly");
  const riskItems = buildRiskItems(risk);
  const actionItems = buildActionItems(goals, currency);

  return {
    metrics,
    chartData,
    chartValue,
    chartTrend,
    currency,
    riskItems,
    actionItems,
    financialHealthScore: profile.financial_health_score ?? 0,
  };
}

export async function getBriefingDataByPeriod(userId: string, period: SnapshotPeriod): Promise<{ metrics: SnapshotMetric[]; chartData: ChartDataPoint[]; chartValue: string; chartTrend: string; currency: string }> {
  if (!userId) return { metrics: [], chartData: [], chartValue: "", chartTrend: "", currency: "USD" };

  const supabase = await createClient();
  const { profile } = await fetchProfile(supabase, userId);

  if (!profile) return { metrics: [], chartData: [], chartValue: "", chartTrend: "", currency: "USD" };

  const currency = profile.currency ?? "USD";
  const metrics = buildMetrics(profile as FinancialProfile, currency, period);
  const nw = netWorth(profile as FinancialProfile);
  const { chartData, chartValue, chartTrend } = await buildChartData(userId, nw, currency, period);

  return { metrics, chartData, chartValue, chartTrend, currency };
}

export async function getFinancialSnapshot(userId?: string): Promise<SnapshotMetric[]> {
  const data = await getBriefingData(userId);
  return data.metrics;
}
