-- Retrait de la table du login par QR code PC → mobile.
--
-- La fonctionnalité a été abandonnée et son code applicatif supprimé (commit
-- 02a01d5). Il ne reste que cette table, créée par
-- 20260902160000_mobile_login_challenges.sql : plus aucune fonction Edge ni
-- aucun code client ne la référence, et elle n'était accessible qu'au
-- service_role.
--
-- La migration d'origine n'est pas supprimée : elle a déjà été appliquée, et
-- l'effacer du dossier ne retirerait rien de la base tout en désynchronisant
-- l'historique des environnements existants.
--
-- Aucune donnée métier n'est concernée : la table ne contenait que des défis
-- d'authentification à usage unique, tous expirés.

drop table if exists public.mobile_login_challenges;
