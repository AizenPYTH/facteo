-- Enforce the monthly document quota (quotes + invoices) on INSERT.
-- Client-side check_plan_limit remains for UX; this trigger is the source of truth
-- so a direct PostgREST insert cannot bypass the Micro limit.
-- Unlimited plans (max_documents_per_month IS NULL) are unchanged.
-- service_role / jobs without auth.uid() are not blocked (e-invoicing inbound).

create index if not exists quotes_user_id_created_at_idx
  on public.quotes (user_id, created_at);

create index if not exists invoices_user_id_created_at_idx
  on public.invoices (user_id, created_at);

create or replace function public.enforce_document_plan_limit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_check jsonb;
begin
  if v_uid is null then
    return new;
  end if;

  perform public.ensure_user_subscription();

  perform 1
  from public.subscriptions
  where user_id = v_uid
  for update;

  v_check := public.check_plan_limit('documents');

  if coalesce((v_check ->> 'allowed')::boolean, false) is not true then
    raise exception 'PLAN_LIMIT_REACHED:documents'
      using errcode = 'P0001',
            detail = v_check::text;
  end if;

  return new;
end;
$$;

comment on function public.enforce_document_plan_limit() is
  'BEFORE INSERT on quotes/invoices: blocks authenticated users who exceeded max_documents_per_month.';

revoke all on function public.enforce_document_plan_limit() from public, anon, authenticated;

drop trigger if exists quotes_enforce_document_plan_limit on public.quotes;
create trigger quotes_enforce_document_plan_limit
  before insert on public.quotes
  for each row
  execute function public.enforce_document_plan_limit();

drop trigger if exists invoices_enforce_document_plan_limit on public.invoices;
create trigger invoices_enforce_document_plan_limit
  before insert on public.invoices
  for each row
  execute function public.enforce_document_plan_limit();
