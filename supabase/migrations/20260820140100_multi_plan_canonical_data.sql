-- Étape 2 : données + resolve + catalogue Max / Apple product ids
-- (après commit de l’extension d’enum)

update public.subscriptions
set plan = 'micro'::public.subscription_plan, updated_at = timezone('utc', now())
where plan::text = 'free';

update public.subscriptions
set plan = 'basique'::public.subscription_plan, updated_at = timezone('utc', now())
where plan::text = 'starter';

update public.subscriptions
set plan = 'pro'::public.subscription_plan, updated_at = timezone('utc', now())
where plan::text = 'premium';

update public.subscriptions
set plan = 'max'::public.subscription_plan, updated_at = timezone('utc', now())
where plan::text = 'enterprise';

create or replace function public.resolve_effective_plan_id(p_plan public.subscription_plan)
returns text
language sql
immutable
as $$
  select case p_plan::text
    when 'micro' then 'micro'
    when 'basique' then 'basique'
    when 'standard' then 'standard'
    when 'pro' then 'pro'
    when 'max' then 'max'
    when 'free' then 'micro'
    when 'starter' then 'basique'
    when 'premium' then 'pro'
    when 'enterprise' then 'max'
    else 'micro'
  end;
$$;

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
  app_store_product_id,
  is_active
)
values
  (
    'max',
    'Max',
    'Toutes les fonctionnalités INVEQ pour une activité sans limite.',
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
    'com.inveq.app.max.monthly',
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
  app_store_product_id = excluded.app_store_product_id,
  is_active = true,
  updated_at = timezone('utc', now());

update public.subscription_plans
set
  app_store_product_id = case id
    when 'basique' then 'com.inveq.app.basique.monthly'
    when 'standard' then 'com.inveq.app.standard.monthly'
    when 'pro' then 'com.inveq.app.pro.monthly'
    when 'max' then 'com.inveq.app.max.monthly'
    else null
  end,
  is_active = true,
  updated_at = timezone('utc', now())
where id in ('micro', 'basique', 'standard', 'pro', 'max');

update public.subscription_plans
set
  app_store_product_id = null,
  updated_at = timezone('utc', now())
where id = 'micro';

update public.subscription_plans
set
  is_active = false,
  app_store_product_id = null,
  updated_at = timezone('utc', now())
where id in ('free', 'premium');
