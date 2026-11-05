-- =============================================================================
-- Factures d'acompte et de solde liées à un devis.
--
-- Exemple : devis 1 000 € → acompte 30 % (300 €) → solde 700 €.
--
-- Toute la logique est ici, en base, pour que le site et l'application
-- calculent exactement la même chose :
-- - `create_deposit_invoice(devis, 'percent' | 'amount', valeur)` : acompte en
--   pourcentage ou en montant TTC, plusieurs acomptes possibles ;
-- - `create_final_invoice_from_quote(devis)` : facture de solde (acomptes
--   déduits) s'il y a des acomptes, sinon facture classique du devis entier ;
-- - `quote_billing_state(devis)` : historique et liens entre documents.
--
-- Garde-fous (aussi pour une écriture directe dans la table) :
-- - un devis n'a qu'une facture finale (classique ou de solde) active ;
-- - les acomptes + le solde ne dépassent jamais le montant du devis ;
-- - pas de facture classique « devis entier » quand des acomptes existent
--   (ils seraient facturés deux fois) ;
-- - un acompte ne s'annule pas tant que son solde est actif.
--
-- La TVA de l'acompte suit la répartition du devis par taux (calcul ligne par
-- ligne, arrondi au centime, comme dans l'app et le site).
-- Les lignes restent positives : le solde reprend le reste dû par taux de TVA
-- et le détail des acomptes déduits figure dans les notes de la facture.
--
-- Aucune facture existante n'est modifiée : les nouvelles colonnes prennent
-- leur valeur par défaut (« standard »).
-- =============================================================================

