-- Provider-aware checkouts and TikTok Advanced Matching identifiers.
--
-- 1. payment_provider
--    The recovery sweep verifies pending rows against a payment API. It used
--    to assume Paystack. Once PAYMENT_PROVIDER can be flipped, a pending row
--    created by one provider must keep being verified against that provider
--    even after the switch — otherwise every old pending row becomes
--    permanently unverifiable and its buyer is never emailed.
--
-- 2. client_ip / client_user_agent / visitor_id / customer_phone / ttclid
--    Captured at checkout start, read back at purchase time, and sent with the
--    server-side Purchase event. ttclid already exists from
--    20261015000001_checkout_intents.sql; these are the rest of the identifiers
--    TikTok's Event Match Quality recommendations ask for.

alter table enrollments
  add column if not exists payment_provider text not null default 'paystack',
  add column if not exists client_ip text,
  add column if not exists client_user_agent text,
  add column if not exists visitor_id text,
  add column if not exists customer_phone text,
  add column if not exists ttp text;

comment on column enrollments.payment_provider is
  'Payment provider that owns paystack_reference. Defaults to paystack for
   every row that existed before the provider switch.';

comment on column enrollments.client_ip is
  'Buyer IP captured at checkout start, sent to the TikTok Events API.';

comment on column enrollments.client_user_agent is
  'Buyer user agent captured at checkout start, sent to the TikTok Events API.';

comment on column enrollments.visitor_id is
  'Anonymous mmc_vid cookie value, hashed at send time and used as TikTok
   external_id so the Purchase can be matched to the PageView.';

comment on column enrollments.customer_phone is
  'WhatsApp/phone number captured at checkout, normalised to E.164 digits.
   Hashed before it reaches TikTok.';

comment on column enrollments.ttp is
  'The TikTok pixel _ttp cookie, read at checkout and sent as user.ttp.
   Plain text, like ttclid.';

-- The column defaults to paystack, which is right for every row created before
-- the switch. Flutterwave references carry a prefix that makes the handful of
-- rows created during the switch unambiguous; correct them rather than leaving
-- the recovery sweep pointing at the wrong API.
update enrollments
   set payment_provider = 'flutterwave'
 where paystack_reference like 'MMC-FLW-%'
   and payment_provider = 'paystack';

-- The sweep filters on status and verifies per provider; this keeps the
-- lookup cheap once pending rows accumulate.
create index if not exists enrollments_pending_provider_idx
  on enrollments (payment_provider, created_at)
  where status = 'pending';
