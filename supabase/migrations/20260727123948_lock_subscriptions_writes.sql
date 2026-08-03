-- Lock subscriptions writes: authenticated users can only SELECT their own row.
-- Mutations (plan, status, Stripe IDs, periods) are reserved to service_role
-- (Edge Functions Stripe) and security definer helpers (e.g. ensure_user_subscription).

begin;

-- Remove client write policies
drop policy if exists subscriptions_insert_own on public.subscriptions;
drop policy if exists subscriptions_update_own on public.subscriptions;
drop policy if exists subscriptions_delete_own on public.subscriptions;

-- Reaffirm read-only access for the owning user
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
  for select
  to authenticated
  using (auth.uid() = user_id);

-- Explicit service_role full access (defense in depth if BYPASSRLS is ever disabled)
drop policy if exists subscriptions_service_role_all on public.subscriptions;
create policy subscriptions_service_role_all on public.subscriptions
  for all
  to service_role
  using (true)
  with check (true);

-- Table privileges: authenticated = SELECT only
revoke all on table public.subscriptions from anon;
revoke all on table public.subscriptions from authenticated;
grant select on table public.subscriptions to authenticated;
grant select, insert, update, delete on table public.subscriptions to service_role;

-- Ensure seed helper remains callable by clients but still security definer
-- (inserts only free/active, on conflict do nothing — never upgrades plan).
revoke all on function public.ensure_user_subscription() from public;
grant execute on function public.ensure_user_subscription() to authenticated;
grant execute on function public.ensure_user_subscription() to service_role;

commit;
