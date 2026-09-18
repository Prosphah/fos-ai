ALTER TABLE reminder_deliveries
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS claim_token UUID;

UPDATE reminder_deliveries
SET status = 'completed', completed_at = now()
WHERE completed_at IS NULL
  AND claimed_at IS NULL;

ALTER TABLE reminder_deliveries
  DROP CONSTRAINT IF EXISTS reminder_deliveries_status_check;

ALTER TABLE reminder_deliveries
  ADD CONSTRAINT reminder_deliveries_status_check
  CHECK (status IN ('pending', 'failed', 'completed'));

CREATE OR REPLACE FUNCTION public.claim_reminder_delivery(
  p_user_id UUID,
  p_delivery_date DATE,
  p_reminder_time TEXT,
  p_stale_before TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_claim_token UUID := gen_random_uuid();
  v_claimed_token UUID;
BEGIN
  INSERT INTO reminder_deliveries (user_id, delivery_date, reminder_time, status, claimed_at, completed_at, claim_token)
  VALUES (p_user_id, p_delivery_date, p_reminder_time, 'pending', now(), NULL, v_claim_token)
  ON CONFLICT (user_id, delivery_date, reminder_time) DO UPDATE
    SET status = 'pending', claimed_at = now(), completed_at = NULL, claim_token = v_claim_token
    WHERE reminder_deliveries.status = 'failed'
       OR reminder_deliveries.claimed_at IS NULL
       OR reminder_deliveries.claimed_at < p_stale_before
  RETURNING claim_token INTO v_claimed_token;

  RETURN v_claimed_token;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_reminder_delivery(UUID, DATE, TEXT, TIMESTAMPTZ) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.claim_reminder_delivery(UUID, DATE, TEXT, TIMESTAMPTZ) TO service_role;