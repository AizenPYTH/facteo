-- Liste d’attente Android (page /mobile/android)

create table if not exists public.android_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  user_agent text,
  source text not null default 'mobile_android_page',
  created_at timestamptz not null default timezone('utc', now()),
  constraint android_waitlist_email_key unique (email)
);

create index if not exists android_waitlist_created_at_idx
  on public.android_waitlist (created_at desc);

alter table public.android_waitlist enable row level security;

drop policy if exists android_waitlist_insert_anon on public.android_waitlist;
create policy android_waitlist_insert_anon on public.android_waitlist
  for insert
  to anon, authenticated
  with check (
    email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    and char_length(email) <= 320
  );

-- Pas de SELECT public : lecture réservée au dashboard / service role
revoke select on public.android_waitlist from anon, authenticated;
grant insert on public.android_waitlist to anon, authenticated;
