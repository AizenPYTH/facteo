-- Présentation de la facture choisie à la création : titre du document
-- (« Facture », « Facture d'acompte »…) et identifiants de l'émetteur affichés
-- en tête (SIREN, SIRET, TVA).
--
-- Rétrocompatibilité : colonne nullable. `null` = présentation par défaut
-- (titre « Facture », SIRET et TVA), identique aux factures existantes.
-- Le site lit et écrit cette colonne en tolérant son absence : il fonctionne
-- avant comme après l'application de cette migration.

alter table public.invoices
  add column if not exists pdf_options jsonb;

comment on column public.invoices.pdf_options is
  'Présentation du PDF : {"title": text|null, "legal_ids": ["siren"|"siret"|"vat"]}. Null = défaut.';
