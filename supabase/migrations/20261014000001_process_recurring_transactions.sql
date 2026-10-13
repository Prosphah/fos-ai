-- Recurring transaction engine
-- Fixes: "Recurring transactions do not execute" (feedback 2026-10-10)
--
-- `is_recurring` / `recurring_config` were already written by record_transaction,
-- but nothing ever read them back. This adds:
--   1. recurring_parent_id  - links a generated occurrence to its template
--   2. next_recurring_date  - pure date arithmetic for the supported frequencies
--   3. process_recurring_transactions() - materialises due occurrences
--
-- Run this file in the Supabase SQL Editor. See the end of the file for the
-- optional pg_cron schedule (must be run separately, jobs do not survive
-- a project restart).

-- =============================================
-- 1. OCCURRENCE LINKING
-- =============================================

ALTER TABLE transactions
  ADD COLUMN IF NOT EXISTS recurring_parent_id UUID
    REFERENCES transactions(id) ON DELETE CASCADE;

-- Partial index: templates are the only rows we ever scan.
CREATE INDEX IF NOT EXISTS idx_transactions_recurring_templates
  ON transactions (recurring_parent_id, transaction_date)
  WHERE is_recurring = true;

-- One occurrence per template per date. Enforces idempotency at the database
-- level, so a double cron run (or a manual re-run) cannot duplicate a charge.
CREATE UNIQUE INDEX IF NOT EXISTS idx_transactions_recurring_occurrence
  ON transactions (recurring_parent_id, transaction_date)
  WHERE recurring_parent_id IS NOT NULL;

-- =============================================
-- 2. DATE ARITHMETIC
-- =============================================

-- Advances p_base by one recurrence step. Returns NULL for an unrecognised
-- frequency so the caller can bail out instead of looping forever.
-- Monthly and yearly clamp to the last valid day of the target month, so a
-- template anchored on the 31st recurs on Feb 28 rather than erroring.
CREATE OR REPLACE FUNCTION public.next_recurring_date(
  p_base       DATE,
  p_frequency  TEXT,
  p_interval   INT DEFAULT 1
) RETURNS DATE
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_interval    INT := GREATEST(COALESCE(p_interval, 1), 1);
  v_month_start DATE;
BEGIN
  CASE p_frequency
    WHEN 'daily' THEN
      RETURN p_base + (v_interval * 1);

    WHEN 'weekly' THEN
      RETURN p_base + (v_interval * 7);

    WHEN 'monthly' THEN
      -- First of the target month, v_interval months after the template's month.
      v_month_start := DATE_TRUNC('month', p_base)::DATE
                       + (v_interval * INTERVAL '1 month');
      -- LEAST() handles the day-31 clamp: the candidate overflows into the
      -- following month, so the month end wins.
      RETURN LEAST(
        v_month_start + (EXTRACT(DAY FROM p_base)::INT - 1),
        v_month_start + (INTERVAL '1 month - 1 day')
      );

    WHEN 'yearly' THEN
      v_month_start := MAKE_DATE(
        EXTRACT(YEAR FROM p_base)::INT + v_interval,
        EXTRACT(MONTH FROM p_base)::INT,
        1
      );
      RETURN LEAST(
        v_month_start + (EXTRACT(DAY FROM p_base)::INT - 1),
        v_month_start + (INTERVAL '1 month - 1 day')
      );

    ELSE
      RETURN NULL;
  END CASE;
END;
$$;

-- =============================================
-- 3. THE ENGINE
-- =============================================

