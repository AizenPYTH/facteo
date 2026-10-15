-- =============================================================================
-- Suivi d'utilisation d'INVEQ : espace administrateur « Activité utilisateurs ».
--
-- - platform_admins : administrateurs de la plateforme (pas les rôles d'une
--   entreprise). Ajout manuel, depuis le SQL editor, par l'équipe INVEQ.
-- - product_events : journal d'événements produit, sans contenu (ni audio, ni
--   transcription, ni contenu de facture). Aucun accès direct pour les
--   utilisateurs : écriture par trigger, par RPC contrôlée ou par la fonction
--   Edge vocale (service_role) ; lecture par les RPC admin uniquement.
--
-- Aucune donnée existante n'est modifiée. Les factures antérieures à cette
-- migration n'ont ni plateforme ni méthode de création connues : elles sont
-- présentées comme « inconnues », jamais devinées.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Administrateurs de la plateforme
-- -----------------------------------------------------------------------------

create table if not exists public.platform_admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;
revoke all on public.platform_admins from anon, authenticated;

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select auth.uid() is not null
    and exists (select 1 from public.platform_admins where user_id = auth.uid());
$$;

revoke all on function public.is_platform_admin() from public, anon;
grant execute on function public.is_platform_admin() to authenticated;

-- -----------------------------------------------------------------------------
-- Journal d'événements produit
-- -----------------------------------------------------------------------------

create table if not exists public.product_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  event_name text not null check (event_name in (
    'session_active',
    'invoice_created',
    'invoice_creation_method',
    'voice_invoice_started',
    'voice_invoice_transcription_completed',
    'voice_invoice_draft_generated',
    'voice_invoice_saved',
    'voice_invoice_failed'
  )),
  occurred_at timestamptz not null default now(),
  platform text not null default 'unknown' check (platform in ('web', 'ios', 'android', 'unknown')),
  -- Identifiant de tentative (création vocale) généré par le client.
  attempt_id uuid,
  invoice_id uuid references public.invoices (id) on delete set null,
  outcome text check (outcome in ('started', 'success', 'failure')),
  creation_method text check (creation_method in ('manual', 'voice', 'quote_conversion', 'ai_import', 'duplicate')),
  error_code text check (error_code ~ '^[a-z0-9_.:-]{1,64}$'),
  -- Qui a écrit l'événement : client (RPC), serveur (fonction Edge) ou trigger.
  source text not null check (source in ('client', 'server', 'trigger')),
  -- Clé de déduplication : un même fait n'est jamais compté deux fois.
  dedup_key text not null unique
);

create index if not exists product_events_name_time_idx
  on public.product_events (event_name, occurred_at desc);
create index if not exists product_events_user_time_idx
  on public.product_events (user_id, occurred_at desc);
create index if not exists product_events_invoice_idx
  on public.product_events (invoice_id) where invoice_id is not null;
create index if not exists product_events_attempt_idx
  on public.product_events (attempt_id) where attempt_id is not null;
-- Une tentative vocale ne produit qu'une seule facture comptée « vocale ».
create unique index if not exists product_events_voice_saved_attempt_uidx
  on public.product_events (attempt_id) where event_name = 'voice_invoice_saved';

