-- Remise sur les lignes + historique des paiements partiels

alter table public.quote_items
  add column if not exists discount_percent numeric(5, 2) not null default 0
    check (discount_percent >= 0 and discount_percent <= 100);

alter table public.invoice_items
  add column if not exists discount_percent numeric(5, 2) not null default 0
    check (discount_percent >= 0 and discount_percent <= 100);

comment on column public.quote_items.discount_percent is 'Remise en pourcentage appliquée à la ligne HT.';
comment on column public.invoice_items.discount_percent is 'Remise en pourcentage appliquée à la ligne HT.';

create table if not exists public.invoice_payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid not null references public.invoices (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  paid_at timestamptz not null default timezone('utc', now()),
  payment_method text,
  payment_reference text,
  notes text,
  created_at timestamptz not null default timezone('utc', now())
);

comment on table public.invoice_payments is 'Paiements partiels ou complets sur une facture.';

create index if not exists invoice_payments_invoice_id_idx on public.invoice_payments (invoice_id);
create index if not exists invoice_payments_user_id_idx on public.invoice_payments (user_id);

alter table public.invoice_payments enable row level security;

create policy invoice_payments_select_own on public.invoice_payments
  for select to authenticated
  using (user_id = auth.uid());

create policy invoice_payments_insert_own on public.invoice_payments
  for insert to authenticated
  with check (user_id = auth.uid());

create policy invoice_payments_delete_own on public.invoice_payments
  for delete to authenticated
  using (user_id = auth.uid());
