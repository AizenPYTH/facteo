-- =============================================================================
-- Suppression d'une entreprise par son propriétaire.
--
-- Une suppression directe de `companies` échouait : réglages, clients,
-- devis, factures… y sont rattachés sans suppression en cascade, et le
-- garde-fou des membres refusait le retrait automatique. Cette fonction
-- supprime l'entreprise et toutes ses données, dans le bon ordre.
--
-- - réservée au propriétaire de l'entreprise ;
-- - impossible sur la dernière entreprise du compte ;
-- - l'abonnement du compte est conservé (simplement détaché).
-- =============================================================================

create or replace function public.delete_company(p_company_id uuid)
returns void
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_user uuid := auth.uid();
begin
  if v_user is null then
    raise exception 'Unauthorized' using errcode = '42501';
  end if;

  if not exists (
    select 1 from public.company_members
    where company_id = p_company_id and user_id = v_user and role = 'owner'
  ) then
    raise exception 'COMPANY_DELETE_FORBIDDEN' using errcode = '42501';
  end if;

  if (select count(*) from public.company_members where user_id = v_user) <= 1 then
    raise exception 'COMPANY_DELETE_LAST' using errcode = 'P0001';
  end if;

  -- Abonnement du compte : conservé, seulement détaché de cette entreprise.
  perform set_config('inveq.allow_subscription_write', 'on', true);
  update public.subscriptions set company_id = null where company_id = p_company_id;
  perform set_config('inveq.allow_subscription_write', 'off', true);

  -- Documents et données de l'entreprise.
  delete from public.invoice_payments where company_id = p_company_id;
  delete from public.invoice_items where company_id = p_company_id;
  delete from public.stripe_payment_sessions where company_id = p_company_id;
  delete from public.invoices where company_id = p_company_id;
  delete from public.quote_items where company_id = p_company_id;
  delete from public.quotes where company_id = p_company_id;
  delete from public.document_signatures where company_id = p_company_id;
  delete from public.sent_documents where company_id = p_company_id;
  delete from public.clients where company_id = p_company_id;
  delete from public.products where company_id = p_company_id;
  delete from public.settings where company_id = p_company_id;

  -- L'entreprise ; ses membres et intégrations suivent en cascade.
  perform set_config('inveq.allow_membership_write', 'on', true);
  delete from public.companies where id = p_company_id;
  perform set_config('inveq.allow_membership_write', 'off', true);
end;
$$;

revoke all on function public.delete_company(uuid) from public, anon;
grant execute on function public.delete_company(uuid) to authenticated;
