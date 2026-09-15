-- Suppression de l'intégration e-commerce (eBay).
--
-- La fonctionnalité est retirée de l'application et du site. Les objets créés
-- par `20260913090000_ebay_integration.sql` n'ont plus aucun appelant : ni les
-- Edge Functions (supprimées), ni le client mobile, ni le site.
--
-- Tout est en `if exists` : la migration est sans effet sur une base qui n'a
-- jamais reçu l'intégration, et nettoie celle qui l'a reçue.
--
-- CE QUI EST PERDU : les commandes importées et leur rattachement aux
-- factures. CE QUI EST CONSERVÉ : les factures elles-mêmes, y compris celles
-- créées depuis une commande eBay — elles vivent dans `invoices` et ne
-- dépendent d'aucun de ces objets.

-- Fonctions d'abord : elles référencent les tables.
drop function if exists public.link_external_order_invoice(uuid, uuid);
drop function if exists public.disconnect_integration(uuid, text);
drop function if exists public.purge_expired_integration_oauth_states();

-- La vue masquait les jetons ; plus rien à masquer.
drop view if exists public.integration_status;

-- Tables. `external_orders` porte une clé étrangère vers `invoices` : la
-- supprimer ne touche pas les factures, seulement le lien.
drop table if exists public.external_orders;
drop table if exists public.integration_oauth_states;
drop table if exists public.integrations;
