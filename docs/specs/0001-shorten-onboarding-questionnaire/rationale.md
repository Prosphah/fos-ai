# 0001 rationale. Shorten the onboarding questionnaire

## Context

> Premise note: the problem was framed as "the questions are too long", but the evidence says the sharper problem is that the form asks for things nobody reads. A third of the fields are write only, so the confusion the engineer feels about "some of these" is real and shared by the code. The right framing is "collect only what the product reads, and explain every remaining question", which is where this decision landed. Length is the symptom; dead fields are the disease.

Onboarding today is 5 steps and 34 fields, in `src/components/onboarding/`, driven by 5 server actions in `src/app/onboarding/actions.ts` and validated by zod schemas in `src/lib/validation/onboarding.ts`. It writes to `financial_profiles` and `financial_goals` in Supabase Postgres. Every input is a required number or dropdown, there is no skipping, and the two free text tag boxes ask for text that is never parsed or used.

The engineering reality that shaped everything here: the product reads very little of what onboarding collects. A full trace of all 34 profile fields across every service, page, AI prompt and API route is in the evidence section below. The short version is that the financial health score is built from income, living expenses, debt repayments, cash, asset totals, liability totals and the risk answers, and that the AI stock analysis reads only the risk profile, the risk score and the investment horizon.

Two forces pushed the other way and were taken seriously:

The first is compliance. The privacy policy, in two separate copies, states that onboarding asks for age and that the product is not for anyone under 18. Any change here has to keep an 18 gate and keep the policy true. The engineer also judged a bare age number to be more sensitive than it needs to be, so the gate moved to a date of birth picker with a floor.

The second is a live defect in a database trigger. `sync_financial_profile` sets `monthly_income` from the sum of income transactions in the last 30 days, and savings and investments from account balances, all wrapped in `COALESCE(..., 0)`, then writes them back. For any user with no connected accounts this does not refine the number, it replaces it with zero. It also builds liabilities by adding the 6 per category debt columns, which is why writing a single total owed would have scored a indebted new user as debt free. Neither was discovered by reading the feature; both were found by tracing what the field is actually for.

Not deciding means the form stays long, the dead fields stay collected, and the zeroing defect keeps corrupting data for everyone who has not connected an account.

## Options considered

### Option 1: Keep the 5 steps, trim the boxes

Drop the questions that nothing reads and leave the step structure alone. Personal loses employment status and pay frequency, assets merge to 4 boxes, goals loses its tag box.

**Pros**:
- Smallest change. The step components, the stepper and the resume probes barely move.
- Easy to ship in a day and easy to revert.
- Nothing existing breaks for a user part way through.

**Cons**:
- Does not answer the complaint. A user still taps through 5 screens and still meets 12 number boxes and 2 free text tag boxes.
- Leaves the form visually broken: the steps do not use the app's own UI kit, the risk options have no selected marker, and every money field looks identical.
- Leaves the zeroing trigger defect in place, which keeps damaging scores for anyone without connected accounts.

### Option 2: Collect only what the product reads, in 4 steps, rebuilt on the existing primitives

Cut to 21 inputs across 4 steps. Keep only answers that change a calculation, a greeting, or a displayed figure. Drop the 9 columns nothing reads rather than keeping them, collect investment experience because the AI prompt already expects it, rebuild every step on `src/components/ui` with one shared field component, give every money question a "why we ask" card, and mark the chosen risk option visibly.

**Pros**:
- Every remaining question earns its place, which is the only argument that survives scrutiny from a user who has already said they do not understand half of it.
- Halves the input count and drops both free text tag boxes, which is the part most likely to cause a blank stare.
- Fixes the visual inconsistency between onboarding and the rest of the app as a side effect of building the shared field component.
- "Why we ask" cards answer the trust problem directly, at exactly the point where someone is asked for income and debt.
- Deleting 9 unread columns shortens the privacy policy, the account export and the data we hold list, and removes 9 things that have to be reasoned about in every future query.

