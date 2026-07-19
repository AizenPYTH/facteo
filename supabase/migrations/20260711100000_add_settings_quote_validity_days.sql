-- =============================================================================
-- Factume — Colonnes settings manquantes (quote_validity_days, etc.)
-- =============================================================================
-- Idempotent : corrige les bases créées sans le schéma MVP complet.
-- =============================================================================

begin;

alter table public.settings
  add column if not exists quote_validity_days integer not null default 30;

do $$ begin
  alter table public.settings
    add constraint settings_quote_validity_days_chk
    check (quote_validity_days > 0);
exception
  when duplicate_object then null;
end $$;

alter table public.settings
  add column if not exists payment_terms_days integer not null default 30;

do $$ begin
  alter table public.settings
    add constraint settings_payment_terms_days_chk
    check (payment_terms_days > 0);
exception
  when duplicate_object then null;
end $$;

alter table public.settings
  add column if not exists quote_footer text,
  add column if not exists invoice_footer text,
  add column if not exists default_vat_rate numeric(5, 2) not null default 20,
  add column if not exists currency text not null default 'EUR',
  add column if not exists locale text not null default 'fr-FR',
  add column if not exists quote_prefix text not null default 'DEV',
  add column if not exists invoice_prefix text not null default 'FAC',
  add column if not exists next_quote_number integer not null default 1,
  add column if not exists next_invoice_number integer not null default 1;

comment on column public.settings.quote_validity_days is
  'Durée de validité par défaut des devis (jours).';

commit;
