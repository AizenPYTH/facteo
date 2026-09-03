-- Aligner le resolver SQL sur le catalogue mobile/web (5 plans).
-- Avant : free → micro, tout le reste → pro (Basique comptait comme Pro côté RPC).

create or replace function public.resolve_effective_plan_id(p_plan public.subscription_plan)
returns text
language sql
immutable
as $$
  select case p_plan
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
