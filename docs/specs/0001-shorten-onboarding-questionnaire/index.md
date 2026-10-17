# 0001. Shorten the onboarding questionnaire

**Date**: 2026-10-15
**Status**: Accepted

## Summary

Onboarding today asks 34 fields across 5 steps, and a third of them are stored and never read by anything. We cut it to 21 inputs across 4 steps, keeping only the answers that change what the app shows, and rebuild the steps on the UI primitives the rest of the app already uses. Every remaining money question gets a short card explaining what it is used for. One column is added for the date of birth, nine dead columns are dropped, and a database trigger that was silently zeroing typed answers is fixed.

## Requirements

**User stories**:
- As a new user, I want to be asked only for things that change what the app shows me, so that onboarding takes minutes rather than a coffee break.
- As a new user, I want to know why each sensitive number is being asked, so that I answer honestly instead of guessing.
- As a returning user, I want my score and the answers the product actually uses to keep working, so that this change does not damage anything that already exists.

**Acceptance criteria** (the contract, each independently checkable):
- **AC-1**: The questionnaire has exactly 4 steps in this order: About you, Month to month, What you own and owe, Goals and risk.
- **AC-2**: Step 1 asks exactly 5 fields: first name, last name, date of birth, currency, monthly income. All 5 are required.
- **AC-3**: The date of birth is entered as day, month and year dropdowns, and no combination produces a date earlier than 18 years before today.
- **AC-4**: A date of birth that is less than 18 years before today is rejected by the server action, not only hidden by the picker.
- **AC-5**: Step 2 asks exactly 3 fields: monthly living expenses, monthly debt repayments, monthly savings. Spending and debt are required, savings is optional.
- **AC-6**: Step 3 asks exactly 5 numbers: cash, investments and retirement combined, property and valuables combined, business and other assets combined, and one total for everything owed. All 5 are required.
- **AC-7**: Step 4 asks exactly one goal with a title, a target amount and a target date, the 4 existing risk scenario questions, and one investment experience question. The goal fields are required and all 4 risk questions must be answered. Investment experience may be left blank.
- **AC-8**: `investment_horizon_years` is derived at save time from the goal target date as whole years rounded down, never below 0. It is never typed by a user.
- **AC-9**: Onboarding asks for none of the following: country, pay frequency, employment status, other income, expected major expenses, retirement age, emergency fund target months, planned purchases, any of the 6 individual debt categories, or retirement and other assets as separate questions.
- **AC-10**: Every money input renders the currency code chosen in step 1 as a fixed prefix inside the field.
- **AC-11**: Every money input carries an info control that opens a card naming what the answer is used for. For income, spending, debt, assets and total owed, the card names the financial health score as the thing the answer powers.
- **AC-12**: All 4 steps render through one shared field component built on `src/components/ui` primitives, and no step file declares its own inline label or input style objects.
- **AC-13**: A chosen risk option is visibly marked with a filled indicator and a highlighted row. Choosing a different option clears the previous one.
- **AC-14**: A field label states only the question. Example values live in helper text or a placeholder, never inside parentheses in the label.
- **AC-15**: Submitting a step saves it and advances. A failed save shows an inline error and does not advance.
- **AC-16**: On resume, a user lands on the first step with missing answers, probed in this order: `date_of_birth` null means step 1, `monthly_living_expenses` null means step 2, `total_cash` null means step 3, no `financial_goals` row or null `risk_score` means step 4.
- **AC-17**: The new flow starts with empty fields and does not prefill from data saved by a partially completed version of the previous form.
- **AC-18**: The success page shows the financial health score with one plain sentence saying what it is.
- **AC-19**: The 9 columns nothing reads (`country`, `income_frequency`, `other_income`, `employment_status`, `expected_major_expenses`, `retirement_age_target`, `emergency_fund_target_months`, `major_purchases_planned`, and the duplicate `financial_profiles.financial_goals`) are dropped, and none of them remains in the profile type, the account export, the data we hold list or the privacy policy.
- **AC-20**: `sync_financial_profile` never overwrites `monthly_income`, `total_savings` or `total_investments` with 0. The overwrite happens only when the user actually has income transactions or accounts rows to aggregate.
- **AC-21**: Net worth and debt ratio use `COALESCE(total_debt, sum of the 6 legacy debt columns)`, so a user who entered one total owed is scored on that total.
- **AC-22**: The onboarding calculation in `src/services/onboarding.service.ts` applies the same liability rule as the database trigger.
- **AC-23**: Both privacy policy copies (`docs/13-privacy-policy.md` and `src/app/privacy/page.tsx`) say onboarding collects a date of birth rather than an age, list only what the new flow actually collects, and no longer mention country, employment status, pay frequency, other income, expected major expenses, retirement age, emergency fund target months or planned purchases.
- **AC-24**: Monthly income of 0 is accepted, step 1 shows a plain note that the score will read low until income is entered, and the score formula itself is unchanged.
- **AC-25**: `investment_experience` is stored as exactly one of 4 labels (New to investing, A little experience, Comfortable, Experienced) or left null, and `src/app/api/ai/analyze-stock/route.ts` receives a non null value for every user who answered it.

