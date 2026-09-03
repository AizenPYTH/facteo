-- Soft-delete of products was an UPDATE (deleted_at, is_active=false), not a DELETE.
-- Postgres applies SELECT policies to the NEW row when the statement has RETURNING
-- (PostgREST PATCH). products_select_active_own required deleted_at IS NULL, so the
-- updated row failed WITH CHECK: "new row violates row-level security policy for table 'products'".
--
-- Keep soft-delete (invoice/quote lines keep product_id via ON DELETE SET NULL only
-- on hard delete). SELECT is tenant-scoped without deleted_at; the app still filters
-- deleted_at IS NULL. UPDATE/DELETE follow the same company membership as clients.

begin;

-- Remaining products created before company backfill.
update public.products p
set company_id = sub.company_id
from (
  select distinct on (user_id) user_id, company_id
  from public.company_members
  order by user_id, case when role = 'owner' then 0 else 1 end, company_id
) sub
where p.company_id is null
  and p.user_id = sub.user_id;

create index if not exists products_company_id_idx
  on public.products (company_id)
  where deleted_at is null;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row
  execute function public.set_updated_at();

drop policy if exists products_select_active_own on public.products;
drop policy if exists products_select_own on public.products;
create policy products_select_own on public.products
  for select to authenticated
  using (
    (company_id is not null and public.user_has_company_access(company_id))
    or (company_id is null and auth.uid() = user_id)
  );

drop policy if exists products_insert_own on public.products;
create policy products_insert_own on public.products
  for insert to authenticated
  with check (
    auth.uid() = user_id
    and deleted_at is null
    and (company_id is null or public.user_has_company_access(company_id))
  );

drop policy if exists products_update_own on public.products;
create policy products_update_own on public.products
  for update to authenticated
  using (
    (company_id is not null and public.user_has_company_access(company_id))
    or (company_id is null and auth.uid() = user_id)
  )
  with check (
    (company_id is not null and public.user_has_company_access(company_id))
    or (company_id is null and auth.uid() = user_id)
  );

drop policy if exists products_delete_own on public.products;
create policy products_delete_own on public.products
  for delete to authenticated
  using (
    (company_id is not null and public.user_has_company_access(company_id))
    or (company_id is null and auth.uid() = user_id)
  );

grant select, insert, update, delete on public.products to authenticated;

commit;
