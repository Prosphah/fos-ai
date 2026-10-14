-- Checkout intent capture.
--
-- Until now enrollments only ever gained a row once a payment succeeded, so
-- every count of it was a count of sales. Abandoned checkouts were invisible:
-- there was no way to tell a page that never converted from a page that
-- converted nine times and lost eighty people on the way to Paystack.
--
-- /api/checkout now writes a row with status 'pending' before it calls
-- Paystack. The webhook still upserts on paystack_reference, so a completed
-- purchase moves the same row from pending to paid and no second row is
-- created. Reading the test becomes:
--
--   select source_variant,
--          count(*) filter (where status in ('paid','active')) as paid,
--          count(*)                                     as started
--     from enrollments
--    group by source_variant;
--
-- Rows that are still pending after a few days are abandoned. They are not
-- errors and they are not deleted on a timer, because "nobody came back for
-- two weeks" is not the same as "nobody is coming back".
--
-- Privacy: these rows hold the name and email of someone who started a
-- checkout and did not buy. That is personal data and the retention table in
-- the privacy policy needs a row for it.

alter table enrollments
  add column if not exists followup_step smallint not null default 0,
  add column if not exists followup_sent_at timestamptz,
  add column if not exists purchase_email_sent_at timestamptz,
  add column if not exists ttclid text;

comment on column enrollments.followup_step is
  'How many abandoned-checkout emails have been sent. Reset to 0 on payment.';

comment on column enrollments.purchase_email_sent_at is
  'Set once the purchase confirmation has been accepted by the mail provider.
   Null on a paid row means it has not been confirmed delivered, and the sweep
   retries it. Rows predating this migration are grandfathered to created_at
   and so are never retried.';

comment on column enrollments.ttclid is
  'TikTok click id captured at checkout, sent to the Events API with the
   Purchase event. Null for traffic that did not arrive from a TikTok ad.';

-- Grandfather every purchase that already happened.
--
-- The column is new, so it is null on every existing paid row, which is
-- exactly the set the retry sweep below would otherwise pick up. Left alone,
-- its first run emails every historical customer a fresh purchase confirmation
-- for something they bought months ago.
--
-- A backfill rather than a created_at cutoff: a cutoff has to guess when the
-- feature went live and silently skips anything bought between that guess and
-- this migration. This is correct whenever the migration happens to run.
update enrollments
   set purchase_email_sent_at = created_at
 where status in ('paid', 'active')
   and purchase_email_sent_at is null;

-- Drives the abandoned-checkout sweep. Partial so it stays small no matter
-- how many completed sales accumulate.
create index if not exists enrollments_pending_idx
  on enrollments (created_at)
  where status = 'pending';

-- Drives the safety net that re-sends a purchase confirmation that was never
-- delivered, so that paying and receiving nothing is detectable rather than
-- something you only learn about when the buyer complains.
create index if not exists enrollments_unconfirmed_idx
  on enrollments (created_at)
  where status in ('paid', 'active')
    and purchase_email_sent_at is null;