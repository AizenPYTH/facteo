-- =============================================================================
-- Liens publics sécurisés et signature des devis en ligne.
--
-- 1. `document_share_links` : un lien envoyé au client donne accès à UN
--    document (devis ou facture), sans compte. Seule l'empreinte SHA-256 du
--    jeton est stockée : une fuite de la base ne donne aucun lien valable.
--    Un lien expire (1 an) et peut être désactivé.
-- 2. `get_public_document(token)` : ce que le client voit (aucune note
--    interne, aucune note sur le client, aucune donnée d'un autre document).
-- 3. `respond_to_public_quote(...)` : le client accepte (signature dessinée +
--    consentement explicite) ou refuse, avec un commentaire. La preuve est
--    gardée dans `quote_acceptances`, qui ne se modifie plus :
--    date et heure, nom, e-mail, signature, texte du consentement, adresse IP
--    et navigateur (lus côté serveur, pas fournis par la page), copie du
--    devis signé et son empreinte SHA-256.
--
-- C'est une signature électronique simple (art. 1367 du Code civil,
-- règlement eIDAS) : ni avancée ni qualifiée.
--
-- Aucune donnée existante n'est modifiée ni supprimée.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- Liens
-- -----------------------------------------------------------------------------

create table if not exists public.document_share_links (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  company_id uuid references public.companies (id) on delete cascade,
  document_type text not null check (document_type in ('quote', 'invoice')),
  document_id uuid not null,
  token_hash text not null unique check (token_hash ~ '^[0-9a-f]{64}$'),
  created_at timestamptz not null default timezone('utc', now()),
  expires_at timestamptz not null default (timezone('utc', now()) + interval '1 year'),
  revoked_at timestamptz,
  first_viewed_at timestamptz,
  last_viewed_at timestamptz,
  view_count integer not null default 0
);

create index if not exists document_share_links_document_idx
  on public.document_share_links (document_type, document_id);

alter table public.document_share_links enable row level security;

drop policy if exists document_share_links_select_member on public.document_share_links;
create policy document_share_links_select_member on public.document_share_links
  for select to authenticated
  using (
    user_id = auth.uid()
    or (company_id is not null and public.user_has_company_access(company_id))
  );

-- Écriture uniquement par les fonctions ci-dessous.
revoke insert, update, delete on public.document_share_links from anon, authenticated;

-- -----------------------------------------------------------------------------
-- Preuves d'acceptation / de refus (jamais modifiées)
-- -----------------------------------------------------------------------------

create table if not exists public.quote_acceptances (
  id uuid primary key default gen_random_uuid(),
  -- Pas de clé étrangère : la preuve survit à la suppression du devis.
  quote_id uuid not null,
  quote_number text not null,
  user_id uuid not null,
  company_id uuid,
  link_id uuid,
  decision text not null check (decision in ('accepted', 'rejected')),
  signer_name text not null check (char_length(signer_name) between 2 and 120),
  signer_email text check (signer_email is null or char_length(signer_email) <= 254),
  signature_image text check (
    signature_image is null
    or (signature_image ~ '^data:image/png;base64,[A-Za-z0-9+/=]+$' and char_length(signature_image) <= 500000)
  ),
  comment text check (comment is null or char_length(comment) <= 2000),
  consent_text text,
  total_ttc numeric(12, 2) not null,
  document_snapshot jsonb not null,
  document_hash text not null check (document_hash ~ '^[0-9a-f]{64}$'),
  ip_address text,
  user_agent text,
  created_at timestamptz not null default timezone('utc', now()),
  constraint quote_acceptances_accept_requires_proof check (
    decision <> 'accepted' or (signature_image is not null and consent_text is not null)
  )
);

create index if not exists quote_acceptances_quote_idx on public.quote_acceptances (quote_id, created_at desc);
-- Un devis n'est accepté en ligne qu'une fois.
create unique index if not exists quote_acceptances_one_accept_per_quote
  on public.quote_acceptances (quote_id) where decision = 'accepted';

alter table public.quote_acceptances enable row level security;

drop policy if exists quote_acceptances_select_member on public.quote_acceptances;
create policy quote_acceptances_select_member on public.quote_acceptances
  for select to authenticated
  using (
    user_id = auth.uid()
    or (company_id is not null and public.user_has_company_access(company_id))
  );

