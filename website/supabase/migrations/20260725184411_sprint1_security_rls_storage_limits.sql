-- Sprint 1 — Confiance
-- B2 company_members · B3 subscriptions · B4 storage · B5 freemium DB limits
-- Goal: no critical IDOR / self-upgrade / public storage / client-only quotas.

-- =============================================================================
-- Helpers
-- =============================================================================

create or replace function public.user_is_company_owner(p_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_members m
    where m.company_id = p_company_id
      and m.user_id = auth.uid()
      and m.role = 'owner'
  );
$$;

revoke all on function public.user_is_company_owner(uuid) from public;
grant execute on function public.user_is_company_owner(uuid) to authenticated;

-- =============================================================================
-- B2 — company_members: no self-join, no role escalate via client
-- =============================================================================

-- Clients must NOT insert themselves into arbitrary companies.
drop policy if exists company_members_insert_own on public.company_members;
drop policy if exists company_members_update_own on public.company_members;
drop policy if exists company_members_delete_own on public.company_members;
drop policy if exists company_members_insert_authenticated on public.company_members;
drop policy if exists company_members_update_authenticated on public.company_members;
drop policy if exists company_members_delete_authenticated on public.company_members;

-- Select: only memberships of companies you already belong to (no cross-tenant leak).
drop policy if exists company_members_select_own on public.company_members;
create policy company_members_select_member on public.company_members
  for select to authenticated
  using (public.user_has_company_access(company_id));

-- No INSERT / UPDATE / DELETE policies for authenticated.
-- Membership writes only via security definer RPCs:
--   handle_new_user, create_company_for_user, (future invite RPC).

-- Companies: stop orphan create with WITH CHECK (true)
drop policy if exists companies_insert_authenticated on public.companies;
-- Inserts only via security definer (handle_new_user / create_company_for_user)

drop policy if exists companies_update_member on public.companies;
create policy companies_update_owner on public.companies
  for update to authenticated
  using (public.user_is_company_owner(id))
  with check (public.user_is_company_owner(id));

-- Keep select for members
drop policy if exists companies_select_member on public.companies;
create policy companies_select_member on public.companies
  for select to authenticated
  using (public.user_has_company_access(id));

-- Defense in depth: block direct membership mutations from clients.
-- Trusted RPCs set local GUC inveq.allow_membership_write = on.
create or replace function public.company_members_guard_mutation()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true), '');
begin
  -- service_role (webhooks / admin) and no JWT (migrations / auth triggers) bypass
  if v_role = 'service_role' or auth.uid() is null then
    return coalesce(new, old);
  end if;

  -- Allow when called from our trusted security definer RPCs via local GUC
  if current_setting('inveq.allow_membership_write', true) = 'on' then
    return coalesce(new, old);
  end if;

  raise exception 'COMPANY_MEMBERS_FORBIDDEN'
    using errcode = '42501',
          hint = 'Membership changes must go through authorized RPCs.';
end;
$$;

drop trigger if exists company_members_guard_insert on public.company_members;
drop trigger if exists company_members_guard_update on public.company_members;
drop trigger if exists company_members_guard_delete on public.company_members;

create trigger company_members_guard_insert
  before insert on public.company_members
  for each row
  execute function public.company_members_guard_mutation();

create trigger company_members_guard_update
  before update on public.company_members
  for each row
  execute function public.company_members_guard_mutation();

create trigger company_members_guard_delete
  before delete on public.company_members
  for each row
  execute function public.company_members_guard_mutation();

