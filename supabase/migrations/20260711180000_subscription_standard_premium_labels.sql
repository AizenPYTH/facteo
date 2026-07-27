-- Renommer les offres et déplacer la recherche SIREN/SIRET vers Premium

update public.subscription_plans
set
  display_name = 'INVEQ Standard',
  description = 'L''essentiel pour démarrer, sans personnalisation avancée.',
  features = jsonb_set(
    coalesce(features, '{}'::jsonb),
    '{siren_search}',
    'false'::jsonb,
    true
  ),
  updated_at = timezone('utc', now())
where id = 'free';

update public.subscription_plans
set
  display_name = 'INVEQ Premium',
  description = 'Sans limites, avec toutes les fonctionnalités avancées et futures.',
  features = jsonb_set(
    jsonb_set(
      coalesce(features, '{}'::jsonb),
      '{siren_search}',
      'true'::jsonb,
      true
    ),
    '{ai_assistant}',
    'true'::jsonb,
    true
  ),
  updated_at = timezone('utc', now())
where id = 'premium';