## Decision

**Chosen option**: Option 2: cut the questionnaire to the answers the product actually reads, in 4 steps, rebuilt on the existing UI primitives.

One sentence: onboarding collects only score driving answers plus one goal and the risk profile, every remaining money question explains itself, and the steps share one field component built from `src/components/ui`.

## Feature design

**Data model sketch**:

One new column. Everything else lands on columns that already exist.

`financial_profiles`, one row per user:

| Column | Type | Null | Written by onboarding now | Notes |
|---|---|---|---|---|
| `date_of_birth` | `date` | yes | yes, required for new users | NEW column, no backfill |
| `age` | `numeric` | yes | no | Kept for rows created before this change. Read falls back to it when `date_of_birth` is null |
| `first_name` | `text` | yes | yes, required | Drives the greeting |
| `last_name` | `text` | yes | yes, required | Shown in Settings |
| `currency` | `text` | yes | yes, required | Source of the money field prefix |
| `monthly_income` | `numeric` | yes | yes, required, 0 allowed | Take home per month, averaged |
| `monthly_living_expenses` | `numeric` | yes | yes, required | |
| `debt_repayments_monthly` | `numeric` | yes | yes, required | |
| `monthly_savings` | `numeric` | yes | yes, optional | Stored, still not read by anything |
| `total_cash` | `numeric` | yes | yes, required | Feeds emergency fund months |
| `total_investments` | `numeric` | yes | yes, required | Now means investments and retirement combined |
| `total_retirement_accounts` | `numeric` | yes | no | Combined into `total_investments` |
| `total_property_value` | `numeric` | yes | yes, required | Now means property and valuables combined |
| `total_business_ownership` | `numeric` | yes | yes, required | Now means business and other assets combined |
| `total_other_assets` | `numeric` | yes | no | Combined into `total_business_ownership` |
| `total_debt` | `numeric` | yes | yes, required | Was a derived column, now written directly as everything owed |
| `credit_card_debt` through `other_debts` (6) | `numeric` | yes | no | Legacy per category shape, kept for existing rows |
| `risk_answers` | `jsonb` | yes | yes, 4 answers required | Same 4 question keys as today |
| `risk_score`, `risk_profile` | `numeric`, `text` | yes | derived | Unchanged |
| `investment_horizon_years` | `numeric` | yes | derived from goal target date | Never typed |
| `investment_experience` | `text` | yes | yes, optional | One of 4 labels or null. Read by the AI prompt in `src/ai/stock-analysis.ts`, written by nothing today |
| `net_worth`, `debt_ratio`, `savings_rate`, `emergency_fund_months`, `financial_health_score`, `monthly_expenses`, `total_savings` | `numeric` | yes | derived | Formula unchanged |

`financial_goals`, one row per goal:

| Column | Type | Null | Written by onboarding now | Notes |
|---|---|---|---|---|
| `title` | `text` | yes | yes, required | Exactly one row created per onboarding |
| `target_amount` | `numeric` | yes | yes, required | |
| `target_date` | `date` | yes | yes, required | Column already existed, never written before |
| `current_amount`, `priority`, `status` | | yes | yes | Unchanged |

Relationships: `financial_profiles` is 1 to 1 with a user. `financial_goals` is 1 to many with a user. No new foreign keys.

**State transitions**:

Onboarding progress is derived, never stored as a step number.

