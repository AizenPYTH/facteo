-- =============================================================================
-- FACTEO MVP — Schéma initial complet
-- =============================================================================
-- Exécuter sur une base Supabase vide (nouveau projet ou reset local).
-- Inclut : enums, soft delete (deleted_at), documents, quote_items, invoice_items.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------

create type public.product_type as enum ('product', 'service');

create type public.quote_status as enum (
  'draft',
  'sent',
  'accepted',
  'rejected',
  'expired',
  'converted'
);

create type public.invoice_status as enum (
  'draft',
  'sent',
  'paid',
  'overdue',
  'canceled'
);

create type public.subscription_plan as enum (
  'free',
  'starter',
  'pro',
  'enterprise'
);

create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'unpaid',
  'incomplete'
);

create type public.document_entity_type as enum (
  'quote',
  'invoice',
  'client'
);

comment on type public.product_type is 'Type de ligne catalogue : produit physique ou service.';
comment on type public.quote_status is 'Cycle de vie d''un devis.';
comment on type public.invoice_status is 'Cycle de vie d''une facture.';
comment on type public.document_entity_type is 'Entité métier liée à un fichier document.';

-- ---------------------------------------------------------------------------
-- Fonctions utilitaires
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'Met à jour la colonne updated_at avant INSERT/UPDATE.';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, created_at, updated_at)
  values (
    new.id,
    new.email,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (id) do nothing;

  insert into public.settings (user_id, created_at, updated_at)
  values (
    new.id,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (user_id) do nothing;

  insert into public.subscriptions (user_id, plan, status, created_at, updated_at)
  values (
    new.id,
    'free'::public.subscription_plan,
    'active'::public.subscription_status,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

comment on function public.handle_new_user() is
  'Provisionne profil, paramètres et abonnement gratuit à l''inscription.';

create or replace function public.enforce_child_user_matches_parent()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  parent_user_id uuid;
begin
  if tg_table_name = 'quote_items' then
    select q.user_id into parent_user_id
    from public.quotes q
    where q.id = new.quote_id
      and q.deleted_at is null;

    if parent_user_id is null then
      raise exception 'Quote % not found or deleted', new.quote_id;
    end if;

    if new.user_id is distinct from parent_user_id then
      raise exception 'quote_items.user_id must match quotes.user_id';
    end if;
  elsif tg_table_name = 'invoice_items' then
    select i.user_id into parent_user_id
    from public.invoices i
    where i.id = new.invoice_id
      and i.deleted_at is null;

    if parent_user_id is null then
      raise exception 'Invoice % not found or deleted', new.invoice_id;
    end if;

    if new.user_id is distinct from parent_user_id then
      raise exception 'invoice_items.user_id must match invoices.user_id';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.enforce_child_user_matches_parent() is
  'Garantit que les lignes enfants appartiennent au même utilisateur que le document parent.';

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  first_name text,
  last_name text,
  company_name text,
  email text,
  phone text,
  address text,
  postal_code text,
  city text,
  country text default 'France',
  siret text,
  vat_number text,
  iban text,
  bic text,
  logo_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint profiles_iban_format_chk
    check (iban is null or iban ~ '^[A-Z]{2}[0-9A-Z]{13,32}$'),
  constraint profiles_bic_format_chk
    check (bic is null or bic ~ '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$')
);

comment on table public.profiles is 'Profil entreprise lié à auth.users.';
comment on column public.profiles.iban is 'IBAN bancaire pour les paiements.';
comment on column public.profiles.bic is 'BIC/SWIFT de la banque.';
comment on column public.profiles.logo_url is 'URL du logo entreprise (Storage ou CDN).';

create index profiles_email_idx on public.profiles (email);
create index profiles_company_name_idx on public.profiles (company_name);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- settings
-- ---------------------------------------------------------------------------

create table public.settings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  currency text not null default 'EUR'
    check (currency ~ '^[A-Z]{3}$'),
  default_vat_rate numeric(5, 2) not null default 20
    check (default_vat_rate >= 0 and default_vat_rate <= 100),
  quote_prefix text not null default 'DEV',
  invoice_prefix text not null default 'FAC',
  quote_validity_days integer not null default 30
    check (quote_validity_days > 0),
  next_quote_number integer not null default 1
    check (next_quote_number > 0),
  next_invoice_number integer not null default 1
    check (next_invoice_number > 0),
  locale text not null default 'fr-FR',
  payment_terms_days integer not null default 30
    check (payment_terms_days > 0),
  quote_footer text,
  invoice_footer text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.settings is 'Paramètres utilisateur et numérotation des documents.';
comment on column public.settings.payment_terms_days is 'Délai de paiement par défaut (jours) pour les factures.';
comment on column public.settings.quote_footer is 'Pied de page par défaut des devis (PDF).';
comment on column public.settings.invoice_footer is 'Pied de page par défaut des factures (PDF).';

create index settings_user_id_idx on public.settings (user_id);

create trigger settings_set_updated_at
  before update on public.settings
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------

create table public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  plan public.subscription_plan not null default 'free',
  status public.subscription_status not null default 'active',
  stripe_customer_id text,
  stripe_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  trial_ends_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.subscriptions is 'Abonnement FACTEO par utilisateur.';

create index subscriptions_user_id_idx on public.subscriptions (user_id);
create index subscriptions_status_idx on public.subscriptions (status);
create index subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null,
  email text,
  phone text,
  company text,
  address text,
  postal_code text,
  city text,
  country text default 'France',
  siren text,
  siret text,
  vat_number text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint clients_siren_format_chk
    check (siren is null or siren ~ '^\d{9}$'),
  constraint clients_siret_format_chk
    check (siret is null or siret ~ '^\d{14}$'),
  constraint clients_postal_code_format_chk
    check (postal_code is null or postal_code ~ '^\d{5}$')
);

comment on table public.clients is 'Clients de l''utilisateur.';
comment on column public.clients.deleted_at is 'Soft delete : NULL = actif.';

create index clients_user_id_idx on public.clients (user_id);
create index clients_name_idx on public.clients (name);
create index clients_company_idx on public.clients (company);
create index clients_email_idx on public.clients (email);
create index clients_phone_idx on public.clients (phone);
create index clients_user_id_name_idx on public.clients (user_id, name);
create index clients_active_user_id_idx on public.clients (user_id)
  where deleted_at is null;
create index clients_deleted_at_idx on public.clients (deleted_at)
  where deleted_at is not null;

create trigger clients_set_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- products
-- ---------------------------------------------------------------------------

create table public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  type public.product_type not null default 'service',
  name text not null,
  description text,
  unit_price numeric(12, 2) not null default 0
    check (unit_price >= 0),
  vat_rate numeric(5, 2) not null default 20
    check (vat_rate >= 0 and vat_rate <= 100),
  unit text not null default 'unité',
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

comment on table public.products is 'Produits et services facturables.';
comment on column public.products.type is 'Produit physique ou prestation de service.';
comment on column public.products.unit is 'Unité de facturation (heure, pièce, forfait…).';
comment on column public.products.is_active is 'FALSE = masqué du catalogue sans suppression.';
comment on column public.products.deleted_at is 'Soft delete : NULL = actif.';

create index products_user_id_idx on public.products (user_id);
create index products_name_idx on public.products (name);
create index products_type_idx on public.products (type);
create index products_is_active_idx on public.products (is_active);
create index products_user_id_name_idx on public.products (user_id, name);
create index products_active_catalog_idx on public.products (user_id, is_active)
  where deleted_at is null and is_active = true;
create index products_deleted_at_idx on public.products (deleted_at)
  where deleted_at is not null;

create trigger products_set_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quotes
-- ---------------------------------------------------------------------------

create table public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  converted_invoice_id uuid,
  number text not null,
  status public.quote_status not null default 'draft',
  subtotal_ht numeric(12, 2) not null default 0
    check (subtotal_ht >= 0),
  total_vat numeric(12, 2) not null default 0
    check (total_vat >= 0),
  total_ttc numeric(12, 2) not null default 0
    check (total_ttc >= 0),
  issued_at timestamptz,
  valid_until timestamptz,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint quotes_totals_consistency_chk
    check (total_ttc = round(subtotal_ht + total_vat, 2)),
  constraint quotes_converted_status_chk
    check (
      status <> 'converted'::public.quote_status
      or converted_invoice_id is not null
    )
);

