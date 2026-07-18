alter table public.products
  add column if not exists price_ttc numeric(12,2),
  add column if not exists sku text,
  add column if not exists barcode_ean text,
  add column if not exists category text,
  add column if not exists brand text,
  add column if not exists supplier text,
  add column if not exists stock_quantity numeric(12,3) not null default 0,
  add column if not exists stock_alert_threshold numeric(12,3) not null default 0,
  add column if not exists notes text,
  add column if not exists image_url text;

create index if not exists idx_products_sku on public.products (sku) where deleted_at is null;
create index if not exists idx_products_barcode_ean on public.products (barcode_ean) where deleted_at is null;
