-- Repair cron_health().
--
-- As written in 20261014000004, the function joined net._http_response on
-- e.url -- and net._http_response has no url column in any shipped pg_net
-- version (it is keyed by request id, which only the caller sees at queue
-- time). Every call died with SQLSTATE 42703 "column e.url does not exist",
-- so /api/health/cron answered 500 "Failed to read cron state" and could
-- report nothing at all: not the send-reminders run status, and not the
-- missing process-recurring-transactions job whose absence was the whole
-- point of this watchdog.
--
-- This rewrite keeps the same shape (the health route parses column names)
-- and changes the HTTP outcome handling:
--
--   * All row-to-JSON extraction reads keys through to_jsonb(e), so a future
--     pg_net column change degrades to "no recorded response" instead of
--     another 42703 silently killing the function.
--   * The net lookup is wrapped in a guarded block: a missing or reshaped
--     pg_net degrades per-job rather than failing every job.
--   * Because net._http_response records no URL, a response cannot be joined
--     to the job that queued it directly. Attribution works with a run
--     window: the newest response between that job's last run start and the
--     queuing statement's end_time plus a short grace period. A response
--     tallied long after a sweep last fired - a neighbour's - can no longer
--     be credited to it; what can still collide is two jobs sharing one
--     minute (the every-minute reminder and an hourly sweep), and the next
--     run corrects that. Per-job cron state (run status, return message)
--     stays exact, and a route's own ok / problems body is the tiebreaker
--     when in doubt.
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
DECLARE
  v_job       RECORD;
  v_last_run  cron.job_run_details%ROWTYPE;
  v_is_http   BOOLEAN;
  v_resp      JSONB;
BEGIN
  FOR v_job IN
    -- Bare ORDER BY jobid would collide with this function's own jobid
    -- output parameter under plpgsql's variable_conflict rules.
    SELECT * FROM cron.job j ORDER BY j.jobid
  LOOP
    -- Latest cron-level run. Not FOUND (null row) for a job that has never
    -- fired yet; %ROWTYPE keeps the variable readable so the field checks
    -- below are null rather than raising "record is not assigned yet".
    SELECT * INTO v_last_run
    FROM cron.job_run_details d
    WHERE d.jobid = v_job.jobid
    ORDER BY d.runid DESC
    LIMIT 1;

    v_is_http := v_job.command::text LIKE '%http://%'
              OR v_job.command::text LIKE '%https://%';

    v_resp := NULL;
    IF v_is_http AND v_last_run.start_time IS NOT NULL THEN
      BEGIN
        -- Newest response known to pg_net that landed inside this job's own
        -- run window: at or after the run started, and no later than the
        -- queuing statement's end_time plus a short grace period. pg_net
        -- records the response asynchronously, after the queuing statement
        -- has already returned - the grace absorbs a cold start plus the
        -- reminders sweep's 60s route budget - while the upper bound stops
        -- a later run of this job or a neighbouring job (for example the
        -- response an hourly sweep's health check reaches long after the
        -- sweep itself) from being credited to this job. Key access through
        -- to_jsonb so the query compiles against whatever columns this
        -- pg_net actually has.
        SELECT to_jsonb(e)
          INTO v_resp
        FROM net._http_response e
        WHERE (to_jsonb(e) ->> 'created')::TIMESTAMPTZ >= v_last_run.start_time
          AND (to_jsonb(e) ->> 'created')::TIMESTAMPTZ
                <= COALESCE(v_last_run.end_time, v_last_run.start_time)
                     + INTERVAL '2 minutes'
        ORDER BY (to_jsonb(e) ->> 'created')::TIMESTAMPTZ DESC
        LIMIT 1;
      EXCEPTION WHEN OTHERS THEN
        v_resp := NULL;
      END;
    END IF;

    jobid               := v_job.jobid;
    jobname             := COALESCE(v_job.jobname::text, '');
    schedule            := v_job.schedule::text;
    active              := v_job.active;
    last_run_at         := v_last_run.start_time;
    last_status         := COALESCE(v_last_run.status, '');
    last_return_message := LEFT(COALESCE(v_last_run.return_message, ''), 500);
    is_http             := v_is_http;
    last_http_status    := NULLIF(v_resp ->> 'status_code', '')::INT;
    last_http_body      := LEFT(COALESCE(v_resp ->> 'content', ''), 300);
    last_http_at        := (v_resp ->> 'created')::TIMESTAMPTZ;

    RETURN NEXT;
  END LOOP;
END;
$$;

REVOKE ALL ON FUNCTION public.cron_health() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cron_health() TO service_role;

-- Verify afterwards (expect one row per registered job, with last_run_at and
-- last_http_status populated for the HTTP sweeps):
--
--   SELECT * FROM public.cron_health();
--
-- Then hit the watchdog itself:
--
--   curl https://fos-ai.betiangli.xyz/api/health/cron \
--     -H "Authorization: Bearer $CRON_SECRET"
--
-- It should return ok:false listing "process-recurring-transactions: not
-- registered" until the cron setup migration runs, and ok:true after.
