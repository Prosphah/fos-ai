-- Cron watchdog support
--
-- pg_cron jobs do not survive a Supabase project restart or a Free-plan pause,
-- and cron.job_run_details reports "succeeded" even when the job's HTTP call
-- 503s (net.http_get queues asynchronously and returns a row regardless).
-- A dead job is therefore invisible from cron.job alone.
--
-- This exposes the state the API health check needs. The `cron` schema is not
-- exposed through PostgREST, so the route cannot query cron.job directly.
--
-- Run in the Supabase SQL Editor.

CREATE OR REPLACE FUNCTION public.cron_health()
RETURNS TABLE (
  jobid               BIGINT,
  jobname             TEXT,
  schedule            TEXT,
  active              BOOLEAN,
  last_run_at         TIMESTAMPTZ,
  last_status         TEXT,
  last_return_message TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT
    j.jobid,
    COALESCE(j.jobname::text, ''),
    j.schedule::text,
    j.active,
    r.start_time,
    r.status::text,
    LEFT(COALESCE(r.return_message, ''), 500)
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT d.start_time, d.status, d.return_message
    FROM cron.job_run_details d
    WHERE d.jobid = j.jobid
    ORDER BY d.runid DESC
    LIMIT 1
  ) r ON true
  ORDER BY j.jobid;
END;
$$;

REVOKE ALL ON FUNCTION public.cron_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cron_health() TO service_role;

-- Verify (expect one row per registered job):
--   SELECT * FROM public.cron_health();