-- Schedule the recurring transaction sweep.
--
-- The engine (20261014000001) shipped without its scheduler: the cron.schedule
-- call existed only as a commented-out "optional" note in that file, so
-- transaction templates were written by record_transaction and then never read
-- back. Zero occurrences were ever generated while every other sweep this app
-- depends on is registered by its own migration (setup_purchase_email_cron,
-- fix_send_reminders_cron, setup_abandoned_checkout_recovery) -- this was the
-- only job with no registration path at all.
--
-- The command runs the function directly rather than through an HTTP hop.
-- Unlike the other three jobs, this logic lives entirely in Postgres, so the
-- Vault secret, a Vercel cold start at 00:05, and the send-reminders-style
-- 401-after-secret-rotation failure mode all stay out of the loop. The job
-- command runs as the role that scheduled it (postgres, also the function
-- owner), which can execute the SECURITY DEFINER function regardless of the
-- REVOKE ... FROM PUBLIC on it.
--
-- Non-HTTP jobs are also the shape /api/health/cron reads most reliably: it
-- reports cron.job_run_details status verbatim, and a failed run surfaces with
-- its return message instead of the ambiguous "queued then vanished" of a
-- net.http_get sweep.
--
-- Supabase project restarts and Free-plan pauses suspend pg_cron execution
-- and can drop scheduled jobs. If /api/health/cron starts complaining about
-- this job (or cron_health shows it missing), re-run this file.
--
-- Run in the Supabase SQL Editor.

do $setup$
declare
  engine_exists boolean;
begin
  -- Guard the ordering the schedule depends on.
  select exists (
    select 1
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.proname = 'process_recurring_transactions'
  ) into engine_exists;

  if not engine_exists then
    raise exception
      'process_recurring_transactions() not found. Run 20261014000001_process_recurring_transactions.sql first.';
  end if;

  -- Unschedule first so re-running this is safe. cron.schedule raises
  -- duplicate_jobname if a job with this name already exists.
  if exists (select 1 from cron.job where jobname = 'process-recurring-transactions') then
    perform cron.unschedule('process-recurring-transactions');
  end if;

  -- 00:05 UTC = 01:05 Africa/Lagos, which keeps the write well clear of
  -- local midnight so month-boundary occurrences land on the intended date.
  perform cron.schedule(
    'process-recurring-transactions',
    '5 0 * * *',
    $job$
      SELECT public.process_recurring_transactions()
    $job$
  );
end
$setup$;

-- Verify afterwards:
--
--   select jobname, schedule, active from cron.job
--    where jobname = 'process-recurring-transactions';
--
-- After the first 00:05 run, confirm the engine produced rows:
--
--   select recurring_parent_id, transaction_date, amount, description
--   from transactions
--   where recurring_parent_id is not null
--   order by transaction_date desc limit 10;
--
-- And once the cron_health repair is in:
--
--   select * from public.cron_health();