comment on table public.quotes is 'Devis commerciaux.';
comment on column public.quotes.deleted_at is 'Soft delete : NULL = actif.';
comment on column public.quotes.converted_invoice_id is 'Facture générée lorsque le statut est converted.';

create unique index quotes_user_number_active_uniq
  on public.quotes (user_id, number)
  where deleted_at is null;

create index quotes_user_id_idx on public.quotes (user_id);
create index quotes_client_id_idx on public.quotes (client_id);
create index quotes_converted_invoice_id_idx on public.quotes (converted_invoice_id);
create index quotes_status_idx on public.quotes (status);
create index quotes_issued_at_idx on public.quotes (issued_at desc nulls last);
create index quotes_user_id_issued_at_idx on public.quotes (user_id, issued_at desc nulls last);
create index quotes_active_user_id_idx on public.quotes (user_id)
  where deleted_at is null;
create index quotes_deleted_at_idx on public.quotes (deleted_at)
  where deleted_at is not null;

create trigger quotes_set_updated_at
  before update on public.quotes
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quote_items
-- ---------------------------------------------------------------------------

create table public.quote_items (
  id uuid primary key default gen_random_uuid(),
  quote_id uuid not null references public.quotes (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  position integer not null default 0
    check (position >= 0),
  description text not null,
  quantity numeric(12, 3) not null default 1
    check (quantity > 0),
  unit text not null default 'unité',
  unit_price numeric(12, 2) not null default 0
    check (unit_price >= 0),
  vat_rate numeric(5, 2) not null default 20
    check (vat_rate >= 0 and vat_rate <= 100),
  line_total_ht numeric(12, 2) not null default 0
    check (line_total_ht >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

comment on table public.quote_items is 'Lignes de devis (snapshot prix/TVA).';
comment on column public.quote_items.deleted_at is 'Soft delete : NULL = actif.';

create index quote_items_quote_id_idx on public.quote_items (quote_id);
create index quote_items_user_id_idx on public.quote_items (user_id);
create index quote_items_product_id_idx on public.quote_items (product_id);
create index quote_items_quote_id_position_idx on public.quote_items (quote_id, position);
create index quote_items_active_quote_id_idx on public.quote_items (quote_id)
  where deleted_at is null;
create index quote_items_deleted_at_idx on public.quote_items (deleted_at)
  where deleted_at is not null;

create trigger quote_items_set_updated_at
  before update on public.quote_items
  for each row
  execute function public.set_updated_at();

create trigger quote_items_enforce_user_id
  before insert or update on public.quote_items
  for each row
  execute function public.enforce_child_user_matches_parent();

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------

create table public.invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  quote_id uuid references public.quotes (id) on delete set null,
  number text not null,
  status public.invoice_status not null default 'draft',
  subtotal_ht numeric(12, 2) not null default 0
    check (subtotal_ht >= 0),
  total_vat numeric(12, 2) not null default 0
    check (total_vat >= 0),
  total_ttc numeric(12, 2) not null default 0
    check (total_ttc >= 0),
  total numeric(12, 2) generated always as (total_ttc) stored,
  issued_at timestamptz,
  due_at timestamptz,
  paid_at timestamptz,
  payment_method text,
  payment_reference text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint invoices_totals_consistency_chk
    check (total_ttc = round(subtotal_ht + total_vat, 2)),
  constraint invoices_paid_at_status_chk
    check (
      status <> 'paid'::public.invoice_status
      or paid_at is not null
    )
);

comment on table public.invoices is 'Factures clients.';
comment on column public.invoices.total is 'Colonne générée (alias de total_ttc) pour compatibilité.';
comment on column public.invoices.deleted_at is 'Soft delete : NULL = actif.';
comment on column public.invoices.payment_method is 'Moyen de paiement (virement, chèque, carte…).';
comment on column public.invoices.payment_reference is 'Référence de paiement ou transaction.';

create unique index invoices_user_number_active_uniq
  on public.invoices (user_id, number)
  where deleted_at is null;

create index invoices_user_id_idx on public.invoices (user_id);
create index invoices_client_id_idx on public.invoices (client_id);
create index invoices_quote_id_idx on public.invoices (quote_id);
create index invoices_status_idx on public.invoices (status);
create index invoices_issued_at_idx on public.invoices (issued_at desc nulls last);
create index invoices_due_at_idx on public.invoices (due_at);
create index invoices_paid_at_idx on public.invoices (paid_at)
  where paid_at is not null;
create index invoices_user_id_issued_at_idx on public.invoices (user_id, issued_at desc nulls last);
create index invoices_active_user_id_idx on public.invoices (user_id)
  where deleted_at is null;
create index invoices_deleted_at_idx on public.invoices (deleted_at)
  where deleted_at is not null;

create trigger invoices_set_updated_at
  before update on public.invoices
  for each row
  execute function public.set_updated_at();

-- FK quotes.converted_invoice_id → invoices (après création de invoices)
alter table public.quotes
  add constraint quotes_converted_invoice_id_fkey
  foreign key (converted_invoice_id)
  references public.invoices (id)
  on delete set null;

-- ---------------------------------------------------------------------------
-- invoice_items
-- ---------------------------------------------------------------------------

create table public.invoice_items (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid references public.products (id) on delete set null,
  position integer not null default 0
    check (position >= 0),
  description text not null,
  quantity numeric(12, 3) not null default 1
    check (quantity > 0),
  unit text not null default 'unité',
  unit_price numeric(12, 2) not null default 0
    check (unit_price >= 0),
  vat_rate numeric(5, 2) not null default 20
    check (vat_rate >= 0 and vat_rate <= 100),
  line_total_ht numeric(12, 2) not null default 0
    check (line_total_ht >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz
);

comment on table public.invoice_items is 'Lignes de facture (snapshot prix/TVA).';
comment on column public.invoice_items.deleted_at is 'Soft delete : NULL = actif.';

create index invoice_items_invoice_id_idx on public.invoice_items (invoice_id);
create index invoice_items_user_id_idx on public.invoice_items (user_id);
create index invoice_items_product_id_idx on public.invoice_items (product_id);
create index invoice_items_invoice_id_position_idx on public.invoice_items (invoice_id, position);
create index invoice_items_active_invoice_id_idx on public.invoice_items (invoice_id)
  where deleted_at is null;
create index invoice_items_deleted_at_idx on public.invoice_items (deleted_at)
  where deleted_at is not null;

create trigger invoice_items_set_updated_at
  before update on public.invoice_items
  for each row
  execute function public.set_updated_at();

create trigger invoice_items_enforce_user_id
  before insert or update on public.invoice_items
  for each row
  execute function public.enforce_child_user_matches_parent();

-- ---------------------------------------------------------------------------
-- documents
-- ---------------------------------------------------------------------------

create table public.documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  entity_type public.document_entity_type not null,
  entity_id uuid not null,
  storage_bucket text not null default 'documents',
  storage_path text not null,
  file_name text not null,
  mime_type text not null,
  size_bytes bigint not null
    check (size_bytes >= 0),
  checksum_sha256 text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  deleted_at timestamptz,
  constraint documents_storage_path_uniq unique (user_id, storage_bucket, storage_path)
);

comment on table public.documents is 'Fichiers stockés (Supabase Storage) liés à devis, factures ou clients.';
comment on column public.documents.entity_id is 'Identifiant polymorphe de l''entité liée.';
comment on column public.documents.deleted_at is 'Soft delete : NULL = actif.';

create index documents_user_id_idx on public.documents (user_id);
create index documents_entity_idx on public.documents (entity_type, entity_id);
create index documents_user_entity_idx on public.documents (user_id, entity_type, entity_id);
create index documents_active_user_id_idx on public.documents (user_id)
  where deleted_at is null;
create index documents_deleted_at_idx on public.documents (deleted_at)
  where deleted_at is not null;

create trigger documents_set_updated_at
  before update on public.documents
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Trigger auth.users → profil / settings / abonnement
-- ---------------------------------------------------------------------------

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.settings enable row level security;
alter table public.subscriptions enable row level security;
alter table public.clients enable row level security;
alter table public.products enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.documents enable row level security;

-- profiles
create policy profiles_select_own on public.profiles
  for select to authenticated
  using (auth.uid() = id);

create policy profiles_insert_own on public.profiles
  for insert to authenticated
  with check (auth.uid() = id);

create policy profiles_update_own on public.profiles
  for update to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

create policy profiles_delete_own on public.profiles
  for delete to authenticated
  using (auth.uid() = id);

-- settings
create policy settings_select_own on public.settings
  for select to authenticated
  using (auth.uid() = user_id);

create policy settings_insert_own on public.settings
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy settings_update_own on public.settings
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy settings_delete_own on public.settings
  for delete to authenticated
  using (auth.uid() = user_id);

-- subscriptions
create policy subscriptions_select_own on public.subscriptions
  for select to authenticated
  using (auth.uid() = user_id);

create policy subscriptions_insert_own on public.subscriptions
  for insert to authenticated
  with check (auth.uid() = user_id);

create policy subscriptions_update_own on public.subscriptions
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy subscriptions_delete_own on public.subscriptions
  for delete to authenticated
  using (auth.uid() = user_id);

-- clients (soft delete)
create policy clients_select_active_own on public.clients
  for select to authenticated
  using (auth.uid() = user_id and deleted_at is null);

create policy clients_insert_own on public.clients
  for insert to authenticated
  with check (auth.uid() = user_id and deleted_at is null);

create policy clients_update_own on public.clients
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- products (soft delete + catalogue actif)
create policy products_select_active_own on public.products
  for select to authenticated
  using (auth.uid() = user_id and deleted_at is null);

create policy products_insert_own on public.products
  for insert to authenticated
  with check (auth.uid() = user_id and deleted_at is null);

create policy products_update_own on public.products
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- quotes (soft delete)
create policy quotes_select_active_own on public.quotes
  for select to authenticated
  using (auth.uid() = user_id and deleted_at is null);

create policy quotes_insert_own on public.quotes
  for insert to authenticated
  with check (auth.uid() = user_id and deleted_at is null);

create policy quotes_update_own on public.quotes
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- quote_items (soft delete)
create policy quote_items_select_active_own on public.quote_items
  for select to authenticated
  using (auth.uid() = user_id and deleted_at is null);

create policy quote_items_insert_own on public.quote_items
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and deleted_at is null
    and exists (
      select 1
      from public.quotes q
      where q.id = quote_id
        and q.user_id = auth.uid()
        and q.deleted_at is null
    )
  );

create policy quote_items_update_own on public.quote_items
  for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.quotes q
      where q.id = quote_id
        and q.user_id = auth.uid()
    )
  );

