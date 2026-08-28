# INVEQ V1 — Audit global (pré-publication)

Date : 2026-07-28  
Périmètre : application mobile (Expo) + web app (`website/`) + Supabase

---

## 1. Terminé dans cette phase

### Identité client (entreprise OU nom + prénom)
- Règle unique `hasValidClientIdentity` (mobile + web).
- Schémas Zod alignés (création, édition, picker, import IA).
- Stockage DB : client société seule → `name` = raison sociale ; relecture sans inventer un faux « nom ».
- Formulaires et hint UX mis à jour.
- Prompt Edge Function `parse-clients` mis à jour.

### Mentions légales facture (France)
- Escompte (néant), pénalités (3× taux légal), indemnité forfaitaire 40 € — toujours présentes sur le PDF facture.
- Mentions TVA par régime conservées (standard, autoliquidation UE, export, franchise 293 B).
- PDF avoir : titre **AVOIR**, référence facture d’origine, section dédiée.
- Identité vendeur enrichie : forme juridique, capital, RCS/RM, SIREN (+ SIRET / TVA).
- Date de livraison / prestation (`service_date`) ajoutée (mobile + PDF).

### Validation intelligente avant émission
- Préflight renforcé : client valide, adresse vendeur, SIRET, TVA vendeur, cohérence autoliquidation/export, devise, totaux, identité client.
- Messages d’erreur cumulés et lisibles (plus un seul code technique opaque).

### Finition UX (premiers leviers)
- Formulaire client moins contraignant et plus clair (particuliers / indépendants / sociétés).
- Profil entreprise : champs légaux exposés.
- Bloc paiement PDF toujours rendu (plus de section vide si IBAN absent).

Migration : `20260729120000_company_legal_fields_and_invoice_service_date.sql`

---

## 2. Audit juridique — état de conformité

| Obligation | Statut V1 | Commentaire |
|---|---|---|
| Nom / adresse vendeur | Partiel → renforcé | Adresse + SIRET bloquants à l’émission |
| Forme juridique / capital / RCS | Ajouté | Champs optionnels au formulaire ; warning préflight si forme absente |
| SIREN / SIRET / TVA | Renforcé | SIRET obligatoire pour émettre ; TVA warning sauf franchise |
| Mentions TVA 293 B / 196 / 262 I | OK | Footer PDF |
| Pénalités de retard (taux) | OK | Mention légale standard |
| Indemnité 40 € | OK | Mention légale standard |
| Escompte (même néant) | OK | Mention légale standard |
| Conditions / échéance | OK | Toujours affichées |
| Avoir (numéro + PDF) | OK | Titre AVOIR + ref. d’origine |
| Acompte | Non V1 | Reporté V1.1 |
| Date livraison / prestation | OK (mobile) | Champ + PDF ; web composer à compléter |
| Numérotation chronologique | Partiel | Séquences atomiques ; trous possibles si brouillon supprimé |
| Conservation 10 ans | Policy | Soft-delete + pas de suppression des émises |
| Lignes HT / TVA / TTC | OK | |
| Devise PDF | Partiel | Settings EUR par défaut ; PDF encore orienté EUR |

> Cet audit logiciel ne remplace pas un avis d’avocat / expert-comptable. Les mentions de pénalités utilisent la formulation légale minimale courante ; un taux contractuel personnalisé peut être ajouté en V1.1 via les paramètres.

---

## 3. Ce qui reste à faire avant / juste après publication stores

### Bloquant ou fortement recommandé
1. **Appliquer la migration** `20260729120000_...` sur le projet Supabase prod.
2. **Compléter le profil entreprise** de chaque compte (SIRET, adresse, forme juridique) — le préflight bloque sinon.
3. **Date de prestation sur le composer web** (parité mobile).
4. **Numérotation sans trou** : réserver le numéro à la finalisation (pas à la création du brouillon).
5. **Tests bout-en-bout** store : création client société seule, devis → facture, Stripe, PDF, partage iOS/Android.
6. **Assets stores** : captures, privacy policy, compte démo review.

### Non bloquant V1 / V1.1
- Factures d’acompte + solde.
- Taux de pénalités / escompte configurables par entreprise.
- QR code paiement (placeholder retiré ou branché).
- Parité complète settings numérotation mobile (footers, devise).
- Voice AI (`process-voice-command`) non branché UI.
- Amélioration recherche / catalogue (filtres avancés).

---

## 4. Audit UX — points traités / restants

### Traités
- Client : contrainte « nom obligatoire » retirée ; hint clair.
- Émission facture : erreurs explicites multi-points.
- PDF : mentions légales visibles ; avoir identifiable.

### Restants (qualité perçue)
- Composer web : dates d’émission / échéance / prestation peu exposées vs mobile.
- Quelques « bientôt disponible » (QR paiement, archivage entreprise, dark mode web).
- Messages réseau encore parfois techniques sur certains flux catalogue.
- Animations / états vides à harmoniser entre listes (clients, devis, factures).

---

## 5. Limites connues V1

1. **Pas de module acompte** dédié.
2. **Trous de numérotation** si un brouillon numéroté est supprimé.
3. **Mentions pénalités** génériques (3× taux légal) — pas encore éditables.
4. **Conformité PDF devise** : multi-devise settings partielle.
5. **Pas de validation juridique externe** automatisée (VIES live, etc.).
6. **Conservation 10 ans** : responsabilité utilisateur + politique ; pas d’export légal archivistique packagé.

---

## 6. Verdict publication

La V1 est **suffisamment aboutie pour une première publication** App Store / Play Store **après** :
- migration prod appliquée,
- smoke tests des parcours critiques,
- comptes de revue avec profil entreprise complet.

Niveau de qualité : comparable à une facturation SMB moderne sur le cœur devis/facture/paiement/PDF, avec des écarts connus (acomptes, numérotation stricte, parité web dates) clairement listés pour V1.1.
