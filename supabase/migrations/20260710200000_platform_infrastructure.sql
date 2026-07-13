-- Stockage entreprise, envois, notifications push, préparation Stripe

-- ---------------------------------------------------------------------------
-- Bucket company-assets
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-assets',
  'company-assets',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists company_assets_select_public on storage.objects;
create policy company_assets_select_public on storage.objects
  for select
  using (bucket_id = 'company-assets');

drop policy if exists company_assets_insert_own on storage.objects;
create policy company_assets_insert_own on storage.objects
  for insert
  to authenticated
  with check (
    bucket_id = 'company-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists company_assets_update_own on storage.objects;
create policy company_assets_update_own on storage.objects
  for update
  to authenticated
  using (
    bucket_id = 'company-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists company_assets_delete_own on storage.objects;
create policy company_assets_delete_own on storage.objects
  for delete
  to authenticated
  using (
    bucket_id = 'company-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- ---------------------------------------------------------------------------
-- Historique des envois (Mail natif + futur Resend)
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.sent_document_type as enum ('quote', 'invoice');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.sent_document_channel as enum ('mail', 'share', 'resend');
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.sent_document_status as enum ('draft', 'sent', 'failed');
exception when duplicate_object then null;
end $$;

create table if not exists public.sent_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_type public.sent_document_type not null,
  document_id uuid not null,
  document_number text not null,
  recipient_email text not null,
  subject text not null,
  message text,
  channel public.sent_document_channel not null default 'mail',
  status public.sent_document_status not null default 'sent',
  provider_message_id text,
  sent_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists sent_documents_user_id_sent_at_idx
  on public.sent_documents (user_id, sent_at desc);
create index if not exists sent_documents_document_idx
  on public.sent_documents (user_id, document_type, document_id);

alter table public.sent_documents enable row level security;

drop policy if exists sent_documents_select_own on public.sent_documents;
create policy sent_documents_select_own on public.sent_documents
  for select to authenticated using (user_id = auth.uid());

drop policy if exists sent_documents_insert_own on public.sent_documents;
create policy sent_documents_insert_own on public.sent_documents
  for insert to authenticated with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Tokens push iOS
-- ---------------------------------------------------------------------------

create table if not exists public.push_device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  expo_push_token text not null,
  platform text not null default 'ios',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (user_id, expo_push_token)
);

create index if not exists push_device_tokens_user_id_idx on public.push_device_tokens (user_id);

alter table public.push_device_tokens enable row level security;

drop policy if exists push_device_tokens_select_own on public.push_device_tokens;
create policy push_device_tokens_select_own on public.push_device_tokens
  for select to authenticated using (user_id = auth.uid());

drop policy if exists push_device_tokens_insert_own on public.push_device_tokens;
create policy push_device_tokens_insert_own on public.push_device_tokens
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists push_device_tokens_update_own on public.push_device_tokens;
create policy push_device_tokens_update_own on public.push_device_tokens
  for update to authenticated using (user_id = auth.uid());

drop policy if exists push_device_tokens_delete_own on public.push_device_tokens;
create policy push_device_tokens_delete_own on public.push_device_tokens
  for delete to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Préférences notifications
-- ---------------------------------------------------------------------------

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users (id) on delete cascade,
  invoice_overdue_enabled boolean not null default true,
  quote_accepted_enabled boolean not null default true,
  payment_received_enabled boolean not null default true,
  due_date_reminder_enabled boolean not null default true,
  due_date_reminder_days integer not null default 3
    check (due_date_reminder_days > 0 and due_date_reminder_days <= 30),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

alter table public.notification_preferences enable row level security;

drop policy if exists notification_preferences_select_own on public.notification_preferences;
create policy notification_preferences_select_own on public.notification_preferences
  for select to authenticated using (user_id = auth.uid());

drop policy if exists notification_preferences_insert_own on public.notification_preferences;
create policy notification_preferences_insert_own on public.notification_preferences
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists notification_preferences_update_own on public.notification_preferences;
create policy notification_preferences_update_own on public.notification_preferences
  for update to authenticated using (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Stripe — sessions de paiement
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.stripe_payment_status as enum (
    'pending', 'processing', 'succeeded', 'canceled', 'failed'
  );
exception when duplicate_object then null;
end $$;

create table if not exists public.stripe_payment_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  payment_link_url text,
  amount numeric(12, 2) not null check (amount > 0),
  currency text not null default 'EUR',
  status public.stripe_payment_status not null default 'pending',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists stripe_payment_sessions_invoice_id_idx
  on public.stripe_payment_sessions (invoice_id);
create index if not exists stripe_payment_sessions_user_id_idx
  on public.stripe_payment_sessions (user_id);

alter table public.stripe_payment_sessions enable row level security;

drop policy if exists stripe_payment_sessions_select_own on public.stripe_payment_sessions;
create policy stripe_payment_sessions_select_own on public.stripe_payment_sessions
  for select to authenticated using (user_id = auth.uid());

drop policy if exists stripe_payment_sessions_insert_own on public.stripe_payment_sessions;
create policy stripe_payment_sessions_insert_own on public.stripe_payment_sessions
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists stripe_payment_sessions_update_own on public.stripe_payment_sessions;
create policy stripe_payment_sessions_update_own on public.stripe_payment_sessions
  for update to authenticated using (user_id = auth.uid());

alter table public.invoices
  add column if not exists stripe_payment_link text,
  add column if not exists stripe_checkout_session_id text;

comment on table public.sent_documents is 'Historique des envois de devis/factures (Mail, partage, Resend).';
comment on table public.stripe_payment_sessions is 'Sessions Stripe Checkout / Payment Links par facture.';
