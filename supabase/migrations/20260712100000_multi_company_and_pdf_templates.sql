-- Multi-entreprise + modèles PDF
-- Un compte peut gérer plusieurs entreprises via company_members.
-- N'altère que les tables existantes (pas de dépendance à public.documents).

-- ---------------------------------------------------------------------------
-- Tables entreprise
-- ---------------------------------------------------------------------------

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  name text not null default '',
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
  payment_methods jsonb not null default '[]'::jsonb,
  logo_url text,
  signature_url text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create table if not exists public.company_members (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner' check (role in ('owner', 'admin', 'member')),
  created_at timestamptz not null default timezone('utc', now()),
  unique (company_id, user_id)
);

create index if not exists company_members_user_id_idx on public.company_members(user_id);
create index if not exists company_members_company_id_idx on public.company_members(company_id);

-- ---------------------------------------------------------------------------
-- Colonnes company_id sur les tables métier (uniquement si la table existe)
-- ---------------------------------------------------------------------------

do $$
declare
  t text;
begin
  foreach t in array array[
    'clients',
    'quotes',
    'invoices',
    'settings',
    'subscriptions',
    'sent_documents',
    'products',
    'quote_items',
    'invoice_items',
    'invoice_payments',
    'document_signatures',
    'stripe_payment_sessions'
  ]
  loop
    if exists (
      select 1
      from information_schema.tables
      where table_schema = 'public'
        and table_name = t
    ) then
      execute format(
        'alter table public.%I add column if not exists company_id uuid references public.companies(id)',
        t
      );
    end if;
  end loop;
end $$;

-- Modèles PDF (settings)
do $$
begin
  if exists (
    select 1 from information_schema.tables
    where table_schema = 'public' and table_name = 'settings'
  ) then
    alter table public.settings
      add column if not exists invoice_template_id text not null default 'classic-blue';
    alter table public.settings
      add column if not exists quote_template_id text not null default 'classic-blue';
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Migration des données existantes (1 profil → 1 entreprise)
-- ---------------------------------------------------------------------------

do $$
declare
  r record;
  v_company_id uuid;
begin
  for r in
    select p.*
    from public.profiles p
    where not exists (
      select 1 from public.company_members cm where cm.user_id = p.id
    )
  loop
    insert into public.companies (
      name, email, phone, address, postal_code, city, country,
      siret, vat_number, iban, bic, payment_methods, logo_url, signature_url,
      created_at, updated_at
    )
    values (
      coalesce(nullif(trim(r.company_name), ''), 'Mon entreprise'),
      r.email, r.phone, r.address, r.postal_code, r.city, r.country,
      r.siret, r.vat_number, r.iban, r.bic,
      coalesce(r.payment_methods, '[]'::jsonb),
      r.logo_url, r.signature_url,
      r.created_at, r.updated_at
    )
    returning id into v_company_id;

    insert into public.company_members (company_id, user_id, role)
    values (v_company_id, r.id, 'owner')
    on conflict do nothing;

    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'clients') then
      update public.clients set company_id = v_company_id where user_id = r.id and company_id is null;
    end if;

    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'quotes') then
      update public.quotes set company_id = v_company_id where user_id = r.id and company_id is null;
    end if;

    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'invoices') then
      update public.invoices set company_id = v_company_id where user_id = r.id and company_id is null;
    end if;

    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'sent_documents') then
      update public.sent_documents set company_id = v_company_id where user_id = r.id and company_id is null;
    end if;

    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'products') then
      update public.products set company_id = v_company_id where user_id = r.id and company_id is null;
    end if;

    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'settings') then
      update public.settings
      set company_id = v_company_id
      where user_id = r.id and company_id is null;
    end if;

    if exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = 'subscriptions') then
      update public.subscriptions
      set company_id = v_company_id
      where user_id = r.id and company_id is null;
    end if;
  end loop;
end $$;

