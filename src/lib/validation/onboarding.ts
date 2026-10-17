import { z } from "zod";

export const CURRENCY_OPTIONS = [
  "USD",
  "EUR",
  "GBP",
  "CAD",
  "AUD",
  "JPY",
  "NZD",
  "CHF",
  "INR",
  "NGN",
  "BRL",
  "MXN",
] as const;

/**
 * The four labels stored in financial_profiles.investment_experience. The stock
 * analysis prompt interpolates this straight into its context, so the labels are
 * written the way a person would say them rather than as machine keys.
 */
export const INVESTMENT_EXPERIENCE_OPTIONS = [
  "New to investing",
  "A little experience",
  "Comfortable",
  "Experienced",
] as const;

export const MIN_AGE_YEARS = 18;

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

/**
 * The oldest date of birth a person may enter, as a local YYYY-MM-DD string.
 * Someone born on or before this date is at least 18 today; anyone born after
 * it is under 18, so the check is a "less than or equal", not a "greater than".
 */
export function earliestDateOfBirth(now: Date = new Date()): string {
  const cutoff = new Date(
    now.getFullYear() - MIN_AGE_YEARS,
    now.getMonth(),
    now.getDate()
  );
  return `${cutoff.getFullYear()}-${pad(cutoff.getMonth() + 1)}-${pad(
    cutoff.getDate()
  )}`;
}

/** Today as a local YYYY-MM-DD string, for comparisons against a date field. */
export function todayIso(now: Date = new Date()): string {
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(
    now.getDate()
  )}`;
}

/** True when the string is a real calendar date, so 2026-02-31 is rejected. */
export function isRealIsoDate(value: string): boolean {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) return false;
  const [, year, month, day] = match;
  const date = new Date(Number(year), Number(month) - 1, Number(day));
  return (
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day)
  );
}

/**
 * A date field entered as three dropdowns and submitted as YYYY-MM-DD.
 * `minimumAgeYears` of 0 means "no age floor", used for a goal target date.
 */
function isoDateField(label: string, minimumAgeYears = 0) {
  return z
    .string()
    .min(1, `Please choose your ${label}`)
    .refine(isRealIsoDate, { message: `Please choose a valid ${label}` })
    .refine(
      (value) => minimumAgeYears === 0 || value <= earliestDateOfBirth(),
      {
        message: `You must be at least ${MIN_AGE_YEARS} to use FOS·AI`,
      }
    );
}

const nonNegative = (label: string) =>
  z.coerce.number().min(0, { message: `${label} cannot be negative` });

/**
 * A currency the dropdown can produce. Kept as a refine on a plain string rather
 * than z.enum so the form type stays `string` and an untouched field is `""`.
 */
const currencyField = z
  .string()
  .refine(
    (value) => (CURRENCY_OPTIONS as readonly string[]).includes(value),
    { message: "Please select your currency" }
  );

export const stepAboutYouSchema = z.object({
  firstName: z.string().min(1, "Please enter your first name"),
  lastName: z.string().min(1, "Please enter your last name"),
  dateOfBirth: isoDateField("date of birth", MIN_AGE_YEARS),
  currency: currencyField,
  monthlyIncome: nonNegative("Income"),
});

export const stepMonthToMonthSchema = z.object({
  monthlyLivingExpenses: nonNegative("Expenses"),
  debtRepaymentsMonthly: nonNegative("Debt repayments"),
  monthlySavings: nonNegative("Savings").default(0),
});

export const stepOwnAndOweSchema = z.object({
  totalCash: nonNegative("This cannot be negative"),
  totalInvestments: nonNegative("This cannot be negative"),
  totalPropertyValue: nonNegative("This cannot be negative"),
  totalBusinessOwnership: nonNegative("This cannot be negative"),
  totalDebt: nonNegative("This cannot be negative"),
});

export const riskAnswerSchema = z.object({
  questionKey: z.string(),
  answer: z.string().min(1, "Please select an answer"),
  score: z.coerce.number().min(1).max(3),
});

export const RISK_QUESTION_COUNT = 4;

export const stepGoalsAndRiskSchema = z.object({
  goalTitle: z.string().min(1, "Give your goal a name"),
  goalAmount: nonNegative("Target amount"),
  // A goal already in the past is not a goal, and it would derive a horizon of 0
  // years and feed that to the AI prompt.
  goalTargetDate: isoDateField("a target date").refine(
    (value) => value >= todayIso(),
    { message: "Choose a target date that has not passed yet" }
  ),
  riskAnswers: z
    .array(riskAnswerSchema)
    .length(RISK_QUESTION_COUNT, {
      message: "Please answer all four questions",
    }),
  investmentExperience: z
    .enum(INVESTMENT_EXPERIENCE_OPTIONS)
    .optional()
    .or(z.literal("")),
});

export const profileDetailsSchema = z.object({
  firstName: z.string().min(1, "Please enter your first name"),
  lastName: z.string().min(1, "Please enter your last name"),
  // Optional because Settings saves a partial profile: a row written before
  // onboarding collected a date of birth has none, and must still be able to
  // change its name or currency. When a value is supplied it is validated in
  // full, so a partial save can never write an under 18 date.
  dateOfBirth: isoDateField("date of birth", MIN_AGE_YEARS).optional(),
  // Kept as a loose string rather than the onboarding enum so an existing profile
  // holding a currency the dropdown no longer offers can still save its name.
  currency: z.string().min(1, "Please select your currency"),
});

export type StepAboutYouForm = z.infer<typeof stepAboutYouSchema>;
export type StepMonthToMonthForm = z.infer<typeof stepMonthToMonthSchema>;
export type StepOwnAndOweForm = z.infer<typeof stepOwnAndOweSchema>;
export type StepGoalsAndRiskForm = z.infer<typeof stepGoalsAndRiskSchema>;
export type ProfileDetailsForm = z.infer<typeof profileDetailsSchema>;
export type RiskAnswer = z.infer<typeof riskAnswerSchema>;