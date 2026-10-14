-- Money Mastery Code enrollments
-- Records every paid course purchase and its fulfilment state.

create table if not exists enrollments (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text,
  tier text not null check (tier in ('course', 'course_fosai')),
  amount integer not null,                -- minor units (kobo)
  currency text not null default 'NGN',
  status text not null default 'pending'
    check (status in ('pending', 'paid', 'provisioning', 'active', 'refunded', 'failed')),
  paystack_reference text unique,
  paystack_transaction_id bigint,
  fosai_invited_at timestamptz,
  fosai_user_id uuid,
  course_access_url text,
  refunded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists enrollments_email_idx on enrollments (lower(email));
create index if not exists enrollments_status_idx on enrollments (status);
create index if not exists enrollments_reference_idx on enrollments (paystack_reference);

alter table enrollments enable row level security;

-- Service-role only. Buyers read their own record after creating a FOS*AI account,
-- which is matched on email by the webhook.
create policy "enrollments_select_own"
  on enrollments for select
  using (
    auth.jwt() ->> 'email' is not null
    and lower(email) = lower(auth.jwt() ->> 'email')
  );

create or replace function set_enrollments_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists enrollments_updated_at on enrollments;
create trigger enrollments_updated_at
  before update on enrollments
  for each row execute function set_enrollments_updated_at();