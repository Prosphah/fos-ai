-- Gift purchases
--
-- A gift purchase is paid by one person and fulfilled for another. The
-- recipient is stored in the existing email/full_name columns, because that is
-- who the course access belongs to and what the whole fulfilment pipeline
-- already keys on; these columns record who paid and why the row exists.

alter table enrollments
  add column if not exists is_gift boolean not null default false,
  add column if not exists gift_recipient_name text,
  add column if not exists gift_recipient_email text,
  add column if not exists gift_purchaser_name text,
  add column if not exists gift_purchaser_email text;

comment on column enrollments.is_gift is
  'True when the purchase was bought for someone else; email/full_name then name the recipient.';
comment on column enrollments.gift_recipient_email is
  'Where access is sent. Mirrors email on gift rows, kept as a pair so a support query can read either without knowing the convention.';
comment on column enrollments.gift_purchaser_email is
  'The payer, for receipts and refunds. Null on a normal purchase.';
