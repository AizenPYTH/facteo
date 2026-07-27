-- =============================================================================
-- INVEQ — Tables applicatives manquantes (migration unique)
-- =============================================================================
-- Contexte : profiles, settings et products existent déjà.
-- Crée si absent : clients, subscriptions, quotes, quote_items, invoices,
-- invoice_items, invoice_payments.
-- Sans deleted_at. Sans ALTER sur quote_items / invoice_items.
-- =============================================================================

begin;

-- ---------------------------------------------------------------------------
-- Extensions
-- ---------------------------------------------------------------------------

create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------------
-- Enums (idempotent)
-- ---------------------------------------------------------------------------

do $$ begin
  create type public.quote_status as enum (
    'draft', 'sent', 'accepted', 'rejected', 'expired', 'converted'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.invoice_status as enum (
    'draft', 'sent', 'paid', 'overdue', 'canceled'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.subscription_plan as enum (
    'free', 'starter', 'pro', 'enterprise'
  );
exception when duplicate_object then null;
end $$;

do $$ begin
  create type public.subscription_status as enum (
    'trialing', 'active', 'past_due', 'canceled', 'unpaid', 'incomplete'
  );
exception when duplicate_object then null;
end $$;

comment on type public.quote_status is 'Cycle de vie d''un devis.';
comment on type public.invoice_status is 'Cycle de vie d''une facture.';

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
    where q.id = new.quote_id;

    if parent_user_id is null then
      raise exception 'Quote % not found', new.quote_id;
    end if;

    if new.user_id is distinct from parent_user_id then
      raise exception 'quote_items.user_id must match quotes.user_id';
    end if;
  elsif tg_table_name = 'invoice_items' then
    select i.user_id into parent_user_id
    from public.invoices i
    where i.id = new.invoice_id;

    if parent_user_id is null then
      raise exception 'Invoice % not found', new.invoice_id;
    end if;

    if new.user_id is distinct from parent_user_id then
      raise exception 'invoice_items.user_id must match invoices.user_id';
    end if;
  end if;

  return new;
end;
$$;

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

-- ---------------------------------------------------------------------------
-- clients
-- ---------------------------------------------------------------------------

create table if not exists public.clients (
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
  constraint clients_siren_format_chk
    check (siren is null or siren ~ '^\d{9}$'),
  constraint clients_siret_format_chk
    check (siret is null or siret ~ '^\d{14}$'),
  constraint clients_postal_code_format_chk
    check (postal_code is null or postal_code ~ '^\d{5}$')
);

comment on table public.clients is 'Clients de l''utilisateur.';

create index if not exists clients_user_id_idx on public.clients (user_id);
create index if not exists clients_name_idx on public.clients (name);
create index if not exists clients_company_idx on public.clients (company);
create index if not exists clients_email_idx on public.clients (email);
create index if not exists clients_phone_idx on public.clients (phone);
create index if not exists clients_user_id_name_idx on public.clients (user_id, name);

drop trigger if exists clients_set_updated_at on public.clients;
create trigger clients_set_updated_at
  before update on public.clients
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- subscriptions
-- ---------------------------------------------------------------------------

create table if not exists public.subscriptions (
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

comment on table public.subscriptions is 'Abonnement INVEQ par utilisateur.';

create index if not exists subscriptions_user_id_idx on public.subscriptions (user_id);
create index if not exists subscriptions_status_idx on public.subscriptions (status);
create index if not exists subscriptions_stripe_customer_id_idx on public.subscriptions (stripe_customer_id)
  where stripe_customer_id is not null;

drop trigger if exists subscriptions_set_updated_at on public.subscriptions;
create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quotes
-- ---------------------------------------------------------------------------

create table if not exists public.quotes (
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
  constraint quotes_totals_consistency_chk
    check (total_ttc = round(subtotal_ht + total_vat, 2)),
  constraint quotes_converted_status_chk
    check (
      status <> 'converted'::public.quote_status
      or converted_invoice_id is not null
    )
);

comment on table public.quotes is 'Devis commerciaux.';
comment on column public.quotes.converted_invoice_id is 'Facture générée lorsque le statut est converted.';

create unique index if not exists quotes_user_number_uniq
  on public.quotes (user_id, number);

create index if not exists quotes_user_id_idx on public.quotes (user_id);
create index if not exists quotes_client_id_idx on public.quotes (client_id);
create index if not exists quotes_converted_invoice_id_idx on public.quotes (converted_invoice_id);
create index if not exists quotes_status_idx on public.quotes (status);
create index if not exists quotes_issued_at_idx on public.quotes (issued_at desc nulls last);
create index if not exists quotes_user_id_issued_at_idx on public.quotes (user_id, issued_at desc nulls last);

drop trigger if exists quotes_set_updated_at on public.quotes;
create trigger quotes_set_updated_at
  before update on public.quotes
  for each row
  execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- quote_items
-- ---------------------------------------------------------------------------

create table if not exists public.quote_items (
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
  discount_percent numeric(5, 2) not null default 0
    check (discount_percent >= 0 and discount_percent <= 100),
  line_total_ht numeric(12, 2) not null default 0
    check (line_total_ht >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.quote_items is 'Lignes de devis (snapshot prix/TVA).';
comment on column public.quote_items.discount_percent is 'Remise en pourcentage appliquée à la ligne HT.';

create index if not exists quote_items_quote_id_idx on public.quote_items (quote_id);
create index if not exists quote_items_user_id_idx on public.quote_items (user_id);
create index if not exists quote_items_product_id_idx on public.quote_items (product_id);
create index if not exists quote_items_quote_id_position_idx on public.quote_items (quote_id, position);

drop trigger if exists quote_items_set_updated_at on public.quote_items;
create trigger quote_items_set_updated_at
  before update on public.quote_items
  for each row
  execute function public.set_updated_at();

drop trigger if exists quote_items_enforce_user_id on public.quote_items;
create trigger quote_items_enforce_user_id
  before insert or update on public.quote_items
  for each row
  execute function public.enforce_child_user_matches_parent();

-- ---------------------------------------------------------------------------
-- invoices
-- ---------------------------------------------------------------------------

create table if not exists public.invoices (
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
comment on column public.invoices.payment_method is 'Moyen de paiement (virement, chèque, carte…).';
comment on column public.invoices.payment_reference is 'Référence de paiement ou transaction.';

create unique index if not exists invoices_user_number_uniq
  on public.invoices (user_id, number);

create index if not exists invoices_user_id_idx on public.invoices (user_id);
create index if not exists invoices_client_id_idx on public.invoices (client_id);
create index if not exists invoices_quote_id_idx on public.invoices (quote_id);
create index if not exists invoices_status_idx on public.invoices (status);
create index if not exists invoices_issued_at_idx on public.invoices (issued_at desc nulls last);
create index if not exists invoices_due_at_idx on public.invoices (due_at);
create index if not exists invoices_paid_at_idx on public.invoices (paid_at)
  where paid_at is not null;
create index if not exists invoices_user_id_issued_at_idx on public.invoices (user_id, issued_at desc nulls last);

drop trigger if exists invoices_set_updated_at on public.invoices;
create trigger invoices_set_updated_at
  before update on public.invoices
  for each row
  execute function public.set_updated_at();

-- FK quotes.converted_invoice_id → invoices (après création de invoices)
do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'quotes_converted_invoice_id_fkey'
      and conrelid = 'public.quotes'::regclass
  ) then
    alter table public.quotes
      add constraint quotes_converted_invoice_id_fkey
      foreign key (converted_invoice_id)
      references public.invoices (id)
      on delete set null;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- invoice_items
-- ---------------------------------------------------------------------------

create table if not exists public.invoice_items (
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
  discount_percent numeric(5, 2) not null default 0
    check (discount_percent >= 0 and discount_percent <= 100),
  line_total_ht numeric(12, 2) not null default 0
    check (line_total_ht >= 0),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.invoice_items is 'Lignes de facture (snapshot prix/TVA).';
comment on column public.invoice_items.discount_percent is 'Remise en pourcentage appliquée à la ligne HT.';

create index if not exists invoice_items_invoice_id_idx on public.invoice_items (invoice_id);
create index if not exists invoice_items_user_id_idx on public.invoice_items (user_id);
create index if not exists invoice_items_product_id_idx on public.invoice_items (product_id);
create index if not exists invoice_items_invoice_id_position_idx on public.invoice_items (invoice_id, position);

drop trigger if exists invoice_items_set_updated_at on public.invoice_items;
create trigger invoice_items_set_updated_at
  before update on public.invoice_items
  for each row
  execute function public.set_updated_at();

drop trigger if exists invoice_items_enforce_user_id on public.invoice_items;
create trigger invoice_items_enforce_user_id
  before insert or update on public.invoice_items
  for each row
  execute function public.enforce_child_user_matches_parent();

-- ---------------------------------------------------------------------------
-- invoice_payments
-- ---------------------------------------------------------------------------

create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  paid_at timestamptz not null default timezone('utc', now()),
  payment_method text,
  payment_reference text,
  notes text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.invoice_payments is 'Paiements partiels ou complets sur une facture.';

create index if not exists invoice_payments_invoice_id_idx on public.invoice_payments (invoice_id);
create index if not exists invoice_payments_user_id_idx on public.invoice_payments (user_id);
create index if not exists invoice_payments_paid_at_idx on public.invoice_payments (paid_at desc);

drop trigger if exists invoice_payments_set_updated_at on public.invoice_payments;
create trigger invoice_payments_set_updated_at
  before update on public.invoice_payments
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

alter table public.clients enable row level security;
alter table public.subscriptions enable row level security;
alter table public.quotes enable row level security;
alter table public.quote_items enable row level security;
alter table public.invoices enable row level security;
alter table public.invoice_items enable row level security;
alter table public.invoice_payments enable row level security;

-- clients
drop policy if exists clients_select_own on public.clients;
create policy clients_select_own on public.clients
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists clients_insert_own on public.clients;
create policy clients_insert_own on public.clients
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists clients_update_own on public.clients;
create policy clients_update_own on public.clients
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists clients_delete_own on public.clients;
create policy clients_delete_own on public.clients
  for delete to authenticated
  using (auth.uid() = user_id);

-- subscriptions
drop policy if exists subscriptions_select_own on public.subscriptions;
create policy subscriptions_select_own on public.subscriptions
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists subscriptions_insert_own on public.subscriptions;
create policy subscriptions_insert_own on public.subscriptions
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists subscriptions_update_own on public.subscriptions;
create policy subscriptions_update_own on public.subscriptions
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists subscriptions_delete_own on public.subscriptions;
create policy subscriptions_delete_own on public.subscriptions
  for delete to authenticated
  using (auth.uid() = user_id);

-- quotes
drop policy if exists quotes_select_own on public.quotes;
create policy quotes_select_own on public.quotes
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists quotes_insert_own on public.quotes;
create policy quotes_insert_own on public.quotes
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists quotes_update_own on public.quotes;
create policy quotes_update_own on public.quotes
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists quotes_delete_own on public.quotes;
create policy quotes_delete_own on public.quotes
  for delete to authenticated
  using (auth.uid() = user_id);

-- quote_items
drop policy if exists quote_items_select_own on public.quote_items;
create policy quote_items_select_own on public.quote_items
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists quote_items_insert_own on public.quote_items;
create policy quote_items_insert_own on public.quote_items
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.quotes q
      where q.id = quote_id
        and q.user_id = auth.uid()
    )
  );

drop policy if exists quote_items_update_own on public.quote_items;
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

drop policy if exists quote_items_delete_own on public.quote_items;
create policy quote_items_delete_own on public.quote_items
  for delete to authenticated
  using (auth.uid() = user_id);

-- invoices
drop policy if exists invoices_select_own on public.invoices;
create policy invoices_select_own on public.invoices
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists invoices_insert_own on public.invoices;
create policy invoices_insert_own on public.invoices
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists invoices_update_own on public.invoices;
create policy invoices_update_own on public.invoices
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists invoices_delete_own on public.invoices;
create policy invoices_delete_own on public.invoices
  for delete to authenticated
  using (auth.uid() = user_id);

-- invoice_items
drop policy if exists invoice_items_select_own on public.invoice_items;
create policy invoice_items_select_own on public.invoice_items
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists invoice_items_insert_own on public.invoice_items;
create policy invoice_items_insert_own on public.invoice_items
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

drop policy if exists invoice_items_update_own on public.invoice_items;
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

drop policy if exists invoice_items_delete_own on public.invoice_items;
create policy invoice_items_delete_own on public.invoice_items
  for delete to authenticated
  using (auth.uid() = user_id);

-- invoice_payments
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

-- ---------------------------------------------------------------------------
-- Droits
-- ---------------------------------------------------------------------------

grant usage on type public.quote_status to authenticated, service_role;
grant usage on type public.invoice_status to authenticated, service_role;
grant usage on type public.subscription_plan to authenticated, service_role;
grant usage on type public.subscription_status to authenticated, service_role;

grant select, insert, update, delete on public.clients to authenticated;
grant select, insert, update, delete on public.subscriptions to authenticated;
grant select, insert, update, delete on public.quotes to authenticated;
grant select, insert, update, delete on public.quote_items to authenticated;
grant select, insert, update, delete on public.invoices to authenticated;
grant select, insert, update, delete on public.invoice_items to authenticated;
grant select, insert, update, delete on public.invoice_payments to authenticated;

commit;
