drop policy if exists companies_delete_owner on public.companies;
create policy companies_delete_owner on public.companies
  for delete to authenticated
  using (
    exists (
      select 1
      from public.company_members cm
      where cm.company_id = companies.id
        and cm.user_id = auth.uid()
        and cm.role = 'owner'
    )
  );