`step 1 -> 2 -> 3 -> 4 -> complete`

Each transition happens only after that step's server action returns success (AC-15). Completion sets `onboarding_completed = true` and `onboarding_completed_at`. Resuming derives the step from the probe order in AC-16. A user with `onboarding_completed = true` is redirected to `/briefing` and never sees the form. `saveStepGoals` deletes existing goals and inserts the single new one, which is the existing behaviour and is kept.

**API surface**:

Server actions in `src/app/onboarding/actions.ts`. Same shape as today, one action per step, all authenticated as the current Supabase user.

| Action | Inputs | Outputs | Auth | Key errors |
|---|---|---|---|---|
| `saveAboutYou` | firstName, lastName, dateOfBirth, currency, monthlyIncome | profileId | session required, own row only | 422 on underage date, negative income, blank name |
| `saveMonthToMonth` | monthlyLivingExpenses, debtRepaymentsMonthly, monthlySavings optional | ok | session required, own row only | 422 on negative values |
| `saveOwnAndOwe` | totalCash, totalInvestments, totalPropertyValue, totalBusinessOwnership, totalDebt | ok | session required, own row only | 422 on negative values |
| `saveGoalsAndRisk` | goalTitle, goalAmount, goalTargetDate, riskAnswers (4) | ok | session required, own row only | 422 on missing goal fields, fewer than 4 answers, out of range scores |
| `finishOnboarding` | none | ok | session required, own row only | recomputes the 5 derived metrics |
| `getOnboardingStatus` | none | onboarded, currentStep, profileId | session required, own row only | none |
| `updateProfile` (existing) | firstName, lastName, dateOfBirth, currency | ok | session required, own row only | 422 on underage date |

9 further columns are dropped rather than kept: `country`, `income_frequency`, `other_income`, `employment_status`, `expected_major_expenses`, `retirement_age_target`, `emergency_fund_target_months`, `major_purchases_planned` and `financial_profiles.financial_goals`.

**Value sourcing**:

| Action | Value produced or displayed | Source |
|---|---|---|
| `saveAboutYou` | minimum selectable date of birth | derived: today's date minus 18 years, computed in the client and re checked in the action |
| `saveAboutYou` | displayed age in Settings | derived from `date_of_birth`, falling back to the `age` column when `date_of_birth` is null |
| every money field | currency code prefix | `financial_profiles.currency`, carried in client state from the step 1 answer |
| `saveMonthToMonth` | `savings_rate` | existing formula `(monthly_income - monthly_living_expenses - debt_repayments_monthly) / monthly_income`, unchanged |
| `saveOwnAndOwe` | `net_worth` | derived: `total_cash + total_investments + total_property_value + total_business_ownership - total liabilities` |
| `saveOwnAndOwe` | `debt_ratio` | derived: `total liabilities / total assets`, guarded to 0 when assets are 0 |
| `saveOwnAndOwe` | `emergency_fund_months` | derived: `total_cash / (monthly_living_expenses + debt_repayments_monthly)` |
| `saveOwnAndOwe` | total liabilities | `COALESCE(total_debt, credit_card_debt + personal_loan_debt + student_loan_debt + mortgage_debt + car_loan_debt + other_debts)` |
| `saveOwnAndOwe` | live net worth summary under the boxes | derived in the client from the 5 watched values |
| `saveGoalsAndRisk` | `investment_horizon_years` | derived from `financial_goals.target_date` minus today, in whole years rounded down, minimum 0 |
| `saveGoalsAndRisk` | `risk_score` | existing: average answer score divided by 3, times 100 |
| `saveGoalsAndRisk` | `risk_profile` | existing bands: 66 and above aggressive, 33 and above moderate, below that conservative |
| `saveGoalsAndRisk` | `investment_experience` | input param, one of 4 fixed labels or null, stored in `financial_profiles.investment_experience` |
| `finishOnboarding` | `financial_health_score` | existing formula, unchanged |
| `getOnboardingStatus` | `currentStep` | probe order in AC-16 |
| success page | displayed score | `financial_profiles.financial_health_score` |
| `analyze-stock` AI prompt | investment experience line | `financial_profiles.investment_experience`, read in `src/app/api/ai/analyze-stock/route.ts` and rendered by `describeRisk` in `src/ai/stock-analysis.ts` |

