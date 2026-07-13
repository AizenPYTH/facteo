-- Statut partiellement payée + numérotation atomique des factures

do $$ begin
  alter type public.invoice_status add value if not exists 'partially_paid';
exception
  when duplicate_object then null;
end $$;

comment on type public.invoice_status is
  'Cycle de vie d''une facture (draft, sent, partially_paid, paid, overdue, canceled).';

create or replace function public.reserve_next_invoice_number(p_user_id uuid)
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

  select invoice_prefix, next_invoice_number
  into v_prefix, v_next
  from public.settings
  where user_id = p_user_id
  for update;

  if not found then
    v_prefix := 'FAC';
    v_next := 1;

    insert into public.settings (user_id, invoice_prefix, next_invoice_number)
    values (p_user_id, v_prefix, 2)
    on conflict (user_id) do nothing;

    if not found then
      select invoice_prefix, next_invoice_number
      into v_prefix, v_next
      from public.settings
      where user_id = p_user_id
      for update;
    end if;
  end if;

  v_year := to_char(timezone('utc', now()), 'YYYY');
  v_number := v_prefix || '-' || v_year || '-' || lpad(v_next::text, 6, '0');

  update public.settings
  set next_invoice_number = v_next + 1,
      updated_at = timezone('utc', now())
  where user_id = p_user_id;

  return v_number;
end;
$$;

comment on function public.reserve_next_invoice_number(uuid) is
  'Réserve et incrémente atomiquement le prochain numéro de facture (ex. FAC-2026-000001).';

grant execute on function public.reserve_next_invoice_number(uuid) to authenticated;