alter table public.product_events enable row level security;
-- Aucune policy : ni lecture ni écriture directes pour anon / authenticated.
revoke all on public.product_events from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Plateforme de la requête, d'après l'en-tête envoyé par supabase-js
-- (« runtime=web » sur le site, « runtime=react-native » dans l'app iOS).
-- -----------------------------------------------------------------------------

create or replace function public.request_client_platform()
returns text
language plpgsql
stable
set search_path = public, pg_temp
as $$
declare
  v_headers json;
  v_info text;
begin
  begin
    v_headers := nullif(current_setting('request.headers', true), '')::json;
  exception when others then
    return 'unknown';
  end;

  v_info := lower(coalesce(v_headers ->> 'x-client-info', ''));

  -- L'app mobile n'est publiée que sur iOS.
  if v_info like '%runtime=react-native%' or v_info like 'supabase-js-react-native%' then
    return 'ios';
  end if;
  if v_info like '%runtime=web%' or v_info like 'supabase-js-web%' then
    return 'web';
  end if;
  return 'unknown';
end;
$$;

revoke all on function public.request_client_platform() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Chaque facture créée est journalisée côté base, quel que soit le client.
-- -----------------------------------------------------------------------------

create or replace function public.log_invoice_created()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  begin
    insert into public.product_events (
      user_id, event_name, occurred_at, platform, invoice_id, outcome, creation_method, source, dedup_key
    )
    values (
      new.user_id,
      'invoice_created',
      coalesce(new.created_at, now()),
      public.request_client_platform(),
      new.id,
      'success',
      -- Seule méthode connue côté base : la conversion d'un devis.
      case when new.quote_id is not null then 'quote_conversion' end,
      'trigger',
      'invoice_created:' || new.id
    )
    on conflict do nothing;
  exception when others then
    -- Le suivi ne doit jamais empêcher la création d'une facture.
    raise warning 'log_invoice_created: %', sqlerrm;
  end;
  return new;
end;
$$;

revoke all on function public.log_invoice_created() from public, anon, authenticated;

drop trigger if exists invoices_log_created on public.invoices;
create trigger invoices_log_created
  after insert on public.invoices
  for each row execute function public.log_invoice_created();

-- -----------------------------------------------------------------------------
-- Événements envoyés par les clients (site, app) : liste fermée, contrôles
-- côté base, utilisateur et horodatage imposés par le serveur.
-- -----------------------------------------------------------------------------

create or replace function public.track_product_event(
  p_event text,
  p_platform text default null,
  p_attempt_id uuid default null,
  p_invoice_id uuid default null,
  p_method text default null,
  p_error_code text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
  v_platform text;
  v_invoice_created timestamptz;
  v_draft_at timestamptz;
  v_rows integer := 0;
begin
  if v_user is null then
    return false;
  end if;

  v_platform := case
    when p_platform in ('web', 'ios', 'android') then p_platform
    else public.request_client_platform()
  end;

  -- Garde-fou : pas plus de 300 événements par utilisateur et par heure.
  if (
    select count(*) from public.product_events
    where user_id = v_user and occurred_at > now() - interval '1 hour'
  ) >= 300 then
    return false;
  end if;

  if p_event = 'session_active' then
    -- Une seule « présence » par utilisateur, plateforme et jour (UTC).
    insert into public.product_events (user_id, event_name, platform, source, dedup_key)
    values (
      v_user, 'session_active', v_platform, 'client',
      'active:' || v_user || ':' || v_platform || ':' || to_char(now() at time zone 'utc', 'YYYY-MM-DD')
    )
    on conflict do nothing;

  elsif p_event = 'voice_invoice_started' then
    if p_attempt_id is null then
      return false;
    end if;
    insert into public.product_events (user_id, event_name, platform, attempt_id, outcome, source, dedup_key)
    values (v_user, 'voice_invoice_started', v_platform, p_attempt_id, 'started', 'client',
            'voice_started:' || p_attempt_id)
    on conflict do nothing;

  elsif p_event = 'voice_invoice_failed' then
    if p_attempt_id is null then
      return false;
    end if;
    -- Une tentative déjà enregistrée en facture n'est plus un échec.
    if exists (
      select 1 from public.product_events
      where attempt_id = p_attempt_id and event_name = 'voice_invoice_saved'
    ) then
      return false;
    end if;
    insert into public.product_events (
      user_id, event_name, platform, attempt_id, outcome, error_code, source, dedup_key
    )
    values (
      v_user, 'voice_invoice_failed', v_platform, p_attempt_id, 'failure',
      case when p_error_code ~ '^[a-z0-9_.:-]{1,64}$' then p_error_code else 'unknown' end,
      'client', 'voice_failed:' || p_attempt_id
    )
    on conflict do nothing;

  elsif p_event = 'voice_invoice_saved' then
    -- Comptée « vocale » seulement si : la facture est à l'utilisateur, elle
    -- vient d'être créée, et le serveur a bien généré un brouillon vocal pour
    -- cette tentative avant sa création.
    if p_attempt_id is null or p_invoice_id is null then
      return false;
    end if;

    select created_at into v_invoice_created
    from public.invoices
    where id = p_invoice_id and user_id = v_user;

    if v_invoice_created is null or v_invoice_created < now() - interval '6 hours' then
      return false;
    end if;

    select min(occurred_at) into v_draft_at
    from public.product_events
    where attempt_id = p_attempt_id
      and user_id = v_user
      and event_name = 'voice_invoice_draft_generated'
      and source = 'server';

    if v_draft_at is null or v_invoice_created < v_draft_at - interval '1 minute' then
      return false;
    end if;

    insert into public.product_events (
      user_id, event_name, platform, attempt_id, invoice_id, outcome, creation_method, source, dedup_key
    )
    values (
      v_user, 'voice_invoice_saved', v_platform, p_attempt_id, p_invoice_id, 'success', 'voice', 'client',
      'voice_saved:' || p_invoice_id
    )
    on conflict do nothing;

  elsif p_event = 'invoice_creation_method' then
    -- Méthode déclarée par le client pour une facture qu'il vient de créer.
    -- La voix passe par voice_invoice_saved (vérifiée), jamais par ici.
    if p_invoice_id is null or p_method is null or p_method not in ('manual', 'ai_import', 'duplicate') then
      return false;
    end if;

    select created_at into v_invoice_created
    from public.invoices
    where id = p_invoice_id and user_id = v_user;

    if v_invoice_created is null or v_invoice_created < now() - interval '6 hours' then
      return false;
    end if;

    insert into public.product_events (
      user_id, event_name, platform, invoice_id, outcome, creation_method, source, dedup_key
    )
    values (
      v_user, 'invoice_creation_method', v_platform, p_invoice_id, 'success', p_method, 'client',
      'invoice_method:' || p_invoice_id
    )
    on conflict do nothing;

  else
    return false;
  end if;

  get diagnostics v_rows = row_count;
  return v_rows > 0;
end;
$$;

revoke all on function public.track_product_event(text, text, uuid, uuid, text, text) from public, anon;
grant execute on function public.track_product_event(text, text, uuid, uuid, text, text) to authenticated;

-- -----------------------------------------------------------------------------
-- Lecture réservée aux administrateurs de la plateforme
-- -----------------------------------------------------------------------------

create or replace function public.assert_platform_admin()
returns void
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Accès réservé aux administrateurs.' using errcode = '42501';
  end if;
end;
$$;

revoke all on function public.assert_platform_admin() from public, anon, authenticated;

-- Méthode de création d'une facture, sans jamais la deviner :
-- voix vérifiée > méthode déclarée > conversion de devis > inconnue.
create or replace function public.admin_invoice_creation_info()
returns table (
  invoice_id uuid,
  platform text,
  creation_method text,
  instrumented boolean
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select
    i.id,
    coalesce(created.platform, 'unknown'),
    case
      when voice.invoice_id is not null then 'voice'
      when declared.creation_method is not null then declared.creation_method
      when i.quote_id is not null then 'quote_conversion'
      else 'unknown'
    end,
    created.invoice_id is not null
  from public.invoices i
  left join lateral (
    select e.invoice_id, e.platform
    from public.product_events e
    where e.invoice_id = i.id and e.event_name = 'invoice_created'
    limit 1
  ) created on true
  left join lateral (
    select e.invoice_id
    from public.product_events e
    where e.invoice_id = i.id and e.event_name = 'voice_invoice_saved'
    limit 1
  ) voice on true
  left join lateral (
    select e.creation_method
    from public.product_events e
    where e.invoice_id = i.id and e.event_name = 'invoice_creation_method'
    limit 1
  ) declared on true;
$$;

revoke all on function public.admin_invoice_creation_info() from public, anon, authenticated;

-- Tableau de bord : indicateurs globaux.
create or replace function public.admin_activity_overview()
returns json
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_today timestamptz := date_trunc('day', now() at time zone 'Europe/Paris') at time zone 'Europe/Paris';
  v_result json;
begin
  perform public.assert_platform_admin();

  with activity as (
    select user_id, occurred_at as at from public.product_events
    union all
    select user_id, created_at from public.invoices
    union all
    select id, last_sign_in_at from auth.users where last_sign_in_at is not null
  ),
  info as (
    select * from public.admin_invoice_creation_info()
  ),
  voice as (
    select event_name, count(*) as total, count(distinct user_id) as users
    from public.product_events
    where event_name like 'voice_invoice_%'
    group by event_name
  ),
  voice_30d as (
    select event_name, count(*) as total
    from public.product_events
    where event_name like 'voice_invoice_%' and occurred_at > now() - interval '30 days'
    group by event_name
  ),
  last_invoice as (
    select i.id, i.number, i.created_at, i.user_id, u.email
    from public.invoices i
    left join auth.users u on u.id = i.user_id
    order by i.created_at desc
    limit 1
  )
  select json_build_object(
    'generated_at', now(),
    'tracking_since', (select min(occurred_at) from public.product_events where source = 'trigger'),
    'registered_users', (select count(*) from auth.users),
    'active_users_24h', (select count(distinct user_id) from activity where at > now() - interval '24 hours'),
    'active_users_7d', (select count(distinct user_id) from activity where at > now() - interval '7 days'),
    'active_users_30d', (select count(distinct user_id) from activity where at > now() - interval '30 days'),
    'invoices_total', (select count(*) from public.invoices),
    'invoices_today', (select count(*) from public.invoices where created_at >= v_today),
    'invoices_7d', (select count(*) from public.invoices where created_at > now() - interval '7 days'),
    'invoices_30d', (select count(*) from public.invoices where created_at > now() - interval '30 days'),
    'last_invoice', (select row_to_json(last_invoice) from last_invoice),
    'invoices_by_platform', (
      select json_object_agg(platform, total)
      from (select platform, count(*) as total from info group by platform) p
    ),
    'invoices_by_method', (
      select json_object_agg(creation_method, total)
      from (select creation_method, count(*) as total from info group by creation_method) m
    ),
    'users_with_invoice', (select count(distinct user_id) from public.invoices),
    'voice_users_saved', coalesce((select users from voice where event_name = 'voice_invoice_saved'), 0),
    'voice_users_tried', (
      select count(distinct user_id) from public.product_events
      where event_name in ('voice_invoice_started', 'voice_invoice_transcription_completed')
    ),
    'voice_totals', coalesce((select json_object_agg(event_name, total) from voice), '{}'::json),
    'voice_30d', coalesce((select json_object_agg(event_name, total) from voice_30d), '{}'::json),
    'voice_errors_30d', coalesce((
      select json_agg(json_build_object('error_code', error_code, 'total', total) order by total desc)
      from (
        select coalesce(error_code, 'unknown') as error_code, count(*) as total
        from public.product_events
        where event_name = 'voice_invoice_failed' and occurred_at > now() - interval '30 days'
        group by 1
        order by 2 desc
        limit 10
      ) errors
    ), '[]'::json)
  ) into v_result;

  return v_result;
end;
$$;

revoke all on function public.admin_activity_overview() from public, anon;
grant execute on function public.admin_activity_overview() to authenticated;

-- Historique des factures (sans montant, client ni contenu).
create or replace function public.admin_invoice_history(
  p_limit integer default 50,
  p_offset integer default 0,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_platform text default null,
  p_method text default null,
  p_user_id uuid default null
)
returns table (
  created_at timestamptz,
  invoice_id uuid,
  invoice_number text,
  user_id uuid,
  user_email text,
  platform text,
  creation_method text,
  deleted boolean,
  total_count bigint
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
begin
  perform public.assert_platform_admin();

  return query
  select
    i.created_at,
    i.id,
    i.number::text,
    i.user_id,
    u.email::text,
    info.platform,
    info.creation_method,
    i.deleted_at is not null,
    count(*) over ()
  from public.invoices i
  join public.admin_invoice_creation_info() info on info.invoice_id = i.id
  left join auth.users u on u.id = i.user_id
  where (p_from is null or i.created_at >= p_from)
    and (p_to is null or i.created_at < p_to)
    and (p_platform is null or info.platform = p_platform)
    and (p_method is null or info.creation_method = p_method)
    and (p_user_id is null or i.user_id = p_user_id)
  order by i.created_at desc
  limit least(greatest(coalesce(p_limit, 50), 1), 200)
  offset greatest(coalesce(p_offset, 0), 0);
end;
$$;

revoke all on function public.admin_invoice_history(integer, integer, timestamptz, timestamptz, text, text, uuid) from public, anon;
grant execute on function public.admin_invoice_history(integer, integer, timestamptz, timestamptz, text, text, uuid) to authenticated;

-- Activité par utilisateur sur une période (compteurs « période » et « total »).
create or replace function public.admin_user_activity(
  p_from timestamptz default null,
  p_to timestamptz default null
)
returns table (
  user_id uuid,
  user_email text,
  signed_up_at timestamptz,
  last_activity_at timestamptz,
  invoices_total bigint,
  invoices_in_period bigint,
  last_invoice_at timestamptz,
  voice_saved bigint,
  voice_failed bigint,
  last_voice_at timestamptz,
  platforms text[]
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
declare
  v_from timestamptz := coalesce(p_from, '-infinity'::timestamptz);
  v_to timestamptz := coalesce(p_to, 'infinity'::timestamptz);
begin
  perform public.assert_platform_admin();

  return query
  select
    u.id,
    u.email::text,
    u.created_at,
    greatest(
      u.last_sign_in_at,
      (select max(e.occurred_at) from public.product_events e where e.user_id = u.id),
      (select max(i.created_at) from public.invoices i where i.user_id = u.id)
    ),
    (select count(*) from public.invoices i where i.user_id = u.id),
    (select count(*) from public.invoices i
      where i.user_id = u.id and i.created_at >= v_from and i.created_at < v_to),
    (select max(i.created_at) from public.invoices i where i.user_id = u.id),
    (select count(*) from public.product_events e
      where e.user_id = u.id and e.event_name = 'voice_invoice_saved'
        and e.occurred_at >= v_from and e.occurred_at < v_to),
    (select count(*) from public.product_events e
      where e.user_id = u.id and e.event_name = 'voice_invoice_failed'
        and e.occurred_at >= v_from and e.occurred_at < v_to),
    (select max(e.occurred_at) from public.product_events e
      where e.user_id = u.id and e.event_name like 'voice_invoice_%'),
    coalesce((
      select array_agg(distinct e.platform order by e.platform)
      from public.product_events e
      where e.user_id = u.id and e.platform <> 'unknown'
    ), '{}'::text[])
  from auth.users u
  order by 4 desc nulls last;
end;
$$;

revoke all on function public.admin_user_activity(timestamptz, timestamptz) from public, anon;
grant execute on function public.admin_user_activity(timestamptz, timestamptz) to authenticated;

-- Journal d'un utilisateur, filtrable par période et type d'événement.
create or replace function public.admin_user_events(
  p_user_id uuid,
  p_from timestamptz default null,
  p_to timestamptz default null,
  p_event text default null,
  p_limit integer default 100
)
returns table (
  occurred_at timestamptz,
  event_name text,
  platform text,
  attempt_id uuid,
  invoice_id uuid,
  invoice_number text,
  outcome text,
  creation_method text,
  error_code text
)
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
#variable_conflict use_column
begin
  perform public.assert_platform_admin();

  return query
  select
    e.occurred_at,
    e.event_name,
    e.platform,
    e.attempt_id,
    e.invoice_id,
    i.number::text,
    e.outcome,
    e.creation_method,
    e.error_code
  from public.product_events e
  left join public.invoices i on i.id = e.invoice_id
  where e.user_id = p_user_id
    and (p_from is null or e.occurred_at >= p_from)
    and (p_to is null or e.occurred_at < p_to)
    and (p_event is null or e.event_name = p_event)
  order by e.occurred_at desc
  limit least(greatest(coalesce(p_limit, 100), 1), 500);
end;
$$;

revoke all on function public.admin_user_events(uuid, timestamptz, timestamptz, text, integer) from public, anon;
grant execute on function public.admin_user_events(uuid, timestamptz, timestamptz, text, integer) to authenticated;

comment on table public.product_events is
  'Événements produit (sans contenu). Écriture : trigger factures, RPC track_product_event, fonction Edge process-voice-command. Lecture : RPC admin_* (administrateurs).';
comment on table public.platform_admins is
  'Administrateurs de la plateforme INVEQ (accès à l''espace « Activité utilisateurs »).';
