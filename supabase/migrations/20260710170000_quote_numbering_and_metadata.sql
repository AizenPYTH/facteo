-- Numérotation atomique des devis + métadonnées complémentaires

alter table public.quotes
  add column if not exists internal_notes text,
  add column if not exists payment_terms_days integer
    check (payment_terms_days is null or payment_terms_days > 0);

comment on column public.quotes.internal_notes is 'Notes internes (non visibles sur le PDF client).';
comment on column public.quotes.payment_terms_days is 'Délai de paiement spécifique à ce devis (jours).';

create or replace function public.reserve_next_quote_number(p_user_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_next integer;
  v_year text;
  v_number text;
begin
  if p_user_id is distinct from auth.uid() then
    raise exception 'Unauthorized';
  end if;

  select quote_prefix, next_quote_number
  into v_prefix, v_next
  from public.settings
  where user_id = p_user_id
  for update;

  if not found then
    v_prefix := 'DEV';
    v_next := 1;

    insert into public.settings (user_id, quote_prefix, next_quote_number)
    values (p_user_id, v_prefix, 2)
    on conflict (user_id) do nothing;

    if not found then
      select quote_prefix, next_quote_number
      into v_prefix, v_next
      from public.settings
      where user_id = p_user_id
      for update;
    end if;
  end if;

  v_year := to_char(timezone('utc', now()), 'YYYY');
  v_number := v_prefix || '-' || v_year || '-' || lpad(v_next::text, 6, '0');

  update public.settings
  set next_quote_number = v_next + 1,
      updated_at = timezone('utc', now())
  where user_id = p_user_id;

  return v_number;
end;
$$;

comment on function public.reserve_next_quote_number(uuid) is
  'Réserve et incrémente atomiquement le prochain numéro de devis (ex. DEV-2026-000001).';

grant execute on function public.reserve_next_quote_number(uuid) to authenticated;
