-- =============================================================================
-- Factume — Synchronisation schéma / code (stabilisation)
-- =============================================================================
-- Idempotent : peut être exécuté sur une base partiellement migrée.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Colonnes manquantes (profil, devis, factures)
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists signature_url text;

comment on column public.profiles.signature_url is 'URL de la signature numérique (Storage).';

alter table public.quotes
  add column if not exists internal_notes text,
  add column if not exists payment_terms_days integer
    check (payment_terms_days is null or payment_terms_days > 0);

alter table public.invoices
  add column if not exists stripe_payment_link text,
  add column if not exists stripe_checkout_session_id text;

-- ---------------------------------------------------------------------------
-- Soft delete (clients / produits — utilisé par l'app)
-- ---------------------------------------------------------------------------

alter table public.clients
  add column if not exists deleted_at timestamptz;

alter table public.products
  add column if not exists deleted_at timestamptz;

create index if not exists clients_deleted_at_idx on public.clients (deleted_at)
  where deleted_at is not null;

create index if not exists products_deleted_at_idx on public.products (deleted_at)
  where deleted_at is not null;

create index if not exists clients_user_active_idx on public.clients (user_id, name)
  where deleted_at is null;

create index if not exists products_user_active_idx on public.products (user_id, name)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- Statut facture partiellement payée
-- ---------------------------------------------------------------------------

do $$ begin
  alter type public.invoice_status add value if not exists 'partially_paid';
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Paiements : colonne updated_at si absente
-- ---------------------------------------------------------------------------

alter table public.invoice_payments
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- ---------------------------------------------------------------------------
-- Clés étrangères explicites (jointures PostgREST clients ↔ documents)
-- ---------------------------------------------------------------------------

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'quotes_client_id_fkey' and conrelid = 'public.quotes'::regclass
  ) then
    alter table public.quotes
      add constraint quotes_client_id_fkey
      foreign key (client_id) references public.clients (id) on delete set null;
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'invoices_client_id_fkey' and conrelid = 'public.invoices'::regclass
  ) then
    alter table public.invoices
      add constraint invoices_client_id_fkey
      foreign key (client_id) references public.clients (id) on delete set null;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Numérotation atomique (si migrations antérieures non appliquées)
-- ---------------------------------------------------------------------------

create or replace function public.reserve_next_quote_number(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_next integer;
  v_year text;
  v_number text;
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'Unauthorized';
  end if;

  select quote_prefix, next_quote_number
  into v_prefix, v_next
  from public.settings
  where user_id = p_user_id
  for update;

  if not found then
    v_prefix := 'DEV';
    v_next := 1;
    insert into public.settings (user_id, quote_prefix, next_quote_number)
    values (p_user_id, v_prefix, 2)
    on conflict (user_id) do nothing;
    select quote_prefix, next_quote_number into v_prefix, v_next
    from public.settings where user_id = p_user_id for update;
  end if;

  v_year := to_char(timezone('utc', now()), 'YYYY');
  v_number := v_prefix || '-' || v_year || '-' || lpad(v_next::text, 6, '0');

  update public.settings
  set next_quote_number = v_next + 1, updated_at = timezone('utc', now())
  where user_id = p_user_id;

  return v_number;
end;
$$;

create or replace function public.reserve_next_invoice_number(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_next integer;
  v_year text;
  v_number text;
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'Unauthorized';
  end if;

  select invoice_prefix, next_invoice_number
  into v_prefix, v_next
  from public.settings
  where user_id = p_user_id
  for update;

  if not found then
    v_prefix := 'FAC';
    v_next := 1;
    insert into public.settings (user_id, invoice_prefix, next_invoice_number)
    values (p_user_id, v_prefix, 2)
    on conflict (user_id) do nothing;
    select invoice_prefix, next_invoice_number into v_prefix, v_next
    from public.settings where user_id = p_user_id for update;
  end if;

  v_year := to_char(timezone('utc', now()), 'YYYY');
  v_number := v_prefix || '-' || v_year || '-' || lpad(v_next::text, 6, '0');

  update public.settings
  set next_invoice_number = v_next + 1, updated_at = timezone('utc', now())
  where user_id = p_user_id;

  return v_number;
end;
$$;

grant execute on function public.reserve_next_quote_number(uuid) to authenticated;
grant execute on function public.reserve_next_invoice_number(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- Plateforme : sent_documents, push, notifications, stripe sessions
-- (reprise idempotente de 20260710200000)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'company-assets', 'company-assets', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$ begin create type public.sent_document_type as enum ('quote', 'invoice');
exception when duplicate_object then null; end $$;
do $$ begin create type public.sent_document_channel as enum ('mail', 'share', 'resend');
exception when duplicate_object then null; end $$;
do $$ begin create type public.sent_document_status as enum ('draft', 'sent', 'failed');
exception when duplicate_object then null; end $$;

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

alter table public.sent_documents enable row level security;

drop policy if exists sent_documents_select_own on public.sent_documents;
create policy sent_documents_select_own on public.sent_documents
  for select to authenticated using (user_id = auth.uid());

drop policy if exists sent_documents_insert_own on public.sent_documents;
create policy sent_documents_insert_own on public.sent_documents
  for insert to authenticated with check (user_id = auth.uid());

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

do $$ begin
  create type public.stripe_payment_status as enum (
    'pending', 'processing', 'succeeded', 'canceled', 'failed'
  );
exception when duplicate_object then null; end $$;

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

-- Storage RLS company-assets
drop policy if exists company_assets_select_public on storage.objects;
create policy company_assets_select_public on storage.objects
  for select using (bucket_id = 'company-assets');

drop policy if exists company_assets_insert_own on storage.objects;
create policy company_assets_insert_own on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'company-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists company_assets_update_own on storage.objects;
create policy company_assets_update_own on storage.objects
  for update to authenticated
  using (
    bucket_id = 'company-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists company_assets_delete_own on storage.objects;
create policy company_assets_delete_own on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'company-assets'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

commit;
