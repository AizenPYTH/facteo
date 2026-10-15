-- =============================================================================
-- Réglages propres à chaque entreprise : numérotation, modèle PDF, titre.
--
-- Avant : `settings.user_id` était unique, donc un compte avec plusieurs
-- entreprises n'avait qu'une seule ligne de réglages (celle de la première
-- entreprise). Les autres entreprises ne pouvaient ni enregistrer leurs
-- préfixes ni leur modèle, et leur numérotation retombait sur celle d'une
-- autre entreprise sans l'incrémenter.
--
-- Après :
-- - une ligne `settings` par entreprise (unique sur company_id) ;
-- - les numéros de facture et de devis sont uniques par entreprise (chaque
--   entreprise est une entité distincte avec sa propre séquence) ;
-- - format du numéro réglable : préfixe, année ou non, séparateur, nombre de
--   chiffres, prochain numéro ;
-- - titre par défaut des factures.
--
-- Aucune facture ni aucun devis existant n'est modifié.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Nouvelles options
-- -----------------------------------------------------------------------------

alter table public.settings
  add column if not exists number_include_year boolean not null default true,
  add column if not exists number_separator text not null default '-',
  add column if not exists number_digits integer not null default 6,
  add column if not exists invoice_title text;

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'settings_number_separator_check') then
    alter table public.settings
      add constraint settings_number_separator_check
      check (number_separator in ('-', '/', '_', '.', ''));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'settings_number_digits_check') then
    alter table public.settings
      add constraint settings_number_digits_check check (number_digits between 1 and 10);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'settings_prefixes_length_check') then
    alter table public.settings
      add constraint settings_prefixes_length_check check (
        char_length(coalesce(invoice_prefix, '')) <= 20
        and char_length(coalesce(quote_prefix, '')) <= 20
      ) not valid;
  end if;
  if not exists (select 1 from pg_constraint where conname = 'settings_titles_length_check') then
    alter table public.settings
      add constraint settings_titles_length_check check (char_length(coalesce(invoice_title, '')) <= 60);
  end if;
end;
$$;

-- -----------------------------------------------------------------------------
-- Une ligne de réglages par entreprise
-- -----------------------------------------------------------------------------

alter table public.settings drop constraint if exists settings_user_id_key;
drop index if exists public.settings_user_id_key;
create index if not exists settings_user_id_idx on public.settings (user_id);
create unique index if not exists settings_company_id_unique
  on public.settings (company_id) where company_id is not null;

-- Un membre ne crée des réglages que pour une entreprise à laquelle il a accès.
drop policy if exists settings_insert_own on public.settings;
create policy settings_insert_own on public.settings
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and (company_id is null or public.user_has_company_access(company_id))
  );

-- -----------------------------------------------------------------------------
-- Numéros uniques par entreprise (et non plus par compte)
-- -----------------------------------------------------------------------------

create unique index if not exists invoices_company_number_uniq
  on public.invoices (company_id, number) where company_id is not null;
create unique index if not exists invoices_user_number_no_company_uniq
  on public.invoices (user_id, number) where company_id is null;
alter table public.invoices drop constraint if exists invoices_user_number_uniq;
drop index if exists public.invoices_user_number_uniq;

create unique index if not exists quotes_company_number_uniq
  on public.quotes (company_id, number) where company_id is not null;
create unique index if not exists quotes_user_number_no_company_uniq
  on public.quotes (user_id, number) where company_id is null;
alter table public.quotes drop constraint if exists quotes_user_number_uniq;
drop index if exists public.quotes_user_number_uniq;

-- -----------------------------------------------------------------------------
-- Format d'un numéro : PRÉFIXE-2026-000042, FA/42, 2026-0042…
-- -----------------------------------------------------------------------------

