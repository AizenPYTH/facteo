-- INVEQ — 5 offres (Micro / Basique / Standard / Pro / Max) + prix Stripe mensuel/annuel

-- ---------------------------------------------------------------------------
-- Enum subscriptions.plan : ajouter les valeurs catalogue
-- ---------------------------------------------------------------------------

alter type public.subscription_plan add value if not exists 'micro';
alter type public.subscription_plan add value if not exists 'basique';
alter type public.subscription_plan add value if not exists 'standard';
alter type public.subscription_plan add value if not exists 'max';

-- ---------------------------------------------------------------------------
-- Prix annuel + lookup keys Stripe (source de vérité côté Stripe)
-- ---------------------------------------------------------------------------

alter table public.subscription_plans
  add column if not exists stripe_price_id_yearly text,
  add column if not exists stripe_lookup_key_monthly text,
  add column if not exists stripe_lookup_key_yearly text;

comment on column public.subscription_plans.stripe_price_id is
  'Price ID Stripe mensuel (cache). Résolu aussi via stripe_lookup_key_monthly.';
comment on column public.subscription_plans.stripe_price_id_yearly is
  'Price ID Stripe annuel (cache). Résolu aussi via stripe_lookup_key_yearly.';
comment on column public.subscription_plans.stripe_lookup_key_monthly is
  'lookup_key Stripe pour le prix mensuel (ex. monthly_basic).';
comment on column public.subscription_plans.stripe_lookup_key_yearly is
  'lookup_key Stripe pour le prix annuel (ex. yearly_basic).';

-- ---------------------------------------------------------------------------
-- Catalogue 5 offres
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
  stripe_lookup_key_monthly,
  stripe_lookup_key_yearly,
  is_active
)
values
  (
    'micro',
    'Micro',
    'Pour découvrir INVEQ et facturer vos premiers clients.',
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
    null,
    null,
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
    'monthly_basic',
    'yearly_basic',
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
    'monthly_standard',
    'yearly_standard',
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
    'monthly_pro',
    'yearly_pro',
    true
  ),
  (
    'max',
    'Max',
    'Toutes les fonctionnalités avancées : paiements, IA, statistiques.',
    4,
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
      'stripe_payments', true,
      'ai_assistant', true,
      'advanced_stats', true,
      'siren_search', true
    ),
    'monthly_max',
    'yearly_max',
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
  stripe_lookup_key_monthly = excluded.stripe_lookup_key_monthly,
  stripe_lookup_key_yearly = excluded.stripe_lookup_key_yearly,
  is_active = excluded.is_active,
  updated_at = timezone('utc', now());

-- Anciens plans marketing unique : désactivés
update public.subscription_plans
set
  is_active = false,
  updated_at = timezone('utc', now())
where id in ('free', 'premium', 'starter', 'enterprise');

-- ---------------------------------------------------------------------------
-- Mapping enum → catalogue (critique pour quotas)
-- ---------------------------------------------------------------------------

create or replace function public.resolve_effective_plan_id(p_plan public.subscription_plan)
returns text
language sql
immutable
as $$
  select case p_plan::text
    when 'free' then 'micro'
    when 'micro' then 'micro'
    when 'basique' then 'basique'
    when 'starter' then 'basique'
    when 'standard' then 'standard'
    when 'pro' then 'pro'
    when 'premium' then 'max'
    when 'max' then 'max'
    when 'enterprise' then 'max'
    else 'micro'
  end;
$$;
