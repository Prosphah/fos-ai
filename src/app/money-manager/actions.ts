"use server";

import { createClient } from "@/lib/supabase/server";
import {
  recordTransactionSchema,
  createAccountSchema,
  updateAccountSchema,
  upsertBudgetSchema,
  updateUserSettingsSchema,
  createCategorySchema,
  createSavingsGoalSchema,
  updateSavingsGoalSchema,
} from "@/lib/validation/money-manager";
import {
  getUserSettings,
  upsertUserSettings,
  getCategories,
  createCategory,
  deleteCategory,
  getAccounts,
  createAccount,
  updateAccount,
  deleteAccount,
  recordTransaction as serviceRecordTransaction,
  deleteTransaction as serviceDeleteTransaction,
  getTransactions,
  getTransactionsSummary,
  upsertBudget,
  getBudgets,
  deleteBudget,
  getSavingsGoals,
  createSavingsGoal,
  updateSavingsGoal,
  deleteSavingsGoal,
  getMoneyManagerDashboard,
} from "@/services/money-manager.service";
import type {
  RecordTransactionForm,
  CreateAccountForm,
  UpdateAccountForm,
  UpsertBudgetForm,
  UpdateUserSettingsForm,
  CreateCategoryForm,
  CreateSavingsGoalForm,
  UpdateSavingsGoalForm,
} from "@/lib/validation/money-manager";

async function getUserId(): Promise<string> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Not authenticated");
  return user.id;
}

// =============================================
// User Settings
// =============================================

export async function getSettings() {
  const userId = await getUserId();
  const settings = await getUserSettings(userId);
  return { settings };
}

export async function updateSettings(data: UpdateUserSettingsForm) {
  const parsed = updateUserSettingsSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const userId = await getUserId();
  const result = await upsertUserSettings(userId, {
    currency: parsed.data.currency,
    monthlyBudget: parsed.data.monthlyBudget,
    reminderEnabled: parsed.data.reminderEnabled,
    reminderTime: parsed.data.reminderTime,
    reminderDays: parsed.data.reminderDays,
  });
  if (result.error) return { error: "Failed to update settings" };
  return { success: true };
}

// =============================================
// Categories
// =============================================

export async function listCategories() {
  const userId = await getUserId();
  const categories = await getCategories(userId);
  return { categories };
}

export async function addCategory(data: CreateCategoryForm) {
  const parsed = createCategorySchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const userId = await getUserId();
  const result = await createCategory(userId, {
    name: parsed.data.name,
    icon: parsed.data.icon,
    color: parsed.data.color,
    type: parsed.data.type,
  });
  if (result.error) return { error: "Failed to create category" };
  return { success: true, category: result.category };
}

export async function removeCategory(categoryId: string) {
  const userId = await getUserId();
  const result = await deleteCategory(userId, categoryId);
  if (result.error) return { error: "Failed to delete category" };
  return { success: true };
}

// =============================================
// Accounts
// =============================================

export async function listAccounts() {
  const userId = await getUserId();
  const accounts = await getAccounts(userId);
  return { accounts };
}

export async function addAccount(data: CreateAccountForm) {
  const parsed = createAccountSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const userId = await getUserId();
  const result = await createAccount(userId, {
    name: parsed.data.name,
    type: parsed.data.type,
    balance: parsed.data.balance,
    currency: parsed.data.currency,
    institution: parsed.data.institution,
    accountNumberLast4: parsed.data.accountNumberLast4,
  });
  if (result.error) return { error: "Failed to create account" };
  return { success: true, account: result.account };
}

export async function editAccount(data: UpdateAccountForm) {
  const parsed = updateAccountSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const userId = await getUserId();
  const { id, ...updates } = parsed.data;
  const result = await updateAccount(userId, id, {
    name: updates.name,
    type: updates.type,
    balance: updates.balance,
    institution: updates.institution,
    accountNumberLast4: updates.accountNumberLast4,
  });
  if (result.error) return { error: "Failed to update account" };
  return { success: true };
}

