-- V1 compliance: seller legal identity + delivery/service date on invoices

alter table public.companies
  add column if not exists legal_form text,
  add column if not exists share_capital text,
  add column if not exists rcs_city text,
  add column if not exists siren text;

do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public' and table_name = 'invoices'
  ) then
    alter table public.invoices
      add column if not exists service_date date;
  end if;
end $$;

comment on column public.companies.legal_form is 'Forme juridique (SAS, SARL, EI, micro-entreprise, etc.)';
comment on column public.companies.share_capital is 'Capital social (texte libre, ex. 10 000 €)';
comment on column public.companies.rcs_city is 'Ville du RCS ou mention RM';
comment on column public.companies.siren is 'SIREN (9 chiffres), dérivable du SIRET';
comment on column public.invoices.service_date is 'Date de livraison ou d’exécution de la prestation';