create or replace function public.format_document_number(
  p_prefix text,
  p_number integer,
  p_include_year boolean,
  p_separator text,
  p_digits integer,
  p_at timestamptz default now()
)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select concat_ws(
    coalesce(p_separator, '-'),
    nullif(trim(coalesce(p_prefix, '')), ''),
    case when coalesce(p_include_year, true)
      then to_char(timezone('Europe/Paris', p_at), 'YYYY') end,
    -- Complété par des zéros, jamais tronqué (lpad coupe les nombres trop longs).
    case
      when char_length(greatest(coalesce(p_number, 1), 1)::text) >= least(greatest(coalesce(p_digits, 6), 1), 10)
        then greatest(coalesce(p_number, 1), 1)::text
      else lpad(greatest(coalesce(p_number, 1), 1)::text, least(greatest(coalesce(p_digits, 6), 1), 10), '0')
    end
  );
$$;

grant execute on function public.format_document_number(text, integer, boolean, text, integer, timestamptz)
  to authenticated;

-- -----------------------------------------------------------------------------
-- Réglages d'une entreprise, créés au besoin.
-- Les valeurs générales (devise, TVA, délais, modèle, format) sont reprises
-- des réglages de l'utilisateur pour une autre entreprise ; la numérotation
-- repart de la suite des documents déjà émis par cette entreprise.
-- -----------------------------------------------------------------------------

create or replace function public.next_number_after_existing(p_company_id uuid, p_kind text)
returns integer
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select coalesce(max(substring(d.number from '(\d+)$')::bigint), 0)::integer + 1
  from (
    select number from public.invoices where p_kind = 'invoice' and company_id = p_company_id
    union all
    select number from public.quotes where p_kind = 'quote' and company_id = p_company_id
  ) d
  -- Seuls les numéros automatiques (PRÉFIXE-AAAA-NNNNNN) font foi : un numéro
  -- saisi à la main (ex. FAC1026046) ne doit pas faire sauter la séquence.
  where d.number ~ '^[^-]*-\d{4}-\d{6}$';
$$;

revoke all on function public.next_number_after_existing(uuid, text) from public, anon, authenticated;

