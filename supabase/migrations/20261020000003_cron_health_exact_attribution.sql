-- Attribute cron HTTP responses by request id, not by time window.
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
-- This version attributes exactly, using only documented pg_net surfaces:
--
--   * net.http_get / net.http_post RETURN the id of the queued request.
--   * every response in net._http_response carries that id in its id
--     column - this is the same id net.http_collect_response takes.
--
-- Each HTTP cron command therefore records the request id it queued into
-- public.cron_http_requests, and cron_health joins responses back through
-- that table. Nothing here depends on pg_net internals: no probe of
-- net._http_request, whose existence and retention vary by pg_net build
-- (an earlier draft of this file probed it and would have silently
-- degraded to guessing on any build that drains completed requests).
--
-- The window heuristic is kept as a documented degraded mode for the case
-- where a job runs a command that does not record its request id - for
-- example if an older scheduling migration is re-applied on top of this
-- one. In that mode a job sharing its minute with send-reminders can
-- again display the reminder's response; the watchdog will also flag the
-- job, and re-running this file repairs the commands.
--
-- The output shape is unchanged; /api/health/cron parses these columns.
--
-- Safe to re-run: the table, indexes, schedules, and function are all
-- create-if-missing or replace-in-place.
--
-- Run in the Supabase SQL Editor.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Registry of queued cron HTTP requests. One row per run of every HTTP
-- job, kept for seven days - far longer than any attribution window, and
-- small: the every-minute reminders job contributes about ten thousand
-- rows a week, the hourly sweeps a few hundred.
create table if not exists public.cron_http_requests (
  jobname     text not null,
  request_id  bigint not null primary key,
  queued_at   timestamptz not null default now()
);

create index if not exists cron_http_requests_queued_idx
  on public.cron_http_requests (queued_at);

-- Internal bookkeeping, not app data. Keep it out of the API surface.
revoke all on public.cron_http_requests from anon, authenticated;

comment on table public.cron_http_requests is
  'Request id returned by net.http_get or net.http_post when a pg_cron job
   queued its HTTP call. cron_health joins net._http_response.id to
   request_id to attribute each response to the exact job that queued it,
   because pg_net records no URL on responses and time-window guessing
   misattributes jobs that share a minute. Rows older than seven days are
   deleted by the jobs themselves.';

do $setup$
declare
  secret_exists boolean;
begin
  -- Same guard as the scheduling migrations: refuse to re-register jobs
  -- that cannot authenticate, so a missing secret fails loudly here
  -- instead of silently 401-ing on every run.
  select exists (
    select 1 from vault.decrypted_secrets where name = 'mmc_cron_secret'
  ) into secret_exists;

  if not secret_exists then
    raise exception
      'Vault secret mmc_cron_secret not found. Run: select vault.create_secret(''<CRON_SECRET>'', ''mmc_cron_secret'');';
  end if;

  -- Re-register all three HTTP jobs with commands that record the request
  -- id. Each command also prunes registry rows older than seven days, so
  -- the table stays bounded even if a sibling job is later unscheduled.
  -- Schedules, URLs, headers, and timeouts are carried over verbatim from
  -- the migrations that registered these jobs; only the request-id
  -- recording is new.

  if exists (select 1 from cron.job where jobname = 'resend-purchase-emails') then
    perform cron.unschedule('resend-purchase-emails');
  end if;

  perform cron.schedule('resend-purchase-emails', '17 * * * *', $cron$
    delete from public.cron_http_requests
     where queued_at < now() - interval '7 days';

    insert into public.cron_http_requests (jobname, request_id)
    select 'resend-purchase-emails', net.http_get(
        url := 'https://fos-ai.betiangli.xyz/api/cron/resend-purchase-emails',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (
                select decrypted_secret
                from vault.decrypted_secrets
                where name = 'mmc_cron_secret'
            )
        ),
        timeout_milliseconds := 60000
    );
  $cron$);

  if exists (select 1 from cron.job where jobname = 'send-reminders') then
    perform cron.unschedule('send-reminders');
  end if;

  perform cron.schedule('send-reminders', '* * * * *', $cron$
    delete from public.cron_http_requests
     where queued_at < now() - interval '7 days';

    insert into public.cron_http_requests (jobname, request_id)
    select 'send-reminders', net.http_get(
        url := 'https://fos-ai.betiangli.xyz/api/cron/send-reminders',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (
                select decrypted_secret
                from vault.decrypted_secrets
                where name = 'mmc_cron_secret'
            )
        ),
        timeout_milliseconds := 60000
    );
  $cron$);

  if exists (select 1 from cron.job where jobname = 'abandoned-checkout-recovery') then
    perform cron.unschedule('abandoned-checkout-recovery');
  end if;

  perform cron.schedule('abandoned-checkout-recovery', '33 * * * *', $cron$
    delete from public.cron_http_requests
     where queued_at < now() - interval '7 days';

    insert into public.cron_http_requests (jobname, request_id)
    select 'abandoned-checkout-recovery', net.http_get(
        url := 'https://fos-ai.betiangli.xyz/api/cron/abandoned-checkout-recovery',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || (
                select decrypted_secret
                from vault.decrypted_secrets
                where name = 'mmc_cron_secret'
            )
        ),
        timeout_milliseconds := 60000
    );
  $cron$);
end
$setup$;

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
      -- Exact attribution. The response id is the request id, and the
      -- registry row says which job queued that request. Bounding created
      -- to the current run start keeps an older run response from
      -- shadowing the newest one when a job fires more than once inside
      -- the polling gap.
      BEGIN
        SELECT to_jsonb(e)
          INTO v_resp
        FROM net._http_response e
        JOIN public.cron_http_requests m
          ON m.request_id = (to_jsonb(e) ->> 'id')::BIGINT
        WHERE m.jobname = v_job.jobname
          AND (to_jsonb(e) ->> 'created')::TIMESTAMPTZ >= v_last_run.start_time
        ORDER BY (to_jsonb(e) ->> 'created')::TIMESTAMPTZ DESC
        LIMIT 1;
      EXCEPTION WHEN OTHERS THEN
        v_resp := NULL;
      END;

      IF v_resp IS NULL THEN
        BEGIN
          -- Degraded mode: the job ran but recorded no request id, so the
          -- newest response inside its run window is the best available
          -- guess. Exact for jobs on unique minutes; shadowed for jobs
          -- sharing a minute with send-reminders. Re-running this file
          -- restores exact attribution. Key access through to_jsonb so the
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

-- Verify afterwards:
--
--   SELECT * FROM public.cron_health();
--
-- The abandoned-checkout row must now show a body that starts with
-- {"buyers": - its own response - never the reminders job's
-- {"success":true,"processed":...} shape. (Until the next :33 run it shows
-- the most recent response recorded for that job.)
--
-- Confirm the jobs record their request ids:
--
--   SELECT jobname, command FROM cron.job
--    WHERE jobname IN ('resend-purchase-emails', 'send-reminders',
--                      'abandoned-checkout-recovery');
--
-- Every command should contain "insert into public.cron_http_requests".
-- After the next run of each job, the registry fills:
--
--   SELECT * FROM public.cron_http_requests ORDER BY queued_at DESC LIMIT 5;
