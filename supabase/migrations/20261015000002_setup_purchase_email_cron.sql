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
-- RUN THIS FIRST, IN ITS OWN STATEMENT:
--
--   select vault.create_secret('<CRON_SECRET>', 'mmc_cron_secret');
--
-- Use the same value as Vercel's CRON_SECRET. The migration below raises an
-- exception and schedules nothing without it.
--
-- The secret lives in Vault rather than inline in the job command because the
-- command is stored in cron.job as readable text. Supabase has exposed that
-- table to logged-in users before, so a literal there is a literal in the
-- hands of anyone who can query it. Resolving it at run time means the
-- command holds a reference, not the secret.
--
-- A database-level setting (ALTER DATABASE ... SET) is the other option and
-- is not used here: the SQL editor's role cannot set custom parameters, and
-- the error it produces is opaque enough to look like a quoting problem.
-- ---------------------------------------------------------------------------

create extension if not exists pg_net;
create extension if not exists pg_cron;

do $$
declare
  sweep_command text;
  secret_exists boolean;
begin
  -- Refuse to register a job that cannot authenticate. Without this the
  -- header would be 'Bearer ' concatenated with null, the sweep would answer
  -- 401 on every run, and nothing would surface it until a buyer reported a
  -- missing email.
  select exists (
    select 1 from vault.decrypted_secrets where name = 'mmc_cron_secret'
  ) into secret_exists;

  if not secret_exists then
    raise exception
      'Vault secret mmc_cron_secret not found. Run: select vault.create_secret(''<CRON_SECRET>'', ''mmc_cron_secret'');';
  end if;

  -- Nested dollar tag so the inner statement does not collide with the DO
  -- block's own delimiter.
  sweep_command := $cron$
    select net.http_get(
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
  $cron$;

  -- Unsubscribe first so re-running this is safe. cron.schedule raises
  -- "job name already exists" on a re-run rather than updating in place, which
  -- would make this migration fail the second time it is applied.
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
-- Named notation is used so the argument position does not matter; pg_net
-- moved timeout_milliseconds one place along when it gained a body parameter.
--
-- Verify the job exists, and that its command holds no secret:
--
--   select jobname, schedule, active from cron.job
--    where jobname = 'resend-purchase-emails';
--
-- Verify the sweep actually authenticates, by firing it once by hand:
--
--   select net.http_get(
--       url := 'https://fos-ai.betiangli.xyz/api/cron/resend-purchase-emails',
--       headers := jsonb_build_object(
--           'Authorization', 'Bearer ' || (
--               select decrypted_secret from vault.decrypted_secrets
--                where name = 'mmc_cron_secret'
--           )
--       ),
--       timeout_milliseconds := 60000
--   );
--
--   select status, content from cron.job_run_details
--    where jobname = 'resend-purchase-emails' order by start_time desc limit 1;
--
-- A 200 means it authenticated. A 401 means the Vault secret and Vercel's
-- CRON_SECRET have drifted apart.
--
-- pg_cron jobs do not survive a Supabase project restart or a Free-plan
-- pause. Re-check after either happens.