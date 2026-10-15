-- Repoint the send-reminders job at Vault.
--
-- This job had been answering 401 on every run, once a minute, since before
-- the CRON_SECRET was rotated. The job itself was fine; the literal secret in
-- its command no longer matched the deployment. Budget reminders to paying
-- users were not being delivered and nothing surfaced it.
--
-- The literal stays readable in cron.job unless the job is replaced, which is
-- what this does. Same Vault secret the purchase-email sweep uses, so there is
-- one value to keep aligned with Vercel rather than two.
--
-- The schedule is unchanged at every minute. The route claims each delivery
-- through claim_reminder_delivery, so overlapping runs are already safe.
--
-- Verify afterwards:
--
--   select jobname, schedule, active from cron.job
--    where jobname = 'send-reminders';
--
--   select * from net._http_response order by id desc limit 3;
--
-- Read headers->>'x-matched-path' on the rows: the ones answering 200 rather
-- than 401 are the fixed job.

do $$
declare
  reminder_command text;
  secret_exists boolean;
begin
  select exists (
    select 1 from vault.decrypted_secrets where name = 'mmc_cron_secret'
  ) into secret_exists;

  if not secret_exists then
    raise exception
      'Vault secret mmc_cron_secret not found. Run: select vault.create_secret(''<CRON_SECRET>'', ''mmc_cron_secret'');';
  end if;

  -- Nested dollar tag so the inner statement does not collide with the DO
  -- block's own delimiter.
  reminder_command := $cron$
    select net.http_get(
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
  $cron$;

  if exists (select 1 from cron.job where jobname = 'send-reminders') then
    perform cron.unschedule('send-reminders');
  end if;

  perform cron.schedule('send-reminders', '* * * * *', reminder_command);
end $$;

-- The explicit timeout matches the maxDuration now exported by the route.
--
-- The default is 5 seconds, and this route walks every opted-in user whose
-- reminder time falls in the catch-up window, claiming and pushing one at a
-- time. Usually that is a handful of rows, but after downtime the window can
-- hold far more, and at 5 seconds pg_net would give up while the route kept
-- working. The caller would record a failure for a run that then completed.
--
-- 60 seconds is also the new maxDuration on the route, so the platform budget
-- and the caller budget agree. Raising one without the other reintroduces the
-- mismatch in the other direction.