-- Materialises every recurring occurrence due on or before CURRENT_DATE.
--
-- Idempotent by design: safe to run as often as you like. A template only ever
-- advances from its most recent generated occurrence, and the unique partial
-- index above rejects any duplicate the range scan might still produce.
--
-- The template row itself keeps its original balance effect - it was already
-- applied when the user recorded it. Only generated occurrences move money.
CREATE OR REPLACE FUNCTION public.process_recurring_transactions()
RETURNS TABLE (
  user_id      UUID,
  generated    INT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_template      transactions%ROWTYPE;
  v_cursor        DATE;
  v_next          DATE;
  v_end_date      DATE;
  v_interval      INT;
  v_frequency     TEXT;
  v_generated     INT;
  v_safety        INT := 0;
BEGIN
  FOR v_template IN
    SELECT t.*
    FROM transactions t
    WHERE t.is_recurring = true
      AND t.recurring_parent_id IS NULL
      AND t.recurring_config IS NOT NULL
  LOOP
    v_frequency := v_template.recurring_config ->> 'frequency';
    v_interval  := COALESCE(
      NULLIF(v_template.recurring_config ->> 'interval', '')::INT, 1
    );
    v_end_date  := NULLIF(v_template.recurring_config ->> 'end_date', '')::DATE;

    -- Resume from the latest generated occurrence so a missed run catches up
    -- rather than silently skipping days. Falls back to the template date.
    SELECT MAX(t2.transaction_date) INTO v_cursor
    FROM transactions t2
    WHERE t2.recurring_parent_id = v_template.id;

    v_cursor := COALESCE(v_cursor, v_template.transaction_date);
    v_generated := 0;

    LOOP
      v_safety := v_safety + 1;
      EXIT WHEN v_safety > 2000;  -- guards against a pathological config

      v_next := public.next_recurring_date(v_cursor, v_frequency, v_interval);
      EXIT WHEN v_next IS NULL;                          -- unknown frequency
      EXIT WHEN v_next > CURRENT_DATE;                  -- not due yet
      EXIT WHEN v_end_date IS NOT NULL AND v_next > v_end_date;

      INSERT INTO transactions (
        user_id, category_id, account_id, transfer_to_id, type, amount,
        description, transaction_date, notes, tags,
        is_recurring, recurring_config, recurring_parent_id
      )
      VALUES (
        v_template.user_id, v_template.category_id, v_template.account_id,
        v_template.transfer_to_id, v_template.type, v_template.amount,
        v_template.description, v_next, v_template.notes, v_template.tags,
        false, NULL, v_template.id
      )
      ON CONFLICT DO NOTHING;

      IF FOUND THEN
        -- Mirror the balance effect that record_transaction applies.
        IF v_template.account_id IS NOT NULL THEN
          UPDATE accounts
          SET balance = balance + CASE v_template.type
            WHEN 'income'   THEN  v_template.amount
            ELSE                 -v_template.amount
          END,
          updated_at = now()
          WHERE id = v_template.account_id;
        END IF;

        IF v_template.type = 'transfer' AND v_template.transfer_to_id IS NOT NULL THEN
          UPDATE accounts
          SET balance = balance + v_template.amount,
          updated_at = now()
          WHERE id = v_template.transfer_to_id;
        END IF;

        v_generated := v_generated + 1;
      END IF;

      v_cursor := v_next;
    END LOOP;

    IF v_generated > 0 THEN
      PERFORM public.sync_financial_profile(v_template.user_id);
      user_id   := v_template.user_id;
      generated := v_generated;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.process_recurring_transactions() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.process_recurring_transactions() TO service_role;

-- =============================================
-- 4. OPTIONAL: SCHEDULE IT
-- =============================================
-- NOT run automatically. pg_cron jobs do not survive a Supabase project
-- restart or a Free-plan pause, so re-check this after either happens.
--
--   SELECT cron.schedule(
--     'process-recurring-transactions',
--     '5 0 * * *',                       -- 00:05 UTC daily
--     $$SELECT public.process_recurring_transactions()$$
--   );
--
-- 00:05 UTC is 01:05 in Africa/Lagos, which keeps the write well clear of
-- local midnight so month-boundary occurrences land on the intended date.
--
-- Verify:
--   SELECT * FROM cron.job WHERE jobname = 'process-recurring-transactions';