-- Patch trusted RPCs to set the GUC around membership writes
create or replace function public.create_company_for_user(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_name text;
  v_check jsonb;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  -- Enforce company quota in DB
  v_check := public.check_plan_limit('companies');
  if coalesce((v_check ->> 'allowed')::boolean, false) is not true then
    raise exception 'PLAN_LIMIT_REACHED:companies'
      using errcode = 'P0001';
  end if;

  v_name := coalesce(nullif(trim(p_name), ''), 'Nouvelle entreprise');

  insert into public.companies (name, created_at, updated_at)
  values (v_name, timezone('utc', now()), timezone('utc', now()))
  returning id into v_company_id;

  perform set_config('inveq.allow_membership_write', 'on', true);
  insert into public.company_members (company_id, user_id, role)
  values (v_company_id, auth.uid(), 'owner');
  perform set_config('inveq.allow_membership_write', 'off', true);

  insert into public.settings (user_id, company_id, created_at, updated_at)
  values (auth.uid(), v_company_id, timezone('utc', now()), timezone('utc', now()))
  on conflict (user_id) do nothing;

  return v_company_id;
end;
$$;

grant execute on function public.create_company_for_user(text) to authenticated;

-- handle_new_user runs as trigger on auth.users — auth.uid() is null in some paths;
-- role is typically not authenticated JWT. Guard allows auth.uid() is null.
-- Still set GUC for safety when jwt is present.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_company_name text;
begin
  insert into public.profiles (id, email, created_at, updated_at)
  values (new.id, new.email, timezone('utc', now()), timezone('utc', now()))
  on conflict (id) do nothing;

  v_company_name := coalesce(
    nullif(trim(new.raw_user_meta_data->>'company_name'), ''),
    'Mon entreprise'
  );

  insert into public.companies (name, email, created_at, updated_at)
  values (v_company_name, new.email, timezone('utc', now()), timezone('utc', now()))
  returning id into v_company_id;

  perform set_config('inveq.allow_membership_write', 'on', true);
  insert into public.company_members (company_id, user_id, role)
  values (v_company_id, new.id, 'owner')
  on conflict do nothing;
  perform set_config('inveq.allow_membership_write', 'off', true);

  insert into public.settings (user_id, company_id, created_at, updated_at)
  values (new.id, v_company_id, timezone('utc', now()), timezone('utc', now()))
  on conflict (user_id) do update set company_id = excluded.company_id;

  perform set_config('inveq.allow_subscription_write', 'on', true);
  insert into public.subscriptions (user_id, company_id, plan, status, created_at, updated_at)
  values (
    new.id, v_company_id,
    'free'::public.subscription_plan,
    'active'::public.subscription_status,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (user_id) do update set company_id = excluded.company_id;
  perform set_config('inveq.allow_subscription_write', 'off', true);

  return new;
end;
$$;

-- =============================================================================
-- B3 — subscriptions: client read-only; writes = service role / security definer
-- =============================================================================

drop policy if exists subscriptions_insert_own on public.subscriptions;
drop policy if exists subscriptions_update_own on public.subscriptions;
drop policy if exists subscriptions_delete_own on public.subscriptions;
drop policy if exists subscriptions_insert_authenticated on public.subscriptions;
drop policy if exists subscriptions_update_authenticated on public.subscriptions;
drop policy if exists subscriptions_delete_authenticated on public.subscriptions;

drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
  for select to authenticated
  using (auth.uid() = user_id);

-- Revoke direct DML from authenticated (SELECT kept via GRANT + policy)
revoke insert, update, delete on public.subscriptions from authenticated;
grant select on public.subscriptions to authenticated;

-- ensure_user_subscription remains security definer (creates free/micro row only)
-- Stripe webhooks use service_role and bypass RLS.

create or replace function public.subscriptions_guard_client_write()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_role text := coalesce(auth.jwt() ->> 'role', '');
begin
  if v_role = 'service_role' or auth.uid() is null then
    return coalesce(new, old);
  end if;

  if current_setting('inveq.allow_subscription_write', true) = 'on' then
    -- Trusted definer may only ensure a free row exists — never upgrade plan
    if tg_op = 'INSERT' then
      new.plan := 'free'::public.subscription_plan;
      new.status := 'active'::public.subscription_status;
      return new;
    end if;
    if tg_op = 'UPDATE' then
      -- Block plan/status/stripe field changes from client-trusted path
      new.plan := old.plan;
      new.status := old.status;
      new.stripe_customer_id := old.stripe_customer_id;
      new.stripe_subscription_id := old.stripe_subscription_id;
      new.current_period_start := old.current_period_start;
      new.current_period_end := old.current_period_end;
      new.cancel_at_period_end := old.cancel_at_period_end;
      new.trial_ends_at := old.trial_ends_at;
      return new;
    end if;
  end if;

  raise exception 'SUBSCRIPTIONS_WRITE_FORBIDDEN'
    using errcode = '42501',
          hint = 'Subscription changes must come from Stripe webhooks / service role.';
end;
$$;

drop trigger if exists subscriptions_guard_insert on public.subscriptions;
drop trigger if exists subscriptions_guard_update on public.subscriptions;
drop trigger if exists subscriptions_guard_delete on public.subscriptions;

create trigger subscriptions_guard_insert
  before insert on public.subscriptions
  for each row
  execute function public.subscriptions_guard_client_write();

create trigger subscriptions_guard_update
  before update on public.subscriptions
  for each row
  execute function public.subscriptions_guard_client_write();

create trigger subscriptions_guard_delete
  before delete on public.subscriptions
  for each row
  execute function public.subscriptions_guard_client_write();

create or replace function public.ensure_user_subscription()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  perform set_config('inveq.allow_subscription_write', 'on', true);
  insert into public.subscriptions (user_id, plan, status, created_at, updated_at)
  values (
    v_uid,
    'free'::public.subscription_plan,
    'active'::public.subscription_status,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (user_id) do nothing;
  perform set_config('inveq.allow_subscription_write', 'off', true);
end;
$$;

revoke all on function public.ensure_user_subscription() from public;
grant execute on function public.ensure_user_subscription() to authenticated;

-- =============================================================================
-- B4 — Storage: private buckets + authenticated path ACL
-- =============================================================================

update storage.buckets
set public = false
where id in ('company-assets', 'document-signatures');

drop policy if exists company_assets_select_public on storage.objects;
drop policy if exists company_assets_select on storage.objects;
drop policy if exists company_assets_insert on storage.objects;
drop policy if exists company_assets_update on storage.objects;
drop policy if exists company_assets_delete on storage.objects;
drop policy if exists company_assets_insert_own on storage.objects;
drop policy if exists company_assets_update_own on storage.objects;
drop policy if exists company_assets_delete_own on storage.objects;

create policy company_assets_select_member on storage.objects
  for select to authenticated
  using (
    bucket_id = 'company-assets'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (
        (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
        and public.user_has_company_access((storage.foldername(name))[1]::uuid)
      )
    )
  );

create policy company_assets_insert_member on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'company-assets'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (
        (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
        and public.user_has_company_access((storage.foldername(name))[1]::uuid)
      )
    )
  );

create policy company_assets_update_member on storage.objects
  for update to authenticated
  using (
    bucket_id = 'company-assets'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (
        (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
        and public.user_has_company_access((storage.foldername(name))[1]::uuid)
      )
    )
  )
  with check (
    bucket_id = 'company-assets'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (
        (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
        and public.user_has_company_access((storage.foldername(name))[1]::uuid)
      )
    )
  );

create policy company_assets_delete_member on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'company-assets'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or (
        (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$'
        and public.user_has_company_access((storage.foldername(name))[1]::uuid)
      )
    )
  );

drop policy if exists document_signatures_storage_select on storage.objects;
drop policy if exists document_signatures_storage_insert on storage.objects;
drop policy if exists document_signatures_storage_update on storage.objects;
drop policy if exists document_signatures_storage_delete on storage.objects;

create policy document_signatures_storage_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'document-signatures'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy document_signatures_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'document-signatures'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy document_signatures_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'document-signatures'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'document-signatures'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy document_signatures_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'document-signatures'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================================================
-- B5 — Freemium limits enforced in DB (triggers)
-- =============================================================================

create or replace function public.enforce_plan_limit_on_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_check jsonb;
  v_resource text;
  v_role text := coalesce(auth.jwt() ->> 'role', '');
begin
  -- service_role / migrations bypass
  if v_role = 'service_role' or auth.uid() is null then
    return new;
  end if;

  if tg_table_name = 'clients' then
    v_resource := 'clients';
  elsif tg_table_name in ('quotes', 'invoices') then
    v_resource := 'documents';
  else
    return new;
  end if;

  v_check := public.check_plan_limit(v_resource);

  if coalesce((v_check ->> 'allowed')::boolean, false) is not true then
    raise exception 'PLAN_LIMIT_REACHED:%', v_resource
      using errcode = 'P0001',
            detail = format(
              'current=%s limit=%s plan=%s',
              v_check ->> 'current',
              v_check ->> 'limit',
              v_check ->> 'plan_id'
            );
  end if;

  return new;
end;
$$;

drop trigger if exists clients_enforce_plan_limit on public.clients;
create trigger clients_enforce_plan_limit
  before insert on public.clients
  for each row
  execute function public.enforce_plan_limit_on_insert();

drop trigger if exists quotes_enforce_plan_limit on public.quotes;
create trigger quotes_enforce_plan_limit
  before insert on public.quotes
  for each row
  execute function public.enforce_plan_limit_on_insert();

drop trigger if exists invoices_enforce_plan_limit on public.invoices;
create trigger invoices_enforce_plan_limit
  before insert on public.invoices
  for each row
  execute function public.enforce_plan_limit_on_insert();

comment on function public.enforce_plan_limit_on_insert() is
  'Sprint 1: DB-enforced freemium quotas. Frontend only displays; DB rejects.';