revoke insert, update, delete on public.quote_acceptances from anon, authenticated;

create or replace function public.prevent_quote_acceptance_update()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  raise exception 'Une preuve de signature ne peut pas être modifiée.';
end;
$$;

drop trigger if exists quote_acceptances_immutable on public.quote_acceptances;
create trigger quote_acceptances_immutable
  before update on public.quote_acceptances
  for each row execute function public.prevent_quote_acceptance_update();

-- -----------------------------------------------------------------------------
-- Outils
-- -----------------------------------------------------------------------------

create or replace function public.share_token_hash(p_token text)
returns text
language sql
immutable
set search_path = public, extensions, pg_temp
as $$
  select encode(extensions.digest(coalesce(p_token, ''), 'sha256'), 'hex');
$$;

revoke all on function public.share_token_hash(text) from public, anon, authenticated;

-- En-têtes de la requête HTTP (PostgREST) : adresse IP et navigateur réels.
create or replace function public.request_header(p_name text)
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select nullif(
    trim((coalesce(nullif(current_setting('request.headers', true), ''), '{}')::jsonb) ->> lower(p_name)),
    ''
  );
$$;

revoke all on function public.request_header(text) from public, anon, authenticated;

create or replace function public.request_client_ip()
returns text
language sql
stable
set search_path = public, pg_temp
as $$
  select left(coalesce(
    public.request_header('cf-connecting-ip'),
    trim(split_part(public.request_header('x-forwarded-for'), ',', 1)),
    public.request_header('x-real-ip')
  ), 64);
$$;