export async function removeAccount(accountId: string) {
  const userId = await getUserId();
  const result = await deleteAccount(userId, accountId);
  if (result.error) return { error: "Failed to delete account" };
  return { success: true };
}

// =============================================
// Transactions (RPC)
// =============================================

export async function addTransaction(data: RecordTransactionForm) {
  const parsed = recordTransactionSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const userId = await getUserId();
  const result = await serviceRecordTransaction(userId, {
    categoryId: parsed.data.categoryId,
    accountId: parsed.data.accountId,
    transferToId: parsed.data.transferToId,
    type: parsed.data.type,
    amount: parsed.data.amount,
    description: parsed.data.description,
    date: parsed.data.date,
    notes: parsed.data.notes,
    tags: parsed.data.tags,
    isRecurring: parsed.data.isRecurring,
    recurringConfig: parsed.data.recurringConfig,
  });
  if (result.error) return { error: "Failed to record transaction" };
  return { success: true, txId: result.txId };
}

export async function removeTransaction(txId: string) {
  const userId = await getUserId();
  const result = await serviceDeleteTransaction(userId, txId);
  if (result.error) return { error: "Failed to delete transaction" };
  return { success: true, deleted: result.deleted };
}

export async function listTransactions(opts?: {
  startDate?: string;
  endDate?: string;
  type?: "income" | "expense" | "transfer";
  categoryId?: string;
  accountId?: string;
  limit?: number;
  offset?: number;
}) {
  const userId = await getUserId();
  const transactions = await getTransactions(userId, opts);
  return { transactions };
}

export async function getTransactionSummary(month: number, year: number) {
  const userId = await getUserId();
  const summary = await getTransactionsSummary(userId, month, year);
  return summary;
}

// =============================================
// Budgets (RPC)
// =============================================

export async function setBudget(data: UpsertBudgetForm) {
  const parsed = upsertBudgetSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const userId = await getUserId();
  const result = await upsertBudget(userId, {
    categoryId: parsed.data.categoryId,
    month: parsed.data.month,
    year: parsed.data.year,
    amount: parsed.data.amount,
  });
  if (result.error) return { error: "Failed to save budget" };
  return { success: true, budgetId: result.budgetId };
}

export async function listBudgets(month: number, year: number) {
  const userId = await getUserId();
  const budgets = await getBudgets(userId, month, year);
  return { budgets };
}

export async function removeBudget(budgetId: string) {
  const userId = await getUserId();
  const result = await deleteBudget(userId, budgetId);
  if (result.error) return { error: "Failed to delete budget" };
  return { success: true };
}

// =============================================
// Savings Goals
// =============================================

export async function listSavingsGoals() {
  const userId = await getUserId();
  const goals = await getSavingsGoals(userId);
  return { goals };
}

export async function addSavingsGoal(data: CreateSavingsGoalForm) {
  const parsed = createSavingsGoalSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const userId = await getUserId();
  const result = await createSavingsGoal(userId, {
    name: parsed.data.name,
    targetAmount: parsed.data.targetAmount,
    targetDate: parsed.data.targetDate,
    accountId: parsed.data.accountId,
  });
  if (result.error) return { error: "Failed to create goal" };
  return { success: true, goal: result.goal };
}

export async function editSavingsGoal(data: UpdateSavingsGoalForm) {
  const parsed = updateSavingsGoalSchema.safeParse(data);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }
  const userId = await getUserId();
  const { id, ...updates } = parsed.data;
  const result = await updateSavingsGoal(userId, id, {
    name: updates.name,
    targetAmount: updates.targetAmount,
    targetDate: updates.targetDate,
    currentAmount: updates.currentAmount,
    status: updates.status,
  });
  if (result.error) return { error: "Failed to update goal" };
  return { success: true };
}

export async function removeSavingsGoal(goalId: string) {
  const userId = await getUserId();
  const result = await deleteSavingsGoal(userId, goalId);
  if (result.error) return { error: "Failed to delete goal" };
  return { success: true };
}

// =============================================
// Dashboard
// =============================================

export async function getDashboard() {
  const userId = await getUserId();
  const dashboard = await getMoneyManagerDashboard(userId);
  return dashboard;
}
