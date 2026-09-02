-- Temporary one-time challenges for PC → mobile login (QR).
-- Secret is stored hashed only. token_hash (Supabase magic link) is set after PC approval.
-- Clients never access this table: service_role via the mobile-login edge function only.

create table public.mobile_login_challenges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  secret_hash text not null,
  status text not null default 'pending'
    check (status in ('pending', 'scanned', 'approved', 'denied', 'expired', 'used')),
  expires_at timestamptz not null,
  scanned_at timestamptz,
  approved_at timestamptz,
  used_at timestamptz,
  token_hash text,
  created_at timestamptz not null default now()
);

create index mobile_login_challenges_user_id_created_idx
  on public.mobile_login_challenges (user_id, created_at desc);

create index mobile_login_challenges_expires_at_idx
  on public.mobile_login_challenges (expires_at);

comment on table public.mobile_login_challenges is
  'One-time QR login challenges. Password never stored. Redeemed via hashed magic-link token.';

alter table public.mobile_login_challenges enable row level security;

revoke all on table public.mobile_login_challenges from anon, authenticated, public;
grant all on table public.mobile_login_challenges to service_role;