**Cons**:
- A real migration: one column added, 9 dropped, a rewritten trigger, 4 new step components, a resume probe rewrite, and two policy copies.
- Dropping the columns is irreversible, and it deletes real answers that existing users already gave.
- Roughly half the profile stops being collected, so future features have less to work with.
- Two data shapes coexist afterwards for the debt columns, which complicates every future query until those legacy columns are dropped too.

### Option 3: One minimal screen, collect the rest in context

Ask for 4 or 5 answers in a single step, unlock the product, and prompt for income, assets and debt contextually inside the app once the user reaches a feature that needs them.

**Pros**:
- Fastest possible time to value, and the highest completion rate of any option.
- No dead fields ever reach the database.
- Smallest total surface area to build and maintain.

**Cons**:
- The briefing loses its action items on first open, because goals are what drive them, and goals have nowhere to come from.
- The financial health score, which is the first number a user ever sees, has nothing to compute from on day one.
- Contextual prompts are the most expensive thing on this list to build well, and they are also the easiest to get wrong and drop.

### Option 4: Ship the new flow behind a flag alongside the old one

Build the new 4 step flow, keep the old components, gate on a flag, cut over once the numbers look good.

**Pros**:
- Instant rollback with no deployment, and a clean way to A/B the completion rate against the old flow.
- The safest option for a live funnel.

**Cons**:
- Two versions of a 5 step form to maintain, and the old one is the version with the known UI problems, so it is dead weight the moment the new one is proven.
- The engineer already chose to restart mid flow users on the new form rather than keep the old path alive, which means the flag buys rollback but not coexistence.
- The completion data that would justify keeping it does not exist yet, so the flag is being carried on faith.

## Rationale

The engineer's stated goal was more people finishing, and the field trace is what makes that goal achievable rather than a guess. Roughly a third of the questions are read by nothing, so cutting them is not a quality tradeoff at all, it is free. That collapses the choice from "how much do we dare cut" to "what is the smallest set that still produces a real answer", and the answer is income, spending, debt payments, cash, three grouped asset figures, one owed total, one goal and the four risk questions.

That set does not fit 3 steps comfortably, and the engineer initially chose 3. Splitting the money in one step from the money owned in another gives 4 steps of 5, 3, 5 and 7 inputs, and every step now ends in a small win, which is the mechanism that actually drives completion. This is also the one point where the spec departs from the engineer's first answer, and it departs deliberately: a single step holding 8 number boxes is the highest risk moment in the whole flow.

The engineer preferred rebuilding on the existing primitives, and that is right for a reason beyond tidiness. The onboarding steps currently duplicate their label and input styles inline in all 5 files while the rest of the app uses `src/components/ui`. Any fix to the form's look would otherwise be applied 4 or 5 times and drift. One shared field component turns a styling problem into a single place to change, and it is what makes the "why we ask" card affordable to put on 9 money fields.

The date of birth move deserves a note, because it is a step backwards on data minimisation and was chosen anyway. Age is less personal than a full birth date, and storing the date means an exact identifier sits in the profile forever. The engineer judged the age question itself to be the sensitive one, and the day plus month plus year dropdowns were chosen over a month and year only version, which would have enforced the 18 rule with less data. This is accepted, and the cost is paid in the privacy policy, which ships in the same change rather than after it.

Keeping the trigger overwriting real data, while refusing to let it overwrite with zero, is the split that preserves the engineer's preference and removes the defect. Real transaction data is better than a typed number, so it should still win when it exists. A `COALESCE` around zero is not better data, it is the absence of data being treated as a fact about the user.

The first draft of this spec parked the unread fields in an optional Settings block instead of deleting them. Reopening that decision was the right call. Keeping a column costs permanently: it is exported to a user on request, it is listed on the data we hold screen, it is legal surface the privacy policy must keep covering, and it has to be reasoned about in every query that touches the profile. The only argument for keeping one is that a future feature might want it, and adding a nullable column back in Postgres is a single line in a migration. A Settings block whose only purpose is collecting values nothing reads is the most expensive way to keep dead data alive, so it is gone.

