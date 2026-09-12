-- ---------------------------------------------------------------------------
-- Intégrations e-commerce génériques (V1 : eBay) — Option A
--
-- Trois tables génériques + une vue de statut :
--   integrations             : une connexion OAuth par (company, provider). Jetons chiffrés.
--   integration_oauth_states : states OAuth à usage unique, liés company + user.
--   external_orders          : commandes importées, normalisées, anti-doublon.
--   integration_status       : projection publique SANS aucun jeton.
--
-- Sécurité :
--   * `integrations` et `integration_oauth_states` ne sont JAMAIS lisibles par
--     le rôle `authenticated` : RLS activée sans aucune policy + revoke explicite.
--     Seul le service role (Edge Functions) y accède.
--   * `external_orders` est lisible par les membres de l'entreprise via
--     user_has_company_access(). Aucune écriture directe : le rattachement
--     facture passe par link_external_order_invoice() qui garantit l'unicité.
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- integrations
-- ---------------------------------------------------------------------------

create table if not exists public.integrations (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  provider text not null check (provider ~ '^[a-z][a-z0-9_]{1,31}$'),
  environment text not null default 'production'
    check (environment in ('sandbox', 'production')),
  status text not null default 'disconnected'
    check (status in ('connected', 'disconnected', 'reauth_required', 'error')),
  external_account_id text,
  scopes text[] not null default '{}'::text[],
  access_token_encrypted text,
  access_token_expires_at timestamptz,
  refresh_token_encrypted text,
  refresh_token_expires_at timestamptz,
  connected_at timestamptz,
  connected_by uuid references auth.users (id) on delete set null,
  last_sync_at timestamptz,
  last_sync_error text,
  -- Curseur de synchronisation incrémentale (eBay : filtre lastmodifieddate).
  last_synced_modified_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint integrations_company_provider_key unique (company_id, provider)
);

comment on table public.integrations is
  'Connexions OAuth aux plateformes externes (eBay…). Jetons chiffrés AES-GCM côté application. Service role uniquement.';
comment on column public.integrations.access_token_encrypted is
  'AES-GCM (iv||ciphertext) base64. Ne doit jamais être exposé au frontend ni journalisé.';
comment on column public.integrations.last_synced_modified_at is
  'Borne haute de la dernière synchronisation réussie (eBay Order.lastModifiedDate). Sert au filtre incrémental.';

create index if not exists integrations_company_id_idx on public.integrations (company_id);
create index if not exists integrations_status_idx on public.integrations (status);

alter table public.integrations enable row level security;
-- Aucune policy : service role uniquement.

-- ---------------------------------------------------------------------------
-- integration_oauth_states
-- ---------------------------------------------------------------------------

create table if not exists public.integration_oauth_states (
  state text primary key,
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider ~ '^[a-z][a-z0-9_]{1,31}$'),
  environment text not null default 'production'
    check (environment in ('sandbox', 'production')),
  redirect_to text,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.integration_oauth_states is
  'States OAuth à usage unique. Portent la liaison company + user : c''est la seule protection du callback, qui est public côté JWT.';

create index if not exists integration_oauth_states_expires_at_idx
  on public.integration_oauth_states (expires_at);
create index if not exists integration_oauth_states_company_id_idx
  on public.integration_oauth_states (company_id);

alter table public.integration_oauth_states enable row level security;
-- Aucune policy : service role uniquement.

-- ---------------------------------------------------------------------------
-- external_orders
-- ---------------------------------------------------------------------------

create table if not exists public.external_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  provider text not null check (provider ~ '^[a-z][a-z0-9_]{1,31}$'),
  environment text not null default 'production'
    check (environment in ('sandbox', 'production')),
  external_order_id text not null,
  legacy_order_id text,
  order_reference text,
  order_created_at timestamptz,
  order_modified_at timestamptz,
  fulfillment_status text,
  payment_status text,
  currency text,
  subtotal_amount numeric(14, 2),
  shipping_amount numeric(14, 2),
  discount_amount numeric(14, 2),
  tax_amount numeric(14, 2),
  total_amount numeric(14, 2),
  -- TVA/taxe collectée ET reversée par la marketplace (eBay Collect & Remit).
  marketplace_tax_amount numeric(14, 2) not null default 0,
  collect_and_remit boolean not null default false,
  buyer_username text,
  -- Figé à l'import : les PII acheteur disparaissent de l'API eBay
  -- (e-mail à 14 jours, nom/rue à 90 jours). Ne jamais re-dériver depuis l'API.
  buyer_snapshot jsonb not null default '{}'::jsonb,
  line_items jsonb not null default '[]'::jsonb,
  marketplace_ids text[] not null default '{}'::text[],
  invoice_id uuid references public.invoices (id) on delete set null,
  invoiced_at timestamptz,
  imported_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  constraint external_orders_provider_order_key
    unique (company_id, provider, external_order_id)
);

comment on table public.external_orders is
  'Commandes importées depuis une marketplace. Anti-doublon : unique (company_id, provider, external_order_id).';
comment on column public.external_orders.buyer_snapshot is
  'Copie figée des données acheteur au moment de l''import. Contient uniquement ce qui sert à facturer (nom, société, adresse, e-mail). Ni téléphone, ni identifiant fiscal, ni notes de commande.';
comment on column public.external_orders.marketplace_tax_amount is
  'Montant de taxe collectée ET reversée par la marketplace. Si > 0, INVEQ ne doit pas ajouter de TVA vendeur sans validation explicite.';

create index if not exists external_orders_company_provider_idx
  on public.external_orders (company_id, provider);
