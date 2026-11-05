-- =============================================================================
-- Relances automatiques des factures impayées.
--
-- Calendrier : 3 jours avant l'échéance, le jour de l'échéance, puis 7 et
-- 15 jours après. Chaque étape s'active ou se désactive, avec un message
-- personnalisable. Relance manuelle possible (au plus une par 24 h).
--
-- Règles (vérifiées en base, au moment de l'envoi) :
-- - jamais de relance pour une facture payée, annulée, supprimée, en
--   brouillon, sans e-mail client ou déjà réglée par paiements partiels ;
-- - une étape n'est envoyée qu'une fois par facture (index unique) ;
-- - une étape plus ancienne n'est jamais envoyée après une plus récente ;
-- - une facture échue depuis plus de 45 jours n'est plus relancée
--   automatiquement (rien ne part en rafale à l'activation) ;
-- - relances coupées par entreprise ou par facture.
--
-- L'historique (`invoice_reminders`) garde chaque envoi et chaque échec.
-- Aucune facture existante n'est modifiée (nouvelle colonne à `true`).
-- =============================================================================

create table if not exists public.reminder_settings (
  company_id uuid primary key references public.companies (id) on delete cascade,
  enabled boolean not null default false,
  before_due_enabled boolean not null default true,
  due_enabled boolean not null default true,
  after_7_enabled boolean not null default true,
  after_15_enabled boolean not null default true,
  include_payment_link boolean not null default true,
  -- Messages personnalisés : { "before_due": { "subject": "…", "body": "…" }, … }
  templates jsonb not null default '{}'::jsonb check (jsonb_typeof(templates) = 'object' and pg_column_size(templates) < 40000),
  updated_at timestamptz not null default timezone('utc', now()),
  updated_by uuid
);

alter table public.reminder_settings enable row level security;

drop policy if exists reminder_settings_select_member on public.reminder_settings;
create policy reminder_settings_select_member on public.reminder_settings
  for select to authenticated using (public.user_has_company_access(company_id));

drop policy if exists reminder_settings_insert_member on public.reminder_settings;
create policy reminder_settings_insert_member on public.reminder_settings
  for insert to authenticated with check (public.user_has_company_access(company_id));

drop policy if exists reminder_settings_update_member on public.reminder_settings;
create policy reminder_settings_update_member on public.reminder_settings
  for update to authenticated
  using (public.user_has_company_access(company_id))
  with check (public.user_has_company_access(company_id));

revoke delete on public.reminder_settings from anon, authenticated;

alter table public.invoices
  add column if not exists reminders_enabled boolean not null default true;

create table if not exists public.invoice_reminders (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  company_id uuid,
  user_id uuid not null,
  stage text not null check (stage in ('before_due', 'due', 'after_7', 'after_15', 'manual')),
  status text not null default 'pending' check (status in ('pending', 'sent', 'failed')),
  recipient_email text,
  subject text,
  body text,
  amount_due numeric(12, 2),
  provider_message_id text,
  error text,
  triggered_by uuid,
  created_at timestamptz not null default timezone('utc', now()),
  sent_at timestamptz
);

create index if not exists invoice_reminders_invoice_idx on public.invoice_reminders (invoice_id, created_at desc);
-- Une étape automatique n'est envoyée qu'une fois (un échec peut être retenté).
create unique index if not exists invoice_reminders_one_per_stage
  on public.invoice_reminders (invoice_id, stage)
  where stage <> 'manual' and status in ('pending', 'sent');

alter table public.invoice_reminders enable row level security;

drop policy if exists invoice_reminders_select_member on public.invoice_reminders;
create policy invoice_reminders_select_member on public.invoice_reminders
  for select to authenticated
  using (user_id = auth.uid() or (company_id is not null and public.user_has_company_access(company_id)));

revoke insert, update, delete on public.invoice_reminders from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Ce qui reste dû et l'étape de relance du jour
-- -----------------------------------------------------------------------------

create or replace function public.invoice_amount_due(p_invoice_id uuid)
returns numeric
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select greatest(
    round(i.total_ttc - coalesce((select sum(p.amount) from public.invoice_payments p where p.invoice_id = i.id), 0), 2),
    0
  )
  from public.invoices i where i.id = p_invoice_id;
$$;

revoke all on function public.invoice_amount_due(uuid) from public, anon;
grant execute on function public.invoice_amount_due(uuid) to authenticated, service_role;

create or replace function public.reminder_stage_for(p_days_after_due integer)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select case
    when p_days_after_due between -3 and -1 then 'before_due'
    when p_days_after_due between 0 and 6 then 'due'
    when p_days_after_due between 7 and 14 then 'after_7'
    when p_days_after_due between 15 and 45 then 'after_15'
  end;
$$;

create or replace function public.reminder_stage_rank(p_stage text)
returns integer
language sql
immutable
set search_path = public, pg_temp
as $$
  select case p_stage when 'before_due' then 1 when 'due' then 2 when 'after_7' then 3 when 'after_15' then 4 else 0 end;
$$;

-- Facture relançable ? null si oui, sinon le motif.
create or replace function public.invoice_reminder_block_reason(p_invoice_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select case
    when i.id is null then 'INVOICE_NOT_FOUND'
    when i.deleted_at is not null then 'INVOICE_DELETED'
    when i.document_kind <> 'invoice' then 'NOT_AN_INVOICE'
    when i.status = 'canceled' then 'INVOICE_CANCELED'
    when i.status = 'paid' then 'INVOICE_PAID'
    when i.status = 'draft' then 'INVOICE_DRAFT'
    when public.invoice_amount_due(i.id) <= 0.01 then 'INVOICE_PAID'
    when cl.email is null or cl.email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$' then 'CLIENT_EMAIL_MISSING'
  end
  from (select p_invoice_id as id) x
  left join public.invoices i on i.id = x.id
  left join public.clients cl on cl.id = i.client_id;
$$;

revoke all on function public.invoice_reminder_block_reason(uuid) from public, anon;
grant execute on function public.invoice_reminder_block_reason(uuid) to authenticated, service_role;

-- -----------------------------------------------------------------------------
-- Réservation des relances (serveur uniquement)
--
-- La relance est d'abord enregistrée « en cours » (l'index unique empêche
-- tout doublon), puis envoyée, puis marquée envoyée ou en échec.
-- -----------------------------------------------------------------------------

create or replace function public.claim_due_invoice_reminders(p_limit integer default 200)
returns table (
  reminder_id uuid,
  invoice_id uuid,
  stage text
)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_row record;
  v_id uuid;
  v_count integer := 0;
begin
  for v_row in
    select i.id as invoice_id, i.user_id, i.company_id, s.stage
    from public.invoices i
    join public.reminder_settings rs on rs.company_id = i.company_id and rs.enabled
    cross join lateral (
      select public.reminder_stage_for(public.paris_today() - (timezone('Europe/Paris', i.due_at))::date) as stage
    ) s
    where i.document_kind = 'invoice'
      and i.deleted_at is null
      and i.reminders_enabled
      and i.status in ('sent', 'overdue', 'partially_paid')
      and i.due_at is not null
      and s.stage is not null
      and case s.stage
        when 'before_due' then rs.before_due_enabled
        when 'due' then rs.due_enabled
        when 'after_7' then rs.after_7_enabled
        when 'after_15' then rs.after_15_enabled
      end
      and public.invoice_reminder_block_reason(i.id) is null
      -- Jamais deux fois la même étape, jamais une étape plus ancienne qu'une étape déjà envoyée.
      and not exists (
        select 1 from public.invoice_reminders r
        where r.invoice_id = i.id and r.stage <> 'manual' and r.status in ('pending', 'sent')
          and public.reminder_stage_rank(r.stage) >= public.reminder_stage_rank(s.stage)
      )
      -- Trois échecs pour une étape : on arrête de réessayer.
      and (
        select count(*) from public.invoice_reminders r
        where r.invoice_id = i.id and r.stage = s.stage and r.status = 'failed'
      ) < 3
    order by i.due_at
    limit greatest(coalesce(p_limit, 200), 1)
  loop
    insert into public.invoice_reminders (invoice_id, company_id, user_id, stage, status, amount_due)
    values (v_row.invoice_id, v_row.company_id, v_row.user_id, v_row.stage, 'pending', public.invoice_amount_due(v_row.invoice_id))
    on conflict do nothing
    returning id into v_id;

    if v_id is not null then
      reminder_id := v_id;
      invoice_id := v_row.invoice_id;
      stage := v_row.stage;
      v_count := v_count + 1;
      return next;
    end if;
  end loop;
end;
$$;

revoke all on function public.claim_due_invoice_reminders(integer) from public, anon, authenticated;
grant execute on function public.claim_due_invoice_reminders(integer) to service_role;

-- Relance manuelle : au plus une toutes les 24 heures par facture.
create or replace function public.claim_manual_invoice_reminder(p_invoice_id uuid, p_actor uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invoice public.invoices%rowtype;
  v_reason text;
  v_id uuid;
begin
  select * into v_invoice from public.invoices where id = p_invoice_id for update;

  if v_invoice.id is null or p_actor is null or not (
    v_invoice.user_id = p_actor
    or exists (select 1 from public.company_members m where m.company_id = v_invoice.company_id and m.user_id = p_actor)
  ) then
    raise exception 'Unauthorized';
  end if;

  v_reason := public.invoice_reminder_block_reason(p_invoice_id);
  if v_reason is not null then
    raise exception '%', v_reason;
  end if;

  if exists (
    select 1 from public.invoice_reminders r
    where r.invoice_id = p_invoice_id and r.status in ('pending', 'sent')
      and r.created_at > timezone('utc', now()) - interval '24 hours'
  ) then
    raise exception 'REMINDER_TOO_SOON';
  end if;

  insert into public.invoice_reminders (invoice_id, company_id, user_id, stage, status, amount_due, triggered_by)
  values (p_invoice_id, v_invoice.company_id, v_invoice.user_id, 'manual', 'pending', public.invoice_amount_due(p_invoice_id), p_actor)
  returning id into v_id;

  return v_id;
end;
$$;

revoke all on function public.claim_manual_invoice_reminder(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_manual_invoice_reminder(uuid, uuid) to service_role;

-- Tout ce qu'il faut pour écrire l'e-mail d'une relance réservée.
create or replace function public.invoice_reminder_payload(p_reminder_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'reminder_id', r.id,
    'stage', r.stage,
    'invoice_id', i.id,
    'user_id', i.user_id,
    'company_id', i.company_id,
    'number', i.number,
    'total_ttc', i.total_ttc,
    'amount_due', public.invoice_amount_due(i.id),
    'due_at', i.due_at,
    'issued_at', i.issued_at,
    'stripe_payment_link', case when i.status in ('sent', 'overdue', 'partially_paid') then i.stripe_payment_link end,
    'client_email', cl.email,
    'client_name', cl.name,
    'client_company', cl.company,
    'company_name', c.name,
    'company_email', c.email,
    'include_payment_link', coalesce(rs.include_payment_link, true),
    'templates', coalesce(rs.templates, '{}'::jsonb),
    'block_reason', public.invoice_reminder_block_reason(i.id)
  )
  from public.invoice_reminders r
  join public.invoices i on i.id = r.invoice_id
  left join public.clients cl on cl.id = i.client_id
  left join public.companies c on c.id = i.company_id
  left join public.reminder_settings rs on rs.company_id = i.company_id
  where r.id = p_reminder_id;
$$;

revoke all on function public.invoice_reminder_payload(uuid) from public, anon, authenticated;
grant execute on function public.invoice_reminder_payload(uuid) to service_role;

create or replace function public.complete_invoice_reminder(
  p_reminder_id uuid,
  p_status text,
  p_recipient text,
  p_subject text,
  p_body text,
  p_provider_message_id text,
  p_error text
)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if p_status not in ('sent', 'failed') then
    raise exception 'STATUS_INVALID';
  end if;
  update public.invoice_reminders
  set status = p_status,
      recipient_email = left(p_recipient, 254),
      subject = left(p_subject, 300),
      body = left(p_body, 10000),
      provider_message_id = left(p_provider_message_id, 200),
      error = left(p_error, 1000),
      sent_at = case when p_status = 'sent' then timezone('utc', now()) end
  where id = p_reminder_id and status = 'pending';
end;
$$;

revoke all on function public.complete_invoice_reminder(uuid, text, text, text, text, text, text) from public, anon, authenticated;
grant execute on function public.complete_invoice_reminder(uuid, text, text, text, text, text, text) to service_role;

-- Relances restées « en cours » (fonction interrompue) : libérées au bout d'une heure.
create or replace function public.release_stale_invoice_reminders()
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  update public.invoice_reminders
  set status = 'failed', error = coalesce(error, 'Envoi interrompu.')
  where status = 'pending' and created_at < timezone('utc', now()) - interval '1 hour';
  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.release_stale_invoice_reminders() from public, anon, authenticated;
grant execute on function public.release_stale_invoice_reminders() to service_role;

-- -----------------------------------------------------------------------------
-- Prochaine relance prévue (affichage)
-- -----------------------------------------------------------------------------

create or replace function public.invoice_next_reminder(p_invoice_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_invoice public.invoices%rowtype;
  v_settings public.reminder_settings%rowtype;
  v_due date;
  v_stage record;
  v_reason text;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;
  select * into v_invoice from public.invoices where id = p_invoice_id;
  if v_invoice.id is null or not (v_invoice.user_id = auth.uid() or public.user_has_company_access(v_invoice.company_id)) then
    raise exception 'Unauthorized';
  end if;

  select * into v_settings from public.reminder_settings where company_id = v_invoice.company_id;
  v_reason := public.invoice_reminder_block_reason(p_invoice_id);

  if v_reason is null and coalesce(v_settings.enabled, false) is not true then
    v_reason := 'REMINDERS_DISABLED';
  elsif v_reason is null and not v_invoice.reminders_enabled then
    v_reason := 'INVOICE_REMINDERS_DISABLED';
  elsif v_reason is null and v_invoice.due_at is null then
    v_reason := 'NO_DUE_DATE';
  end if;

  if v_reason is not null then
    return jsonb_build_object('next_stage', null, 'next_date', null, 'reason', v_reason);
  end if;

  v_due := (timezone('Europe/Paris', v_invoice.due_at))::date;
  for v_stage in
    select * from (values ('before_due', -3, v_settings.before_due_enabled), ('due', 0, v_settings.due_enabled),
                          ('after_7', 7, v_settings.after_7_enabled), ('after_15', 15, v_settings.after_15_enabled)) t(stage, offset_days, enabled)
  loop
    continue when not v_stage.enabled;
    continue when exists (
      select 1 from public.invoice_reminders r
      where r.invoice_id = p_invoice_id and r.stage <> 'manual' and r.status in ('pending', 'sent')
        and public.reminder_stage_rank(r.stage) >= public.reminder_stage_rank(v_stage.stage)
    );
    -- Fenêtre de l'étape encore ouverte ?
    continue when public.paris_today() - v_due > case v_stage.stage when 'before_due' then -1 when 'due' then 6 when 'after_7' then 14 else 45 end;
    return jsonb_build_object(
      'next_stage', v_stage.stage,
      'next_date', greatest(v_due + v_stage.offset_days, public.paris_today()),
      'reason', null
    );
  end loop;

  return jsonb_build_object('next_stage', null, 'next_date', null, 'reason', 'SCHEDULE_DONE');
end;
$$;

revoke all on function public.invoice_next_reminder(uuid) from public, anon;
grant execute on function public.invoice_next_reminder(uuid) to authenticated;
