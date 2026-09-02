-- SUPER PDP e-invoicing (multi-tenant)
-- Tokens are never exposed to authenticated clients (service-role only on secret table).
-- Public status is available via company_superpdp_connection_status view + RLS.

-- ---------------------------------------------------------------------------
-- Company fields needed for French e-invoicing / SUPER PDP company profile
-- ---------------------------------------------------------------------------

alter table public.companies
  add column if not exists siren text,
  add column if not exists has_vat_on_debits boolean not null default false,
  add column if not exists vat_regime text
    check (
      vat_regime is null
      or vat_regime in ('monthly', 'quarterly', 'simplified', 'vat_exemption')
    );

comment on column public.companies.siren is 'SIREN (9 digits). Prefer explicit value; can be derived from SIRET.';
comment on column public.companies.has_vat_on_debits is 'Option TVA sur les débits (SUPER PDP has_vat_on_debits).';
comment on column public.companies.vat_regime is 'Régime TVA SUPER PDP: monthly|quarterly|simplified|vat_exemption.';

-- ---------------------------------------------------------------------------
-- Invoice electronic lifecycle (additive; classic PDF statuses unchanged)
-- ---------------------------------------------------------------------------

alter table public.invoices
  add column if not exists electronic_invoice_status text
    check (
      electronic_invoice_status is null
      or electronic_invoice_status in (
        'draft',
        'ready',
        'submitted',
        'accepted',
        'rejected',
        'delivered',
        'received',
        'paid',
        'cancelled',
        'error'
      )
    ),
  add column if not exists superpdp_invoice_id bigint,
  add column if not exists superpdp_external_id text,
  add column if not exists electronic_invoice_format text
    check (
      electronic_invoice_format is null
      or electronic_invoice_format in ('cii', 'ubl', 'factur-x', 'en16931')
    ),
  add column if not exists electronic_invoice_sent_at timestamptz,
  add column if not exists electronic_invoice_received_at timestamptz,
  add column if not exists electronic_invoice_last_error text,
  add column if not exists electronic_invoice_updated_at timestamptz,
  add column if not exists electronic_buyer_address text,
  add column if not exists delivery_address text,
  add column if not exists delivery_postal_code text,
  add column if not exists delivery_city text,
  add column if not exists delivery_country text,
  add column if not exists operation_category text;

create unique index if not exists invoices_company_superpdp_invoice_id_uidx
  on public.invoices (company_id, superpdp_invoice_id)
  where superpdp_invoice_id is not null and company_id is not null;

create unique index if not exists invoices_company_superpdp_external_id_uidx
  on public.invoices (company_id, superpdp_external_id)
  where superpdp_external_id is not null and company_id is not null;

comment on column public.invoices.electronic_invoice_status is
  'INVEQ-normalized e-invoice status. See docs/super-pdp.md mapping from SUPER PDP api:*/fr:* events.';
comment on column public.invoices.superpdp_external_id is
  'Idempotency key sent as SUPER PDP external_id (max 36). Usually invoices.id.';

-- ---------------------------------------------------------------------------
-- OAuth CSRF states (one-time, company-bound)
-- ---------------------------------------------------------------------------

