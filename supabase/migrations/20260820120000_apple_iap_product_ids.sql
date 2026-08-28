-- Seed App Store product id for Premium (IAP).
update public.subscription_plans
set app_store_product_id = coalesce(nullif(app_store_product_id, ''), 'com.inveq.app.premium.monthly'),
    updated_at = now()
where id in ('premium', 'pro')
  and is_active = true;
