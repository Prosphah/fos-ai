-- Align user_settings.currency with financial_profiles.currency
-- Fixes: "changed my currency in user settings, but the accounts section is
--         still USD while briefing correctly shows NGN"
--
-- Currency is stored in two places:
--   financial_profiles.currency  - read by the briefing
--   user_settings.currency       - read by Money Manager
--
-- The settings page exposes ONE currency control, but it only ever wrote
-- financial_profiles (see src/app/actions/profile.ts updateProfile). So the
-- briefing showed the user's choice while every Money Manager surface kept
-- rendering the user_settings default of 'USD'.
--
-- This corrects the stored data. profile.ts now writes both columns, so
-- future changes stay in sync.
--
-- financial_profiles is the user's explicit choice, so it wins where present.

UPDATE user_settings us
SET currency = fp.currency
FROM financial_profiles fp
WHERE fp.user_id = us.user_id
  AND fp.currency IS NOT NULL
  AND fp.currency <> ''
  AND us.currency IS DISTINCT FROM fp.currency;

-- accounts.currency is a third copy, defaulting to 'USD'. Each account card
-- renders from it, so a stale value showed '$' on a card whose balance is
-- naira. The app never offers a per-account currency choice (the form seeds
-- it from the user setting), so all of a user's accounts share one currency.
UPDATE accounts a
SET currency = us.currency
FROM user_settings us
WHERE us.user_id = a.user_id
  AND us.currency IS NOT NULL
  AND us.currency <> ''
  AND a.currency IS DISTINCT FROM us.currency;

-- Users who never completed onboarding have no profile row, so there is no
-- recorded preference to copy. Leave their existing value alone rather than
-- guessing.

-- Verify: these should now agree.
--   SELECT u.email, fp.currency AS profile_currency, us.currency AS settings_currency
--   FROM auth.users u
--   LEFT JOIN financial_profiles fp ON fp.user_id = u.id
--   LEFT JOIN user_settings us       ON us.user_id = u.id
--   WHERE fp.currency IS DISTINCT FROM us.currency;