create index if not exists external_orders_order_created_at_idx
  on public.external_orders (company_id, order_created_at desc);
create index if not exists external_orders_uninvoiced_idx
  on public.external_orders (company_id, provider)
  where invoice_id is null;

-- Une facture INVEQ ne peut être rattachée qu'à une seule commande externe.
create unique index if not exists external_orders_invoice_id_uidx
  on public.external_orders (invoice_id)
  where invoice_id is not null;

alter table public.external_orders enable row level security;

drop policy if exists external_orders_select on public.external_orders;
create policy external_orders_select on public.external_orders
  for select
  to authenticated
  using (public.user_has_company_access(company_id));

-- Pas de policy insert/update/delete : l'import passe par le service role,
-- le rattachement facture par link_external_order_invoice().

grant select on public.external_orders to authenticated;

-- ---------------------------------------------------------------------------
-- Vue de statut : aucun jeton, filtrée par appartenance
-- ---------------------------------------------------------------------------

create or replace view public.integration_status as
select
  i.id,
  i.company_id,
  i.provider,
  i.environment,
  i.status,
  i.external_account_id,
  i.scopes,
  i.connected_at,
  i.last_sync_at,
  i.last_sync_error,
  i.last_synced_modified_at,
  i.access_token_expires_at,
  i.refresh_token_expires_at,
  -- La vue ne référence AUCUNE colonne de jeton, même pour un test de nullité :
  -- les dates d'expiration suffisent et sont écrites/effacées avec les jetons.
  (
    i.refresh_token_expires_at is not null
    and i.refresh_token_expires_at <= timezone('utc', now())
  ) as refresh_token_expired,
  (
    select count(*)
    from public.external_orders o
    where o.company_id = i.company_id and o.provider = i.provider
  ) as orders_imported,
  (
    select count(*)
    from public.external_orders o
    where o.company_id = i.company_id and o.provider = i.provider and o.invoice_id is null
  ) as orders_pending_invoice,
  i.created_at,
  i.updated_at
from public.integrations i
where public.user_has_company_access(i.company_id);

comment on view public.integration_status is
  'Projection publique des intégrations : aucun jeton, aucun secret. Les compteurs sont calculés sur external_orders (jamais de valeur de démonstration).';

grant select on public.integration_status to authenticated;

-- ---------------------------------------------------------------------------
-- RPC : rattacher une facture à une commande importée (atomique, une seule fois)
-- ---------------------------------------------------------------------------

create or replace function public.link_external_order_invoice(
  p_external_order_id uuid,
  p_invoice_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_existing_invoice uuid;
begin
  select company_id, invoice_id
    into v_company_id, v_existing_invoice
  from public.external_orders
  where id = p_external_order_id
  for update;

  if v_company_id is null then
    raise exception 'external_order_not_found' using errcode = 'no_data_found';
  end if;

  if not public.user_has_company_access(v_company_id) then
    raise exception 'forbidden_company_access' using errcode = 'insufficient_privilege';
  end if;

  if v_existing_invoice is not null then
    if v_existing_invoice = p_invoice_id then
      return;
    end if;
    raise exception 'external_order_already_invoiced' using errcode = 'unique_violation';
  end if;

  if not exists (
    select 1
    from public.invoices inv
    where inv.id = p_invoice_id
      and inv.company_id = v_company_id
  ) then
    raise exception 'invoice_not_found_for_company' using errcode = 'no_data_found';
  end if;

  update public.external_orders
     set invoice_id = p_invoice_id,
         invoiced_at = timezone('utc', now()),
         updated_at = timezone('utc', now())
   where id = p_external_order_id
     and invoice_id is null;

  if not found then
    raise exception 'external_order_already_invoiced' using errcode = 'unique_violation';
  end if;
end;
$$;

revoke all on function public.link_external_order_invoice(uuid, uuid) from public;
grant execute on function public.link_external_order_invoice(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- RPC : déconnecter une intégration (efface les jetons, garde les commandes)
-- ---------------------------------------------------------------------------

create or replace function public.disconnect_integration(
  p_company_id uuid,
  p_provider text
)
returns void
language plpgsql
volatile
security definer
set search_path = public
as $$
begin
  if not public.user_has_company_access(p_company_id) then
    raise exception 'forbidden_company_access' using errcode = 'insufficient_privilege';
  end if;

  update public.integrations
     set status = 'disconnected',
         access_token_encrypted = null,
         access_token_expires_at = null,
         refresh_token_encrypted = null,
         refresh_token_expires_at = null,
         last_sync_error = null,
         updated_at = timezone('utc', now())
   where company_id = p_company_id
     and provider = p_provider;
end;
$$;

revoke all on function public.disconnect_integration(uuid, text) from public;
grant execute on function public.disconnect_integration(uuid, text) to authenticated;

-- ---------------------------------------------------------------------------
-- Purge des states OAuth expirés (appelée par les Edge Functions)
-- ---------------------------------------------------------------------------

create or replace function public.purge_expired_integration_oauth_states()
returns void
language sql
volatile
security definer
set search_path = public
as $$
  delete from public.integration_oauth_states
  where expires_at < timezone('utc', now()) - interval '1 hour';
$$;

revoke all on function public.purge_expired_integration_oauth_states() from public;

-- ---------------------------------------------------------------------------
-- Verrouillage : aucun accès direct aux tables portant des secrets
-- ---------------------------------------------------------------------------

do $$
begin
  revoke all on table public.integrations from authenticated, anon;
  revoke all on table public.integration_oauth_states from authenticated, anon;
exception
  when undefined_object then null;
end $$;
