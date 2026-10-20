-- Backfill the followup columns the recovery sweep now maintains.
--
-- followup_step / followup_sent_at were added by 20261015000001 as the
-- tracking columns for abandoned-checkout emails, but the sweep that
-- 20261019000001 shipped keeps its state in recovery_started_at /
-- recovery_attempts instead, and nothing ever wrote the followup pair -
-- which is why every row read 0 / NULL even after emails went out.
--
-- The sweep now writes both pairs in lockstep (set on claim, cleared on
-- release, cleared again on payment by the fulfil upsert). This one-off
-- copies the recovery state into the readable pair so checkouts already
-- contacted before that change - the first five deliveries - are visible
-- there too.
--
-- Pending rows only: a row that was contacted and then paid keeps
-- recovery_started_at set, but the followup pair must read clean on every
-- non-pending row, matching the reset-on-payment contract and the sweep's
-- own writes. Non-pending rows are corrected explicitly below, which also
-- undoes any stamp an earlier unrestricted draft of this backfill left on
-- converted rows.
--
-- Run in the Supabase SQL Editor. Safe to re-run: both updates only touch
-- rows that still disagree with the recovery state.

update enrollments
   set followup_step = recovery_attempts,
       followup_sent_at = recovery_started_at
 where status = 'pending'
   and recovery_started_at is not null
   and followup_sent_at is null;

update enrollments
   set followup_step = 0,
       followup_sent_at = null
 where status <> 'pending'
   and (followup_step <> 0 or followup_sent_at is not null);

comment on column enrollments.followup_sent_at is
  'When the abandoned-checkout recovery email was triggered for this buyer.
   Set on every pending row of a buyer who was contacted - one email covers
   all of a buyer''s attempts, so sibling rows carry the same stamp. Cleared
   if the send failed and the claim was released, and cleared when the
   checkout ends in a payment.';
