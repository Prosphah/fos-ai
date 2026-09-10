import { createClient } from "@/lib/supabase/server";
import type {
  UserSettings,
  Category,
  Account,
  Transaction,
  Budget,
  SavingsGoal,
} from "@/types/database";

async function getServerClient() {
  return await createClient();
}

// =============================================
// User Settings
// =============================================

export async function getUserSettings(
  userId: string
): Promise<UserSettings | null> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  return data;
}

export async function upsertUserSettings(
  userId: string,
  data: {
    currency?: string;
    monthlyBudget?: number;
    reminderEnabled?: boolean;
    reminderTime?: string;
    reminderDays?: number[];
  }
): Promise<{ error?: unknown }> {
  const supabase = await getServerClient();
  const result = await supabase.rpc("upsert_user_settings", {
    p_user_id: userId,
    p_currency: data.currency ?? null,
    p_monthly_budget: data.monthlyBudget ?? null,
    p_reminder_enabled: data.reminderEnabled ?? null,
    p_reminder_time: data.reminderTime ?? null,
    p_reminder_days: data.reminderDays ?? null,
  });
  return { error: result.error };
}

// =============================================
// Categories
// =============================================

export async function getCategories(
  userId: string
): Promise<Category[]> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .or(`user_id.is.null,user_id.eq.${userId}`)
    .order("is_system", { ascending: false })
    .order("name");
  return data ?? [];
}

export async function createCategory(
  userId: string,
  data: {
    name: string;
    icon?: string | null;
    color?: string | null;
    type?: "income" | "expense" | "both";
  }
): Promise<{ error?: unknown; category?: Category }> {
  const supabase = await getServerClient();
  const { data: category, error } = await supabase
    .from("categories")
    .insert({
      user_id: userId,
      name: data.name,
      icon: data.icon ?? null,
      color: data.color ?? null,
      type: data.type ?? "expense",
    })
    .select()
    .single();
  return { error, category };
}

export async function deleteCategory(
  userId: string,
  categoryId: string
): Promise<{ error?: unknown }> {
  const supabase = await getServerClient();
  const { error } = await supabase
    .from("categories")
    .delete()
    .eq("id", categoryId)
    .eq("user_id", userId)
    .eq("is_system", false);
  return { error };
}

// =============================================
// Accounts
// =============================================

export async function getAccounts(userId: string): Promise<Account[]> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("is_active", true)
    .order("name");
  return data ?? [];
}

export async function getAccount(
  userId: string,
  accountId: string
): Promise<Account | null> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("accounts")
    .select("*")
    .eq("user_id", userId)
    .eq("id", accountId)
    .maybeSingle();
  return data;
}

export async function createAccount(
  userId: string,
  data: {
    name: string;
    type: "cash" | "current" | "savings" | "investment" | "credit" | "other";
    balance?: number;
    currency?: string;
    institution?: string | null;
    accountNumberLast4?: string | null;
  }
): Promise<{ error?: unknown; account?: Account }> {
  const supabase = await getServerClient();
  const { data: account, error } = await supabase
    .from("accounts")
    .insert({
      user_id: userId,
      name: data.name,
      type: data.type,
      balance: data.balance ?? 0,
      currency: data.currency ?? "USD",
      institution: data.institution ?? null,
      account_number_last4: data.accountNumberLast4 ?? null,
    })
    .select()
    .single();
  return { error, account };
}

export async function updateAccount(
  userId: string,
  accountId: string,
  data: {
    name?: string;
    type?: "cash" | "current" | "savings" | "investment" | "credit" | "other";
    balance?: number;
    institution?: string | null;
    accountNumberLast4?: string | null;
    isActive?: boolean;
  }
): Promise<{ error?: unknown }> {
  const supabase = await getServerClient();
  const { error } = await supabase
    .from("accounts")
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.type !== undefined && { type: data.type }),
      ...(data.balance !== undefined && { balance: data.balance }),
      ...(data.institution !== undefined && { institution: data.institution }),
      ...(data.accountNumberLast4 !== undefined && {
        account_number_last4: data.accountNumberLast4,
      }),
      ...(data.isActive !== undefined && { is_active: data.isActive }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", accountId)
    .eq("user_id", userId);
  return { error };
}

