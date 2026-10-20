import { z } from "zod";

// =============================================
// Transaction
// =============================================

const recurringConfigSchema = z.object({
  frequency: z.enum(["daily", "weekly", "monthly", "yearly"]),
  end_date: z.string().nullable().optional(),
  interval: z.number().int().min(1).default(1),
});

// Calendar-day comparison helper for the recurring end-date rule. The SQL
// engine stores repetition config dates as DATE, so the rule has to mean
// "later calendar day", not "later string":
//
//   "2026-10-20T23:59" > "2026-10-20" is true lexicographically, yet it is
//   the same calendar day - after the engine's ::DATE clamp it would mean
//   zero occurrences ever fire. Plain string ordering would also accept
//   non-date text like "zzz" or "abc", which compares greater than any
//   ISO date. Parse instead; a value that fails to parse becomes null and
//   the rule rejects it.
//
// Which day a string names follows what the engine's own text -> DATE
// conversion would yield: zoneful strings describe an instant, and the
// engine's UTC session lands them on their UTC day; zoneless strings have
// no instant meaning at all, so the literal date typed into them decides -
// taking the written "YYYY-MM-DD" prefix rather than the reader's clock,
// which would shift zoneless datetimes across day boundaries for any
// non-zero local offset.
function toCalendarDay(value: string): number | null {
  const text = value.trim();
  const parsed = new Date(text);
  if (Number.isNaN(parsed.getTime())) return null;

  if (/[zZ]$/.test(text) || /[+-]\d{2}:?\d{2}$/.test(text)) {
    return Date.UTC(
      parsed.getUTCFullYear(),
      parsed.getUTCMonth(),
      parsed.getUTCDate()
    );
  }

  const written = new Date(`${text.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(written.getTime())) return null;
  return Date.UTC(
    written.getUTCFullYear(),
    written.getUTCMonth(),
    written.getUTCDate()
  );
}

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
  )
  .refine(
    (data) => {
      if (!data.isRecurring) return true;
      const config = data.recurringConfig;
      // No end date means the recurrence runs indefinitely.
      if (!config?.end_date) return true;
      // The recorded transaction is itself day one, and the engine generates
      // the first occurrence one interval after it. An end date on or before
      // the anchor date can therefore never fire a single occurrence - it
      // would silently do nothing until the cron rollover day, which is how
      // the 2026-10-10 report of "recurring does not execute" stayed invisible.
      const endDay = toCalendarDay(config.end_date);
      const anchorDay = toCalendarDay(data.date);
      if (endDay === null || anchorDay === null) return false;
      return endDay > anchorDay;
    },
    {
      message: "End date must be later than the transaction date - the transaction itself already counts as the first occurrence",
      path: ["recurringConfig", "end_date"],
    }
  );

export type RecordTransactionForm = z.infer<typeof recordTransactionSchema>;

// =============================================
// Account
// =============================================

export const createAccountSchema = z.object({
  name: z.string().min(1, "Account name is required").max(50),
  type: z.enum(["cash", "current", "savings", "investment", "credit", "other"]),
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
