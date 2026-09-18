ALTER TABLE user_settings ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'UTC';

UPDATE user_settings
SET reminder_days = ARRAY(
	SELECT CASE WHEN day_value = 7 THEN 0 ELSE day_value END
	FROM unnest(reminder_days) AS day_value
)
WHERE 7 = ANY(reminder_days);