create unique index if not exists settings_company_id_unique
  on public.settings(company_id)
  where company_id is not null;

-- ---------------------------------------------------------------------------
-- Helpers RLS (nouvelle fonction — CREATE OR REPLACE suffit, pas de DROP
-- car les policies RLS créées plus bas en dépendent lors d'un rejeu)
-- ---------------------------------------------------------------------------

create or replace function public.user_has_company_access(p_company_id uuid)
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
  );
$$;

grant execute on function public.user_has_company_access(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- handle_new_user : créer entreprise + membership
-- ---------------------------------------------------------------------------

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

  insert into public.company_members (company_id, user_id, role)
  values (v_company_id, new.id, 'owner')
  on conflict do nothing;

  insert into public.settings (user_id, company_id, created_at, updated_at)
  values (new.id, v_company_id, timezone('utc', now()), timezone('utc', now()))
  on conflict (user_id) do update set company_id = excluded.company_id;

  insert into public.subscriptions (user_id, company_id, plan, status, created_at, updated_at)
  values (
    new.id, v_company_id,
    'free'::public.subscription_plan,
    'active'::public.subscription_status,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (user_id) do update set company_id = excluded.company_id;

  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPC création entreprise supplémentaire (nouvelle fonction)
-- ---------------------------------------------------------------------------

drop function if exists public.create_company_for_user(text);

create function public.create_company_for_user(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_name text;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  v_name := coalesce(nullif(trim(p_name), ''), 'Nouvelle entreprise');

  insert into public.companies (name, created_at, updated_at)
  values (v_name, timezone('utc', now()), timezone('utc', now()))
  returning id into v_company_id;

  insert into public.company_members (company_id, user_id, role)
  values (v_company_id, auth.uid(), 'owner');

  insert into public.settings (user_id, company_id, created_at, updated_at)
  values (auth.uid(), v_company_id, timezone('utc', now()), timezone('utc', now()))
  on conflict (user_id) do nothing;

  return v_company_id;
end;
$$;

grant execute on function public.create_company_for_user(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Numérotation par entreprise
-- PostgreSQL refuse de renommer un paramètre via CREATE OR REPLACE
-- (p_user_id → p_company_id) : DROP obligatoire avant recréation.
-- ---------------------------------------------------------------------------

drop function if exists public.reserve_next_quote_number(uuid);
drop function if exists public.reserve_next_invoice_number(uuid);

create function public.reserve_next_quote_number(p_company_id uuid)
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
  if not public.user_has_company_access(p_company_id) then
    raise exception 'Unauthorized';
  end if;

  select s.quote_prefix, s.next_quote_number
  into v_prefix, v_next
  from public.settings s
  where s.company_id = p_company_id
  for update;

  if v_prefix is null then
    select s.quote_prefix, s.next_quote_number
    into v_prefix, v_next
    from public.settings s
    where s.user_id = auth.uid()
    for update;
  end if;

  v_year := to_char(timezone('utc', now()), 'YYYY');
  v_number := coalesce(v_prefix, 'DEV') || '-' || v_year || '-' || lpad(v_next::text, 6, '0');

  update public.settings
  set next_quote_number = v_next + 1, updated_at = timezone('utc', now())
  where company_id = p_company_id
     or (company_id is null and user_id = auth.uid());

  return v_number;
end;
$$;

create function public.reserve_next_invoice_number(p_company_id uuid)
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
  if not public.user_has_company_access(p_company_id) then
    raise exception 'Unauthorized';
  end if;

  select s.invoice_prefix, s.next_invoice_number
  into v_prefix, v_next
  from public.settings s
  where s.company_id = p_company_id
  for update;

  if v_prefix is null then
    select s.invoice_prefix, s.next_invoice_number
    into v_prefix, v_next
    from public.settings s
    where s.user_id = auth.uid()
    for update;
  end if;

  v_year := to_char(timezone('utc', now()), 'YYYY');
  v_number := coalesce(v_prefix, 'FAC') || '-' || v_year || '-' || lpad(v_next::text, 6, '0');

  update public.settings
  set next_invoice_number = v_next + 1, updated_at = timezone('utc', now())
  where company_id = p_company_id
     or (company_id is null and user_id = auth.uid());

  return v_number;
end;
$$;

grant execute on function public.reserve_next_quote_number(uuid) to authenticated;
grant execute on function public.reserve_next_invoice_number(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RLS companies & members
-- ---------------------------------------------------------------------------

alter table public.companies enable row level security;
alter table public.company_members enable row level security;

drop policy if exists companies_select_member on public.companies;
create policy companies_select_member on public.companies
  for select to authenticated
  using (public.user_has_company_access(id));

drop policy if exists companies_insert_authenticated on public.companies;
create policy companies_insert_authenticated on public.companies
  for insert to authenticated
  with check (true);

drop policy if exists companies_update_member on public.companies;
create policy companies_update_member on public.companies
  for update to authenticated
  using (public.user_has_company_access(id))
  with check (public.user_has_company_access(id));

drop policy if exists company_members_select_own on public.company_members;
create policy company_members_select_own on public.company_members
  for select to authenticated
  using (user_id = auth.uid());

drop policy if exists company_members_insert_own on public.company_members;
create policy company_members_insert_own on public.company_members
  for insert to authenticated
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- RLS métier : accès par company_id (fallback user_id pour transition)
-- ---------------------------------------------------------------------------

drop policy if exists clients_select_own on public.clients;
create policy clients_select_own on public.clients
  for select to authenticated
  using (
    deleted_at is null
    and (
      (company_id is not null and public.user_has_company_access(company_id))
      or (company_id is null and auth.uid() = user_id)
    )
  );

drop policy if exists clients_insert_own on public.clients;
create policy clients_insert_own on public.clients
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and (company_id is null or public.user_has_company_access(company_id))
  );

drop policy if exists clients_update_own on public.clients;
create policy clients_update_own on public.clients
  for update to authenticated
  using (
    (company_id is not null and public.user_has_company_access(company_id))
    or (company_id is null and auth.uid() = user_id)
  )
  with check (
    auth.uid() = user_id
    and (company_id is null or public.user_has_company_access(company_id))
  );

drop policy if exists clients_delete_own on public.clients;
create policy clients_delete_own on public.clients
  for delete to authenticated
  using (
    (company_id is not null and public.user_has_company_access(company_id))
    or (company_id is null and auth.uid() = user_id)
  );

-- settings par entreprise
drop policy if exists settings_select_own on public.settings;
create policy settings_select_own on public.settings
  for select to authenticated
  using (
    auth.uid() = user_id
    or (company_id is not null and public.user_has_company_access(company_id))
  );

drop policy if exists settings_update_own on public.settings;
create policy settings_update_own on public.settings
  for update to authenticated
  using (
    auth.uid() = user_id
    or (company_id is not null and public.user_has_company_access(company_id))
  )
  with check (
    auth.uid() = user_id
    or (company_id is not null and public.user_has_company_access(company_id))
  );

-- Storage : autoriser company_id ou user_id comme dossier
drop policy if exists company_assets_select on storage.objects;
drop policy if exists company_assets_insert on storage.objects;
drop policy if exists company_assets_update on storage.objects;
drop policy if exists company_assets_delete on storage.objects;

create policy company_assets_select on storage.objects
  for select to authenticated
  using (
    bucket_id = 'company-assets'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.user_has_company_access((storage.foldername(name))[1]::uuid)
    )
  );

create policy company_assets_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'company-assets'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.user_has_company_access((storage.foldername(name))[1]::uuid)
    )
  );

create policy company_assets_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'company-assets'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.user_has_company_access((storage.foldername(name))[1]::uuid)
    )
  );

create policy company_assets_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'company-assets'
    and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.user_has_company_access((storage.foldername(name))[1]::uuid)
    )
  );
