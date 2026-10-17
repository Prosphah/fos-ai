-- Drop the profile columns that nothing ever read.
--
-- Each of these was collected at onboarding and then never used by a calculation,
-- a page, an API route or an AI prompt. They were still written on every user,
-- still exported in their account download, and still named in the privacy policy.
-- Adding one back is a single line in a migration if a feature ever needs it,
-- which is a far cheaper option than carrying them forever.
--
-- financial_profiles.financial_goals goes too: it is a text column that duplicates
-- the name of the real financial_goals table and is written and read by nothing.
--
-- This is irreversible. Re-adding the columns restores the shape but not the
-- values, so run it only once the shortened questionnaire has proven itself.
--
-- NOT dropped: age. Rows written before 2026-10-15 still carry their age there
-- and it is the fallback read when date_of_birth is null.

ALTER TABLE financial_profiles
  DROP COLUMN IF EXISTS country,
  DROP COLUMN IF EXISTS income_frequency,
  DROP COLUMN IF EXISTS other_income,
  DROP COLUMN IF EXISTS employment_status,
  DROP COLUMN IF EXISTS expected_major_expenses,
  DROP COLUMN IF EXISTS retirement_age_target,
  DROP COLUMN IF EXISTS emergency_fund_target_months,
  DROP COLUMN IF EXISTS major_purchases_planned,
  DROP COLUMN IF EXISTS financial_goals;