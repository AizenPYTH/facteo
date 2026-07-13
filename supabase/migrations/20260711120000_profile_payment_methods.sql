-- Moyens de paiement acceptés (profil entreprise)
begin;

alter table public.profiles
  add column if not exists payment_methods jsonb not null default '["bank_transfer"]'::jsonb;

comment on column public.profiles.payment_methods is
  'Moyens de paiement acceptés (bank_transfer, cash, card, cheque, paypal, stripe).';

do $$ begin
  alter table public.profiles
    add constraint profiles_payment_methods_is_array
    check (jsonb_typeof(payment_methods) = 'array');
exception
  when duplicate_object then null;
end $$;

commit;
