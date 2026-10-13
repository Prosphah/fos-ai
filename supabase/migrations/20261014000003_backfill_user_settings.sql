-- Notification reminders: backfill missing user_settings rows
-- Fixes: "daily transaction reminder appeared once, never again"
--        (feedback 2026-10-09, area=settings)
--
-- TWO INDEPENDENT CAUSES, both confirmed against production:
--
-- 1. VAPID env vars missing on Vercel. The cron request returns
--      503 {"error":"VAPID keys not configured"} on every run, so the route
--      bails at the guard before doing any work. This is an env/deploy fix,
--      NOT a code fix - see the checklist at the bottom of this file.
--
-- 2. user_settings had zero rows. send-reminders filters on
--      .eq("reminder_enabled", true), so an empty table yields processed: 0
--      every minute. Rows only appeared via upsert_user_settings during
--      onboarding, so anyone who skipped onboarding was permanently invisible
--      to the scheduler - while the settings page showed them a reassuring
--      "Daily reminder / 19:00 / Every day" drawn from hardcoded fallbacks.
--
-- This migration fixes (2) and closes the write gap so (2) cannot recur.
-- Run in the Supabase SQL Editor.

-- =============================================
-- 1. BACKFILL
-- =============================================

-- One row per auth user that lacks one. Column defaults supply currency USD,
-- monthly_budget 0, reminder_enabled true, reminder_time 19:00.
--
-- reminder_days is written explicitly as 0-6 (Sunday=0) because the column
-- default is still '{1,2,3,4,5,6,7}' - 1-indexed with a 7. The cron route's
-- dayMap (Sun:0..Sat:6) has no 7, so a default row would match no weekday at
-- all and silently never fire. See the note under step 2.
INSERT INTO user_settings (user_id, reminder_days)
SELECT u.id, ARRAY[0, 1, 2, 3, 4, 5, 6]
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM user_settings s WHERE s.user_id = u.id
);

-- =============================================
-- 2. FIX THE COLUMN DEFAULT
-- =============================================

-- The old default wrote 7 into reminder_days, which the cron can never match.
-- Existing rows were patched by 20260917000001, but the default itself was
-- never corrected, so every row created without an explicit value kept the bug.
ALTER TABLE user_settings
  ALTER COLUMN reminder_days SET DEFAULT ARRAY[0, 1, 2, 3, 4, 5, 6];

-- Catch any 1-indexed values written by the old default: 7 is Sunday.
UPDATE user_settings
SET reminder_days = ARRAY(
  SELECT CASE WHEN d = 7 THEN 0 ELSE d END FROM unnest(reminder_days) AS d
)
WHERE 7 = ANY(reminder_days);

-- A user who unchecks every day should be able to store an empty array.
-- The cron treats an empty list as "no reminder", which is correct.
-- (No constraint change needed; reminder_days is a plain INT[].)

-- =============================================
-- 3. CLOSE THE WRITE GAP
-- =============================================

-- on_auth_user_created inserts a row for every NEW signup, so the scheduler
-- never has to guess about users who skipped onboarding. Matches the defaults
-- the settings page already displays when a row is missing.
CREATE OR REPLACE FUNCTION public.on_auth_user_created()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO user_settings (user_id, reminder_days)
  VALUES (NEW.id, ARRAY[0, 1, 2, 3, 4, 5, 6])
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.on_auth_user_created();

-- =============================================
-- VERIFY
-- =============================================

-- Every user should now have a row, with no 7s left in reminder_days.
SELECT
  (SELECT count(*) FROM auth.users)                                  AS auth_users,
  (SELECT count(*) FROM user_settings)                               AS settings_rows,
  (SELECT count(*) FROM user_settings WHERE 7 = ANY(reminder_days))  AS rows_with_bad_day;

-- =============================================
-- NOT FIXED BY THIS MIGRATION - DO THIS FIRST
-- =============================================
-- Cause (1) is a deploy problem. The route returns 503 until these exist on
-- the Vercel project (Settings -> Environment Variables, all three required):
--
--   VAPID_PUBLIC_KEY
--   VAPID_PRIVATE_KEY
--   VAPID_EMAIL
--
-- The values live in your local .env.local (lines 21-22, 24). Add them to
-- Vercel and redeploy, or reminders will keep 503-ing no matter what this
-- migration does.
--
-- After deploying, confirm the cron is healthy:
--   SELECT status_code, left(content, 200), created
--   FROM net._http_response ORDER BY id DESC LIMIT 5;
-- Healthy looks like 200 with {"success":true,...}. A 503 means the env vars
-- still are not set.
--
-- Note: notifications are still best-effort. If a user has no active push
-- subscription, send-reminders marks the delivery completed and sends only
-- the in-app notification. That is intentional, but it means push silence
-- does not necessarily mean the cron is broken.