-- Cron watchdog support
--
-- pg_cron job definitions persist in cron.job across project restarts and
-- Free-plan pauses; pausing only stops execution while the project is paused.
-- What is NOT visible from cron.job alone is whether the job actually works:
-- cron.job_run_details reports "succeeded" whenever the command ran, even when
-- its HTTP call returned 503, because net.http_get queues asynchronously and
-- returns a row regardless of the eventual status code. That blind spot is
-- what let a missing VAPID_* env var hide for a week.
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
  last_return_message TEXT,
  is_http             BOOLEAN,
  last_http_status    INT,
  last_http_body      TEXT,
  last_http_at        TIMESTAMPTZ
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
    LEFT(COALESCE(r.return_message, ''), 500),
    h.is_http,
    h.status_code,
    LEFT(COALESCE(h.content, ''), 300),
    h.created
  FROM cron.job j
  LEFT JOIN LATERAL (
    SELECT d.start_time, d.status, d.return_message
    FROM cron.job_run_details d
    WHERE d.jobid = j.jobid
    ORDER BY d.runid DESC
    LIMIT 1
  ) r ON true
  LEFT JOIN LATERAL (
    -- A job is treated as an HTTP job when its command targets a URL. For
    -- those, cron-level success is meaningless: net.http_get queues the
    -- request and returns, so "succeeded" only proves the queue worked.
    -- The real outcome is the status code recorded in net._http_response.
    SELECT
      TRUE AS is_http,
      e.status_code,
      e.content,
      e.created
    FROM net._http_response e
    WHERE (j.command::text LIKE '%http://%' OR j.command::text LIKE '%https://%')
      AND e.url = ANY(
        -- URLs referenced by this job's command
        ARRAY(
          SELECT m[1]
          FROM regexp_matches(j.command::text, '(https?://[^''"\s]+)', 'g') AS x(m)
        )
      )
    ORDER BY e.created DESC
    LIMIT 1
  ) h ON true
  ORDER BY j.jobid;
END;
$$;

REVOKE ALL ON FUNCTION public.cron_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cron_health() TO service_role;

-- Verify (expect one row per registered job):
--   SELECT * FROM public.cron_health();