-- ---------------------------------------------------------------------------
-- Verrouille les ecritures sur public.subscriptions
-- ---------------------------------------------------------------------------
--
-- Faille corrigee :
--   20260710160000_create_missing_application_tables.sql
--     l.527-531 : policy subscriptions_update_own en `for update to authenticated`,
--                 sans aucune restriction de colonne.
--     l.698     : grant select, insert, update, delete ... to authenticated.
--
--   Consequence : tout utilisateur authentifie pouvait, avec la seule cle anon,
--   faire PATCH /rest/v1/subscriptions?user_id=eq.<son uid> et se donner
--   {"plan":"max","status":"active"}. Cela neutralisait le trigger de quota
--   enforce_document_plan_limit (qui lit la colonne falsifiee), la verification
--   serveur des recus Apple (apple-verify.ts) et le gating des edge functions.
--
-- Principe retenu : le plan d'un utilisateur est une donnee de facturation.
-- Elle n'est ecrite que par le backend, jamais par le porteur du droit.
--
-- Recensement effectue avant redaction (aucun appelant casse) :
--   - src/lib/supabase/subscriptions.ts:193 et son jumeau
--     website/src/lib/domain/supabase/subscriptions.ts:193 -> `select` uniquement.
--   - public.ensure_user_subscription() (20260711170000:129) est `security definer`
--     et contourne donc RLS et grants : l'auto-creation de la ligne d'abonnement
--     a la premiere connexion continue de fonctionner.
--   - Les 10 acces des edge functions (apple-confirm-subscription,
--     stripe-create-billing-portal, stripe-create-subscription-checkout,
--     _shared/subscription-sync.ts, _shared/entitlements.ts) utilisent tous
--     un client `service_role`, qui contourne la RLS.
--
-- RLS reste ACTIVEE. La lecture reste inchangee.
-- ---------------------------------------------------------------------------

-- 1. Retrait des policies d'ecriture ouvertes au role `authenticated`.
--    subscriptions_select_own est volontairement conservee.
drop policy if exists subscriptions_insert_own on public.subscriptions;
drop policy if exists subscriptions_update_own on public.subscriptions;
drop policy if exists subscriptions_delete_own on public.subscriptions;

-- 2. Retrait des privileges de table correspondants.
--    Sans grant, PostgREST refuse l'ecriture avant meme d'evaluer la RLS.
revoke insert, update, delete on public.subscriptions from authenticated;
revoke insert, update, delete on public.subscriptions from anon;

-- 3. La lecture reste explicitement autorisee.
grant select on public.subscriptions to authenticated;

-- 4. Le backend conserve l'ecriture complete.
grant select, insert, update, delete on public.subscriptions to service_role;

-- 5. Garantie : la RLS ne doit jamais etre desactivee sur cette table.
alter table public.subscriptions enable row level security;

comment on table public.subscriptions is
  'Abonnement par utilisateur. Lecture seule pour `authenticated` : le plan, le statut '
  'et les identifiants Stripe/Apple ne sont ecrits que par le backend (service_role) '
  'via les edge functions Stripe/Apple, ou par ensure_user_subscription() en security definer.';