**Key invariants**:

- Only `financial_profiles` and `financial_goals` rows belonging to the authenticated user are ever read or written.
- A stored `date_of_birth` is never earlier than 18 years before the date it was written.
- No money field is ever negative.
- `total_debt` and the 6 legacy debt columns are never both meaningful for the same row: new rows carry only `total_debt`, old rows carry only the categories.
- The financial health score formula, its weights, and the risk profile bands do not change in this work.
- A step never advances unless its server action succeeded.
- No column on `financial_profiles` is written by any screen unless that screen shows the value back to the person who entered it.

**Security model**:

Every action reads the user id from the Supabase session, never from client input, and scopes the query to that user. No new roles, no new tables, no new public endpoints. Personal data in scope: first name, last name, date of birth, income, expenses, debt, asset balances. The date of birth is strictly more personal than the age it replaces, so the privacy policy wording change in AC-23 ships with this work, not after it.

**Configuration required**: none. No new environment variables, no new dependencies. The date inputs are plain dropdowns, so no date picker library is added.

**Critical test scenarios**:

- Happy path: a new user completes all 4 steps and lands on the success page showing a score, verifies **AC-1**, **AC-18**
- Happy path: a user whose pay is yearly types a monthly figure and the saved `monthly_income` is exactly what they typed, verifies **AC-2**, **AC-20**
- Failure case: a save returns an error, the step does not advance and the inline error shows, verifies **AC-15**
- Failure case: a date of birth one day under 18 is submitted directly to the action and is rejected, verifies **AC-4**
- Edge case: a user with 0 income and 0 assets finishes without a validation error and the score computes rather than throwing, verifies **AC-24**
- Edge case: a user with a mortgage total but no per category rows gets a debt ratio based on the total, verifies **AC-21**
- Edge case: a user who answers investment experience gets a non null experience line in the stock analysis prompt, verifies **AC-25**
- Edge case: a user leaves investment experience blank and the flow still completes, verifies **AC-7**
- Regression: a user with no transactions or accounts has their typed income and investments unchanged by a profile sync, verifies **AC-20**
- Regression: a user part way through the previous version of the form starts the new form at step 1 with empty fields, verifies **AC-17**

## Build plan

Ordered as end to end slices (the project records no build approach, so this is the Tracer Bullet default assumed for production work): the schema and the shared field component land first because every step depends on them, then each step is wired end to end through its own action, and the independent work (trigger fix, Settings, privacy copy) follows.

- [x] 1. Add the `date_of_birth` column as nullable with no backfill, satisfies **AC-3**, **AC-16**
- [x] 2. Replace `sync_financial_profile` so it only overwrites income, savings and investments when real data exists, and so liabilities use `COALESCE(total_debt, the 6 legacy columns)`, satisfies **AC-20**, **AC-21**
- [x] 3. Build the shared field component on `src/components/ui` primitives, with label, optional marker, helper text, error slot, currency code prefix and the info card trigger, satisfies **AC-10**, **AC-11**, **AC-12**, **AC-14**
- [x] 4. Build step 1 end to end: component, zod schema, `saveAboutYou`, resume probe, and the 0 income note, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-24**
- [x] 5. Build step 2 end to end: component, schema, `saveMonthToMonth`, satisfies **AC-5**
- [x] 6. Build step 3 end to end: component, schema, `saveOwnAndOwe`, the live net worth summary, and the matching liability rule in `src/services/onboarding.service.ts`, satisfies **AC-6**, **AC-22**
- [x] 7. Build step 4 end to end: goal with a date dropdown, horizon derivation, `saveGoalsAndRisk`, the investment experience dropdown, and the risk options with a visible selected marker, satisfies **AC-7**, **AC-8**, **AC-13**, **AC-25**
- [x] 8. Rewire the page and stepper to 4 tiles, delete the old step components, remove prefill, satisfies **AC-1**, **AC-9**, **AC-15**, **AC-16**, **AC-17**
- [x] 9. Show the score on the success page, satisfies **AC-18**
- [x] 10. Rewrite the onboarding sections of both privacy policy copies, satisfies **AC-23**
- [x] 11. Only once the new flow has proven itself, drop the 9 dead columns and remove them from `src/types/database.ts`, the account export and `AccountDataSection.tsx`, satisfies **AC-19**

