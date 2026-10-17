-- Store a date of birth instead of an age.

-- Onboarding now asks for a day, month and year so the "18 or older" rule can be
-- checked against an exact date. `age` is left in place on purpose: rows written
-- before this migration still carry a value there, and every read falls back to it
-- when `date_of_birth` is null.
--
-- No backfill is run. Inventing a 1 January date from someone's age would put a
-- fabricated personal identifier in the profile, which is worse than an honest null.

ALTER TABLE financial_profiles
  ADD COLUMN IF NOT EXISTS date_of_birth DATE;

COMMENT ON COLUMN financial_profiles.date_of_birth IS
  'Date of birth collected at onboarding. Age is derived from this; the legacy age column is kept for rows written before 2026-10-15.';