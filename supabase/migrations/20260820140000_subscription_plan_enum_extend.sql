-- Étape 1 : étendre l’enum (commit séparé — obligatoire sous PostgreSQL).
alter type public.subscription_plan add value if not exists 'micro';
alter type public.subscription_plan add value if not exists 'basique';
alter type public.subscription_plan add value if not exists 'standard';
alter type public.subscription_plan add value if not exists 'max';