create or replace function public.ensure_company_settings(p_company_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_id uuid;
  v_user uuid;
  v_template public.settings%rowtype;
begin
  if p_company_id is null then
    raise exception 'Entreprise manquante.';
  end if;

  if auth.uid() is not null and not public.user_has_company_access(p_company_id) then
    raise exception 'Unauthorized';
  end if;

  select id into v_id from public.settings where company_id = p_company_id;
  if v_id is not null then
    return v_id;
  end if;

  v_user := coalesce(
    auth.uid(),
    (select m.user_id from public.company_members m
      where m.company_id = p_company_id
      order by (m.role = 'owner') desc, m.created_at
      limit 1)
  );
  if v_user is null then
    raise exception 'Entreprise sans membre.';
  end if;

  select * into v_template
  from public.settings s
  where s.user_id = v_user
  order by s.updated_at desc nulls last
  limit 1;

  insert into public.settings (
    user_id, company_id,
    currency, default_vat_rate, locale, payment_terms_days, quote_validity_days,
    quote_prefix, invoice_prefix, credit_note_prefix,
    next_quote_number, next_invoice_number, next_credit_note_number,
    quote_template_id, invoice_template_id,
    number_include_year, number_separator, number_digits,
    created_at, updated_at
  )
  values (
    v_user, p_company_id,
    coalesce(v_template.currency, 'EUR'),
    coalesce(v_template.default_vat_rate, 20),
    coalesce(v_template.locale, 'fr-FR'),
    coalesce(v_template.payment_terms_days, 30),
    coalesce(v_template.quote_validity_days, 30),
    coalesce(v_template.quote_prefix, 'DEV'),
    coalesce(v_template.invoice_prefix, 'FAC'),
    coalesce(v_template.credit_note_prefix, 'AV-'),
    public.next_number_after_existing(p_company_id, 'quote'),
    public.next_number_after_existing(p_company_id, 'invoice'),
    1,
    coalesce(v_template.quote_template_id, '04'),
    coalesce(v_template.invoice_template_id, '04'),
    coalesce(v_template.number_include_year, true),
    coalesce(v_template.number_separator, '-'),
    coalesce(v_template.number_digits, 6),
    timezone('utc', now()), timezone('utc', now())
  )
  on conflict (company_id) where company_id is not null do nothing
  returning id into v_id;

  if v_id is null then
    select id into v_id from public.settings where company_id = p_company_id;
  end if;

  return v_id;
end;
$$;

revoke all on function public.ensure_company_settings(uuid) from public, anon;
grant execute on function public.ensure_company_settings(uuid) to authenticated;

-- Rattrapage : chaque entreprise ayant au moins un membre reçoit ses réglages.
do $$
declare
  v_company uuid;
begin
  for v_company in
    select c.id from public.companies c
    where not exists (select 1 from public.settings s where s.company_id = c.id)
      and exists (select 1 from public.company_members m where m.company_id = c.id)
  loop
    perform public.ensure_company_settings(v_company);
  end loop;
end;
$$;

-- -----------------------------------------------------------------------------
-- Réservation des numéros : uniquement les réglages de l'entreprise visée.
-- -----------------------------------------------------------------------------

create or replace function public.reserve_next_invoice_number(p_company_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_settings public.settings%rowtype;
begin
  if not public.user_has_company_access(p_company_id) then
    raise exception 'Unauthorized';
  end if;

  perform public.ensure_company_settings(p_company_id);

  select * into v_settings
  from public.settings
  where company_id = p_company_id
  for update;

  update public.settings
  set next_invoice_number = greatest(coalesce(v_settings.next_invoice_number, 1), 1) + 1,
      updated_at = timezone('utc', now())
  where id = v_settings.id;

  return public.format_document_number(
    coalesce(v_settings.invoice_prefix, 'FAC'),
    greatest(coalesce(v_settings.next_invoice_number, 1), 1),
    v_settings.number_include_year,
    v_settings.number_separator,
    v_settings.number_digits
  );
end;
$$;

create or replace function public.reserve_next_quote_number(p_company_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_settings public.settings%rowtype;
begin
  if not public.user_has_company_access(p_company_id) then
    raise exception 'Unauthorized';
  end if;

  perform public.ensure_company_settings(p_company_id);

  select * into v_settings
  from public.settings
  where company_id = p_company_id
  for update;

  update public.settings
  set next_quote_number = greatest(coalesce(v_settings.next_quote_number, 1), 1) + 1,
      updated_at = timezone('utc', now())
  where id = v_settings.id;

  return public.format_document_number(
    coalesce(v_settings.quote_prefix, 'DEV'),
    greatest(coalesce(v_settings.next_quote_number, 1), 1),
    v_settings.number_include_year,
    v_settings.number_separator,
    v_settings.number_digits
  );
end;
$$;

-- Avoirs : même format qu'avant (AV-00001), sans toucher aux réglages d'une
-- autre entreprise.
create or replace function public.reserve_next_credit_note_number(p_company_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_prefix text;
  v_next integer;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if not public.user_has_company_access(p_company_id) then
    raise exception 'Unauthorized';
  end if;

  perform public.ensure_company_settings(p_company_id);

  update public.settings
  set
    next_credit_note_number = coalesce(next_credit_note_number, 1) + 1,
    updated_at = timezone('utc', now())
  where company_id = p_company_id
  returning credit_note_prefix, next_credit_note_number - 1
  into v_prefix, v_next;

  return coalesce(v_prefix, 'AV-') || lpad(v_next::text, 5, '0');
end;
$$;

revoke all on function public.reserve_next_invoice_number(uuid) from public, anon;
revoke all on function public.reserve_next_quote_number(uuid) from public, anon;
revoke all on function public.reserve_next_credit_note_number(uuid) from public, anon;
grant execute on function public.reserve_next_invoice_number(uuid) to authenticated;
grant execute on function public.reserve_next_quote_number(uuid) to authenticated;
grant execute on function public.reserve_next_credit_note_number(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Nouvelle entreprise : ses propres réglages (repris des réglages existants,
-- numérotation à 1). Remplace l'ancien `on conflict (user_id) do nothing`
-- qui laissait la seconde entreprise sans réglages.
-- -----------------------------------------------------------------------------

create or replace function public.create_company_for_user(p_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_name text;
  v_check jsonb;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  v_check := public.check_plan_limit('companies');
  if coalesce((v_check ->> 'allowed')::boolean, false) is not true then
    raise exception 'PLAN_LIMIT_REACHED:companies'
      using errcode = 'P0001';
  end if;

  v_name := coalesce(nullif(trim(p_name), ''), '');

  insert into public.companies (name, created_at, updated_at)
  values (v_name, timezone('utc', now()), timezone('utc', now()))
  returning id into v_company_id;

  perform set_config('inveq.allow_membership_write', 'on', true);
  insert into public.company_members (company_id, user_id, role)
  values (v_company_id, auth.uid(), 'owner');
  perform set_config('inveq.allow_membership_write', 'off', true);

  perform public.ensure_company_settings(v_company_id);

  return v_company_id;
end;
$$;

-- Inscription : même fonction qu'en production, seule l'insertion des
-- réglages change (conflit sur l'entreprise, plus sur l'utilisateur).
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_company_id uuid;
  v_company_name text;
  v_first_name text;
  v_last_name text;
  v_phone text;
  v_avatar text;
  v_full_name text;
begin
  v_first_name := nullif(trim(coalesce(
    new.raw_user_meta_data->>'first_name',
    new.raw_user_meta_data->>'given_name',
    ''
  )), '');

  v_last_name := nullif(trim(coalesce(
    new.raw_user_meta_data->>'last_name',
    new.raw_user_meta_data->>'family_name',
    ''
  )), '');

  v_full_name := nullif(trim(coalesce(
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'name',
    ''
  )), '');

  if v_first_name is null and v_full_name is not null then
    v_first_name := split_part(v_full_name, ' ', 1);
    if v_last_name is null and position(' ' in v_full_name) > 0 then
      v_last_name := trim(substring(v_full_name from position(' ' in v_full_name) + 1));
    end if;
  end if;

  v_phone := nullif(trim(coalesce(new.raw_user_meta_data->>'phone', '')), '');
  v_avatar := nullif(trim(coalesce(
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'picture',
    ''
  )), '');

  insert into public.profiles (
    id, email, first_name, last_name, phone, avatar_url,
    onboarding_completed, onboarding_step, created_at, updated_at
  )
  values (
    new.id, new.email, v_first_name, v_last_name, v_phone, v_avatar,
    false, 0, timezone('utc', now()), timezone('utc', now())
  )
  on conflict (id) do update set
    email = coalesce(excluded.email, profiles.email),
    first_name = coalesce(profiles.first_name, excluded.first_name),
    last_name = coalesce(profiles.last_name, excluded.last_name),
    phone = coalesce(profiles.phone, excluded.phone),
    avatar_url = coalesce(profiles.avatar_url, excluded.avatar_url),
    updated_at = timezone('utc', now());

  v_company_name := coalesce(nullif(trim(new.raw_user_meta_data->>'company_name'), ''), '');

  insert into public.companies (name, email, created_at, updated_at)
  values (v_company_name, new.email, timezone('utc', now()), timezone('utc', now()))
  returning id into v_company_id;

  perform set_config('inveq.allow_membership_write', 'on', true);
  insert into public.company_members (company_id, user_id, role)
  values (v_company_id, new.id, 'owner')
  on conflict do nothing;
  perform set_config('inveq.allow_membership_write', 'off', true);

  insert into public.settings (user_id, company_id, created_at, updated_at)
  values (new.id, v_company_id, timezone('utc', now()), timezone('utc', now()))
  on conflict (company_id) where company_id is not null do nothing;

  perform set_config('inveq.allow_subscription_write', 'on', true);
  insert into public.subscriptions (user_id, company_id, plan, status, created_at, updated_at)
  values (
    new.id, v_company_id,
    'free'::public.subscription_plan,
    'active'::public.subscription_status,
    timezone('utc', now()),
    timezone('utc', now())
  )
  on conflict (user_id) do update set company_id = excluded.company_id;
  perform set_config('inveq.allow_subscription_write', 'off', true);

  return new;
end;
$$;

comment on column public.settings.number_include_year is 'Numéro avec l''année (FAC-2026-000001) ou sans (FAC-000001).';
comment on column public.settings.number_separator is 'Séparateur entre préfixe, année et numéro : -, /, _, . ou aucun.';
comment on column public.settings.number_digits is 'Nombre de chiffres du numéro (complété par des zéros).';
comment on column public.settings.invoice_title is 'Titre par défaut des factures de l''entreprise (vide : « Facture »).';
