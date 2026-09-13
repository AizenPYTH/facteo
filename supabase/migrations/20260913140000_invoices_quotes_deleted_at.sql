-- ---------------------------------------------------------------------------
-- Rétablir la colonne `deleted_at` sur les documents
--
-- Le schéma initial du dépôt (20260709000000) déclare `deleted_at` sur
-- `quotes` et `invoices`, et plusieurs Edge Functions filtrent dessus. La base
-- de production ne l'a pas : les migrations distantes ont divergé du dépôt.
--
-- En PostgreSQL, filtrer sur une colonne absente ne renvoie pas un résultat
-- vide : la requête ÉCHOUE. Trois fonctions serveur étaient donc silencieuse-
-- ment hors service dès qu'elles touchaient une facture :
--   * send-document-email   → « Document introuvable » à chaque envoi
--   * superpdp-send-invoice → aucune facture trouvée, envoi impossible
--   * superpdp-sync         → aucune ligne remontée, synchronisation vide
--
-- Migration purement additive : colonne nullable, sans valeur par défaut,
-- aucune donnée modifiée. Rien n'écrit encore dedans — la suppression reste
-- définitive — mais les filtres cessent de faire échouer les requêtes.
-- ---------------------------------------------------------------------------

alter table public.quotes
  add column if not exists deleted_at timestamptz;

alter table public.invoices
  add column if not exists deleted_at timestamptz;

comment on column public.quotes.deleted_at is 'Soft delete : NULL = actif.';
comment on column public.invoices.deleted_at is 'Soft delete : NULL = actif.';

create index if not exists quotes_deleted_at_idx
  on public.quotes (deleted_at)
  where deleted_at is null;

create index if not exists invoices_deleted_at_idx
  on public.invoices (deleted_at)
  where deleted_at is null;
