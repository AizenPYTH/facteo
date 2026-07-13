-- FACTEO — Système d'abonnement Freemium + signatures client

-- ---------------------------------------------------------------------------
-- Plan enum: ajouter premium (évolutif: business, pro_plus plus tard)
-- ---------------------------------------------------------------------------

alter type public.subscription_plan add value if not exists 'premium';

-- ---------------------------------------------------------------------------
-- subscription_plans — source de vérité pour limites et fonctionnalités
-- ---------------------------------------------------------------------------

create table if not exists public.subscription_plans (
  id text primary key,
  display_name text not null,
  description text,
  sort_order integer not null default 0,
  max_clients integer,
  max_quotes integer,
  max_invoices integer,
  features jsonb not null default '{}'::jsonb,
  stripe_price_id text,
  stripe_product_id text,
  app_store_product_id text,
  play_store_product_id text,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

comment on table public.subscription_plans is
  'Catalogue des offres FACTEO (limites et fonctionnalités configurables).';
comment on column public.subscription_plans.max_clients is 'NULL = illimité.';
comment on column public.subscription_plans.features is
  'Flags fonctionnels: custom_logo, company_signature, client_signature, stripe_payments, ai_assistant, advanced_stats, siren_search.';

insert into public.subscription_plans (
  id,
  display_name,
  description,
  sort_order,
  max_clients,
  max_quotes,
  max_invoices,
  features
)
values
  (
    'free',
    'FACTEO Standard',
    'L''essentiel pour démarrer, sans personnalisation avancée.',
    0,
    5,
    10,
    10,
    jsonb_build_object(
      'custom_logo', false,
      'company_signature', false,
      'client_signature', false,
      'stripe_payments', false,
      'ai_assistant', false,
      'advanced_stats', false,
      'siren_search', false
    )
  ),
  (
    'premium',
    'FACTEO Premium',
    'Sans limites, avec toutes les fonctionnalités avancées et futures.',
    1,
    null,
    null,
    null,
    jsonb_build_object(
      'custom_logo', true,
      'company_signature', true,
      'client_signature', true,
      'stripe_payments', true,
      'ai_assistant', true,
      'advanced_stats', true,
      'siren_search', true
    )
  )
on conflict (id) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  max_clients = excluded.max_clients,
  max_quotes = excluded.max_quotes,
  max_invoices = excluded.max_invoices,
  features = excluded.features,
  updated_at = timezone('utc', now());

drop trigger if exists subscription_plans_set_updated_at on public.subscription_plans;
create trigger subscription_plans_set_updated_at
  before update on public.subscription_plans
  for each row
  execute function public.set_updated_at();

alter table public.subscription_plans enable row level security;

drop policy if exists subscription_plans_select_authenticated on public.subscription_plans;
create policy subscription_plans_select_authenticated on public.subscription_plans
  for select to authenticated
  using (is_active = true);

grant select on public.subscription_plans to authenticated;

-- ---------------------------------------------------------------------------
-- Backfill subscriptions manquantes
-- ---------------------------------------------------------------------------

insert into public.subscriptions (user_id, plan, status, created_at, updated_at)
select
  u.id,
  'free'::public.subscription_plan,
  'active'::public.subscription_status,
  timezone('utc', now()),
  timezone('utc', now())
from auth.users u
where not exists (
  select 1 from public.subscriptions s where s.user_id = u.id
);

-- ---------------------------------------------------------------------------
-- ensure_user_subscription
-- ---------------------------------------------------------------------------

create or replace function public.ensure_user_subscription()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  insert into public.subscriptions (user_id, plan, status, created_at, updated_at)
  values (
    v_uid,
    'free'::public.subscription_plan,
    'active'::public.subscription_status,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (user_id) do nothing;
end;
$$;

revoke all on function public.ensure_user_subscription() from public;
grant execute on function public.ensure_user_subscription() to authenticated;

-- ---------------------------------------------------------------------------
-- resolve_effective_plan_id — mappe l'enum vers le catalogue
-- ---------------------------------------------------------------------------

create or replace function public.resolve_effective_plan_id(p_plan public.subscription_plan)
returns text
language sql
immutable
as $$
  select case
    when p_plan = 'free'::public.subscription_plan then 'free'
    else 'premium'
  end;
$$;

-- ---------------------------------------------------------------------------
-- get_subscription_usage
-- ---------------------------------------------------------------------------

create or replace function public.get_subscription_usage()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_clients integer := 0;
  v_quotes integer := 0;
  v_invoices integer := 0;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  select count(*)::integer into v_clients
  from public.clients
  where user_id = v_uid and deleted_at is null;

  select count(*)::integer into v_quotes
  from public.quotes
  where user_id = v_uid;

  select count(*)::integer into v_invoices
  from public.invoices
  where user_id = v_uid;

  return jsonb_build_object(
    'clients', v_clients,
    'quotes', v_quotes,
    'invoices', v_invoices
  );
end;
$$;

revoke all on function public.get_subscription_usage() from public;
grant execute on function public.get_subscription_usage() to authenticated;

-- ---------------------------------------------------------------------------
-- check_plan_limit
-- ---------------------------------------------------------------------------

create or replace function public.check_plan_limit(p_resource text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_plan public.subscription_plan;
  v_status public.subscription_status;
  v_plan_id text;
  v_plan_row public.subscription_plans%rowtype;
  v_usage jsonb;
  v_current integer := 0;
  v_limit integer;
  v_allowed boolean := true;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_resource not in ('clients', 'quotes', 'invoices') then
    raise exception 'Invalid resource: %', p_resource;
  end if;

  perform public.ensure_user_subscription();

  select s.plan, s.status
  into v_plan, v_status
  from public.subscriptions s
  where s.user_id = v_uid;

  v_plan_id := public.resolve_effective_plan_id(v_plan);

  select * into v_plan_row
  from public.subscription_plans sp
  where sp.id = v_plan_id and sp.is_active = true;

  if not found then
    raise exception 'Plan configuration not found for %', v_plan_id;
  end if;

  v_usage := public.get_subscription_usage();
  v_current := (v_usage ->> p_resource)::integer;

  v_limit := case p_resource
    when 'clients' then v_plan_row.max_clients
    when 'quotes' then v_plan_row.max_quotes
    when 'invoices' then v_plan_row.max_invoices
    else null
  end;

  if v_limit is not null and v_current >= v_limit then
    v_allowed := false;
  end if;

  return jsonb_build_object(
    'allowed', v_allowed,
    'resource', p_resource,
    'current', v_current,
    'limit', v_limit,
    'plan_id', v_plan_id,
    'plan_name', v_plan_row.display_name,
    'status', v_status::text,
    'is_premium', v_plan_id = 'premium'
  );
end;
$$;

revoke all on function public.check_plan_limit(text) from public;
grant execute on function public.check_plan_limit(text) to authenticated;

-- ---------------------------------------------------------------------------
-- document_signatures — signature électronique client
-- ---------------------------------------------------------------------------

create table if not exists public.document_signatures (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  document_type text not null check (document_type in ('quote', 'invoice')),
  document_id uuid not null,
  signature_url text not null,
  signer_name text,
  signed_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint document_signatures_unique_document unique (user_id, document_type, document_id)
);

comment on table public.document_signatures is 'Signatures électroniques client sur devis et factures.';

create index if not exists document_signatures_user_id_idx
  on public.document_signatures (user_id);
create index if not exists document_signatures_document_idx
  on public.document_signatures (document_type, document_id);

drop trigger if exists document_signatures_set_updated_at on public.document_signatures;
create trigger document_signatures_set_updated_at
  before update on public.document_signatures
  for each row
  execute function public.set_updated_at();

alter table public.document_signatures enable row level security;

drop policy if exists document_signatures_select_own on public.document_signatures;
create policy document_signatures_select_own on public.document_signatures
  for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists document_signatures_insert_own on public.document_signatures;
create policy document_signatures_insert_own on public.document_signatures
  for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists document_signatures_update_own on public.document_signatures;
create policy document_signatures_update_own on public.document_signatures
  for update to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists document_signatures_delete_own on public.document_signatures;
create policy document_signatures_delete_own on public.document_signatures
  for delete to authenticated
  using (auth.uid() = user_id);

grant select, insert, update, delete on public.document_signatures to authenticated;

-- ---------------------------------------------------------------------------
-- Storage: document-signatures
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'document-signatures',
  'document-signatures',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists document_signatures_storage_select on storage.objects;
create policy document_signatures_storage_select on storage.objects
  for select to public
  using (bucket_id = 'document-signatures');

drop policy if exists document_signatures_storage_insert on storage.objects;
create policy document_signatures_storage_insert on storage.objects
  for insert to authenticated
  with check (
    bucket_id = 'document-signatures'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists document_signatures_storage_update on storage.objects;
create policy document_signatures_storage_update on storage.objects
  for update to authenticated
  using (
    bucket_id = 'document-signatures'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'document-signatures'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

drop policy if exists document_signatures_storage_delete on storage.objects;
create policy document_signatures_storage_delete on storage.objects
  for delete to authenticated
  using (
    bucket_id = 'document-signatures'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- ---------------------------------------------------------------------------
-- handle_new_user: garantir abonnement free
-- (déjà présent — pas de modification nécessaire)
-- ---------------------------------------------------------------------------
