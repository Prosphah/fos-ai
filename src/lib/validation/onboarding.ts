import { z } from "zod";

export const stepPersonalSchema = z.object({
  firstName: z.string().min(1, "Please enter your first name"),
  lastName: z.string().min(1, "Please enter your last name"),
  age: z.coerce.number().min(18, "You must be at least 18").max(120, "Please enter a valid age"),
  country: z.string().min(1, "Please enter your country"),
  currency: z.string().min(1, "Please select your currency"),
  employmentStatus: z.string().min(1, "Please select your employment status"),
  monthlyIncome: z.coerce.number().min(0, "Income cannot be negative"),
  incomeFrequency: z.string().min(1, "Please select how often you're paid"),
});

export const stepCashflowSchema = z.object({
  monthlyLivingExpenses: z.coerce.number().min(0, "Expenses cannot be negative"),
  debtRepaymentsMonthly: z.coerce.number().min(0, "Debt repayments cannot be negative"),
  monthlySavings: z.coerce.number().min(0, "Savings cannot be negative"),
  otherIncome: z.coerce.number().min(0, "Other income cannot be negative"),
  expectedMajorExpenses: z.array(z.string()).default([]),
});

export const stepAssetsSchema = z.object({
  totalCash: z.coerce.number().min(0, "Cannot be negative").default(0),
  totalInvestments: z.coerce.number().min(0, "Cannot be negative").default(0),
  totalRetirementAccounts: z.coerce.number().min(0, "Cannot be negative").default(0),
  totalPropertyValue: z.coerce.number().min(0, "Cannot be negative").default(0),
  totalBusinessOwnership: z.coerce.number().min(0, "Cannot be negative").default(0),
  totalOtherAssets: z.coerce.number().min(0, "Cannot be negative").default(0),
  creditCardDebt: z.coerce.number().min(0, "Cannot be negative").default(0),
  personalLoanDebt: z.coerce.number().min(0, "Cannot be negative").default(0),
  studentLoanDebt: z.coerce.number().min(0, "Cannot be negative").default(0),
  mortgageDebt: z.coerce.number().min(0, "Cannot be negative").default(0),
  carLoanDebt: z.coerce.number().min(0, "Cannot be negative").default(0),
  otherDebts: z.coerce.number().min(0, "Cannot be negative").default(0),
});

export const goalEntrySchema = z.object({
  title: z.string().min(1, "Give your goal a name"),
  targetAmount: z.coerce.number().min(0),
});

export const stepGoalsSchema = z.object({
  goals: z.array(goalEntrySchema).min(1, "Add at least one goal").max(3, "Maximum 3 goals"),
  retirementAgeTarget: z.coerce.number().min(0, "Please enter a valid age").nullable(),
  emergencyFundTargetMonths: z.coerce.number().min(0, "Cannot be negative").default(0),
  investmentHorizonYears: z.coerce.number().min(0, "Cannot be negative").default(0),
  majorPurchasesPlanned: z.array(z.string()).default([]),
});

export const riskQuestionSchema = z.object({
  questionKey: z.string(),
  answer: z.string().min(1, "Please select an answer"),
  score: z.coerce.number().min(1).max(3),
});

export const stepRiskSchema = z.object({
  answers: z.array(riskQuestionSchema).min(3, "Please answer all questions"),
});

export type StepPersonalForm = z.infer<typeof stepPersonalSchema>;
export type StepCashflowForm = z.infer<typeof stepCashflowSchema>;
export type StepAssetsForm = z.infer<typeof stepAssetsSchema>;
export type StepGoalsForm = z.infer<typeof stepGoalsSchema>;
export type StepRiskForm = z.infer<typeof stepRiskSchema>;

export const completeOnboardingSchema = z.object({
  personal: stepPersonalSchema,
  cashflow: stepCashflowSchema,
  assets: stepAssetsSchema,
  goals: stepGoalsSchema,
  risk: stepRiskSchema,
});

export type CompleteOnboardingForm = z.infer<typeof completeOnboardingSchema>;
