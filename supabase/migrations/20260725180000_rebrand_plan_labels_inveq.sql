-- Align subscription plan copy with INVEQ branding (idempotent).

update public.subscription_plans
set
  description = 'Pour découvrir INVEQ et facturer vos premiers clients.'
where id = 'micro';

update public.subscription_plans
set
  display_name = case id
    when 'standard' then 'Standard'
    when 'premium' then 'Premium'
    when 'pro' then 'Pro'
    when 'basique' then 'Basique'
    when 'micro' then 'Micro'
    else display_name
  end
where id in ('micro', 'basique', 'standard', 'premium', 'pro');

comment on table public.subscriptions is 'Abonnement INVEQ par utilisateur.';
