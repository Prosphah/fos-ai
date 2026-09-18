DROP POLICY IF EXISTS "Service role manages reminder deliveries" ON reminder_deliveries;

CREATE POLICY "Service role manages reminder deliveries"
  ON reminder_deliveries FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