export async function deleteAccount(
  userId: string,
  accountId: string
): Promise<{ error?: unknown }> {
  const supabase = await getServerClient();
  const { error } = await supabase
    .from("accounts")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", accountId)
    .eq("user_id", userId);
  return { error };
}

// =============================================
// Transactions (RPC)
// =============================================

export async function recordTransaction(
  userId: string,
  data: {
    categoryId?: string | null;
    accountId?: string | null;
    transferToId?: string | null;
    type: "income" | "expense" | "transfer";
    amount: number;
    description: string;
    date: string;
    notes?: string | null;
    tags?: string[] | null;
    isRecurring?: boolean;
    recurringConfig?: {
      frequency: "daily" | "weekly" | "monthly" | "yearly";
      end_date?: string | null;
      interval?: number;
    } | null;
  }
): Promise<{ error?: unknown; txId?: string }> {
  const supabase = await getServerClient();
  const { data: txId, error } = await supabase.rpc("record_transaction", {
    p_user_id: userId,
    p_category_id: data.categoryId ?? null,
    p_account_id: data.accountId ?? null,
    p_type: data.type,
    p_amount: data.amount,
    p_description: data.description,
    p_date: data.date,
    p_notes: data.notes ?? null,
    p_tags: data.tags ?? null,
    p_transfer_to_id: data.transferToId ?? null,
    p_is_recurring: data.isRecurring ?? false,
    p_recurring_config: data.recurringConfig ?? null,
  });
  return { error, txId };
}

export async function deleteTransaction(
  userId: string,
  txId: string
): Promise<{ error?: unknown; deleted?: boolean }> {
  const supabase = await getServerClient();
  const { data, error } = await supabase.rpc("delete_transaction", {
    p_tx_id: txId,
    p_user_id: userId,
  });
  return { error, deleted: data };
}

export async function getTransactions(
  userId: string,
  opts?: {
    startDate?: string;
    endDate?: string;
    type?: "income" | "expense" | "transfer";
    categoryId?: string;
    accountId?: string;
    limit?: number;
    offset?: number;
  }
): Promise<Transaction[]> {
  const supabase = await getServerClient();
  let query = supabase
    .from("transactions")
    .select("*")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (opts?.startDate) query = query.gte("transaction_date", opts.startDate);
  if (opts?.endDate) query = query.lte("transaction_date", opts.endDate);
  if (opts?.type) query = query.eq("type", opts.type);
  if (opts?.categoryId) query = query.eq("category_id", opts.categoryId);
  if (opts?.accountId) query = query.eq("account_id", opts.accountId);
  if (opts?.limit) query = query.limit(opts.limit);
  if (opts?.offset) query = query.range(opts.offset, opts.offset + (opts.limit ?? 50) - 1);

  const { data } = await query;
  return data ?? [];
}

export async function getTransactionsSummary(
  userId: string,
  month: number,
  year: number
): Promise<{
  totalIncome: number;
  totalExpenses: number;
  byCategory: { categoryId: string; name: string; amount: number; color: string | null }[];
  byAccount: { accountId: string; name: string; amount: number }[];
}> {
  const supabase = await getServerClient();

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data: transactions } = await supabase
    .from("transactions")
    .select("type, amount, category_id, account_id")
    .eq("user_id", userId)
    .gte("transaction_date", startDate)
    .lt("transaction_date", endDate);

  if (!transactions || transactions.length === 0) {
    return { totalIncome: 0, totalExpenses: 0, byCategory: [], byAccount: [] };
  }

  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + Number(t.amount), 0);

  // Group by category
  const catMap = new Map<string, number>();
  for (const t of transactions) {
    if (t.category_id && t.type !== "transfer") {
      catMap.set(t.category_id, (catMap.get(t.category_id) ?? 0) + Number(t.amount));
    }
  }

  let byCategory: { categoryId: string; name: string; amount: number; color: string | null }[] = [];
  if (catMap.size > 0) {
    const { data: cats } = await supabase
      .from("categories")
      .select("id, name, color")
      .in("id", [...catMap.keys()]);

    const catLookup = new Map((cats ?? []).map((c) => [c.id, c]));
    byCategory = [...catMap.entries()].map(([catId, amount]) => ({
      categoryId: catId,
      name: catLookup.get(catId)?.name ?? "Unknown",
      amount,
      color: catLookup.get(catId)?.color ?? null,
    }));
  }

  // Group by account
  const accMap = new Map<string, number>();
  for (const t of transactions) {
    if (t.account_id) {
      accMap.set(t.account_id, (accMap.get(t.account_id) ?? 0) + Number(t.amount));
    }
  }

  let byAccount: { accountId: string; name: string; amount: number }[] = [];
  if (accMap.size > 0) {
    const { data: accs } = await supabase
      .from("accounts")
      .select("id, name")
      .in("id", [...accMap.keys()]);

    const accLookup = new Map((accs ?? []).map((a) => [a.id, a]));
    byAccount = [...accMap.entries()].map(([accId, amount]) => ({
      accountId: accId,
      name: accLookup.get(accId)?.name ?? "Unknown",
      amount,
    }));
  }

  return { totalIncome, totalExpenses, byCategory, byAccount };
}