revoke all on function public.request_client_ip() from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Création d'un lien
--
-- `issue_document_share_link` : réservée au serveur (envoi d'e-mails, relances).
-- `create_document_share_link` : depuis le site ou l'app, pour l'utilisateur connecté.
-- Le jeton en clair n'est renvoyé qu'une fois et n'est jamais stocké.
-- -----------------------------------------------------------------------------

create or replace function public.issue_document_share_link(
  p_document_type text,
  p_document_id uuid,
  p_actor uuid,
  p_mark_sent boolean default false
)
returns text
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_user uuid;
  v_company uuid;
  v_status text;
  v_deleted timestamptz;
  v_token text;
begin
  if p_document_type = 'quote' then
    select user_id, company_id, status::text, deleted_at
      into v_user, v_company, v_status, v_deleted
    from public.quotes where id = p_document_id
    for update;
  elsif p_document_type = 'invoice' then
    select user_id, company_id, status::text, deleted_at
      into v_user, v_company, v_status, v_deleted
    from public.invoices where id = p_document_id
    for update;
  else
    raise exception 'DOCUMENT_TYPE_INVALID';
  end if;

  if v_user is null or v_deleted is not null then
    raise exception 'DOCUMENT_NOT_FOUND';
  end if;

  if p_actor is null or not (
    v_user = p_actor
    or exists (
      select 1 from public.company_members m
      where m.company_id = v_company and m.user_id = p_actor
    )
  ) then
    raise exception 'Unauthorized';
  end if;

  if p_document_type = 'invoice' and v_status = 'canceled' then
    raise exception 'INVOICE_CANCELED';
  end if;

  v_token := encode(extensions.gen_random_bytes(32), 'hex');

  insert into public.document_share_links (user_id, company_id, document_type, document_id, token_hash)
  values (v_user, v_company, p_document_type, p_document_id, public.share_token_hash(v_token));

  -- Partager un brouillon, c'est l'envoyer.
  if p_mark_sent and v_status = 'draft' then
    if p_document_type = 'quote' then
      update public.quotes set status = 'sent', updated_at = timezone('utc', now())
      where id = p_document_id and status = 'draft';
    else
      update public.invoices set status = 'sent', updated_at = timezone('utc', now())
      where id = p_document_id and status = 'draft';
    end if;
  end if;

  return v_token;
end;
$$;

revoke all on function public.issue_document_share_link(text, uuid, uuid, boolean) from public, anon, authenticated;
grant execute on function public.issue_document_share_link(text, uuid, uuid, boolean) to service_role;

create or replace function public.create_document_share_link(p_document_type text, p_document_id uuid)
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;
  return public.issue_document_share_link(p_document_type, p_document_id, auth.uid(), true);
end;
$$;

revoke all on function public.create_document_share_link(text, uuid) from public, anon;
grant execute on function public.create_document_share_link(text, uuid) to authenticated;

-- Désactive tous les liens d'un document (lien transmis par erreur…).
create or replace function public.revoke_document_share_links(p_document_type text, p_document_id uuid)
returns integer
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  update public.document_share_links l
  set revoked_at = timezone('utc', now())
  where l.document_type = p_document_type
    and l.document_id = p_document_id
    and l.revoked_at is null
    and (l.user_id = auth.uid() or (l.company_id is not null and public.user_has_company_access(l.company_id)));

  get diagnostics v_count = row_count;
  return v_count;
end;
$$;

revoke all on function public.revoke_document_share_links(text, uuid) from public, anon;
grant execute on function public.revoke_document_share_links(text, uuid) to authenticated;

-- -----------------------------------------------------------------------------
-- Lien → document (interne)
-- -----------------------------------------------------------------------------

create or replace function public.resolve_share_link(p_token text)
returns public.document_share_links
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  v_link public.document_share_links%rowtype;
begin
  if p_token is null or p_token !~ '^[0-9a-f]{64}$' then
    raise exception 'LINK_INVALID';
  end if;

  select * into v_link
  from public.document_share_links
  where token_hash = public.share_token_hash(p_token);

  if v_link.id is null or v_link.revoked_at is not null then
    raise exception 'LINK_INVALID';
  end if;
  if v_link.expires_at < timezone('utc', now()) then
    raise exception 'LINK_EXPIRED';
  end if;

  return v_link;
end;
$$;

revoke all on function public.resolve_share_link(text) from public, anon, authenticated;

-- Date du jour en France (échéances, validité des devis).
create or replace function public.paris_today()
returns date
language sql
stable
set search_path = public, pg_temp
as $$
  select (timezone('Europe/Paris', now()))::date;
$$;

grant execute on function public.paris_today() to anon, authenticated;

-- Copie figée d'un devis : ce que le client voit et signe.
create or replace function public.quote_public_snapshot(p_quote_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'quote', jsonb_build_object(
      'id', q.id,
      'number', q.number,
      'issued_at', q.issued_at,
      'valid_until', q.valid_until,
      'subtotal_ht', q.subtotal_ht,
      'total_vat', q.total_vat,
      'total_ttc', q.total_ttc,
      'notes', q.notes,
      'payment_terms_days', q.payment_terms_days
    ),
    'items', coalesce((
      select jsonb_agg(jsonb_build_object(
        'position', i.position,
        'title', i.title,
        'description', i.description,
        'quantity', i.quantity,
        'unit', i.unit,
        'unit_price', i.unit_price,
        'vat_rate', i.vat_rate,
        'discount_percent', i.discount_percent,
        'line_total_ht', i.line_total_ht
      ) order by i.position, i.created_at)
      from public.quote_items i where i.quote_id = q.id
    ), '[]'::jsonb),
    'company', (
      select jsonb_build_object('name', c.name, 'siret', c.siret, 'siren', c.siren, 'vat_number', c.vat_number)
      from public.companies c where c.id = q.company_id
    ),
    'client', (
      select jsonb_build_object('name', cl.name, 'company', cl.company, 'email', cl.email)
      from public.clients cl where cl.id = q.client_id
    )
  )
  from public.quotes q
  where q.id = p_quote_id;
$$;

revoke all on function public.quote_public_snapshot(uuid) from public, anon, authenticated;

-- -----------------------------------------------------------------------------
-- Ce que voit le client
-- -----------------------------------------------------------------------------

create or replace function public.get_public_document(p_token text)
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_link public.document_share_links%rowtype;
  v_doc jsonb;
  v_items jsonb;
  v_payments jsonb := '[]'::jsonb;
  v_client_id uuid;
  v_company_id uuid;
  v_owner uuid;
  v_status text;
  v_effective_status text;
  v_valid_until date;
  v_pdf_options jsonb;
  v_payment_link text;
  v_acceptance jsonb;
begin
  v_link := public.resolve_share_link(p_token);

  if v_link.document_type = 'quote' then
    select
      jsonb_build_object(
        'id', q.id, 'user_id', q.user_id, 'client_id', q.client_id,
        'converted_invoice_id', null, 'number', q.number, 'status', q.status,
        'subtotal_ht', q.subtotal_ht, 'total_vat', q.total_vat, 'total_ttc', q.total_ttc,
        'issued_at', q.issued_at, 'valid_until', q.valid_until,
        'payment_terms_days', q.payment_terms_days, 'notes', q.notes,
        'internal_notes', null, 'created_at', q.created_at, 'updated_at', q.updated_at,
        'clients', (select jsonb_build_object('name', cl.name, 'company', cl.company, 'email', cl.email)
                    from public.clients cl where cl.id = q.client_id)
      ),
      q.client_id, q.company_id, q.user_id, q.status::text, q.valid_until
    into v_doc, v_client_id, v_company_id, v_owner, v_status, v_valid_until
    from public.quotes q
    where q.id = v_link.document_id and q.deleted_at is null;

    if v_doc is null then
      raise exception 'LINK_INVALID';
    end if;

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', i.id, 'quote_id', i.quote_id, 'user_id', i.user_id, 'product_id', null,
      'position', i.position, 'title', i.title, 'description', i.description,
      'quantity', i.quantity, 'unit', i.unit, 'unit_price', i.unit_price,
      'vat_rate', i.vat_rate, 'discount_percent', i.discount_percent,
      'line_total_ht', i.line_total_ht, 'created_at', i.created_at, 'updated_at', i.updated_at
    ) order by i.position, i.created_at), '[]'::jsonb)
    into v_items
    from public.quote_items i where i.quote_id = v_link.document_id;

    v_effective_status := case
      when v_status in ('draft', 'sent') and v_valid_until is not null and v_valid_until < public.paris_today()
        then 'expired'
      when v_status = 'draft' then 'sent'
      else v_status
    end;

    select jsonb_build_object(
      'decision', a.decision, 'signer_name', a.signer_name,
      'created_at', a.created_at, 'comment', a.comment, 'document_hash', a.document_hash
    )
    into v_acceptance
    from public.quote_acceptances a
    where a.quote_id = v_link.document_id
    order by a.created_at desc
    limit 1;
  else
    select
      jsonb_build_object(
        'id', inv.id, 'user_id', inv.user_id, 'client_id', inv.client_id, 'quote_id', null,
        'number', inv.number, 'status', inv.status,
        'subtotal_ht', inv.subtotal_ht, 'total_vat', inv.total_vat, 'total_ttc', inv.total_ttc,
        'total', inv.total, 'issued_at', inv.issued_at, 'due_at', inv.due_at, 'paid_at', inv.paid_at,
        'payment_method', null, 'payment_reference', null, 'notes', inv.notes,
        'stripe_payment_link', null, 'created_at', inv.created_at, 'updated_at', inv.updated_at,
        'document_kind', inv.document_kind,
        'clients', (select jsonb_build_object('name', cl.name, 'company', cl.company, 'email', cl.email)
                    from public.clients cl where cl.id = inv.client_id)
      ),
      inv.client_id, inv.company_id, inv.user_id, inv.status::text, inv.pdf_options,
      case when inv.status in ('draft', 'sent', 'overdue', 'partially_paid') then inv.stripe_payment_link end
    into v_doc, v_client_id, v_company_id, v_owner, v_status, v_pdf_options, v_payment_link
    from public.invoices inv
    where inv.id = v_link.document_id and inv.deleted_at is null;

    if v_doc is null then
      raise exception 'LINK_INVALID';
    end if;

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', i.id, 'invoice_id', i.invoice_id, 'user_id', i.user_id, 'product_id', null,
      'position', i.position, 'title', i.title, 'description', i.description,
      'quantity', i.quantity, 'unit', i.unit, 'unit_price', i.unit_price,
      'vat_rate', i.vat_rate, 'discount_percent', i.discount_percent,
      'line_total_ht', i.line_total_ht, 'created_at', i.created_at, 'updated_at', i.updated_at
    ) order by i.position, i.created_at), '[]'::jsonb)
    into v_items
    from public.invoice_items i where i.invoice_id = v_link.document_id;

    select coalesce(jsonb_agg(jsonb_build_object(
      'id', p.id, 'invoice_id', p.invoice_id, 'user_id', p.user_id, 'amount', p.amount,
      'paid_at', p.paid_at, 'payment_method', null, 'payment_reference', null, 'notes', null,
      'created_at', p.created_at
    ) order by p.paid_at), '[]'::jsonb)
    into v_payments
    from public.invoice_payments p where p.invoice_id = v_link.document_id;

    -- Une facture partagée ou envoyée par e-mail est une facture émise.
    v_effective_status := case when v_status = 'draft' then 'sent' else v_status end;
  end if;

  update public.document_share_links
  set view_count = view_count + 1,
      first_viewed_at = coalesce(first_viewed_at, timezone('utc', now())),
      last_viewed_at = timezone('utc', now())
  where id = v_link.id;

  return jsonb_build_object(
    'document_type', v_link.document_type,
    'document', v_doc,
    'items', v_items,
    'payments', v_payments,
    'effective_status', v_effective_status,
    'can_respond', v_link.document_type = 'quote' and v_effective_status = 'sent',
    'acceptance', v_acceptance,
    'payment_link', v_payment_link,
    'pdf_options', v_pdf_options,
    'link_expires_at', v_link.expires_at,
    'company', (
      select jsonb_build_object(
        'id', c.id, 'name', c.name, 'email', c.email, 'phone', c.phone, 'address', c.address,
        'postal_code', c.postal_code, 'city', c.city, 'country', c.country, 'siret', c.siret,
        'siren', c.siren, 'vat_number', c.vat_number, 'iban', c.iban, 'bic', c.bic,
        'payment_methods', c.payment_methods, 'logo_url', c.logo_url, 'signature_url', c.signature_url,
        'created_at', c.created_at, 'updated_at', c.updated_at
      )
      from public.companies c where c.id = v_company_id
    ),
    'profile', (
      select jsonb_build_object('first_name', pr.first_name, 'last_name', pr.last_name, 'iban', pr.iban, 'bic', pr.bic)
      from public.profiles pr where pr.id = v_owner
    ),
    'client', (
      select jsonb_build_object(
        'id', cl.id, 'user_id', cl.user_id, 'name', cl.name, 'email', cl.email, 'phone', cl.phone,
        'company', cl.company, 'address', cl.address, 'postal_code', cl.postal_code, 'city', cl.city,
        'country', cl.country, 'siren', cl.siren, 'siret', cl.siret, 'vat_number', cl.vat_number,
        'notes', null, 'created_at', cl.created_at, 'updated_at', cl.updated_at
      )
      from public.clients cl where cl.id = v_client_id
    ),
    'settings', (
      select to_jsonb(s) - 'next_quote_number' - 'next_invoice_number' - 'next_credit_note_number'
      from public.settings s where s.company_id = v_company_id
      limit 1
    ),
    'signature', (
      select jsonb_build_object('signature_url', ds.signature_url, 'signed_at', ds.signed_at)
      from public.document_signatures ds
      where ds.document_type = v_link.document_type and ds.document_id = v_link.document_id
      order by ds.signed_at desc nulls last
      limit 1
    )
  );
