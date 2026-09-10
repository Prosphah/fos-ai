-- Product feedback submitted by authenticated users
CREATE TABLE feedback (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  area            TEXT NOT NULL CHECK (area IN ('briefing', 'money_manager', 'assistant', 'tools', 'settings', 'other')),
  feedback_type   TEXT NOT NULL CHECK (feedback_type IN ('improvement', 'feature_request', 'bug', 'other')),
  message         TEXT NOT NULL CHECK (char_length(message) BETWEEN 10 AND 4000),
  status          TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'reviewed', 'planned', 'resolved')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_feedback_user_created_at ON feedback(user_id, created_at DESC);

ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feedback"
  ON feedback FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit feedback"
  ON feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);