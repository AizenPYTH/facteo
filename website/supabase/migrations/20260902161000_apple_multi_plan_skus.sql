-- Product IDs StoreKit du groupe « INVEQ Plans » + offre Max.
-- Ne remplace pas les lignes Stripe existantes : on enrichit app_store_product_id.

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
values (
  'max',
  'Max',
  'Toutes les fonctionnalités INVEQ, y compris paiements Stripe, assistant IA et statistiques avancées.',
  40,
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
  true
)
on conflict (id) do update
set
  display_name = excluded.display_name,
  description = excluded.description,
  features = excluded.features,
  is_active = true,
  updated_at = now();

update public.subscription_plans
set
  app_store_product_id = 'com.inveq.app.basique.monthly',
  updated_at = now()
where id = 'basique';

update public.subscription_plans
set
  app_store_product_id = 'com.inveq.app.standard.monthly',
  updated_at = now()
where id = 'standard';

update public.subscription_plans
set
  app_store_product_id = 'com.inveq.app.pro.monthly',
  updated_at = now()
where id in ('pro', 'premium');

update public.subscription_plans
set
  app_store_product_id = 'com.inveq.app.max.monthly',
  updated_at = now()
where id = 'max';
