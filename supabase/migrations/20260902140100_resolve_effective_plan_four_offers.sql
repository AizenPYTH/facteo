-- Mapping enum subscriptions.plan → catalogue actif
-- (micro / basique / standard / pro). Les valeurs legacy restent lisibles.

create or replace function public.resolve_effective_plan_id(p_plan public.subscription_plan)
returns text
language sql
immutable
as $$
  select case p_plan
    when 'free'::public.subscription_plan then 'micro'
    when 'micro'::public.subscription_plan then 'micro'
    when 'basique'::public.subscription_plan then 'basique'
    when 'standard'::public.subscription_plan then 'standard'
    when 'starter'::public.subscription_plan then 'standard'
    when 'pro'::public.subscription_plan then 'pro'
    when 'premium'::public.subscription_plan then 'pro'
    when 'enterprise'::public.subscription_plan then 'pro'
    else 'micro'
  end;
$$;

comment on function public.resolve_effective_plan_id(public.subscription_plan) is
  'Mappe l’enum subscriptions.plan (y compris free/premium legacy) vers le catalogue micro/basique/standard/pro.';
