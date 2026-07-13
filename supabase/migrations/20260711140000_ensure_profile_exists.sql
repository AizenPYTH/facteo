-- Backfill missing profiles for existing auth users
insert into public.profiles (id, email, created_at, updated_at, country)
select
  u.id,
  u.email,
  timezone('utc', now()),
  timezone('utc', now()),
  'France'
from auth.users u
where not exists (
  select 1
  from public.profiles p
  where p.id = u.id
);

-- Ensure profile row exists before client-side updates (e.g. logo/signature)
create or replace function public.ensure_profile_exists()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_email text;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select email into v_email from auth.users where id = v_uid;

  insert into public.profiles (id, email, created_at, updated_at, country)
  values (
    v_uid,
    v_email,
    timezone('utc', now()),
    timezone('utc', now()),
    'France'
  )
  on conflict (id) do nothing;
end;
$$;

revoke all on function public.ensure_profile_exists() from public;
grant execute on function public.ensure_profile_exists() to authenticated;

comment on function public.ensure_profile_exists() is
  'Crée le profil utilisateur s''il est absent (équivalent handle_new_user pour comptes existants).';
