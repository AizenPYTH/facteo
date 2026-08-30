-- Product StoreKit unique pour l'offre INVEQ Premium.
update public.subscription_plans
set
  app_store_product_id = coalesce(
    nullif(app_store_product_id, ''),
    'com.inveq.app.premium.monthly'
  ),
  updated_at = timezone('utc', now())
where id in ('premium', 'pro')
  and is_active = true;