That same reopening surfaced `investment_experience`, which sits in the AI prompt and is written by nothing, so every stock analysis has been told the user's experience is unavailable. One optional 4 label dropdown repairs a broken input to an existing feature, which is a far better use of a question than storing employment status. It is the one addition in this spec that is not score driving, and it earns its place by feeding something that already exists.

## Evidence

### Field usage audit, all 34 profile fields

Read by a calculation, service, page or AI prompt:

- `monthly_income`, `monthly_living_expenses`, `debt_repayments_monthly`: savings rate, emergency fund months, financial health score, in `src/services/onboarding.service.ts` and in the SQL triggers
- `total_cash`, `total_investments`, `total_retirement_accounts`, `total_property_value`, `total_business_ownership`, `total_other_assets`: total assets, net worth, debt ratio, score
- `credit_card_debt`, `personal_loan_debt`, `student_loan_debt`, `mortgage_debt`, `car_loan_debt`, `other_debts`: total liabilities, net worth, debt ratio, score
- `risk_answers`: risk score and risk profile, and the AI prompt in `src/ai/stock-analysis.ts` via `src/app/api/ai/analyze-stock/route.ts`, together with `risk_profile`, `risk_score` and `investment_horizon_years`
- `first_name`: greeting in the dashboard shell and the briefing
- `currency`: display currency in `src/services/financial-health.service.ts`
- goals rows: action items in `financial-health.service.ts`, and the account export

Stored but never read by anything:

- `monthly_savings`, `other_income`
- `expected_major_expenses`, `major_purchases_planned`, both free text tag boxes, never parsed and never turned into goals
- `retirement_age_target`, `emergency_fund_target_months`
- `employment_status`, `income_frequency`, `country`
- `age`, outside the Settings display and one resume probe
- `financial_profiles.financial_goals`, a text column on the profile that duplicates the name of the actual `financial_goals` table and is written and read by nothing, which is worse than dead because it reads like the table
- `risk_answers` after the score is derived, apart from repopulating the form on resume
- derived columns `net_worth`, `debt_ratio`, `savings_rate`, `emergency_fund_months`, `monthly_expenses`, `total_savings`, `total_debt`, all written but only ever read as inputs to the score

Read but never written, which is the mirror image of the same problem:

- `investment_experience`, read by `describeRisk` in `src/ai/stock-analysis.ts` through `src/app/api/ai/analyze-stock/route.ts`, and written by no code path anywhere, so it is always null in the prompt

Not connected to onboarding at all: all 13 calculators in `src/components/calculators/` take everything from the user per session and never read the profile. Reminder and notification cron routes read only `user_settings`. The goals page is a waitlist page and reads no goal data.

### Trigger audit, `supabase/migrations/20260827000004_score_delta.sql`

`sync_financial_profile` computes:

- `v_monthly_income` as the sum of income transactions in the last 30 days, `COALESCE`d to 0, then written back to `monthly_income`
- `v_total_savings` and `v_total_investments` as account balance sums, `COALESCE`d to 0, and `total_investments` written back
- `v_total_liabilities` as the sum of the 6 per category debt columns, never `total_debt`
- `v_net_worth` as `(total_savings + total_investments)` minus those 6 columns, which disagrees with the TypeScript service, which counts cash

Two consequences for this work. First, any user with no connected accounts has a good typed income replaced by 0. Second, writing a single owed total into `total_debt` would leave the trigger reading 0 liabilities and awarding the full 25% debt points to a user who owes money. Both are fixed in the same migration as the new column, because the second one is caused by this decision.

### Current resume probes, `src/app/onboarding/actions.ts`

`determineCurrentStep` currently probes `age`, `monthly_living_expenses`, `total_cash`, `retirement_age_target` and `risk_score`. Two of those fields are no longer collected, so the probe order is replaced by the one in AC-16. The prefill path in `src/app/onboarding/page.tsx` that repopulates each step from saved data is switched off, because the engineer chose to restart mid flow users rather than carry their typing into a form whose fields have changed shape.