// =============================================
// Budgets (RPC)
// =============================================

export async function upsertBudget(
  userId: string,
  data: {
    categoryId?: string | null;
    month: number;
    year: number;
    amount: number;
  }
): Promise<{ error?: unknown; budgetId?: string }> {
  const supabase = await getServerClient();
  const { data: budgetId, error } = await supabase.rpc("upsert_budget", {
    p_user_id: userId,
    p_category_id: data.categoryId ?? null,
    p_month: data.month,
    p_year: data.year,
    p_amount: data.amount,
  });
  return { error, budgetId };
}

export async function getBudgets(
  userId: string,
  month: number,
  year: number
): Promise<(Budget & { spent: number; categoryName: string | null })[]> {
  const supabase = await getServerClient();

  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const { data: budgets } = await supabase
    .from("budgets")
    .select("*, categories(name)")
    .eq("user_id", userId)
    .eq("month", month)
    .eq("year", year);

  if (!budgets || budgets.length === 0) return [];

  // Get spending for each budget
  const results = await Promise.all(
    budgets.map(async (b) => {
      let query = supabase
        .from("transactions")
        .select("amount")
        .eq("user_id", userId)
        .eq("type", "expense")
        .gte("transaction_date", startDate)
        .lt("transaction_date", endDate);

      if (b.category_id) {
        query = query.eq("category_id", b.category_id);
      } else {
        // Total budget — sum all expenses
        query = query.not("type", "eq", "transfer");
      }

      const { data: txs } = await query;
      const spent = (txs ?? []).reduce((sum, t) => sum + Number(t.amount), 0);

      return {
        ...b,
        spent,
        categoryName: (b.categories as { name: string } | null)?.name ?? null,
      };
    })
  );

  return results;
}

export async function deleteBudget(
  userId: string,
  budgetId: string
): Promise<{ error?: unknown }> {
  const supabase = await getServerClient();
  const { error } = await supabase
    .from("budgets")
    .delete()
    .eq("id", budgetId)
    .eq("user_id", userId);
  return { error };
}

// =============================================
// Savings Goals
// =============================================