create table if not exists public.superpdp_oauth_states (
  id uuid primary key default gen_random_uuid(),
  state text not null unique,
  company_id uuid not null references public.companies (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  redirect_to text,
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists superpdp_oauth_states_company_id_idx
  on public.superpdp_oauth_states (company_id);
create index if not exists superpdp_oauth_states_expires_at_idx
  on public.superpdp_oauth_states (expires_at);

alter table public.superpdp_oauth_states enable row level security;

-- No policies for authenticated/anon: service role only.

-- ---------------------------------------------------------------------------
-- Per-company SUPER PDP connection (tokens encrypted at application layer)
-- ---------------------------------------------------------------------------

create table if not exists public.company_superpdp_connections (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null unique references public.companies (id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'connected', 'needs_review', 'failed', 'disconnected')),
  remote_company_id bigint,
  remote_company_number text,
  remote_company_name text,
  remote_env text check (remote_env is null or remote_env in ('sandbox', 'production')),
  company_verification_status text
    check (
      company_verification_status is null
      or company_verification_status in ('verified', 'needs_review', 'failed')
    ),
  access_token_encrypted text not null,
  refresh_token_encrypted text not null,
  token_expires_at timestamptz not null,
  scopes text[] not null default '{}'::text[],
  directory_registered boolean,
  emission_enabled boolean not null default true,
  reception_enabled boolean not null default true,
  connected_at timestamptz,
  last_sync_at timestamptz,
  last_error text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists company_superpdp_connections_status_idx
  on public.company_superpdp_connections (status);

alter table public.company_superpdp_connections enable row level security;

-- No direct client access to token columns.

-- Safe status projection: no tokens. Filtered by membership via auth.uid().
-- View owner reads the base table; user_has_company_access() still sees caller auth.uid().
create or replace view public.company_superpdp_connection_status as
select
  c.id,
  c.company_id,
  c.status,
  c.remote_company_id,
  c.remote_company_number,
  c.remote_company_name,
  c.remote_env,
  c.company_verification_status,
  c.scopes,
  c.directory_registered,
  c.emission_enabled,
  c.reception_enabled,
  c.connected_at,
  c.last_sync_at,
  c.last_error,
  c.token_expires_at,
  c.created_at,
  c.updated_at
from public.company_superpdp_connections c
where public.user_has_company_access(c.company_id);

grant select on public.company_superpdp_connection_status to authenticated;

create or replace function public.get_company_superpdp_connection_status(p_company_id uuid)
returns table (
  id uuid,
  company_id uuid,
  status text,
  remote_company_id bigint,
  remote_company_number text,
  remote_company_name text,
  remote_env text,
  company_verification_status text,
  scopes text[],
  directory_registered boolean,
  emission_enabled boolean,
  reception_enabled boolean,
  connected_at timestamptz,
  last_sync_at timestamptz,
  last_error text,
  token_expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    c.id,
    c.company_id,
    c.status,
    c.remote_company_id,
    c.remote_company_number,
    c.remote_company_name,
    c.remote_env,
    c.company_verification_status,
    c.scopes,
    c.directory_registered,
    c.emission_enabled,
    c.reception_enabled,
    c.connected_at,
    c.last_sync_at,
    c.last_error,
    c.token_expires_at,
    c.created_at,
    c.updated_at
  from public.company_superpdp_connections c
  where c.company_id = p_company_id
    and public.user_has_company_access(p_company_id);
$$;

revoke all on function public.get_company_superpdp_connection_status(uuid) from public;
grant execute on function public.get_company_superpdp_connection_status(uuid) to authenticated;

do $$
begin
  revoke all on table public.company_superpdp_connections from authenticated, anon;
  revoke all on table public.superpdp_oauth_states from authenticated, anon;
exception
  when undefined_object then null;
end $$;

-- ---------------------------------------------------------------------------
-- Received e-invoices (inbound). Not auto-marked as paid.
-- ---------------------------------------------------------------------------

create table if not exists public.superpdp_received_invoices (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  superpdp_invoice_id bigint not null,
  supplier_name text,
  supplier_number text,
  invoice_number text,
  issue_date date,
  currency text not null default 'EUR',
  subtotal_ht numeric(14, 2),
  total_vat numeric(14, 2),
  total_ttc numeric(14, 2),
  latest_status_code text,
  electronic_invoice_status text,
  received_at timestamptz,
  document_content_type text,
  structured_payload jsonb,
  raw_events jsonb not null default '[]'::jsonb,
  imported_at timestamptz,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now()),
  unique (company_id, superpdp_invoice_id)
);

create index if not exists superpdp_received_invoices_company_id_idx
  on public.superpdp_received_invoices (company_id, received_at desc);

alter table public.superpdp_received_invoices enable row level security;

create policy superpdp_received_invoices_select_member
  on public.superpdp_received_invoices
  for select
  to authenticated
  using (public.user_has_company_access(company_id));

-- Writes only via service role (edge functions).

-- ---------------------------------------------------------------------------
-- Webhook / sync event log (idempotent)
-- ---------------------------------------------------------------------------

create table if not exists public.superpdp_webhook_events (
  id uuid primary key default gen_random_uuid(),
  company_id uuid references public.companies (id) on delete set null,
  event_key text not null,
  source text not null default 'webhook'
    check (source in ('webhook', 'poll', 'manual')),
  payload jsonb not null,
  headers jsonb,
  signature_valid boolean,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default timezone('utc', now()),
  unique (event_key)
);

create index if not exists superpdp_webhook_events_company_id_idx
  on public.superpdp_webhook_events (company_id, created_at desc);

alter table public.superpdp_webhook_events enable row level security;

-- Service role only for webhook events (contains operational payloads).
revoke all on table public.superpdp_webhook_events from authenticated, anon;

-- ---------------------------------------------------------------------------
-- Directory lookup cache (optional UX; no secrets)
-- ---------------------------------------------------------------------------

create table if not exists public.superpdp_directory_lookups (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  siren text not null,
  is_registered boolean not null default false,
  active_identifiers text[] not null default '{}'::text[],
  raw_result jsonb,
  looked_up_at timestamptz not null default timezone('utc', now()),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists superpdp_directory_lookups_company_siren_idx
  on public.superpdp_directory_lookups (company_id, siren, looked_up_at desc);

alter table public.superpdp_directory_lookups enable row level security;

create policy superpdp_directory_lookups_select_member
  on public.superpdp_directory_lookups
  for select
  to authenticated
  using (public.user_has_company_access(company_id));

create policy superpdp_directory_lookups_insert_member
  on public.superpdp_directory_lookups
  for insert
  to authenticated
  with check (public.user_has_company_access(company_id));