-- invoices (soft delete)
create policy invoices_select_active_own on public.invoices
  for select to authenticated
  using (auth.uid() = user_id and deleted_at is null);

create policy invoices_insert_own on public.invoices
  for insert to authenticated
  with check (auth.uid() = user_id and deleted_at is null);

create policy invoices_update_own on public.invoices
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- invoice_items (soft delete)
create policy invoice_items_select_active_own on public.invoice_items
  for select to authenticated
  using (auth.uid() = user_id and deleted_at is null);

create policy invoice_items_insert_own on public.invoice_items
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and deleted_at is null
    and exists (
      select 1
      from public.invoices i
      where i.id = invoice_id
        and i.user_id = auth.uid()
        and i.deleted_at is null
    )
  );

create policy invoice_items_update_own on public.invoice_items
  for update to authenticated
  using (auth.uid() = user_id)
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.invoices i
      where i.id = invoice_id
        and i.user_id = auth.uid()
    )
  );

-- documents (soft delete)
create policy documents_select_active_own on public.documents
  for select to authenticated
  using (auth.uid() = user_id and deleted_at is null);

create policy documents_insert_own on public.documents
  for insert to authenticated
  with check (auth.uid() = user_id and deleted_at is null);

create policy documents_update_own on public.documents
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Droits
-- ---------------------------------------------------------------------------

grant usage on schema public to postgres, anon, authenticated, service_role;

grant usage on type public.product_type to authenticated, service_role;
grant usage on type public.quote_status to authenticated, service_role;
grant usage on type public.invoice_status to authenticated, service_role;
grant usage on type public.subscription_plan to authenticated, service_role;
grant usage on type public.subscription_status to authenticated, service_role;
grant usage on type public.document_entity_type to authenticated, service_role;

grant all on all tables in schema public to postgres, service_role;
grant select, insert, update on all tables in schema public to authenticated;

grant usage, select on all sequences in schema public to postgres, authenticated, service_role;

commit;