export async function getSavingsGoals(
  userId: string
): Promise<SavingsGoal[]> {
  const supabase = await getServerClient();
  const { data } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function createSavingsGoal(
  userId: string,
  data: {
    name: string;
    targetAmount: number;
    targetDate?: string | null;
    accountId?: string | null;
  }
): Promise<{ error?: unknown; goal?: SavingsGoal }> {
  const supabase = await getServerClient();
  const { data: goal, error } = await supabase
    .from("savings_goals")
    .insert({
      user_id: userId,
      name: data.name,
      target_amount: data.targetAmount,
      target_date: data.targetDate ?? null,
      account_id: data.accountId ?? null,
    })
    .select()
    .single();
  return { error, goal };
}

export async function updateSavingsGoal(
  userId: string,
  goalId: string,
  data: {
    name?: string;
    targetAmount?: number;
    targetDate?: string | null;
    currentAmount?: number;
    status?: "active" | "completed" | "paused";
  }
): Promise<{ error?: unknown }> {
  const supabase = await getServerClient();
  const { error } = await supabase
    .from("savings_goals")
    .update({
      ...(data.name !== undefined && { name: data.name }),
      ...(data.targetAmount !== undefined && { target_amount: data.targetAmount }),
      ...(data.targetDate !== undefined && { target_date: data.targetDate }),
      ...(data.currentAmount !== undefined && { current_amount: data.currentAmount }),
      ...(data.status !== undefined && { status: data.status }),
      updated_at: new Date().toISOString(),
    })
    .eq("id", goalId)
    .eq("user_id", userId);
  return { error };
}

export async function deleteSavingsGoal(
  userId: string,
  goalId: string
): Promise<{ error?: unknown }> {
  const supabase = await getServerClient();
  const { error } = await supabase
    .from("savings_goals")
    .delete()
    .eq("id", goalId)
    .eq("user_id", userId);
  return { error };
}

// =============================================
// Dashboard Aggregates
// =============================================

export async function getMoneyManagerDashboard(userId: string): Promise<{
  accounts: Account[];
  recentTransactions: Transaction[];
  currentMonth: {
    income: number;
    expenses: number;
    savingsRate: number;
  };
  budgetProgress: {
    totalBudget: number;
    totalSpent: number;
    percentage: number;
    categories: {
      categoryId: string | null;
      categoryName: string | null;
      amount: number;
      spent: number;
    }[];
  };
  savingsGoals: SavingsGoal[];
  currency: string;
}> {
  const supabase = await getServerClient();
  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const startDate = `${year}-${String(month).padStart(2, "0")}-01`;
  const endMonth = month === 12 ? 1 : month + 1;
  const endYear = month === 12 ? year + 1 : year;
  const endDate = `${endYear}-${String(endMonth).padStart(2, "0")}-01`;

  const [accountsRes, txRes, budgetRes, goalsRes, settingsRes, categoriesRes] = await Promise.all([
    supabase
      .from("accounts")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true),
    supabase
      .from("transactions")
      .select("type, amount, category_id")
      .eq("user_id", userId)
      .gte("transaction_date", startDate)
      .lt("transaction_date", endDate),
    supabase
      .from("budgets")
      .select("category_id, amount")
      .eq("user_id", userId)
      .eq("month", month)
      .eq("year", year),
    supabase
      .from("savings_goals")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active"),
    supabase
      .from("user_settings")
      .select("monthly_budget, currency")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("categories")
      .select("id, name")
      .or(`user_id.is.null,user_id.eq.${userId}`),
  ]);

  const accounts = accountsRes.data ?? [];
  const transactions = txRes.data ?? [];
  const budgets = budgetRes.data ?? [];
  const goals = goalsRes.data ?? [];
  const categoryNames = categoriesRes.data ?? [];

  const categoryNameMap = new Map(categoryNames.map((c) => [c.id, c.name]));

  const income = transactions
    .filter((t) => t.type === "income")
    .reduce((s, t) => s + Number(t.amount), 0);
  const expenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((s, t) => s + Number(t.amount), 0);

  const savingsRate = income > 0 ? Math.round(((income - expenses) / income) * 100) : 0;

  const spendingByCategory = new Map<string, number>();
  for (const tx of transactions) {
    if (tx.type !== "expense" || !tx.category_id) continue;
    spendingByCategory.set(
      tx.category_id,
      (spendingByCategory.get(tx.category_id) ?? 0) + Number(tx.amount)
    );
  }

  const categoryBudgets = budgets.map((b) => ({
    categoryId: b.category_id,
    categoryName: b.category_id ? (categoryNameMap.get(b.category_id) ?? null) : null,
    amount: Number(b.amount),
    spent: b.category_id ? (spendingByCategory.get(b.category_id) ?? 0) : expenses,
  }));

  const totalBudget = budgets.reduce((s, b) => s + Number(b.amount), 0);
  const totalSpent = expenses;
  const budgetPercentage =
    totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  return {
    accounts,
    recentTransactions: [],
    currentMonth: { income, expenses, savingsRate },
    budgetProgress: {
      totalBudget: settingsRes.data?.monthly_budget || totalBudget,
      totalSpent,
      percentage: budgetPercentage,
      categories: categoryBudgets,
    },
    savingsGoals: goals,
    currency: settingsRes.data?.currency ?? "USD",
  };
}
