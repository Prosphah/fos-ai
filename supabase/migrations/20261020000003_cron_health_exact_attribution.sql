-- Attribute cron HTTP responses by URL instead of by time window.
--
-- 20261020000002 replaced the broken url-column join with a run-window
-- guess: "newest response recorded between this job's start and its end
-- plus two minutes". For jobs on unique minutes that is exact. It is
-- structurally wrong for an hourly sweep that shares its minute with the
-- every-minute send-reminders job: the reminder's next response always
-- lands inside the sweep's window and is newer than the sweep's own, so
-- the sweep's row displays the reminder's status and body. That is what
-- happened on 2026-10-20: abandoned-checkout-recovery showed
-- send-reminders' {"success":true,"processed":0,...} while its own
-- response went unseen entirely.
--
-- pg_net's response table records no URL, but the request table does, and
-- a response's id is the id of the request that produced it. Where
-- net._http_request retains the queued request, joining on that id
-- attributes every response to the exact job that queued it. Where the
-- table is absent, shaped differently, or drained after completion, the
-- function falls back to the window heuristic - degrading to the previous
-- behavior rather than failing.
--
-- The output shape is unchanged; /api/health/cron parses these columns.
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
  v_url       TEXT;
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
    v_url  := NULL;
    IF v_is_http AND v_last_run.start_time IS NOT NULL THEN
      -- The endpoint this job queues, taken from the command text. Every
      -- HTTP job registered in this database queues exactly one URL.
      v_url := (regexp_match(
                 v_job.command::text,
                 'https?://[^[:space:'',)]+',
                 'g'
               ))[1];

      -- Exact attribution first. A missing table, a missing column, a type
      -- surprise, or a drained request row all land in the exception (or
      -- simply match nothing) and fall through to the window heuristic.
      BEGIN
        IF v_url IS NOT NULL THEN
          SELECT to_jsonb(e)
            INTO v_resp
          FROM net._http_response e
          JOIN net._http_request r
            ON r.id = (to_jsonb(e) ->> 'id')::BIGINT
          WHERE to_jsonb(r) ->> 'url' = v_url
            AND (to_jsonb(e) ->> 'created')::TIMESTAMPTZ >= v_last_run.start_time
          ORDER BY (to_jsonb(e) ->> 'created')::TIMESTAMPTZ DESC
          LIMIT 1;
        END IF;
      EXCEPTION WHEN OTHERS THEN
        v_resp := NULL;
      END;

      IF v_resp IS NULL THEN
        BEGIN
          -- Window heuristic (20261020000002's behavior), kept as fallback:
          -- exact for jobs on unique minutes, shadowed for jobs sharing a
          -- minute with send-reminders. Key access through to_jsonb so the
          -- query compiles against whatever columns this pg_net has.
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

-- Verify afterwards. The abandoned-checkout row must now show a body that
-- starts with {"buyers": - its own response - never the reminders job's
-- {"success":true,"processed":...} shape:
--
--   SELECT * FROM public.cron_health();
--
-- If the exact path is unavailable on this pg_net build (drained request
-- table), the row falls back to the window guess; check which is active
-- with:
--
--   SELECT count(*) FROM net._http_request;
