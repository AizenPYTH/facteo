-- =============================================================================
-- INVEQ — Colonnes manquantes (profiles.iban, products.type, etc.)
-- =============================================================================
-- Aligne la base réelle avec le code applicatif.
-- Idempotent : safe à ré-exécuter.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Enum product_type (requis pour products.type)
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.product_type as enum ('product', 'service');
exception
  when duplicate_object then null;
end $$;

grant usage on type public.product_type to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- profiles — coordonnées bancaires & assets
-- ---------------------------------------------------------------------------

alter table public.profiles
  add column if not exists iban text,
  add column if not exists bic text,
  add column if not exists logo_url text,
  add column if not exists signature_url text;

do $$ begin
  alter table public.profiles
    add constraint profiles_iban_format_chk
    check (iban is null or iban ~ '^[A-Z]{2}[0-9A-Z]{13,32}$');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  alter table public.profiles
    add constraint profiles_bic_format_chk
    check (bic is null or bic ~ '^[A-Z]{4}[A-Z]{2}[A-Z0-9]{2}([A-Z0-9]{3})?$');
exception
  when duplicate_object then null;
end $$;

comment on column public.profiles.iban is 'IBAN bancaire pour les paiements.';
comment on column public.profiles.bic is 'BIC/SWIFT de la banque.';
comment on column public.profiles.logo_url is 'URL du logo entreprise (Storage ou CDN).';
comment on column public.profiles.signature_url is 'URL de la signature numérique (Storage).';

-- ---------------------------------------------------------------------------
-- products — catalogue complet
-- ---------------------------------------------------------------------------

alter table public.products
  add column if not exists type public.product_type not null default 'service',
  add column if not exists is_active boolean not null default true,
  add column if not exists reference text,
  add column if not exists deleted_at timestamptz;

comment on column public.products.type is 'Produit physique ou prestation de service.';
comment on column public.products.is_active is 'FALSE = masqué du catalogue sans suppression.';
comment on column public.products.reference is 'Référence interne ou SKU (optionnel).';
comment on column public.products.deleted_at is 'Soft delete : NULL = actif.';

create index if not exists products_type_idx on public.products (type);
create index if not exists products_is_active_idx on public.products (is_active);
create index if not exists products_deleted_at_idx on public.products (deleted_at)
  where deleted_at is not null;
create index if not exists products_user_active_idx on public.products (user_id, name)
  where deleted_at is null;

create unique index if not exists products_user_reference_unique_idx
  on public.products (user_id, reference)
  where reference is not null and deleted_at is null;

-- ---------------------------------------------------------------------------
-- clients — soft delete
-- ---------------------------------------------------------------------------

alter table public.clients
  add column if not exists deleted_at timestamptz;

create index if not exists clients_deleted_at_idx on public.clients (deleted_at)
  where deleted_at is not null;
create index if not exists clients_user_active_idx on public.clients (user_id, name)
  where deleted_at is null;

-- ---------------------------------------------------------------------------
-- quotes — métadonnées & soft delete
-- ---------------------------------------------------------------------------

alter table public.quotes
  add column if not exists internal_notes text,
  add column if not exists payment_terms_days integer,
  add column if not exists deleted_at timestamptz;

do $$ begin
  alter table public.quotes
    add constraint quotes_payment_terms_days_chk
    check (payment_terms_days is null or payment_terms_days > 0);
exception
  when duplicate_object then null;
end $$;

comment on column public.quotes.internal_notes is 'Notes internes (non visibles sur le PDF client).';
comment on column public.quotes.payment_terms_days is 'Délai de paiement spécifique à ce devis (jours).';

-- ---------------------------------------------------------------------------
-- quote_items — remise & soft delete
-- ---------------------------------------------------------------------------

alter table public.quote_items
  add column if not exists discount_percent numeric(5, 2) not null default 0,
  add column if not exists deleted_at timestamptz;

do $$ begin
  alter table public.quote_items
    add constraint quote_items_discount_percent_chk
    check (discount_percent >= 0 and discount_percent <= 100);
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- invoices — colonnes complémentaires & soft delete
-- ---------------------------------------------------------------------------

alter table public.invoices
  add column if not exists stripe_payment_link text,
  add column if not exists stripe_checkout_session_id text,
  add column if not exists deleted_at timestamptz;

do $$ begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'invoices'
      and column_name = 'total'
  ) then
    alter table public.invoices
      add column total numeric(12, 2) generated always as (total_ttc) stored;
  end if;
end $$;

comment on column public.invoices.total is 'Colonne générée (alias de total_ttc) pour compatibilité.';

-- Statut partiellement payée
do $$ begin
  alter type public.invoice_status add value if not exists 'partially_paid';
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- invoice_items — remise & soft delete
-- ---------------------------------------------------------------------------

alter table public.invoice_items
  add column if not exists discount_percent numeric(5, 2) not null default 0,
  add column if not exists deleted_at timestamptz;

do $$ begin
  alter table public.invoice_items
    add constraint invoice_items_discount_percent_chk
    check (discount_percent >= 0 and discount_percent <= 100);
exception
  when duplicate_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- invoice_payments — updated_at
-- ---------------------------------------------------------------------------

alter table public.invoice_payments
  add column if not exists updated_at timestamptz not null default timezone('utc', now());

-- ---------------------------------------------------------------------------
-- Numérotation atomique (si absentes)
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
-- invoice_payments — RLS (si table créée sans policies complètes)
-- ---------------------------------------------------------------------------

alter table public.invoice_payments enable row level security;

drop policy if exists invoice_payments_select_own on public.invoice_payments;
create policy invoice_payments_select_own on public.invoice_payments
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists invoice_payments_insert_own on public.invoice_payments;
create policy invoice_payments_insert_own on public.invoice_payments
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.invoices i
      where i.id = invoice_id
        and i.user_id = auth.uid()
    )
  );

drop policy if exists invoice_payments_update_own on public.invoice_payments;
create policy invoice_payments_update_own on public.invoice_payments
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists invoice_payments_delete_own on public.invoice_payments;
create policy invoice_payments_delete_own on public.invoice_payments
  for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.invoice_payments to authenticated;

-- ---------------------------------------------------------------------------
-- RLS products (si table existante sans policies)
-- ---------------------------------------------------------------------------

alter table public.products enable row level security;

drop policy if exists "Users can view their own products" on public.products;
drop policy if exists "Users can insert their own products" on public.products;
drop policy if exists "Users can update their own products" on public.products;
drop policy if exists "Users can delete their own products" on public.products;

drop policy if exists products_select_active_own on public.products;
create policy products_select_active_own on public.products
  for select to authenticated
  using (auth.uid() = user_id and deleted_at is null);

drop policy if exists products_insert_own on public.products;
create policy products_insert_own on public.products
  for insert to authenticated
  with check (auth.uid() = user_id and deleted_at is null);

drop policy if exists products_update_own on public.products;
create policy products_update_own on public.products
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists products_delete_own on public.products;
create policy products_delete_own on public.products
  for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.products to authenticated;

commit;
