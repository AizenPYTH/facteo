-- Mappe l’enum subscriptions.plan vers le catalogue actif
-- (micro / basique / standard / pro / max), au lieu de tout collapser en pro.

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
    when 'pro'::public.subscription_plan then 'pro'
    when 'max'::public.subscription_plan then 'max'
    when 'premium'::public.subscription_plan then 'pro'
    when 'starter'::public.subscription_plan then 'pro'
    when 'enterprise'::public.subscription_plan then 'pro'
    else 'micro'
  end;
$$;

comment on function public.resolve_effective_plan_id(public.subscription_plan) is
  'Mappe l’enum legacy/catalog vers l’id subscription_plans (micro|basique|standard|pro|max).';
