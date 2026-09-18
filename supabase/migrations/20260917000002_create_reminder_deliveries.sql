CREATE TABLE reminder_deliveries (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  delivery_date  DATE NOT NULL,
  reminder_time  TEXT NOT NULL,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, delivery_date, reminder_time)
);

ALTER TABLE reminder_deliveries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages reminder deliveries"
  ON reminder_deliveries FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX idx_reminder_deliveries_lookup ON reminder_deliveries(user_id, delivery_date, reminder_time);