alter table public.invoices
  add column if not exists billing_role text not null default 'standard',
  add column if not exists deposit_percent numeric(7, 3);

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'invoices_billing_role_chk') then
    alter table public.invoices
      add constraint invoices_billing_role_chk check (billing_role in ('standard', 'deposit', 'balance'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'invoices_billing_role_quote_chk') then
    alter table public.invoices
      add constraint invoices_billing_role_quote_chk check (billing_role = 'standard' or quote_id is not null);
  end if;
end;
$$;

-- Une seule facture finale active par devis (double clic, deux appareils…).
create unique index if not exists invoices_one_final_per_quote
  on public.invoices (quote_id)
  where quote_id is not null
    and document_kind = 'invoice'
    and billing_role in ('standard', 'balance')
    and status <> 'canceled'
    and deleted_at is null;

create index if not exists invoices_quote_id_idx on public.invoices (quote_id) where quote_id is not null;

-- -----------------------------------------------------------------------------
-- Outils de mise en forme
-- -----------------------------------------------------------------------------

create or replace function public.fr_amount(p_value numeric)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select replace(replace(to_char(coalesce(p_value, 0), 'FM999,999,990.00'), ',', ' '), '.', ',') || ' €';
$$;

create or replace function public.fr_date(p_value timestamptz)
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select to_char(timezone('Europe/Paris', p_value), 'DD/MM/YYYY');
$$;

create or replace function public.fr_rate(p_value numeric)
returns text
language sql
immutable
set search_path = public, pg_temp
as $$
  select replace(trim(trailing '.' from trim(trailing '0' from to_char(coalesce(p_value, 0), 'FM990.00'))), '.', ',') || ' %';
$$;

-- Dates des documents : minuit UTC du jour, comme l'app et le site.
create or replace function public.document_day_timestamp(p_day date)
returns timestamptz
language sql
immutable
set search_path = public, pg_temp
as $$
  select (p_day::timestamp at time zone 'UTC');
$$;

-- -----------------------------------------------------------------------------
-- Garde-fous sur les factures liées à un devis
-- -----------------------------------------------------------------------------

create or replace function public.enforce_quote_billing_limits()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_quote_total numeric;
  v_others numeric;
  v_active boolean := new.status <> 'canceled' and new.deleted_at is null;
  v_was_active boolean := tg_op = 'UPDATE' and old.status <> 'canceled' and old.deleted_at is null;
begin
  if new.billing_role <> 'standard' and new.quote_id is null then
    raise exception 'BILLING_ROLE_REQUIRES_QUOTE';
  end if;

  if new.quote_id is null or new.document_kind <> 'invoice' then
    return new;
  end if;

  -- Verrou sur le devis : deux factures créées en même temps sont vérifiées l'une après l'autre.
  select q.total_ttc into v_quote_total from public.quotes q where q.id = new.quote_id for update;

  if not v_active then
    if new.billing_role = 'deposit' and v_was_active and exists (
      select 1 from public.invoices i
      where i.quote_id = new.quote_id and i.id <> new.id and i.document_kind = 'invoice'
        and i.billing_role = 'balance' and i.status <> 'canceled' and i.deleted_at is null
    ) then
      raise exception 'DEPOSIT_HAS_BALANCE'
        using detail = 'Annulez d''abord la facture de solde qui déduit cet acompte.';
    end if;
    return new;
  end if;

  if v_quote_total is null then
    -- Devis supprimé : rien à comparer.
    return new;
  end if;

  if new.billing_role = 'standard' and exists (
    select 1 from public.invoices i
    where i.quote_id = new.quote_id and i.id <> new.id and i.document_kind = 'invoice'
      and i.billing_role = 'deposit' and i.status <> 'canceled' and i.deleted_at is null
  ) then
    raise exception 'QUOTE_HAS_DEPOSITS'
      using detail = 'Ce devis a déjà des acomptes : créez la facture de solde.';
  end if;

  if new.billing_role = 'deposit' and exists (
    select 1 from public.invoices i
    where i.quote_id = new.quote_id and i.id <> new.id and i.document_kind = 'invoice'
      and i.billing_role in ('standard', 'balance') and i.status <> 'canceled' and i.deleted_at is null
  ) then
    raise exception 'QUOTE_ALREADY_INVOICED';
  end if;

  if new.billing_role in ('deposit', 'balance') then
    select coalesce(sum(i.total_ttc), 0) into v_others
    from public.invoices i
    where i.quote_id = new.quote_id and i.id <> new.id and i.document_kind = 'invoice'
      and i.billing_role in ('deposit', 'balance') and i.status <> 'canceled' and i.deleted_at is null;

    -- 5 centimes de tolérance : arrondis de TVA par taux.
    if v_others + new.total_ttc > v_quote_total + 0.05 then
      raise exception 'QUOTE_OVERBILLED'
        using detail = format('Déjà facturé : %s. Devis : %s.', public.fr_amount(v_others), public.fr_amount(v_quote_total));
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists invoices_enforce_quote_billing on public.invoices;
create trigger invoices_enforce_quote_billing
  before insert or update of quote_id, billing_role, total_ttc, status, deleted_at, document_kind
  on public.invoices
  for each row execute function public.enforce_quote_billing_limits();

-- Facture finale annulée ou supprimée : le devis redevient « accepté », pour
-- pouvoir refaire la facture (sinon il resterait « converti » sans facture).
create or replace function public.release_quote_after_final_invoice_cancel()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if new.quote_id is not null
    and new.billing_role in ('standard', 'balance')
    and (new.status = 'canceled' or new.deleted_at is not null)
    and (old.status <> 'canceled' and old.deleted_at is null) then
    update public.quotes
    set status = 'accepted', converted_invoice_id = null, updated_at = timezone('utc', now())
    where id = new.quote_id and converted_invoice_id = new.id and status = 'converted';
  end if;
  return new;
end;
$$;

drop trigger if exists invoices_release_quote_on_cancel on public.invoices;
create trigger invoices_release_quote_on_cancel
  after update of status, deleted_at on public.invoices
  for each row execute function public.release_quote_after_final_invoice_cancel();

-- -----------------------------------------------------------------------------
-- Lecture : où en est la facturation d'un devis ?
-- -----------------------------------------------------------------------------

create or replace function public.quote_billing_state(p_quote_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_quote public.quotes%rowtype;
  v_invoices jsonb;
  v_deposits numeric;
  v_deposits_paid numeric;
  v_final uuid;
  v_final_role text;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  select * into v_quote from public.quotes where id = p_quote_id;
  if v_quote.id is null then
    return null;
  end if;
  if not (v_quote.user_id = auth.uid() or public.user_has_company_access(v_quote.company_id)) then
    raise exception 'Unauthorized';
  end if;

  select coalesce(jsonb_agg(jsonb_build_object(
      'id', i.id,
      'number', i.number,
      'role', i.billing_role,
      'status', i.status,
      'total_ttc', i.total_ttc,
      'deposit_percent', i.deposit_percent,
      'issued_at', i.issued_at,
      'amount_paid', coalesce((select sum(p.amount) from public.invoice_payments p where p.invoice_id = i.id), 0),
      'active', i.status <> 'canceled'
    ) order by i.created_at), '[]'::jsonb)
  into v_invoices
  from public.invoices i
  where i.quote_id = p_quote_id and i.document_kind = 'invoice' and i.deleted_at is null;

  select
    coalesce(sum(i.total_ttc), 0),
    coalesce(sum((select coalesce(sum(p.amount), 0) from public.invoice_payments p where p.invoice_id = i.id)), 0)
  into v_deposits, v_deposits_paid
  from public.invoices i
  where i.quote_id = p_quote_id and i.document_kind = 'invoice' and i.billing_role = 'deposit'
    and i.status <> 'canceled' and i.deleted_at is null;

  select i.id, i.billing_role into v_final, v_final_role
  from public.invoices i
  where i.quote_id = p_quote_id and i.document_kind = 'invoice' and i.billing_role in ('standard', 'balance')
    and i.status <> 'canceled' and i.deleted_at is null
  limit 1;

  return jsonb_build_object(
    'quote_id', v_quote.id,
    'quote_number', v_quote.number,
    'quote_status', v_quote.status,
    'quote_total_ttc', v_quote.total_ttc,
    'invoices', v_invoices,
    'deposits_total_ttc', v_deposits,
    'deposits_paid', v_deposits_paid,
    'final_invoice_id', v_final,
    'final_invoice_role', v_final_role,
    'remaining_ttc', case when v_final is null then greatest(v_quote.total_ttc - v_deposits, 0) else 0 end,
    'can_create_deposit', v_quote.deleted_at is null and v_quote.status = 'accepted' and v_final is null
      and v_quote.total_ttc - v_deposits > 0.01,
    'can_create_final', v_quote.deleted_at is null and v_quote.status = 'accepted' and v_final is null
  );
end;
$$;

revoke all on function public.quote_billing_state(uuid) from public, anon;
grant execute on function public.quote_billing_state(uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Création (interne) : contrôles communs
-- -----------------------------------------------------------------------------

create or replace function public.lock_quote_for_billing(p_quote_id uuid)
returns public.quotes
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_quote public.quotes%rowtype;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  select * into v_quote from public.quotes where id = p_quote_id for update;

  if v_quote.id is null or v_quote.deleted_at is not null then
    raise exception 'QUOTE_NOT_FOUND';
  end if;
  if not (v_quote.user_id = auth.uid() or public.user_has_company_access(v_quote.company_id)) then
    raise exception 'Unauthorized';
  end if;
  if v_quote.status = 'converted' or exists (
    select 1 from public.invoices i
    where i.quote_id = p_quote_id and i.document_kind = 'invoice' and i.billing_role in ('standard', 'balance')
      and i.status <> 'canceled' and i.deleted_at is null
  ) then
    raise exception 'QUOTE_ALREADY_INVOICED';
  end if;
  if v_quote.status <> 'accepted' then
    raise exception 'QUOTE_NOT_ACCEPTED';
  end if;
  if v_quote.client_id is null then
    raise exception 'CLIENT_REQUIRED';
  end if;
  if coalesce(v_quote.total_ttc, 0) <= 0 then
    raise exception 'QUOTE_EMPTY';
  end if;

  return v_quote;
end;
$$;

revoke all on function public.lock_quote_for_billing(uuid) from public, anon, authenticated;

create or replace function public.quote_due_at(p_quote public.quotes, p_issued timestamptz)
returns timestamptz
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p_issued + make_interval(days => coalesce(
    p_quote.payment_terms_days,
    (select s.payment_terms_days from public.settings s where s.company_id = p_quote.company_id limit 1),
    30
  ));
$$;

revoke all on function public.quote_due_at(public.quotes, timestamptz) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Facture d'acompte
-- -----------------------------------------------------------------------------

create or replace function public.create_deposit_invoice(
  p_quote_id uuid,
  p_mode text,
  p_value numeric
)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_quote public.quotes%rowtype;
  v_ratio numeric;
  v_deposits numeric;
  v_group record;
  v_ht numeric;
  v_vat numeric;
  v_subtotal numeric := 0;
  v_total_vat numeric := 0;
  v_total_ttc numeric;
  v_number text;
  v_invoice_id uuid;
  v_issued timestamptz := public.document_day_timestamp(public.paris_today());
  v_percent_label text;
  v_groups integer;
  v_position integer := 0;
begin
  v_quote := public.lock_quote_for_billing(p_quote_id);

  if p_value is null or p_value <= 0 then
    raise exception 'DEPOSIT_INVALID';
  end if;
  if p_mode = 'percent' then
    if p_value >= 100 then
      raise exception 'DEPOSIT_INVALID' using detail = 'Un acompte est inférieur à 100 %.';
    end if;
    v_ratio := p_value / 100;
  elsif p_mode = 'amount' then
    v_ratio := p_value / v_quote.total_ttc;
  else
    raise exception 'DEPOSIT_INVALID';
  end if;

  select coalesce(sum(i.total_ttc), 0) into v_deposits
  from public.invoices i
  where i.quote_id = p_quote_id and i.document_kind = 'invoice' and i.billing_role = 'deposit'
    and i.status <> 'canceled' and i.deleted_at is null;

  select count(distinct vat_rate) into v_groups from public.quote_items where quote_id = p_quote_id;

  for v_group in
    select qi.vat_rate, round(sum(qi.line_total_ht), 2) as ht
    from public.quote_items qi where qi.quote_id = p_quote_id
    group by qi.vat_rate
  loop
    v_ht := round(v_group.ht * v_ratio, 2);
    v_subtotal := v_subtotal + v_ht;
    v_total_vat := v_total_vat + round(v_ht * v_group.vat_rate / 100, 2);
  end loop;
  v_total_ttc := round(v_subtotal + v_total_vat, 2);

  if v_total_ttc <= 0 then
    raise exception 'DEPOSIT_TOO_SMALL';
  end if;
  -- Il doit rester un solde à facturer.
  if v_deposits + v_total_ttc > v_quote.total_ttc - 0.01 then
    raise exception 'DEPOSIT_EXCEEDS_REMAINING'
      using detail = format('Reste à facturer : %s.', public.fr_amount(v_quote.total_ttc - v_deposits));
  end if;

  v_percent_label := replace(trim(trailing '.' from trim(trailing '0' from to_char(round(v_ratio * 100, 2), 'FM990.00'))), '.', ',') || ' %';
  v_number := public.reserve_next_invoice_number(v_quote.company_id);

  insert into public.invoices (
    user_id, company_id, client_id, quote_id, number, status,
    subtotal_ht, total_vat, total_ttc, issued_at, due_at, notes,
    billing_role, deposit_percent, pdf_options, updated_at
  )
  values (
    v_uid, v_quote.company_id, v_quote.client_id, v_quote.id, v_number, 'draft',
    round(v_subtotal, 2), round(v_total_vat, 2), v_total_ttc, v_issued, public.quote_due_at(v_quote, v_issued),
    format(
      'Facture d''acompte de %s sur le devis n° %s du %s (montant total du devis : %s TTC). Cet acompte sera déduit de la facture de solde.',
      v_percent_label, v_quote.number, coalesce(public.fr_date(v_quote.issued_at), public.fr_date(v_quote.created_at)),
      public.fr_amount(v_quote.total_ttc)
    ),
    'deposit', round(v_ratio * 100, 3),
    jsonb_build_object('title', 'Facture d''acompte'),
    timezone('utc', now())
  )
  returning id into v_invoice_id;

  for v_group in
    select qi.vat_rate, round(sum(qi.line_total_ht), 2) as ht
    from public.quote_items qi where qi.quote_id = p_quote_id
    group by qi.vat_rate
    order by qi.vat_rate desc
  loop
    v_ht := round(v_group.ht * v_ratio, 2);
    continue when v_ht <= 0;
    insert into public.invoice_items (
      invoice_id, user_id, company_id, position, title, description,
      quantity, unit, unit_price, vat_rate, discount_percent, line_total_ht
    )
    values (
      v_invoice_id, v_uid, v_quote.company_id, v_position,
      format('Acompte de %s — devis n° %s', v_percent_label, v_quote.number),
      case when v_groups > 1
        then format('Part des prestations soumises à la TVA à %s', public.fr_rate(v_group.vat_rate))
        else format('Devis n° %s : %s TTC', v_quote.number, public.fr_amount(v_quote.total_ttc))
      end,
      1, 'forfait', v_ht, v_group.vat_rate, 0, v_ht
    );
    v_position := v_position + 1;
  end loop;

  return jsonb_build_object('id', v_invoice_id, 'number', v_number, 'total_ttc', v_total_ttc);
end;
$$;

revoke all on function public.create_deposit_invoice(uuid, text, numeric) from public, anon;
grant execute on function public.create_deposit_invoice(uuid, text, numeric) to authenticated;

-- -----------------------------------------------------------------------------
-- Facture finale : solde (acomptes déduits) ou facture du devis entier
-- -----------------------------------------------------------------------------

create or replace function public.create_final_invoice_from_quote(p_quote_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid := auth.uid();
  v_quote public.quotes%rowtype;
  v_has_deposits boolean;
  v_number text;
  v_invoice_id uuid;
  v_issued timestamptz := public.document_day_timestamp(public.paris_today());
  v_subtotal numeric := 0;
  v_total_vat numeric := 0;
  v_total_ttc numeric;
  v_group record;
  v_ht numeric;
  v_position integer := 0;
  v_deposits_ttc numeric;
  v_deposit_list text;
  v_title text;
begin
  v_quote := public.lock_quote_for_billing(p_quote_id);

  select exists (
    select 1 from public.invoices i
    where i.quote_id = p_quote_id and i.document_kind = 'invoice' and i.billing_role = 'deposit'
      and i.status <> 'canceled' and i.deleted_at is null
  ) into v_has_deposits;

  v_number := public.reserve_next_invoice_number(v_quote.company_id);

  if not v_has_deposits then
    -- Facture du devis entier : mêmes lignes, TVA ligne par ligne.
    select
      round(coalesce(sum(qi.line_total_ht), 0), 2),
      round(coalesce(sum(round(qi.line_total_ht * qi.vat_rate / 100, 2)), 0), 2)
    into v_subtotal, v_total_vat
    from public.quote_items qi where qi.quote_id = p_quote_id;
    v_total_ttc := round(v_subtotal + v_total_vat, 2);

    select nullif(trim(s.invoice_title), '') into v_title
    from public.settings s where s.company_id = v_quote.company_id limit 1;

    insert into public.invoices (
      user_id, company_id, client_id, quote_id, number, status,
      subtotal_ht, total_vat, total_ttc, issued_at, due_at, notes,
      billing_role, pdf_options, updated_at
    )
    values (
      v_uid, v_quote.company_id, v_quote.client_id, v_quote.id, v_number, 'draft',
      v_subtotal, v_total_vat, v_total_ttc, v_issued, public.quote_due_at(v_quote, v_issued), v_quote.notes,
      'standard', case when v_title is not null then jsonb_build_object('title', v_title) end,
      timezone('utc', now())
    )
    returning id into v_invoice_id;

    insert into public.invoice_items (
      invoice_id, user_id, company_id, product_id, position, title, description,
      quantity, unit, unit_price, vat_rate, discount_percent, line_total_ht
    )
    select v_invoice_id, v_uid, v_quote.company_id, qi.product_id, qi.position, qi.title, qi.description,
           qi.quantity, qi.unit, qi.unit_price, qi.vat_rate, qi.discount_percent, qi.line_total_ht
    from public.quote_items qi where qi.quote_id = p_quote_id
    order by qi.position, qi.created_at;
  else
    -- Solde : reste dû par taux de TVA = devis − acomptes actifs.
    select
      coalesce(sum(i.total_ttc), 0),
      string_agg(format('n° %s du %s (%s TTC)', i.number, public.fr_date(i.issued_at), public.fr_amount(i.total_ttc)), ' ; ' order by i.created_at)
    into v_deposits_ttc, v_deposit_list
    from public.invoices i
    where i.quote_id = p_quote_id and i.document_kind = 'invoice' and i.billing_role = 'deposit'
      and i.status <> 'canceled' and i.deleted_at is null;

    insert into public.invoices (
      user_id, company_id, client_id, quote_id, number, status,
      subtotal_ht, total_vat, total_ttc, issued_at, due_at, notes,
      billing_role, pdf_options, updated_at
    )
    values (
      v_uid, v_quote.company_id, v_quote.client_id, v_quote.id, v_number, 'draft',
      0, 0, 0, v_issued, public.quote_due_at(v_quote, v_issued), null,
      'balance', jsonb_build_object('title', 'Facture de solde'),
      timezone('utc', now())
    )
    returning id into v_invoice_id;

    for v_group in
      select g.vat_rate, g.ht,
        coalesce((
          select sum(ii.line_total_ht)
          from public.invoice_items ii
          join public.invoices i on i.id = ii.invoice_id
          where i.quote_id = p_quote_id and i.document_kind = 'invoice' and i.billing_role = 'deposit'
            and i.status <> 'canceled' and i.deleted_at is null and ii.vat_rate = g.vat_rate
        ), 0) as deducted
      from (
        select qi.vat_rate, round(sum(qi.line_total_ht), 2) as ht
        from public.quote_items qi where qi.quote_id = p_quote_id
        group by qi.vat_rate
      ) g
      order by g.vat_rate desc
    loop
      v_ht := round(v_group.ht - v_group.deducted, 2);
      if v_ht < 0 then
        raise exception 'BALANCE_INCONSISTENT'
          using detail = format('Les acomptes au taux de %s dépassent le devis.', public.fr_rate(v_group.vat_rate));
      end if;
      continue when v_ht = 0;
      insert into public.invoice_items (
        invoice_id, user_id, company_id, position, title, description,
        quantity, unit, unit_price, vat_rate, discount_percent, line_total_ht
      )
      values (
        v_invoice_id, v_uid, v_quote.company_id, v_position,
        format('Solde du devis n° %s', v_quote.number),
        format('Prestations à %s de TVA : %s HT, moins acomptes déjà facturés : %s HT',
          public.fr_rate(v_group.vat_rate), public.fr_amount(v_group.ht), public.fr_amount(v_group.deducted)),
        1, 'forfait', v_ht, v_group.vat_rate, 0, v_ht
      );
      v_subtotal := v_subtotal + v_ht;
      v_total_vat := v_total_vat + round(v_ht * v_group.vat_rate / 100, 2);
      v_position := v_position + 1;
    end loop;

    v_total_ttc := round(v_subtotal + v_total_vat, 2);
    if v_total_ttc <= 0 then
      raise exception 'BALANCE_INCONSISTENT' using detail = 'Il ne reste rien à facturer sur ce devis.';
    end if;

    update public.invoices
    set subtotal_ht = round(v_subtotal, 2),
        total_vat = round(v_total_vat, 2),
        total_ttc = v_total_ttc,
        notes = format(
          'Facture de solde du devis n° %s du %s (montant total : %s TTC). Acomptes déduits : %s. Total des acomptes : %s TTC. Reste à payer : %s TTC.',
          v_quote.number, coalesce(public.fr_date(v_quote.issued_at), public.fr_date(v_quote.created_at)),
          public.fr_amount(v_quote.total_ttc), v_deposit_list, public.fr_amount(v_deposits_ttc), public.fr_amount(v_total_ttc)
        )
    where id = v_invoice_id;
  end if;

  update public.quotes
  set status = 'converted', converted_invoice_id = v_invoice_id, updated_at = timezone('utc', now())
  where id = p_quote_id;

  return jsonb_build_object(
    'id', v_invoice_id,
    'number', v_number,
    'total_ttc', v_total_ttc,
    'role', case when v_has_deposits then 'balance' else 'standard' end
  );
end;
$$;

revoke all on function public.create_final_invoice_from_quote(uuid) from public, anon;
grant execute on function public.create_final_invoice_from_quote(uuid) to authenticated;
