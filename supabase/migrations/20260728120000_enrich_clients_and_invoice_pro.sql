-- Enrich clients for AI import + invoice credit notes / revisions.

alter table public.clients
  add column if not exists address_line2 text,
  add column if not exists region text,
  add column if not exists website text;

comment on column public.clients.address_line2 is 'Address complement (building, floor, etc.)';
comment on column public.clients.region is 'Region / state / district';
comment on column public.clients.website is 'Company website URL';

-- Invoice document kind: standard invoice vs credit note (avoir)
alter table public.invoices
  add column if not exists document_kind text not null default 'invoice',
  add column if not exists credit_of_invoice_id uuid references public.invoices(id) on delete set null,
  add column if not exists vat_regime text not null default 'standard',
  add column if not exists revision integer not null default 1;

alter table public.invoices
  drop constraint if exists invoices_document_kind_chk;

alter table public.invoices
  add constraint invoices_document_kind_chk
  check (document_kind in ('invoice', 'credit_note'));

alter table public.invoices
  drop constraint if exists invoices_vat_regime_chk;

alter table public.invoices
  add constraint invoices_vat_regime_chk
  check (
    vat_regime in (
      'standard',
      'eu_reverse_charge',
      'export_outside_eu',
      'exempt'
    )
  );

create index if not exists invoices_credit_of_invoice_id_idx
  on public.invoices (credit_of_invoice_id)
  where credit_of_invoice_id is not null;

-- Credit note numbering settings
alter table public.settings
  add column if not exists credit_note_prefix text not null default 'AV-',
  add column if not exists next_credit_note_number integer not null default 1;

-- Invoice revision history
create table if not exists public.invoice_revisions (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  company_id uuid references public.companies(id) on delete cascade,
  revision integer not null,
  reason text,
  snapshot jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists invoice_revisions_invoice_id_idx
  on public.invoice_revisions (invoice_id, created_at desc);

alter table public.invoice_revisions enable row level security;

drop policy if exists invoice_revisions_select_own on public.invoice_revisions;
create policy invoice_revisions_select_own on public.invoice_revisions
  for select to authenticated
  using (
    company_id in (
      select cm.company_id from public.company_members cm where cm.user_id = auth.uid()
    )
  );

drop policy if exists invoice_revisions_insert_own on public.invoice_revisions;
create policy invoice_revisions_insert_own on public.invoice_revisions
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and company_id in (
      select cm.company_id from public.company_members cm where cm.user_id = auth.uid()
    )
  );

grant select, insert on public.invoice_revisions to authenticated;

-- Reserve next credit note number
create or replace function public.reserve_next_credit_note_number(p_company_id uuid)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prefix text;
  v_next integer;
begin
  if auth.uid() is null then
    raise exception 'Unauthorized';
  end if;

  if not exists (
    select 1 from public.company_members
    where company_id = p_company_id and user_id = auth.uid()
  ) then
    raise exception 'Unauthorized';
  end if;

  update public.settings
  set
    next_credit_note_number = coalesce(next_credit_note_number, 1) + 1,
    updated_at = timezone('utc', now())
  where company_id = p_company_id
  returning credit_note_prefix, next_credit_note_number - 1
  into v_prefix, v_next;

  if v_next is null then
    insert into public.settings (user_id, company_id, credit_note_prefix, next_credit_note_number)
    values (auth.uid(), p_company_id, 'AV-', 2)
    on conflict (user_id) do update
      set
        company_id = excluded.company_id,
        next_credit_note_number = coalesce(settings.next_credit_note_number, 1) + 1
    returning credit_note_prefix, next_credit_note_number - 1
    into v_prefix, v_next;
  end if;

  return coalesce(v_prefix, 'AV-') || lpad(v_next::text, 5, '0');
end;
$$;

grant execute on function public.reserve_next_credit_note_number(uuid) to authenticated;
