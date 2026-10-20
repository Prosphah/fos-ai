-- Schedule the abandoned-checkout recovery sweep.
--
-- A checkout that stays pending — the buyer reached Paystack and left, or
-- the card was declined — currently sits in enrollments forever and the
-- buyer never hears anything. The privacy policy's payments section already
-- promises the opposite: that we may contact them about an unfinished
-- checkout, that they can opt out by replying, and that unfinished checkouts
-- are deleted after 90 days. This migration and the sweep it schedules are
-- what make that section true.
--
-- Runs hourly at :33. Off the hour and off the :17 of the purchase-email
-- sweep, so the two sweeps never land at the same instant.
--
-- The pg_cron job is named 'abandoned-checkout-recovery'.
--
-- The Vault secret this job authenticates with is the same 'mmc_cron_secret'
-- the purchase-email sweep uses, so no new secret is needed. If that
-- migration has run on this project, this one will find the secret.
--
-- pg_cron jobs do not survive a Supabase project restart or a Free-plan
-- pause. Re-check after either happens.

create extension if not exists pg_net;
create extension if not exists pg_cron;

-- Claim columns for the recovery flow. Nothing else reads them.
--
-- recovery_started_at is written BEFORE the recovery email is posted and
-- released on failure, exactly like purchase_email_sent_at: the timestamp is
-- the lock that stops two concurrent runs emailing the same buyer.
--
-- recovery_attempts exists so a second touch at a longer delay can be added
-- later without another migration. The current sweep is one touch and never
-- raises it past 1.
alter table public.enrollments
  add column if not exists recovery_started_at timestamptz,
  add column if not exists recovery_attempts integer not null default 0;

-- The sweep reads pending rows by age. A partial index keeps that scan
-- proportional to the number of unfinished checkouts, which is small, rather
-- than the number of enrollments ever created, which grows forever.
create index if not exists enrollments_pending_recovery_idx
  on public.enrollments (created_at)
  where status = 'pending';

do $$
declare
  sweep_command text;
  secret_exists boolean;
begin
  -- Same guard as the purchase-email migration: refuse to register a job
  -- that cannot authenticate, so a missing secret fails loudly here instead
  -- of silently 401-ing every hour.
  select exists (
    select 1 from vault.decrypted_secrets where name = 'mmc_cron_secret'
  ) into secret_exists;

  if not secret_exists then
    raise exception
      'Vault secret mmc_cron_secret not found. Run: select vault.create_secret(''<CRON_SECRET>'', ''mmc_cron_secret'');';
  end if;

  sweep_command := $cron$
    select net.http_get(
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
  $cron$;

  -- Unsubscribe first so re-running this migration is safe.
  if exists (select 1 from cron.job where jobname = 'abandoned-checkout-recovery') then
    perform cron.unschedule('abandoned-checkout-recovery');
  end if;

  perform cron.schedule('abandoned-checkout-recovery', '33 * * * *', sweep_command);
end $$;

-- The 60-second pg_net timeout matches maxDuration on the route. The sweep
-- verifies each candidate against Paystack before emailing it, and a batch
-- of five at worst costs two verifies plus one Make post per buyer.
--
-- Verify the job exists:
--
--   select jobname, schedule, active from cron.job
--    where jobname = 'abandoned-checkout-recovery';
--
-- Verify the sweep actually authenticates, by firing it once by hand:
--
--   select net.http_get(
--       url := 'https://fos-ai.betiangli.xyz/api/cron/abandoned-checkout-recovery',
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
--    where jobname = 'abandoned-checkout-recovery' order by start_time desc limit 1;
--
-- A 200 means it authenticated and ran; the response body reports how many
-- buyers it saw and what it did. A 401 means the Vault secret and Vercel's
-- CRON_SECRET have drifted apart.
