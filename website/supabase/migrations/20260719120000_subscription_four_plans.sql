-- Factume — Offres Micro / Basique / Standard / Pro + quotas mensuels

-- ---------------------------------------------------------------------------
-- Colonnes de quotas
-- ---------------------------------------------------------------------------

alter table public.subscription_plans
  add column if not exists max_documents_per_month integer,
  add column if not exists max_siren_searches_per_month integer,
  add column if not exists max_companies integer;

comment on column public.subscription_plans.max_documents_per_month is
  'Quota devis+factures créés sur le mois calendaire UTC. NULL = illimité.';
comment on column public.subscription_plans.max_siren_searches_per_month is
  'Quota recherches SIREN/SIRET sur le mois calendaire UTC. NULL = illimité. 0 = désactivé.';
comment on column public.subscription_plans.max_companies is
  'Nombre max d’entreprises (memberships). NULL = illimité.';

-- ---------------------------------------------------------------------------
-- Compteur d’usage mensuel (SIREN)
-- ---------------------------------------------------------------------------

create table if not exists public.plan_usage_counters (
  user_id uuid not null references auth.users (id) on delete cascade,
  resource text not null,
  period_start date not null,
  count integer not null default 0 check (count >= 0),
  updated_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, resource, period_start),
  constraint plan_usage_counters_resource_check check (resource in ('siren_searches'))
);

create index if not exists plan_usage_counters_user_period_idx
  on public.plan_usage_counters (user_id, period_start);

alter table public.plan_usage_counters enable row level security;

drop policy if exists plan_usage_counters_select_own on public.plan_usage_counters;
create policy plan_usage_counters_select_own on public.plan_usage_counters
  for select to authenticated
  using (user_id = auth.uid());

grant select on public.plan_usage_counters to authenticated;

-- ---------------------------------------------------------------------------
-- Catalogue des 4 offres
-- ---------------------------------------------------------------------------

insert into public.subscription_plans (
  id,
  display_name,
  description,
  sort_order,
  max_clients,
  max_quotes,
  max_invoices,
  max_documents_per_month,
  max_siren_searches_per_month,
  max_companies,
  features,
  is_active
)
values
  (
    'micro',
    'Micro',
    'Pour découvrir Factume et facturer vos premiers clients.',
    0,
    null,
    null,
    null,
    3,
    0,
    1,
    jsonb_build_object(
      'custom_logo', false,
      'company_signature', false,
      'client_signature', false,
      'pdf_templates', false,
      'stripe_payments', false,
      'ai_assistant', false,
      'advanced_stats', false,
      'siren_search', false
    ),
    true
  ),
  (
    'basique',
    'Basique',
    'Pour les indépendants qui facturent sans limite.',
    1,
    null,
    null,
    null,
    null,
    50,
    1,
    jsonb_build_object(
      'custom_logo', true,
      'company_signature', true,
      'client_signature', false,
      'pdf_templates', true,
      'stripe_payments', false,
      'ai_assistant', false,
      'advanced_stats', false,
      'siren_search', true
    ),
    true
  ),
  (
    'standard',
    'Standard',
    'Pour signer vos documents et gérer plusieurs activités.',
    2,
    null,
    null,
    null,
    null,
    200,
    3,
    jsonb_build_object(
      'custom_logo', true,
      'company_signature', true,
      'client_signature', true,
      'pdf_templates', true,
      'stripe_payments', false,
      'ai_assistant', false,
      'advanced_stats', false,
      'siren_search', true
    ),
    true
  ),
  (
    'pro',
    'Pro',
    'Pour les pros multi-activités sans plafond de recherche.',
    3,
    null,
    null,
    null,
    null,
    null,
    null,
    jsonb_build_object(
      'custom_logo', true,
      'company_signature', true,
      'client_signature', true,
      'pdf_templates', true,
      'stripe_payments', false,
      'ai_assistant', false,
      'advanced_stats', false,
      'siren_search', true
    ),
    true
  )
on conflict (id) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  sort_order = excluded.sort_order,
  max_clients = excluded.max_clients,
  max_quotes = excluded.max_quotes,
  max_invoices = excluded.max_invoices,
  max_documents_per_month = excluded.max_documents_per_month,
  max_siren_searches_per_month = excluded.max_siren_searches_per_month,
  max_companies = excluded.max_companies,
  features = excluded.features,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

-- Anciens plans : désactivés (conservés pour historique / fallback)
update public.subscription_plans
set
  is_active = false,
  updated_at = timezone('utc', now())
where id in ('free', 'premium');

-- ---------------------------------------------------------------------------
-- Mapping enum legacy → catalogue
-- free → micro ; tout abonnement payant legacy → pro
-- ---------------------------------------------------------------------------

create or replace function public.resolve_effective_plan_id(p_plan public.subscription_plan)
returns text
language sql
immutable
as $$
  select case
    when p_plan = 'free'::public.subscription_plan then 'micro'
    else 'pro'
  end;
