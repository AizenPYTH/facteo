# Handoff — Refonte de l'espace connecté INVEQ (v2)

## Vue d'ensemble

Refonte UX/UI des écrans connectés d'INVEQ (facturation, devis, catalogue, paiements) avec trois objectifs dictés par le brief :

1. **Emplacement d'action stable** — l'action primaire de chaque écran est toujours au même endroit : en haut à droite du header, même gabarit, même style, sur tous les écrans. Plus de bouton qui change de place selon la page.
2. **Outils IA mis en avant** — l'import par image et l'import par tableur ne sont plus enfouis dans l'éditeur : entrée de nav dédiée, bandeau sur le tableau de bord, boutons dans la barre d'outils du catalogue, entrées dans le menu « Créer » et dans la palette ⌘K.
3. **Flux repensés** — tableau de bord orienté « à traiter aujourd'hui », listes en tableau plein largeur + panneau de détail, une seule action primaire contextuelle par document, éditeur en 3 colonnes avec totaux toujours visibles.

Identité conservée : logo `/logo-inveq.png`, fond blanc dominant, indigo/violet en accent, navy pour le texte.

## À propos des fichiers de design

Les fichiers de ce dossier sont des **références de design réalisées en HTML** : un prototype qui montre l'apparence et le comportement attendus, **pas du code de production à copier**. Le travail consiste à **recréer ces écrans dans l'environnement existant du dépôt** — `AizenPYTH/facteo`, sous-arbre `website/` (Next.js App Router + Tailwind v4 + Supabase + TanStack Query + lucide-react + framer-motion) — en suivant ses patterns établis.

Contrainte forte, identique au handoff précédent du dépôt (`docs/design/APP-DESIGN-HANDOFF.md`) : **aucune fonctionnalité nouvelle, aucune fonctionnalité supprimée** côté données. Les hooks, requêtes, mutations, validations, routes et query params restent identiques ; seule la couche présentation change. Ne pas réécrire `lib/domain/**`, `hooks/**`, `providers/**`, `middleware.ts`, ni les migrations Supabase.

