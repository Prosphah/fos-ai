export interface FinancialProfile {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string | null;

  // Personal Snapshot
  age: number | null;
  country: string | null;
  currency: string | null;
  employment_status: string | null;
  monthly_income: number | null;
  income_frequency: string | null;

  // Cash Flow
  monthly_expenses: number | null;
  monthly_living_expenses: number | null;
  debt_repayments_monthly: number | null;
  monthly_savings: number | null;
  other_income: number | null;
  expected_major_expenses: string[] | null;

  // Assets
  total_cash: number | null;
  total_investments: number | null;
  total_retirement_accounts: number | null;
  total_property_value: number | null;
  total_business_ownership: number | null;
  total_other_assets: number | null;

  // Liabilities
  credit_card_debt: number | null;
  personal_loan_debt: number | null;
  student_loan_debt: number | null;
  mortgage_debt: number | null;
  car_loan_debt: number | null;
  other_debts: number | null;

  // Goals
  retirement_age_target: number | null;
  emergency_fund_target_months: number | null;
  investment_horizon_years: number | null;
  major_purchases_planned: string[] | null;

  // Risk
  risk_answers: RiskAnswer[] | null;
  risk_score: number | null;
  risk_profile: string | null;

  // Derived metrics
  total_savings: number | null;
  total_debt: number | null;
  net_worth: number | null;
  debt_ratio: number | null;
  savings_rate: number | null;
  emergency_fund_months: number | null;
  investment_experience: string | null;
  financial_goals: string | null;
  financial_health_score: number | null;
  onboarding_completed: boolean | null;
  onboarding_completed_at: string | null;
}

export interface RiskAnswer {
  questionKey: string;
  answer: string;
  score: number;
}

export interface FinancialGoal {
  id: string;
  user_id: string;
  created_at: string;
  title: string | null;
  target_amount: number | null;
  target_date: string | null;
  current_amount: number | null;
  priority: string | null;
  status: string | null;
}

export interface RiskAssessment {
  id: string;
  user_id: string;
  created_at: string;
  score: number | null;
  category: string | null;
}

export interface FinancialEvent {
  id: string;
  user_id: string;
  created_at: string;
  event_type: string | null;
}

// =============================================
// Money Manager
// =============================================

export type CategoryType = "income" | "expense" | "both";
export type AccountType = "cash" | "savings" | "investment" | "credit" | "other";
export type TransactionType = "income" | "expense" | "transfer";
export type SavingsGoalStatus = "active" | "completed" | "paused";

export interface UserSettings {
  user_id: string;
  currency: string;
  monthly_budget: number;
  reminder_enabled: boolean;
  reminder_time: string;
  reminder_days: number[];
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string | null;
  color: string | null;
  type: CategoryType;
  is_system: boolean;
  created_at: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: AccountType;
  balance: number;
  currency: string;
  is_active: boolean;
  institution: string | null;
  account_number_last4: string | null;
  created_at: string;
  updated_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  category_id: string | null;
  account_id: string | null;
  transfer_to_id: string | null;
  type: TransactionType;
  amount: number;
  description: string;
  transaction_date: string;
  notes: string | null;
  tags: string[] | null;
  is_recurring: boolean;
  recurring_config: RecurringConfig | null;
  created_at: string;
  updated_at: string;
}

export interface RecurringConfig {
  frequency: "daily" | "weekly" | "monthly" | "yearly";
  end_date: string | null;
  interval: number;
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  month: number;
  year: number;
  amount: number;
  created_at: string;
  updated_at: string;
}

export interface SavingsGoal {
  id: string;
  user_id: string;
  account_id: string | null;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date: string | null;
  status: SavingsGoalStatus;
  created_at: string;
  updated_at: string;
}