Tasks 1, 2 and 11 are code complete but their SQL is unapplied: this repo has no Supabase CLI, no `config.toml` and no migration script, so migrations are run by hand. Nothing in 11 is irreversible until `20261015000006_drop_unused_profile_columns.sql` is executed, which the migration plan deliberately holds for phase 4.

## Migration plan

**Strategy**: feature flagged at the page level for one deployment, with the destructive column drops held back for a separate, later deployment.

**Phases**:
1. Ship the new column and the trigger fix first, on their own. It fixes a live defect for current users and touches no UI, so it carries no risk to the form.
2. Ship the new 4 step flow behind a flag that reads from an environment variable, default on, with the old step components still in the tree.
3. Watch completion rate and error rate for one week, then remove the flag and delete the old step components in the following change.
4. Drop the 9 dead columns in their own migration, only after step 3 has been stable. This ordering is deliberate: a column drop cannot be undone, so it must never share a deployment with anything else.

**Rollback**: the flag flips back to the old flow without a code change or a data change. The added column is nullable and unused by the old flow, so nothing needs to be undone. The trigger replacement is one function definition and can be restored by reapplying the previous migration file. The column drops in phase 4 cannot be rolled back: re-adding the columns as nullable restores the shape but not the values, which is why they run last.

**Risks**: the trigger fix changes values for users who do have transactions, because liabilities for them now come from `total_debt`, which is null for them and therefore falls through to the 6 legacy columns. That path is unchanged, but it needs checking against real rows before shipping. Second risk: mid flow users from the previous form restart, and some will be annoyed. That is the accepted cost of not maintaining two forms. Third risk: dropping the 9 columns deletes real answers that existing users already gave, including an employment status and a retirement age for anyone who filled them in under the old form. Those values are read by nothing, so no feature breaks, but the deletion is permanent and should be a deliberate, dated decision rather than a side effect.

## Consequences

**Positive**:
- 34 fields become 21 inputs, and the number of required answers drops to 14.
- Every question left in the flow changes something the app shows. Nothing is asked for decoration.
- 9 columns that nothing read stop being collected, exported to users on request, and covered by the privacy policy.
- The form finally uses the same UI kit as the rest of the app, so it stops looking like a different product.
- The stock analysis AI prompt stops receiving an always null experience field.
- A user who types an income and no connected account no longer has that income silently overwritten with 0.
- A user who owes money is no longer scored as debt free.

**Negative / tradeoffs**:
- Dropping 9 columns is irreversible. An employment status or a retirement age that an existing user already gave is deleted, permanently, with no way to recover it.
- The asset picture is coarser. Someone with a mortgage, a car loan and credit cards now enters one total, so any future advice about which debt to attack first has nothing to work with.
- Roughly half the profile is no longer collected at all, so the briefing and any future feature start from a thinner picture than they could have.
- Two data shapes now coexist. Old users have per category debts, new users have one total. Any future query has to handle both until the legacy columns are dropped.
- The score is still recomputed from transactions once real data exists, so it can drift away from what a person told us. This change does not fix that.
- `monthly_savings` is now stored and still not read by anything. It is one more field we collect for a feature that does not exist yet.
- We landed at 21 inputs against a target of 12. Cutting further means cutting something the score actually reads.

**Neutral**:
- One new nullable column, no backfill, no data transformation on existing rows.
- The risk questions keep their existing keys and scores, so old and new `risk_answers` rows stay comparable.
- The score formula and its weights are untouched.

## Follow-up

- [ ] Add instrumentation for onboarding completion rate and median time to finish before shipping. This change is justified by a completion problem and there is currently no way to know whether it worked. This is the highest value item on this list.
- [ ] Decide whether to drop the 6 legacy debt columns and the unused asset category columns once the new shape has run for a while. Unlike the 9 in AC-19 these hold real data for existing users, so it needs a data check first.
- [ ] `monthly_savings` is stored and never read. Either use it in the briefing or drop the question, given this spec now argues for deleting unread columns.
- [ ] This repo has no `AGENTS.md` and no `docs/scope/`. A root `AGENTS.md` recording the stack conventions and where this spec lives would give later decisions a home.

## Rationale

Reasoning and options: see rationale.md