end;
$$;

revoke all on function public.get_public_document(text) from public;
grant execute on function public.get_public_document(text) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Réponse du client à un devis
-- -----------------------------------------------------------------------------

create or replace function public.respond_to_public_quote(
  p_token text,
  p_decision text,
  p_signer_name text,
  p_signer_email text default null,
  p_signature text default null,
  p_comment text default null,
  p_consent boolean default false
)
returns jsonb
language plpgsql
security definer
set search_path = public, extensions, pg_temp
as $$
declare
  v_link public.document_share_links%rowtype;
  v_quote public.quotes%rowtype;
  v_name text := nullif(regexp_replace(trim(coalesce(p_signer_name, '')), '\s+', ' ', 'g'), '');
  v_email text := nullif(lower(trim(coalesce(p_signer_email, ''))), '');
  v_comment text := nullif(trim(coalesce(p_comment, '')), '');
  v_snapshot jsonb;
  v_hash text;
  v_consent text;
  v_id uuid;
  v_at timestamptz := timezone('utc', now());
begin
  v_link := public.resolve_share_link(p_token);

  if v_link.document_type <> 'quote' then
    raise exception 'LINK_INVALID';
  end if;
  if p_decision not in ('accepted', 'rejected') then
    raise exception 'DECISION_INVALID';
  end if;

  -- Verrou : deux clics simultanés ne donnent qu'une seule réponse.
  select * into v_quote from public.quotes where id = v_link.document_id for update;

  if v_quote.id is null or v_quote.deleted_at is not null then
    raise exception 'LINK_INVALID';
  end if;
  if v_quote.status::text not in ('draft', 'sent') then
    raise exception 'QUOTE_ALREADY_ANSWERED';
  end if;
  if v_quote.valid_until is not null and v_quote.valid_until < public.paris_today() then
    raise exception 'QUOTE_EXPIRED';
  end if;

  if v_name is null or char_length(v_name) < 2 or char_length(v_name) > 120 then
    raise exception 'SIGNER_NAME_REQUIRED';
  end if;
  if v_email is not null and (char_length(v_email) > 254 or v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]{2,}$') then
    raise exception 'SIGNER_EMAIL_INVALID';
  end if;
  if v_comment is not null and char_length(v_comment) > 2000 then
    raise exception 'COMMENT_TOO_LONG';
  end if;

  if p_decision = 'accepted' then
    if coalesce(p_consent, false) is not true then
      raise exception 'CONSENT_REQUIRED';
    end if;
    if p_signature is null
      or p_signature !~ '^data:image/png;base64,[A-Za-z0-9+/=]+$'
      or char_length(p_signature) < 200
      or char_length(p_signature) > 500000 then
      raise exception 'SIGNATURE_REQUIRED';
    end if;
    v_consent := format(
      'Bon pour accord. Je, soussigné(e) %s, reconnais avoir pris connaissance du devis n° %s d''un montant de %s € TTC et l''accepte sans réserve.',
      v_name,
      v_quote.number,
      replace(replace(to_char(v_quote.total_ttc, 'FM999,999,990.00'), ',', ' '), '.', ',')
    );
  end if;

  v_snapshot := public.quote_public_snapshot(v_quote.id);
  v_hash := encode(extensions.digest(v_snapshot::text, 'sha256'), 'hex');

  insert into public.quote_acceptances (
    quote_id, quote_number, user_id, company_id, link_id, decision,
    signer_name, signer_email, signature_image, comment, consent_text,
    total_ttc, document_snapshot, document_hash, ip_address, user_agent, created_at
  )
  values (
    v_quote.id, v_quote.number, v_quote.user_id, v_quote.company_id, v_link.id, p_decision,
    v_name, v_email, case when p_decision = 'accepted' then p_signature end, v_comment, v_consent,
    v_quote.total_ttc, v_snapshot, v_hash, public.request_client_ip(),
    left(public.request_header('user-agent'), 500), v_at
  )
  returning id into v_id;

  update public.quotes
  set status = p_decision::public.quote_status, updated_at = v_at
  where id = v_quote.id;

  -- La signature apparaît dans le bloc « Signature du client » du PDF.
  if p_decision = 'accepted' then
    insert into public.document_signatures (user_id, company_id, document_type, document_id, signature_url, signer_name, signed_at)
    values (v_quote.user_id, v_quote.company_id, 'quote', v_quote.id, p_signature, v_name, v_at)
    on conflict (user_id, document_type, document_id)
    do update set signature_url = excluded.signature_url,
                  signer_name = excluded.signer_name,
                  signed_at = excluded.signed_at,
                  company_id = excluded.company_id;
  end if;

  return jsonb_build_object(
    'id', v_id,
    'decision', p_decision,
    'created_at', v_at,
    'document_hash', v_hash
  );
end;
$$;

revoke all on function public.respond_to_public_quote(text, text, text, text, text, text, boolean) from public;
grant execute on function public.respond_to_public_quote(text, text, text, text, text, text, boolean) to anon, authenticated;