Exception assumée : les écrans « Outils IA » et les flux d'import décrits au §6 supposent des endpoints d'import déjà présents (import IA / CSV existant dans l'éditeur). Si un endpoint manque côté serveur, livrer l'UI et brancher sur l'existant, puis signaler le manque — ne pas inventer de nouvelle table.

## Fidélité

**Haute fidélité (hifi).** Couleurs, typographie, tailles, rayons, espacements et états sont définitifs et donnés en valeurs exactes ci-dessous. Recréer au pixel avec Tailwind + les composants existants de `components/app/**`.

## Design tokens

À ajouter/compléter dans `website/src/app/globals.css` (`:root` + `@theme inline`), sans casser les variables du site vitrine.

```css
:root {
  --primary: #4f46e5;          /* action primaire */
  --primary-dark: #4338ca;     /* texte sur teinte accent */
  --primary-violet: #7c3aed;   /* dégradés (barre du mois courant) */

  --app-canvas: #f6f7fb;       /* fond de page */
  --app-surface: #ffffff;      /* cartes, tableaux, panneaux */
  --app-subtle: #fafbfe;       /* en-têtes de tableau, pieds de carte */
  --app-border: #e6e9f2;
  --app-border-soft: #f3f5fa;  /* séparateurs de lignes */
  --app-text: #0f1533;
  --app-text-2: #3b4256;
  --app-muted: #6b7490;
  --app-muted-2: #8a92a8;
  --app-faint: #a3aabd;
  --app-accent-tint: #f1efff;  /* nav active, chips actives, pastilles */
  --app-accent-tint-2: #f6f4ff;/* boutons IA au repos */
  --app-accent-border: #c9c4f5;
  --app-row-selected: #f7f6ff;
  --app-row-hover: #f7f8fd;
  --app-chart-bar: #dcd9fb;
}
```

Couleurs sémantiques : succès `#059669` / tint `#ecfdf5` / texte `#047857` · alerte `#f59e0b` / `#fffbeb` / `#b45309` · danger `#dc2626` / `#fef2f2` / `#b91c1c` · bordure de carte danger `#f3d3d3`.

**Typographie** : Inter. Échelle utilisée : 10.5 / 11 / 11.5 / 12 / 12.5 / 13 / 13.5 / 14.5 / 15 / 16 / 17 / 19 / 24 / 27 / 28 px. Titres `font-weight:600`, `letter-spacing:-0.01em` (−0.02em ≥ 24 px). Libellés d'en-tête de tableau : 11px / 700 / uppercase / `letter-spacing:.07em` / `#8a92a8`. **Tous les montants, dates et quantités en `font-variant-numeric: tabular-nums`.**

**Rayons** : 20px pilules/chips · 14px cartes et sections · 16px carte d'onboarding · 12px cartes internes · 10px boutons, champs de recherche, zones de dépôt · 9px champs de formulaire et petits boutons · 8px pastilles d'icône 26–30px · 10px pastille 38–40px.

**Ombres** (deux seulement) :
- bouton primaire : `0 10px 22px -12px rgba(79,70,229,.85)`
- couche flottante (modale, palette, overlay de détail) : `0 24px 50px -24px rgba(15,21,51,.45)`
- **les cartes n'ont pas d'ombre** : `1px solid var(--app-border)` seulement.

**Densité (équilibrée)** : ligne de tableau `padding:11px 24px` (première/dernière colonne à 24px du bord), en-tête de tableau `padding:9px 24px`, champs `padding:9px 11px`, boutons `padding:9px 14px` (primaire d'en-tête `10px 16px`), gap de grille de tableau 14px.

**Motion** : uniquement `transition: background-color .15s, border-color .15s, color .15s` sur les éléments interactifs. Pas de `hover:-translate-y`, pas d'apparition `whileInView` dans `components/app/**`. framer-motion reste pour les modales.

**Focus** : `border-color:#c9c4f5` + `box-shadow:0 0 0 3px rgba(79,70,229,.14)`.

## Statuts — couleurs canoniques

Libellés issus de `INVOICE_STATUS_LABELS` / `QUOTE_STATUS_LABELS` (inchangés). Badge : `display:inline-flex; gap:6px; padding:3px 9px; border-radius:20px; font-size:11.5px; font-weight:600`, pastille 5px.

| Statut | fond | texte | pastille |
|---|---|---|---|
| `draft` | `#f3f5fa` | `#4a5268` | `#a3aabd` |
| `sent` | `#f1efff` | `#4338ca` | `#4f46e5` |
| `partially_paid` | `#fffbeb` | `#b45309` | `#f59e0b` |
| `paid` / `accepted` / `converted` | `#ecfdf5` | `#047857` | `#059669` |
| `overdue` / `rejected` | `#fef2f2` | `#b91c1c` | `#dc2626` |
| `expired` | `#fffbeb` | `#b45309` | `#f59e0b` |
| `canceled` | `#f3f5fa` | `#4a5268` | `#a3aabd` |

Centraliser dans `components/app/status-badge.tsx` (`<StatusBadge kind="invoice"|"quote" status={…} />`) et remplacer `INVOICE_STATUS_VARIANTS` / `QUOTE_STATUS_VARIANTS` de `document-workspace.tsx`.

## Socle : shell, header, tableau

### Sidebar — `components/app/app-shell.tsx`
Largeur **248px**, fond `#fff`, `border-right:1px solid #e6e9f2`, `position:sticky; top:0; height:100vh`.

Ordre vertical :
1. Logo `/logo-inveq.png`, largeur 132px, padding `18px 16px 12px`.
2. **Company switcher** : bouton pleine largeur, `padding:9px 11px`, bordure `#e6e9f2`, fond `#fafbfe`, radius 10px ; pastille 26px `#f1efff`/`#4f46e5` avec initiales, nom 13px/600, chevron `#a3aabd`.
3. **Bouton « Créer »** primaire : `background:linear-gradient(180deg,#5b52ea,#4f46e5)`, texte 13.5px/600 blanc, radius 10px, ombre bouton primaire. Ouvre le menu de création (§ Menu Créer).
4. **Déclencheur de recherche ⌘K** : bouton `padding:9px 11px`, fond `#fafbfe`, texte `#8a92a8` 13px, badge « ⌘K » 10.5px/600 en bordure `#e6e9f2`. Ouvre la palette.
5. **Nav** : items hauteur 36px, `padding:0 11px`, radius 9px, 13px (500 ; 600 si actif). Actif = fond `#f1efff`, texte et icône `#4f46e5`. Pas de barre latérale animée.
   - Groupe sans titre : Tableau de bord, Clients, Devis (compteur `3` = devis en attente), Factures (compteur `2` = factures en retard, **en rouge** : fond `#fef2f2`, texte `#b91c1c`), Paiements.
   - Groupe **CATALOGUE** : Produits, Prestations, Entreprises.
   - Groupe **ASSISTANT** : **Outils IA** (nouveau, icône sparkle).
   - Titres de groupe : 10.5px/700/uppercase/`.07em`/`#a3aabd`, `padding:14px 11px 6px`.
   - Compteurs : 11px/700 tabular-nums, pill `padding:1px 7px`, fond `#f3f5fa` (ou rouge ci-dessus).
6. Pied (`border-top:1px solid #f3f5fa`) : « Paramètres » (item de nav normal) puis bloc utilisateur — pastille 28px `FD`, nom 12.5px/600, « Offre Max » 11px `#8a92a8`, icône de déconnexion `#a3aabd`.

### Header d'écran — `AppTopBar`
`background:#fff; border-bottom:1px solid #e6e9f2; position:sticky; top:0`, hauteur mini 64px, `padding:13px 24px`.

- Gauche : titre 19px/600 + **chip de comptage** (11.5px/600, `#4338ca` sur `#f1efff`, radius 20px, `padding:2px 9px`) ; sous-titre 13px `#6b7490`.
- Droite, **toujours dans cet ordre** : action secondaire optionnelle (bouton bordé blanc, 13px/600 `#3b4256`, `white-space:nowrap`) puis **action primaire** (dégradé indigo, 13.5px/600, radius 10px, `padding:10px 16px`, ombre primaire, préfixe « + »).

Mapping écran → (titre, chip, sous-titre, secondaire, primaire) :

| Écran | Titre | Chip | Secondaire | Primaire |
|---|---|---|---|---|
| Tableau de bord | `Bonjour, {prénom}` | — | — | Nouvelle facture |
| Clients | Clients | `7 clients` | Importer | Nouveau client |
| Devis | Devis | `6 devis` | Importer | Nouveau devis |
| Factures | Factures | `7 factures` | Importer | Nouvelle facture |
| Paiements | Paiements | `5 encaissements` | — | Enregistrer un paiement |
| Produits | Produits | `5 actifs` | Modèle de tableur | Nouveau produit |
| Prestations | Prestations | `4 actives` | Modèle de tableur | Nouvelle prestation |
| Entreprises | Entreprises | `3 espaces` | — | Nouvelle entreprise |
| Paramètres | Paramètres | — | — | Nouvelle facture |
| Éditeur | Nouveau devis / Nouvelle facture | — | — | Créer et envoyer |
| Outils IA | Outils IA | — | — | Nouvel import |

Le sous-titre de l'éditeur porte le numéro prévisionnel + l'état d'enregistrement (`DEV-2026-0093 · brouillon enregistré`).

### Barre d'outils de liste (2ᵉ rangée du header)
`background:#fff; border-bottom:1px solid #e6e9f2; padding:14px 24px`, `display:flex; flex-wrap:wrap; gap:10px; align-items:center`.

- **Recherche** : `flex:0 1 320px`, `padding:8px 11px`, bordure `#e6e9f2`, fond `#fafbfe`, radius 10px, icône loupe `#a3aabd`, placeholder par écran (`Numéro, client, montant…`, `Nom, société, e-mail, ville…`, `Nom, référence, SKU…`, `Facture, client, moyen…`).
- **Chips de statut avec compteurs** (remplacent le `<select>`) : `padding:7px 13px`, radius 20px, 12.5px/600, `white-space:nowrap` ; actif = bordure `#c9c4f5`, fond `#f1efff`, texte `#4338ca`, compteur `#4f46e5` ; inactif = bordure `#e6e9f2`, fond `#fff`, texte `#3b4256`, compteur `#a3aabd`.
  - Factures : Toutes 7 · Brouillons 1 · Envoyées 2 · En retard 2 · Partielles 1 · Payées 1
  - Devis : Tous 6 · Brouillons 1 · Envoyés 2 · Acceptés 1 · Refusés 1 · Expirés 1
  - Clients : Tous 7 · Professionnels 5 · Particuliers 2 · Impayés 4
  - Paiements : Ce mois · Trimestre · Année · Virement · Carte · Stripe
  - Produits : Actifs 5 · Stock bas 2 · Archivés 1 — Prestations : Actives 4 · Archivées 0
- **Boutons IA (écrans Produits et Prestations uniquement)**, dans cet ordre : `Créer depuis une image` (bordure `#c9c4f5`, fond `#f6f4ff`, texte `#4338ca`) · `Modèle de tableur` (bouton neutre bordé blanc) · `Importer le modèle rempli` (accent). Tous en `white-space:nowrap`.
- **Trier** à droite : bouton neutre bordé.

### Tableau — `components/app/ui.tsx` (`DataTable`)
Carte `background:#fff; border:1px solid #e6e9f2; border-radius:14px; overflow-x:auto`.

- En-tête : `position:sticky; top:0`, fond `#fafbfe`, `border-bottom:1px solid #e6e9f2`, libellés 11px/700/uppercase.
- Lignes : `border-bottom:1px solid #f3f5fa`, hover `#f7f8fd`, **sélectionnée** = fond `#f7f6ff` + `box-shadow: inset 3px 0 0 #4f46e5`, curseur pointer, `onRowClick`.
- Montants alignés à droite ; cellule « Client » = pastille 30px d'initiales + nom 13.5px/600 + sous-ligne type 11.5px `#8a92a8`.
- **Chaque colonne flexible a une largeur minimale et la carte défile horizontalement** (voir §Responsive) : la grille de ligne porte le même `min-width` que l'en-tête.
- Pied de carte : `padding:11px 24px`, fond `#fafbfe`, 12.5px `#6b7490` — « 7 sur 7 clients » à gauche, « Lignes par page 25 » à droite.

Colonnes par écran (gabarit CSS grid, gap 14px) :

| Écran | Colonnes |
|---|---|
| Clients | `minmax(200px,1.6fr)` Client · `minmax(190px,1.4fr)` Contact · `110px` Ville · `120px` CA encaissé (droite) · `110px` En attente (droite) · `150px` Dernier document |
| Devis | `150px` Numéro · `minmax(170px,1.4fr)` Client · `120px` Émission · `120px` Validité · `120px` Total TTC (droite) · `120px` Statut |
| Factures | idem Devis, `Échéance` au lieu de `Validité` |
| Paiements | `120px` Date · `150px` Facture · `minmax(160px,1.2fr)` Client · `140px` Moyen · `120px` Montant (droite) · `120px` Statut |
| Produits / Prestations | `minmax(240px,1.8fr)` Désignation (+ catégorie) · `140px` Référence · `90px` Unité · `100px` Prix HT (droite) · `80px` TVA (droite) · `130px` Stock (produits) / Durée (prestations) |

Stock : badge vert si > seuil, ambre si ≤ `stockAlertThreshold`, rouge si rupture, gris si non suivi.

## Écran par écran

### 1. Tableau de bord — `app/app/page.tsx`
Contenu `padding:20px 24px 40px`, colonnes `minmax(0,2fr) minmax(280px,1fr)`, gap 16px, `align-items:start`. Aucune nouvelle requête : tout est calculé depuis `useDashboard()`.

1. **Rangée argent** — `repeat(auto-fit,minmax(260px,1fr))` :
   - « Encaissé ce mois » — pastille 26px verte, valeur 28px/600, contexte « +18 % vs août · 5 factures payées ».
   - « En attente de paiement » — pastille indigo, contexte « 4 factures · délai moyen 12 j » (`averagePaymentDelayDays`).
   - « En retard » — bordure `#f3d3d3`, pastille rouge, valeur `#b91c1c`, lien « Traiter » dans l'en-tête → `/app/invoices?status=overdue`.
2. **Bandeau IA** (pleine largeur) — `background:linear-gradient(100deg,#f6f4ff,#fdfdff)`, bordure `#c9c4f5`, radius 14px. Titre « Gagnez du temps avec l'IA », texte explicatif, boutons « Créer depuis une image » (plein indigo) et « Modèle de tableur » (bordé accent). Masquable via la préférence `aiEmphasis` (voir §Tweaks).
3. **« À traiter aujourd'hui »** (colonne large) — file construite côté client depuis les données déjà chargées : factures `overdue` → Relancer ; devis `accepted` non convertis → Facturer ; brouillons → Reprendre ; devis `sent` dont `validUntil` < 7 j → Relancer. Ligne : pastille 30px teintée selon la tonalité, intitulé 13.5px/600, méta 12px `#8a92a8`, montant 13.5px/600 tabular-nums, bouton d'action bordé 12.5px/600 `#4338ca`. Pied de carte `#fafbfe` : « Tout est à jour au-delà de ces éléments. » Ce bloc remplace `DashboardTips`.
4. **Graphique CA** (colonne large) — `extended.revenueByMonth`, 12 barres en grille `repeat(12,minmax(0,1fr))`, hauteur de zone 160px, barres `#dcd9fb` radius `6px 6px 3px 3px`, **mois courant `linear-gradient(180deg,#7c3aed,#4f46e5)`**, initiale du mois 10.5px `#a3aabd` sous la barre. Segments 12 mois / 6 mois / Année (filtrage local). Pas d'animation de hauteur.
5. Colonne droite : **« Créer »** (4 tuiles 2×2 : Devis, Facture, Client, Produit — pastille 28px + libellé 13px/600, bordure `#e6e9f2`, hover bordure `#c9c4f5` + fond `#fafbfe`) · **« Ce mois »** (Devis envoyés 9 · Taux d'acceptation 62 % · Panier moyen 1 480 € · Meilleur client) · **« Activité récente »** (pastille 26px grise, intitulé 12.5px/600, horodatage 11.5px `#a3aabd`, montant à droite).

### 2. Devis et Factures — `components/app/document-workspace.tsx`
Inverser le modèle actuel : **tableau plein largeur à gauche, panneau de détail 392px à droite** (`border-left:1px solid #e6e9f2`, `padding:20px`, `gap:16px`). `?selected=` reste la source de vérité.

Ordre imposé du panneau :
1. Sur-titre 11.5px/700/uppercase `#a3aabd` (« Facture » / « Devis »).
2. Numéro 17px/600 + badge de statut, puis nom du client 13px `#6b7490`.
3. **Montant 27px/600 tabular-nums** + note « échéance le … » / « valable jusqu'au … ».
4. **Une seule action primaire contextuelle** (pleine largeur, dégradé indigo) + bouton « PDF » + menu `···`. Les six actions actuelles passent dans le menu.
   - Facture : `draft` → Envoyer la facture · `sent` → Marquer comme payée (respecter `canMarkInvoiceAsPaid`) · `partially_paid` → Enregistrer le solde · `overdue` → Relancer le client · `paid` → Télécharger le PDF.
   - Devis : `draft` → Envoyer le devis · `sent` → Relancer le client · `accepted` → Convertir en facture (respecter `canConvertQuoteToInvoice`) · `expired` → Renouveler le devis.
5. **Suivi** (`DocumentStatusTimeline`) : pastilles 9px, remplies `#4f46e5` si l'étape est franchie, sinon `#fff` + bordure `#d8dce8` ; trait vertical 1.5px `#dcd9fb` (franchi) / `#eef0f7` ; libellé 12.5px/600 (`#a3aabd` si non franchi), date 11.5px `#a3aabd`.
6. **Détails** : Total HT, TVA, Total TTC, Échéance/Validité, Modèle PDF, Relances envoyées — libellé 12.5px `#6b7490`, valeur 12.5px/600 tabular-nums, séparateur `#f3f5fa`.
7. Puis aperçu PDF en vignette (`PdfPreviewPanel`, bouton « Ouvrir en grand ») et historique (`ActivityTimeline`).

Sélection multiple : case d'en-tête + cases par ligne (`accent-color:#4f46e5`), barre d'actions groupées au-dessus du tableau (fond `#f1efff`) — Télécharger, Dupliquer, Supprimer, uniquement des actions existantes. « Charger plus » → « Charger N de plus » avec `totalCount`.

### 3. Clients — `app/app/clients/page.tsx`
Même gabarit tableau + panneau. Panneau : type en sur-titre, nom 17px, CA encaissé en valeur 27px avec note « encaissé depuis janvier · X en attente », action primaire **« Nouveau devis »** + « Facturer » dans le menu, suivi (client créé, dernier devis, dernière facture, dernier paiement), détails (Ville, Type, CA encaissé, En attente, Documents, Délai de paiement moyen). Remplace la fiche centrée et les trois gros liens du bas.

### 4. Éditeur de devis / facture — `components/app/document-composer/index.tsx`
Trois colonnes, gap 16px, `padding:18px 24px 40px` :
- **Colonne Client** (300px) : bloc « Client » avec chip rouge/ambre **« Obligatoire »** visible dès l'affichage, sélecteur de client en état focus (pastille + nom + n° TVA + chevron) et rappel adresse/e-mail 12px `#8a92a8` ; bloc « Dates et conditions » (date d'émission, **délai de paiement en segments 30 / 45 / 60 j**, échéance calculée affichée en clair) ; bloc « Notes sur le document » (textarea 88px mini).
- **Colonne Lignes** (flexible, cœur de l'écran) : en-tête de bloc avec titre + boutons regroupés à droite — `+ Ligne libre`, `Catalogue`, `Import IA · modèle CSV` (accent). Tableau de lignes `minmax(220px,1fr) 70px 80px 96px 72px 104px 32px`, `min-width:800px`, en-tête collant `#fafbfe`. Bouton « + Ajouter une ligne » en bordure pointillée `#c9c4f5`. **Pied de bloc toujours visible** (`#fafbfe`) : Total HT, TVA 20 %, Total TTC (15px/600 `#4338ca`).
- **Colonne Aperçu** (300px) : grille 2×2 des modèles PDF (vignette avec barre de couleur 8px : Classique `#4f46e5`, Moderne dégradé violet→indigo, Premium `#0f1533`, Minimal `#a3aabd` ; sélection = bordure `#c9c4f5` + fond `#fbfaff`) ; aperçu A4 `aspect-ratio:1/1.414` + libellé « En direct » 10.5px/700 vert ; bouton « Ouvrir en grand ». La barre de modèles disparaît du header.

`validation.ts` inchangé ; garder `scrollToFirstError` mais afficher aussi l'erreur **sous le champ** (`InlineFieldError`).

### 5. Paiements — `app/app/payments/page.tsx`
Trois cartes (Encaissé ce mois / En attente de paiement / Impayés à relancer) + chips de période (Ce mois · Trimestre · Année) et de moyen + tableau des encaissements (Date, Facture, Client, Moyen, Montant, Statut) + pied « 5 encaissements · 9 180 € ce trimestre ». Action primaire « Enregistrer un paiement » (mutation existante).

### 6. Outils IA — nouvel écran `app/app/ai/page.tsx`
Deux cartes `repeat(auto-fit,minmax(280px,1fr))`, chacune : pastille 38px `#f1efff`/`#4f46e5`, titre 14.5px/600, corps 13px `#3b4256`, zone de dépôt pointillée `#c9c4f5` sur `#fbfaff` avec libellé monospace 11px, bouton primaire pleine largeur.

**Carte 1 — Image → produit.** Copy exacte : « Déposez une image où les informations du produit sont écrites : fiche produit d'un site marchand, catalogue fournisseur, étiquette de prix. L'IA lit le nom, la référence, le prix et la TVA — une photo d'objet sans texte ne peut pas être reconnue. » Zone de dépôt : « capture d'écran ou photo de fiche produit · .jpg, .png, .pdf ». Bouton « Choisir une image ». Note sous le bouton : « Les valeurs lues restent modifiables avant enregistrement. »
> Important côté produit : ne pas promettre la reconnaissance d'un objet photographié. L'UI doit orienter vers une **image porteuse de texte** (fiche produit d'un site marchand, page de catalogue, étiquette avec nom / prix / TVA).

**Carte 2 — Tableur → catalogue, en deux étapes explicites.** Seul le modèle INVEQ est accepté, donc **le téléchargement du modèle vient avant l'import** :
- Encart « Étape 1 — partez du modèle INVEQ » (bordure `#e6e9f2`, fond `#fafbfe`) avec bouton bordé accent **« Télécharger le modèle vide (.xlsx) »** et mention « Colonnes prêtes · ne pas les renommer ». Proposer les trois modèles : produits, prestations, clients.
- Corps : « L'import n'accepte que le modèle INVEQ : téléchargez-le, remplissez les colonnes déjà en place, puis déposez le fichier. Un autre tableur sera refusé. »
- Zone de dépôt « déposez votre modèle rempli · .xlsx, .csv — jusqu'à 2 000 lignes », bouton « Importer le modèle rempli », note « Étape 2 — déposez le fichier rempli ci-dessus. »
- **Règle d'UI globale** : partout où « Importer un tableur » est proposé (barre d'outils Produits/Prestations, header secondaire, menu Créer, palette), le **modèle vide est offert juste avant** l'import, dans le même groupe de boutons. Un fichier hors modèle est refusé avec un état « Refusé — colonnes hors modèle INVEQ » et une action « Modèle » qui relance le téléchargement.

**« Imports récents »** sous les cartes : ligne = pastille 28px, intitulé 13.5px/600, méta 12px, badge de statut, bouton d'action. Trois états à couvrir : `Enregistré` (vert, action Voir), `À vérifier` (ambre, action Vérifier), `Refusé` (rouge, action Modèle). Mention à droite du titre : « Chaque import est vérifiable avant enregistrement ».

### 7. Produits et Prestations — `components/app/catalog-workspace.tsx`
Tableau décrit ci-dessus, chips Actifs / Stock bas / Archivés, barre de sélection multiple au-dessus du tableau (fond `#f1efff`) avec « Créer un devis », « Dupliquer », « Supprimer ». Remplacer `confirm()` par `AppDialog tone="danger"`. Formulaire produit dans la modale existante, champs regroupés (Identité, Prix et TVA, Stock, Notes).

### 8. Entreprises — `components/app/companies-workspace.tsx`
Grille de cartes `repeat(auto-fill,minmax(300px,1fr))`. Carte : pastille 40px d'initiales, nom 14.5px/600, rôle 12px `#8a92a8`, chip « Actif » vert si espace courant (bordure de carte `#c9c4f5`), trois métriques (clients / documents / CA 2026 en 16px/600 tabular-nums + libellé 11.5px), puis bouton principal (« Activer » indigo, ou « Espace actif » désactivé `#fafbfe`/`#8a92a8`) + « Profil » bordé. `switchCompany` inchangé.

### 9. Paramètres — `app/app/settings/**`
Navigation secondaire gauche **236px** (fond `#fff`, `border-right`), items hauteur 34px radius 9px, actif `#f1efff`/`#4f46e5` ; groupes : **Compte** (Profil, Notifications), **Entreprise** (Identité, Logo et couleurs, Modèles PDF), **Facturation** (Numérotation, Moyens de paiement, Facturation électronique), **Abonnement** (Offre Max, Historique). Contenu à droite, largeur de lecture max **720px**, sections en `FormSection` + pied `#fafbfe` avec « Annuler » / « Enregistrer ». Champs en grille 2 colonnes, labels 12px/600 `#6b7490`. Numérotation : afficher **le prochain numéro calculé** en sous-titre (« Prochain numéro de facture : FAC-2026-0144 »).

### 10. Onboarding — `app/app/onboarding/**`
Écran plein sans sidebar, fond `linear-gradient(180deg,#f8f7ff,#f6f7fb)`, carte centrée max **640px**, radius 16px. Logo 110px + lien « Passer » discret ; barre de progression en 4 segments de 4px (`#4f46e5` franchis, `#e6e9f2` restants) ; « Étape 2 sur 4 » 11.5px/700/uppercase ; titre 24px/600 ; texte d'aide 13.5px `#6b7490` max 440px. Champ SIRET en focus + bouton « Rechercher » (`use-company-registration-lookup`), puis carte de résultat `#fafbfe` avec coche verte, raison sociale, adresse et activité. Boutons « Continuer » (primaire, flex:1) + « Retour ». Ligne de contexte : « Étape suivante : logo et couleurs de vos documents. »

### 11. Palette de commandes ⌘K — nouveau `components/app/command-palette.tsx`
Voile `rgba(15,21,51,.38)`, carte `min(620px,92vw)` à 12vh du haut, radius 14px, ombre flottante. Champ 14.5px avec icône loupe et badge « esc ». Section **Actions** (pastille 26px `#f1efff`) : Créer une facture (F), Créer un devis (D), Ajouter un client (C), Créer un produit depuis une image (P), Télécharger le modèle de tableur (T), Changer d'entreprise (E). Section **Documents** : résultats groupés avec numéro, sous-ligne « client · statut » et montant à droite. Réutiliser `useInfiniteClients`, `useInfiniteQuotes`, `useInfiniteInvoices` + `useDebouncedValue`. Monté dans `app/app/layout.tsx`, raccourci ⌘K / Ctrl+K, fermeture Échap.

### 12. Menu « Créer »
Modale `min(420px,92vw)` centrée, radius 14px, ombre flottante, titre « Créer » 15px/600. Entrées (pastille 30px, libellé 13.5px/600, sous-ligne 11.5px `#8a92a8`), dans cet ordre :
1. Devis — « Depuis le catalogue ou une ligne libre »
2. Facture — « Ou convertir un devis accepté »
3. Client — « Recherche SIRET automatique »
4. Produit ou prestation — « Fiche manuelle »
5. **Créer depuis une image** — « IA · fiche produit, catalogue ou étiquette » (pastille accent bordée `#c9c4f5`)
6. **Télécharger le modèle de tableur** — « Étape 1 avant tout import Excel ou CSV »
7. **Importer le modèle rempli** — « IA · vos lignes arrivent dans le catalogue »

## Interactions et comportement

- Clic sur une ligne de tableau → sélectionne la ligne (fond `#f7f6ff` + liseré gauche 3px) et alimente le panneau de détail ; `?selected=` mis à jour.
- Hover : lignes `#f7f8fd` ; boutons neutres → bordure `#c9c4f5` + fond `#fafbfe` ; items de nav → `#f7f8fd`. Transitions 150 ms sur `background-color, border-color, color` uniquement.
- ⌘K / Ctrl+K ouvre la palette ; Échap ferme palette, menu Créer et overlay de détail ; clic sur le voile ferme aussi.
- États vides : icône 44px sur `#f1efff`, titre 14.5px, description ≤ 290px, **toujours une action suivante** + action secondaire optionnelle. Ajouter `NoResultsState({ query, onClear })` distinct de l'état « aucune donnée ».
- Chargement : `TableSkeleton` reproduisant la structure du tableau (en-tête + barres de largeurs variables), pas des blocs de 56px.
- Erreurs de formulaire : bordure `#e88b8b` + `ring rgba(220,38,38,.1)` + message 12px avec icône `alert-circle` sous le champ.
- Confirmations et retours de mutation : `ToastProvider` web (succès/erreur/info, bas droite, auto-dismiss 4 s) branché sur les `onSuccess`/`onError` existants ; suppressions via `AppDialog tone="danger"`.
- Import IA : après lecture, **toujours un écran de vérification** des valeurs avant enregistrement (l'IA ne crée jamais une fiche sans validation).

## État (côté UI)

| État | Rôle |
|---|---|
| `selectedId` (`?selected=`) | ligne active du tableau et contenu du panneau de détail |
| `detailOpen` | ouverture de l'overlay de détail sous 1280px |
| `statusFilter` / `typeFilter` | chip active (valeurs identiques à `InvoiceStatusFilter` / `QuoteStatusFilter`) |
| `search` (débouncé) | recherche de liste et palette |
| `paletteOpen`, `createMenuOpen` | surcouches ⌘K et menu Créer |
| `chartRange` | 12 mois / 6 mois / Année (filtrage local de `revenueByMonth`) |
| `selectedRows` | sélection multiple et barre d'actions groupées |
| `importStep` | `template` → `upload` → `review` → `saved` pour l'import tableur |

Aucune requête nouvelle : tout vient de `useDashboard`, `useInfiniteClients/Quotes/Invoices`, `useCatalog`, `useSettings`, `useCompanyManagement`, `useSubscription`.

## Responsive

| Palier | Comportement |
|---|---|
| ≥ 1440px | Sidebar 248px · tableau · panneau de détail 392px · éditeur en 3 colonnes `300px minmax(420px,1fr) 300px` |
| 1280–1439px | Idem, éditeur en 2 colonnes `minmax(420px,1fr) 300px` (Lignes d'abord, bloc Client sous le tableau de lignes) |
| 1100–1279px | Panneau de détail en **overlay** `fixed top:0 right:0 bottom:0 width:min(420px,92vw)` + voile `rgba(15,21,51,.32)` et bouton « Fermer » ; tableau pleine largeur |
| < 1100px | Éditeur en une seule colonne (Lignes d'abord, puis Client, puis Modèle/Aperçu) |
| < 1024px | Sidebar réduite à 64px, icônes seules + tooltips ; colonnes secondaires (Émission, Unité) masquées |
| < 900px | Sidebar → barre de navigation basse (Accueil, Devis, **« + » central**, Factures, Clients) ; tableaux → cartes (numéro + client + montant + statut) ; détail en plein écran ; éditeur en assistant 3 étapes (Client → Lignes → Récapitulatif) avec total TTC collé au-dessus de « Continuer » |

Les tableaux conservent un `min-width` égal à la somme des largeurs minimales de colonnes + gaps et **défilent horizontalement** dans leur carte plutôt que d'écraser la colonne flexible à 0. Cibles tactiles ≥ 44px.

## Préférences de maquette (« tweaks »)

Le prototype expose trois réglages qui peuvent rester des constantes côté code : `defaultScreen` (écran ouvert au chargement, utilitaire de maquette), `aiEmphasis` (« Bannière + tuiles » ou « Tuiles seules » sur le tableau de bord), `navCounters` (compteurs dans la sidebar).

## Assets

- `logo-inveq.png` — logo INVEQ, repris tel quel de `website/public/logo-inveq.png` dans le dépôt. Aucun autre asset : les icônes du prototype sont des primitives SVG à **remplacer par les icônes lucide-react équivalentes** (`layout-grid`, `users`, `file-text`, `receipt`, `credit-card`, `package`, `wrench`, `building-2`, `settings`, `sparkles`, `camera`, `table`, `search`, `clock`, `alert-circle`, `check`, `upload`, `arrow-up-down`, `log-out`).
- L'aperçu A4 de l'éditeur et les vignettes de modèles sont des placeholders : brancher `PdfPreviewPanel` et les modèles réels.

## Non-régression à vérifier

- Routes et query params inchangés : `?selected=`, `?create=1`, `?client=`, `?fromProducts=`, `?status=`.
- Multi-entreprise : `requireScope(scope)` avant chaque requête ; changement d'espace vide les caches (`clear-tenant-cache.ts`).
- Devis → facture, envoi, duplication, paiement partiel, statuts calculés (`resolveInvoiceStatusFromPayments`) : comportements identiques.
- PDF (`lib/domain/pdf/**`) et modèles intacts ; seuls les conteneurs d'aperçu changent.
- Limites d'offre (`enforcePlanLimit`) : messages toujours affichés (toast + bannière de formulaire).
- `npx tsc --noEmit` et `npm run build` sans erreur ; aucune dépendance ajoutée (Tailwind, lucide-react, framer-motion suffisent).

## Ordre de travail conseillé

1. Tokens + socle (`app-shell.tsx`, `ui.tsx`, `status-badge.tsx`, `empty-state.tsx`, `skeleton.tsx`, toast).
2. Factures, puis Devis (`document-workspace.tsx`) — le gabarit tableau + panneau sert ensuite partout.
3. Clients, Paiements.
4. Catalogue + **Outils IA** (écran, modèles de tableur, écran de vérification).
5. Éditeur (`document-composer/**`).
6. Entreprises, Paramètres, Onboarding.
7. Palette ⌘K, menu Créer, responsive < 1024px.

Vérifier `npm run build` et `npx tsc --noEmit` après chaque écran.

## Fichiers du bundle

| Fichier | Rôle |
|---|---|
| `INVEQ App v2.dc.html` | maquette haute fidélité, 11 écrans navigables via la sidebar (référence visuelle principale) |
| `support.js` | runtime nécessaire à l'ouverture du fichier HTML dans un navigateur |
| `logo-inveq.png` | logo utilisé par la maquette |

Ouvrir `INVEQ App v2.dc.html` dans un navigateur, puis naviguer dans la sidebar (Tableau de bord, Clients, Devis, Factures, Paiements, Produits, Prestations, Entreprises, Outils IA, Paramètres) ; ⌘K ouvre la palette, le bouton « Créer » ouvre le menu de création, un clic sur une ligne de tableau ouvre le panneau de détail, et le bouton « Nouvelle facture » de l'en-tête n'est pas câblé (utiliser la tuile « Devis » ou « Facture » du tableau de bord pour voir l'éditeur).
