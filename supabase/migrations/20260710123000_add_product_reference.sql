-- Référence produit / SKU (optionnel, unique par utilisateur parmi les actifs)
alter table public.products
  add column if not exists reference text;

comment on column public.products.reference is 'Référence interne ou SKU (optionnel).';

create unique index if not exists products_user_reference_unique_idx
  on public.products (user_id, reference)
  where reference is not null and deleted_at is null;
