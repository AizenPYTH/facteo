-- Restore handle_new_user after Sprint 1 security overwrite.
-- Keeps: Google/email metadata → profiles, onboarding_completed=false,
-- empty company name (no "Mon entreprise"), subscription seed,
-- and Sprint 1 GUCs for company_members / subscriptions guards.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_company_name text;
  v_first_name text;
  v_last_name text;
  v_phone text;
  v_avatar text;
  v_full_name text;
begin
  v_first_name := nullif(trim(coalesce(
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'given_name',
    ''
  )), '');

  v_last_name := nullif(trim(coalesce(
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'family_name',
    ''
  )), '');

  v_full_name := nullif(trim(coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    ''
  )), '');

  if v_first_name is null and v_full_name is not null then
    v_first_name := split_part(v_full_name, ' ', 1);
    if v_last_name is null and position(' ' in v_full_name) > 0 then
      v_last_name := trim(substring(v_full_name from position(' ' in v_full_name) + 1));
    end if;
  end if;

  v_phone := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  v_avatar := nullif(trim(coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    ''
  )), '');

  insert into public.profiles (
    id, email, first_name, last_name, phone, avatar_url,
    onboarding_completed, onboarding_step, created_at, updated_at
  )
  values (
    new.id, new.email, v_first_name, v_last_name, v_phone, v_avatar,
    false, 0, timezone('utc', now()), timezone('utc', now())
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, profiles.email),
    first_name = coalesce(profiles.first_name, excluded.first_name),
    last_name = coalesce(profiles.last_name, excluded.last_name),
    phone = coalesce(profiles.phone, excluded.phone),
    avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url),
    updated_at = timezone('utc', now());

  -- Empty name until onboarding step 1 (never seed "Mon entreprise")
  v_company_name := coalesce(nullif(trim(new.raw_user_meta_data->>'company_name'), ''), '');

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

-- Allow empty company name from onboarding bootstrap; keep Sprint 1 quota + GUC.
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

  v_check := public.check_plan_limit('companies');
  if coalesce((v_check ->> 'allowed')::boolean, false) is not true then
    raise exception 'PLAN_LIMIT_REACHED:companies'
      using errcode = 'P0001';
  end if;

  -- Empty string allowed (onboarding fills the name later)
  v_name := coalesce(nullif(trim(p_name), ''), '');

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

comment on function public.handle_new_user() is
  'Auth signup trigger: Google/email metadata → profiles, onboarding_completed=false, empty company, Sprint 1 write GUCs.';
