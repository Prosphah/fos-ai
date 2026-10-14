-- Account deletion. Erases every row tied to a user, then removes the auth
-- record itself, in one transaction so a partial failure cannot leave an
-- orphaned profile behind a live login.
--
-- Security: SECURITY DEFINER means this runs with the owner's rights, so RLS
-- is bypassed by design. It is therefore granted ONLY to service_role and
-- revoked from everyone else. The application calls it through
-- src/app/api/account/delete/route.ts using SUPABASE_SERVICE_ROLE_KEY. Never
-- expose this function to the anon or authenticated roles.
--
-- financial_profiles, financial_goals, risk_assessments and waitlist predate
-- the migrations directory and have no foreign key to auth.users, so they are
-- deleted explicitly rather than relying on ON DELETE CASCADE.

create or replace function delete_account_data(p_user_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  v_deleted jsonb := '{}'::jsonb;
  v_rows integer;
begin
  -- Guard against a null or malformed identifier.
  if p_user_id is null then
    raise exception 'p_user_id is required';
  end if;

  -- Child rows first so foreign keys stay satisfied throughout.
  delete from reminder_deliveries where user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('reminder_deliveries', v_rows);

  delete from notifications where user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('notifications', v_rows);

  delete from push_subscriptions where user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('push_subscriptions', v_rows);

  delete from feedback where user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('feedback', v_rows);

  -- Transactions reference accounts and categories, so they go first.
  delete from transactions where user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('transactions', v_rows);

  delete from budgets where user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('budgets', v_rows);

  delete from savings_goals where user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('savings_goals', v_rows);

  delete from accounts where user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('accounts', v_rows);

  -- System categories have a null user_id and are shared. Only user rows go.
  delete from categories where user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('categories', v_rows);

  delete from user_settings where user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('user_settings', v_rows);

  -- Tables with no migration and therefore no cascading foreign key.
  delete from financial_goals where user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('financial_goals', v_rows);

  delete from risk_assessments where user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('risk_assessments', v_rows);

  delete from financial_profiles where user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('financial_profiles', v_rows);

  delete from waitlist where user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('waitlist', v_rows);

  -- Enrollments are keyed on email, not user_id, and are deliberately left in
  -- place: they are the sales and tax record the privacy policy says we retain.
  -- The link to this account is severed here so the retained record no longer
  -- points at a person who asked to be forgotten.
  update enrollments
     set fosai_user_id = null,
         updated_at = now()
   where fosai_user_id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('enrollments_unlinked', v_rows);

  -- The auth record last: anything still cascading from it goes now.
  delete from auth.users where id = p_user_id;
  get diagnostics v_rows = row_count;
  v_deleted := v_deleted || jsonb_build_object('auth_users', v_rows);

  return v_deleted;
end;
$$;

revoke all on function delete_account_data(uuid) from public;
revoke all on function delete_account_data(uuid) from anon;
revoke all on function delete_account_data(uuid) from authenticated;
grant execute on function delete_account_data(uuid) to service_role;

comment on function delete_account_data(uuid) is
  'Erases all personal data for a user and removes the auth record. Service role only. Enrollment rows are retained for tax and unlinked from the deleted account.';