$$;

-- ---------------------------------------------------------------------------
-- Usage (lifetime + mensuel)
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
  v_documents_month integer := 0;
  v_companies integer := 0;
  v_siren_searches integer := 0;
  v_period_start date := date_trunc('month', timezone('utc', now()))::date;
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

  select (
    (select count(*)::integer from public.quotes
      where user_id = v_uid and created_at >= v_period_start)
    +
    (select count(*)::integer from public.invoices
      where user_id = v_uid and created_at >= v_period_start)
  ) into v_documents_month;

  select count(*)::integer into v_companies
  from public.company_members
  where user_id = v_uid;

  select coalesce(c.count, 0)::integer into v_siren_searches
  from public.plan_usage_counters c
  where c.user_id = v_uid
    and c.resource = 'siren_searches'
    and c.period_start = v_period_start;

  return jsonb_build_object(
    'clients', v_clients,
    'quotes', v_quotes,
    'invoices', v_invoices,
    'documents', v_documents_month,
    'companies', v_companies,
    'siren_searches', coalesce(v_siren_searches, 0)
  );
end;
$$;

revoke all on function public.get_subscription_usage() from public;
grant execute on function public.get_subscription_usage() to authenticated;

-- ---------------------------------------------------------------------------
-- check_plan_limit — documents / companies / siren_searches + legacy
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
  v_features jsonb;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if p_resource not in ('clients', 'quotes', 'invoices', 'documents', 'companies', 'siren_searches') then
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
  where sp.id = v_plan_id;

  if not found then
    raise exception 'Plan configuration not found for %', v_plan_id;
  end if;

  v_features := coalesce(v_plan_row.features, '{}'::jsonb);
  v_usage := public.get_subscription_usage();

  if p_resource = 'siren_searches' and coalesce((v_features ->> 'siren_search')::boolean, false) is not true then
    return jsonb_build_object(
      'allowed', false,
      'resource', p_resource,
      'current', coalesce((v_usage ->> 'siren_searches')::integer, 0),
      'limit', 0,
      'plan_id', v_plan_id,
      'plan_name', v_plan_row.display_name,
      'status', v_status::text,
      'is_premium', v_plan_id <> 'micro'
    );
  end if;

  v_current := case p_resource
    when 'documents' then coalesce((v_usage ->> 'documents')::integer, 0)
    when 'companies' then coalesce((v_usage ->> 'companies')::integer, 0)
    when 'siren_searches' then coalesce((v_usage ->> 'siren_searches')::integer, 0)
    else coalesce((v_usage ->> p_resource)::integer, 0)
  end;

  v_limit := case p_resource
    when 'clients' then v_plan_row.max_clients
    when 'quotes' then v_plan_row.max_quotes
    when 'invoices' then v_plan_row.max_invoices
    when 'documents' then v_plan_row.max_documents_per_month
    when 'companies' then v_plan_row.max_companies
    when 'siren_searches' then v_plan_row.max_siren_searches_per_month
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
    'is_premium', v_plan_id <> 'micro'
  );
end;
$$;

revoke all on function public.check_plan_limit(text) from public;
grant execute on function public.check_plan_limit(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Consommer 1 recherche SIREN (check + incrément atomique)
-- ---------------------------------------------------------------------------

create or replace function public.consume_siren_search()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_check jsonb;
  v_period_start date := date_trunc('month', timezone('utc', now()))::date;
  v_count integer;
begin
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  v_check := public.check_plan_limit('siren_searches');

  if coalesce((v_check ->> 'allowed')::boolean, false) is not true then
    return v_check;
  end if;

  insert into public.plan_usage_counters (user_id, resource, period_start, count, updated_at)
  values (v_uid, 'siren_searches', v_period_start, 1, timezone('utc', now()))
  on conflict (user_id, resource, period_start)
  do update set
    count = public.plan_usage_counters.count + 1,
    updated_at = timezone('utc', now())
  returning count into v_count;

  return jsonb_build_object(
    'allowed', true,
    'resource', 'siren_searches',
    'current', v_count,
    'limit', v_check -> 'limit',
    'plan_id', v_check ->> 'plan_id',
    'plan_name', v_check ->> 'plan_name',
    'status', v_check ->> 'status',
    'is_premium', (v_check ->> 'is_premium')::boolean
  );
end;
$$;

revoke all on function public.consume_siren_search() from public;
grant execute on function public.consume_siren_search() to authenticated;

-- ---------------------------------------------------------------------------
-- Création d’entreprise plafonnée
-- ---------------------------------------------------------------------------

create or replace function public.create_company_for_user(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_name text;
  v_check jsonb;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  v_check := public.check_plan_limit('companies');
  if coalesce((v_check ->> 'allowed')::boolean, false) is not true then
    raise exception 'PLAN_LIMIT_REACHED:companies'
      using errcode = 'P0001',
            detail = v_check::text;
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
