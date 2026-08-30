-- Photo IA / assistant + paiements facture Stripe : activer sur les plans payants.
-- (four_plans avait laissé ai_assistant / stripe_payments à false partout.)

update public.subscription_plans
set features = features || '{"ai_assistant": true}'::jsonb
where id in ('basique', 'standard', 'pro', 'premium');

update public.subscription_plans
set features = features || '{"stripe_payments": true, "advanced_stats": true, "client_signature": true}'::jsonb
where id in ('standard', 'pro', 'premium');
