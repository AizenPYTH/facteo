-- Titre et description séparés pour chaque prestation.
--
-- Rétrocompatibilité : `title` est nullable et aucune donnée existante n'est
-- déplacée. Les lignes historiques gardent leur `description` seule ; l'app
-- affiche alors la description comme désignation principale.
-- Les nouvelles lignes peuvent renseigner l'un, l'autre ou les deux.

alter table public.quote_items
  add column if not exists title text;

alter table public.invoice_items
  add column if not exists title text;

comment on column public.quote_items.title is
  'Nom court de la prestation. Indépendant de description. Null pour les lignes créées avant la séparation titre/description.';

comment on column public.invoice_items.title is
  'Nom court de la prestation. Indépendant de description. Null pour les lignes créées avant la séparation titre/description.';

-- `description` reste NOT NULL mais peut désormais être une chaîne vide
-- (prestation avec un titre seul).
alter table public.quote_items
  alter column description set default '';

alter table public.invoice_items
  alter column description set default '';
