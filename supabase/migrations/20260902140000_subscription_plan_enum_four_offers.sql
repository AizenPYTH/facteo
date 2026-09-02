-- Ajoute les identifiants catalogue Micro / Basique / Standard
-- à l’enum subscriptions.plan (pro existe déjà).
-- Les nouvelles valeurs ne sont pas utilisées dans cette migration :
-- PostgreSQL n’autorise leur usage qu’après COMMIT.

alter type public.subscription_plan add value if not exists 'micro';
alter type public.subscription_plan add value if not exists 'basique';
alter type public.subscription_plan add value if not exists 'standard';
