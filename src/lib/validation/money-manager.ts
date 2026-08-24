import { z } from "zod";

// =============================================
// Transaction
// =============================================

const recurringConfigSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  end_date: z.string().nullable().optional(),
  interval: z.number().int().min(1).default(1),
});

export const recordTransactionSchema = z
  .object({
    categoryId: z.string().uuid().nullable().optional(),
    accountId: z.string().uuid().nullable().optional(),
    transferToId: z.string().uuid().nullable().optional(),
    type: z.enum(["income", "expense", "transfer"]),
    amount: z.coerce.number().positive("Amount must be positive"),
    description: z.string().min(1, "Description is required").max(200),
    date: z.string().min(1, "Date is required"),
    notes: z.string().max(500).nullable().optional(),
    tags: z.array(z.string()).nullable().optional(),
    isRecurring: z.boolean().default(false),
    recurringConfig: recurringConfigSchema.nullable().optional(),
  })
  .refine(
    (data) => {
      if (data.type === "transfer") {
        return !!data.accountId && !!data.transferToId;
      }
      return true;
    },
    { message: "Transfers require both source and destination accounts", path: ["accountId"] }
  );

export type RecordTransactionForm = z.infer<typeof recordTransactionSchema>;

// =============================================
// Account
// =============================================

export const createAccountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(50),
  type: z.enum(["cash", "savings", "investment", "credit", "other"]),
  balance: z.coerce.number().default(0),
  currency: z.string().min(1).default("USD"),
  institution: z.string().max(100).nullable().optional(),
  accountNumberLast4: z
    .string()
    .length(4, "Must be 4 digits")
    .regex(/^\d+$/, "Must be digits only")
    .nullable()
    .optional(),
});

export type CreateAccountForm = z.infer<typeof createAccountSchema>;

export const updateAccountSchema = createAccountSchema.partial().extend({
  id: z.string().uuid(),
});

export type UpdateAccountForm = z.infer<typeof updateAccountSchema>;

// =============================================
// Budget
// =============================================

export const upsertBudgetSchema = z.object({
  categoryId: z.string().uuid().nullable().optional(),
  month: z.coerce.number().int().min(1).max(12),
  year: z.coerce.number().int().min(2020).max(2100),
  amount: z.coerce.number().min(0, "Budget cannot be negative"),
});

export type UpsertBudgetForm = z.infer<typeof upsertBudgetSchema>;

// =============================================
// User Settings
// =============================================

export const updateUserSettingsSchema = z.object({
  currency: z.string().min(1).optional(),
  monthlyBudget: z.coerce.number().min(0).optional(),
  reminderEnabled: z.boolean().optional(),
  reminderTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Time must be in HH:MM format")
    .optional(),
  reminderDays: z.array(z.number().int().min(1).max(7)).optional(),
});

export type UpdateUserSettingsForm = z.infer<typeof updateUserSettingsSchema>;

// =============================================
// Category
// =============================================

export const createCategorySchema = z.object({
  name: z.string().min(1, "Category name is required").max(30),
  icon: z.string().max(30).nullable().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Must be a valid hex color").nullable().optional(),
  type: z.enum(["income", "expense", "both"]).default("expense"),
});

export type CreateCategoryForm = z.infer<typeof createCategorySchema>;

// =============================================
// Savings Goal
// =============================================

export const createSavingsGoalSchema = z.object({
  accountId: z.string().uuid().nullable().optional(),
  name: z.string().min(1, "Goal name is required").max(50),
  targetAmount: z.coerce.number().positive("Target must be positive"),
  targetDate: z.string().nullable().optional(),
});

export type CreateSavingsGoalForm = z.infer<typeof createSavingsGoalSchema>;

export const updateSavingsGoalSchema = createSavingsGoalSchema.partial().extend({
  id: z.string().uuid(),
  status: z.enum(["active", "completed", "paused"]).optional(),
  currentAmount: z.coerce.number().min(0).optional(),
});

export type UpdateSavingsGoalForm = z.infer<typeof updateSavingsGoalSchema>;
