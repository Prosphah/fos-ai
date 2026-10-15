-- Schedule the purchase-email resend sweep.
--
-- Runs hourly at :17. Off the hour on purpose, so it does not land at the
-- same instant as every other :00 job in the account.
--
-- Executable, unlike 20260917000004_setup_reminder_cron.sql which is
-- documentation only. Cron registration here does it automatically so the
-- sweep cannot be silently skipped by someone assuming the migrations folder
-- contains nothing but schema.
--
-- The pg_cron job is named 'resend-purchase-emails'.
--
-- ---------------------------------------------------------------------------
-- RUN THIS FIRST, IN ITS OWN STATEMENT. The migration below raises an
-- exception and does nothing without it:
--
--   alter database postgres
--     set "app.settings.cron_secret" = '<the same value as Vercel CRON_SECRET>';
--
-- It lives in the database rather than inline here so the secret is never
-- written into cron.job, where anyone able to read that table can read it.
-- ---------------------------------------------------------------------------

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Unsubscribe first so re-running this is safe. cron.schedule raises
-- "job name already exists" on a re-run rather than updating in place, which
-- would make this migration fail the second time it is applied.
--
-- The body is a literal so the dollar quoting of the inner statement does not
-- collide with the DO block's own delimiter.
do $$
declare
  sweep_command text := $cron$
    select net.http_get(
        url := 'https://fos-ai.betiangli.xyz/api/cron/resend-purchase-emails',
        headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer ' || current_setting('app.settings.cron_secret', true)
        ),
        timeout_milliseconds := 60000
    );
  $cron$;
  secret text := current_setting('app.settings.cron_secret', true);
begin
  -- Refuse to register a job that cannot authenticate. Without this the header
  -- would be 'Bearer ' || null, the sweep would answer 401 on every run, and
  -- nothing would surface it until a buyer reported a missing email.
  if secret is null or secret = '' then
    raise exception
      'app.settings.cron_secret is not set. Run: alter database postgres set "app.settings.cron_secret" = ''<same value as Vercel CRON_SECRET>'';';
  end if;

  if exists (select 1 from cron.job where jobname = 'resend-purchase-emails') then
    perform cron.unschedule('resend-purchase-emails');
  end if;

  perform cron.schedule('resend-purchase-emails', '17 * * * *', sweep_command);
end $$;

-- The explicit timeout matters. pg_net defaults to 5 seconds, and this
-- endpoint is allowed up to 60: ten rows, each a sequential post that can burn
-- the full three-second trigger timeout when Make is down. At the default the
-- cron job would give up while the sweep was still working and report a
-- failure for a run that then carried on server-side.
--
-- 60s matches the maxDuration exported by the route. Raising one without the
-- other reintroduces the same mismatch in the other direction.
--
-- timeout_milliseconds has been available since pg_net 0.3. Supabase ships
-- newer than that. Named notation is used so the argument position does not
-- matter; pg_net moved timeout_milliseconds one place along when it gained a
-- body parameter.
--
-- CRON_SECRET: see the header. If you skipped that statement the migration
-- raised an exception rather than registering a job that cannot authenticate.
--
-- Verify:
--
--   select jobname, schedule, active from cron.job
--    where jobname = 'resend-purchase-emails';
--
-- pg_cron jobs do not survive a Supabase project restart or a Free-plan
-- pause. Re-check after either happens.