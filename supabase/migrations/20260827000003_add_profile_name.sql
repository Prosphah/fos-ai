-- Add first_name and last_name to financial_profiles
ALTER TABLE financial_profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT;
