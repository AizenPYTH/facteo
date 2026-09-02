# INVEQ — Refonte UX/UI de l'espace connecté · Handoff d'implémentation

Maquette de référence : `INVEQ App.dc.html` (ouvrir dans le navigateur, la barre noire en bas à droite bascule entre **App**, **États** et **Responsive**).

Dépôt cible : `AizenPYTH/facteo`, branche `main`, sous-arbre `website/` (Next.js App Router + Tailwind v4 + Supabase + TanStack Query).

## 0. Règles de la mission

1. **Aucune fonctionnalité nouvelle, aucune fonctionnalité supprimée.** Tous les hooks, requêtes, mutations, validations et routes restent identiques. On ne touche qu'à la couche présentation.
2. **Identité visuelle conservée** : logo `/logo-inveq.png` inchangé, fond blanc dominant, violet/indigo existant en accent (`--primary: #4f46e5`, violet `#7c3aed`), navy `#0f1533` pour le texte.
3. Les changements se font **dans les composants existants** listés ci-dessous, en priorité par remplacement de classes Tailwind. Ne pas réécrire les fichiers `lib/domain/**`, `hooks/**`, `providers/**`, `middleware.ts`, ni les migrations Supabase.
4. Travailler **écran par écran** dans l'ordre du §4, en vérifiant après chaque écran que `npm run build` et `npx tsc --noEmit` passent.

## 1. Tokens de design

À ajouter dans `website/src/app/globals.css` (`:root` + `@theme inline`), sans supprimer les variables existantes utilisées par le site vitrine.

```css
:root {
  /* conservés */
  --primary: #4f46e5;
  --primary-dark: #4338ca;
  --primary-violet: #7c3aed;

  /* app connectée */
  --app-canvas: #f6f7fb;   /* fond des zones de contenu */
  --app-surface: #ffffff;  /* cartes, tableaux, panneaux */
  --app-subtle: #fafbfe;   /* en-têtes de tableaux, pieds de carte */
  --app-border: #e6e9f2;
  --app-border-soft: #f3f5fa; /* séparateurs de lignes */
  --app-text: #0f1533;
  --app-text-2: #3b4256;
  --app-muted: #6b7490;
  --app-muted-2: #8a92a8;
  --app-faint: #a3aabd;
  --app-accent-tint: #f1efff;   /* fond actif nav / chips actives */
  --app-accent-border: #c9c4f5;
  --app-success: #059669; --app-success-tint: #ecfdf5; --app-success-text: #047857;
  --app-warning: #f59e0b; --app-warning-tint: #fffbeb; --app-warning-text: #b45309;
  --app-danger: #dc2626;  --app-danger-tint: #fef2f2;  --app-danger-text: #b91c1c;
}
```

**Typographie** : Inter (déjà en place). Échelle utilisée dans l'app : 10.5 / 11 / 12 / 12.5 / 13 / 13.5 / 14.5 / 17 / 19 / 24 / 28 px. Titres en `font-weight: 600`, `letter-spacing: -0.01em` (−0.03em au-dessus de 24 px). Tous les montants et dates en `font-variant-numeric: tabular-nums`.

**Rayons** : 20px (chips/pilules), 14px (cartes et sections), 12px (modales, cartes mobiles), 10px (boutons, champs de recherche), 9px (champs de formulaire, petits boutons), 8px (badges d'icône).

**Ombres** (deux seulement) :
- bouton primaire : `0 10px 22px -12px rgba(79,70,229,.85)`
- couche flottante (modale, palette, toast, menu) : `0 24px 50px -24px rgba(15,21,51,.45)`
- **Les cartes n'ont pas d'ombre** : bordure `1px solid var(--app-border)` uniquement. Supprimer les `shadow-[0_1px_2px…]` / `shadow-[0_8px_24px…]` actuels de `Panel`, `FormSection`, `StatCard`.

**Densité (« équilibrée », demandée)** : ligne de tableau = `padding: 11px 12px` (≈44 px de haut), en-tête de tableau `padding: 9px 12px`, première/dernière colonne `padding-left/right: 24px`. Champs de formulaire `padding: 9px 11px`, boutons `padding: 9px 14px`.

**Motion** : uniquement `transition: background-color .15s, border-color .15s, color .15s` sur les éléments interactifs. **Supprimer les `hover:-translate-y-0.5`, `card-hover` et les `motion.div` d'apparition (`whileInView`, `initial={{opacity:0,y:8}}`) dans tout `components/app/**`** : dans un outil de gestion ils ralentissent la lecture. `framer-motion` reste utilisé pour les modales et l'indicateur de nav.

## 2. Composants de socle à modifier

| Fichier | Changement |
|---|---|
| `components/app/app-shell.tsx` | `AppSidebar` : largeur 248px ; logo 132px ; **`CompanySwitcher` déplacé juste sous le logo** ; **nouveau bouton primaire « Créer »** (menu : Devis / Facture / Client) ; **nouveau déclencheur de recherche globale ⌘K** ; items de nav 36px, radius 9px, actif = fond `--app-accent-tint` + texte/icône `--primary` (supprimer la barre latérale animée `layoutId`) ; **compteurs à droite des items** (Devis = devis en attente, Factures = factures en retard, en rouge) ; pied : Paramètres + bloc utilisateur (avatar, nom, offre, déconnexion). |
| `components/app/app-shell.tsx` | `AppTopBar` : titre 19px + **chip de comptage** à droite du titre ; sous-titre 13px ; actions à droite ; hauteur totale ~64px ; ajouter une **seconde rangée optionnelle** (`toolbar` prop) pour recherche + filtres. |
| `components/app/app-shell.tsx` | `AppSearchInput` : radius 10px, fond `--app-subtle`, focus `border-primary` + `ring-2 ring-primary/15`. |
| `components/app/master-detail.tsx` | `MasterDetailLayout` : **inverser le modèle**. Aujourd'hui liste étroite (340px) + détail large. Nouveau : **table pleine largeur à gauche + panneau de détail 392px à droite** (`border-left`). Le panneau `sidebar` actuel fusionne avec le détail. Sous 1280px le panneau devient un overlay (`fixed inset-y-0 right-0 w-[420px]` + voile), sous 900px il occupe tout l'écran. |
| `components/app/ui.tsx` | `DataTable` : en-tête `sticky top-0` fond `--app-subtle`, libellés 11px/700/uppercase/tracking .07em couleur `--app-muted-2` ; lignes séparées par `--app-border-soft` ; hover `#f7f8fd` ; **ligne sélectionnée** = fond `#f7f6ff` + `border-left: 3px solid var(--primary)` ; support `selectable` (case à cocher, `accent-color: #4f46e5`), `align: 'right'` pour les montants, `onRowClick`. |
| `components/app/ui.tsx` | `StatCard` : supprimer les dégradés et l'animation. Nouveau gabarit : pastille d'icône 26px + libellé 12px/600 muted, valeur 28px/600 tabular-nums, ligne de contexte 12.5px. Variante `tone="danger"` = bordure `#f3d3d3` + valeur `--app-danger-text` + lien d'action dans l'en-tête. |
| `components/app/ui.tsx` | `Badge` : conserver l'API, aligner les couleurs sur §3, taille 11.5px/600, pastille 5px. |
| `components/app/ui.tsx` | `Panel` : bordure seule, radius 14px, titre 14.5px/600, padding en-tête `14px 18px`, corps `16px 18px`. |
| `components/app/empty-state.tsx` | `EmptyState` : supprimer l'animation ; icône 44px sur `--app-accent-tint` ; titre 14.5px, description ≤ 290px, **deux actions possibles** (`action` + `secondaryAction`). Règle : **tout état vide doit proposer l'action suivante**. |
| `components/app/empty-state.tsx` | Ajouter `NoResultsState({ query, onClear })` — état « aucun résultat » distinct de l'état « aucune donnée » (voir écran États de la maquette). |
| `components/app/skeleton.tsx` | `TableSkeleton` : reproduire la structure du tableau (en-tête + lignes de barres de largeurs variables) plutôt que des blocs de 56px. |
| `components/app/form-fields.tsx` | Champs radius 9px, `padding: 9px 11px`, focus `border-primary` + `ring-3 rgba(79,70,229,.14)` ; erreur = bordure `#e88b8b` + `ring rgba(220,38,38,.1)` + message 12px avec icône `alert-circle`. Boutons : primaire (indigo plein), secondaire (bordure), discret (texte indigo), destructif (bordure rouge, texte rouge) — retirer les translations au survol. |
| `components/app/app-dialog.tsx` | Conserver la mécanique (Esc, scroll lock, AnimatePresence). Nouveau gabarit : icône 38px teintée, titre 16px, texte 13px, **pied `bg-[--app-subtle]` avec actions alignées à droite**. Ajouter `tone="danger"` (bouton de confirmation rouge) pour toutes les suppressions. |
| **Nouveau** `components/app/command-palette.tsx` | Recherche globale ⌘K / Ctrl+K. Champ + section « Actions » (Créer un devis, Créer une facture, Ajouter un client, Changer d'entreprise) puis résultats groupés Clients / Devis / Factures. **Réutiliser les hooks existants** `useInfiniteClients`, `useInfiniteQuotes`, `useInfiniteInvoices` avec le terme saisi (débounce déjà dispo : `useDebouncedValue`). Monté dans `app/app/layout.tsx`. |
| **Nouveau** `components/app/toast` | Un `ToastProvider` web équivalent à celui du mobile (`src/providers/toast-provider.tsx`) : succès/erreur/info, coin bas droit, auto-dismiss 4s. Brancher les `onSuccess`/`onError` des mutations existantes (envoi, duplication, suppression, enregistrement des paramètres). |

## 3. Statuts — couleurs canoniques

Les libellés viennent de `INVOICE_STATUS_LABELS` / `QUOTE_STATUS_LABELS` (inchangés).

| Statut | fond | texte | pastille |
|---|---|---|---|
| `draft` | `#f3f5fa` | `#4a5268` | `#a3aabd` |
| `sent` | `#f1efff` | `#4338ca` | `#4f46e5` |
| `partially_paid` | `#fffbeb` | `#b45309` | `#f59e0b` |
| `paid` / `accepted` / `converted` | `#ecfdf5` | `#047857` | `#059669` |
| `overdue` / `rejected` | `#fef2f2` | `#b91c1c` | `#dc2626` |
| `expired` | `#fffbeb` | `#b45309` | `#f59e0b` |
| `canceled` | `#f3f5fa` | `#4a5268` | `#a3aabd` |

Centraliser dans `components/app/status-badge.tsx` (`<StatusBadge kind="invoice"|"quote" status={…} />`) et remplacer les deux tables `INVOICE_STATUS_VARIANTS` / `QUOTE_STATUS_VARIANTS` de `document-workspace.tsx`.

## 4. Écran par écran

### 4.1 Tableau de bord — `app/app/page.tsx`

Problème actuel : 4 `StatCard` hétérogènes, un bloc « Raccourcis » qui répète la nav, des zones vides, aucune priorisation.

Nouvelle structure (haut → bas), **sans nouvelle requête** :

1. **Rangée argent, 3 cartes** — « Encaissé ce mois » (`stats.monthlyRevenue`, comparaison mois précédent calculable depuis `extended.revenueByMonth`), « En attente de paiement » (`stats.outstandingAmount` + `stats.outstandingInvoices` + `stats.averagePaymentDelayDays`), « En retard » (montant et nombre issus des factures `overdue`, carte en tonalité danger avec lien « Traiter » vers `/app/invoices?status=overdue`).
2. **« À traiter aujourd'hui »** (2/3 de largeur) — file de tâches construite **côté client à partir des données déjà chargées** : factures `overdue` → « Relancer » ; devis `accepted` non convertis → « Facturer » ; devis `sent` dont `validUntil` < 7 jours → « Relancer » ; brouillons → « Reprendre ». Chaque ligne : icône teintée, intitulé, méta, montant, bouton d'action. Ce bloc remplace `DashboardTips` (les conseils d'onboarding deviennent les tâches affichées quand les compteurs sont à zéro).
3. Colonne droite : **« Créer »** (4 tuiles : Devis, Facture, Client, Produit) puis **« Ce mois »** (devis envoyés, taux d'acceptation, panier moyen `stats.averageInvoiceAmount`, meilleur client `extended.topClients[0]`).
4. **Graphique CA** (2/3) — `extended.revenueByMonth`, barres `#dcd9fb`, barre du mois courant en dégradé violet→indigo, sélecteur 12 mois / 6 mois / Année (filtrage local du tableau déjà chargé). **Supprimer l'animation de hauteur.**
5. **« Activité récente »** (1/3) — `DashboardActivityFeed` conservé, sans animations par item, montant à droite.

Filet de sécurité : `useDashboard()` n'est pas modifié.

### 4.2 Devis et Factures — `components/app/document-workspace.tsx`

- Le panneau liste étroit devient un **tableau plein** : colonnes Numéro / Client / Émission / Échéance (ou Validité) / Total TTC / Statut / actions au survol (Aperçu, PDF, menu). Ligne cliquable → sélection ; `?selected=` reste la source de vérité.
- **Barre de filtres** : recherche (placeholder « Numéro, client, montant… ») + **chips de statut avec compteurs** (remplace le `<select>` actuel ; mêmes valeurs que `InvoiceStatusFilter` / `QuoteStatusFilter`) + boutons « Filtres » et tri. Le filtre actif doit être lisible sans ouvrir de menu.
- **Sélection multiple** : case d'en-tête + cases par ligne, barre d'actions groupées (Télécharger, Dupliquer, Supprimer) — ne brancher que les actions déjà existantes.
- **Panneau de détail droit (392px)**, ordre imposé : type + numéro + client + statut → **montant en 27px** → **une seule action primaire contextuelle** + PDF + menu `…` → frise de statut (`DocumentStatusTimeline`) → dates et totaux HT/TVA → aperçu PDF (`PdfPreviewPanel` en vignette, bouton « Ouvrir en grand ») → historique (`ActivityTimeline`).
- **Action primaire contextuelle** (remplace la grille de 6 boutons égaux ; ces 6 actions passent dans le menu `…`) :
  - Facture `draft` → « Envoyer la facture » ; `sent`/`overdue`/`partially_paid` → « Marquer comme payée » (respecter `canMarkInvoiceAsPaid`) ; `paid` → « Télécharger le PDF ».
  - Devis `draft` → « Envoyer le devis » ; `accepted` → « Convertir en facture » (respecter `canConvertQuoteToInvoice`) ; `sent`/`expired` → « Relancer le client » (mailto existant).
- « Charger plus » devient « Charger N de plus » avec le total (`totalCount` déjà renvoyé par les pages).

### 4.3 Création / modification de devis et de facture — `components/app/document-composer/index.tsx`

- **Trois colonnes 300 / flexible / 300** : (1) Client + Dates et conditions + Notes, (2) Lignes, (3) Modèle PDF + aperçu A4 en direct (`ComposerLivePreview` + `ComposerTemplateBar` fusionnés ici ; supprimer la barre de modèles de l'en-tête).
- En-tête : Retour, titre, **numéro prévisionnel**, indicateur « Enregistré », Annuler, action primaire (« Créer et envoyer »).
- Champ Client marqué **« Obligatoire »** dès l'affichage (aujourd'hui l'erreur n'apparaît qu'après soumission) ; sous le client, rappel adresse + TVA.
- Dates : émission, échéance/validité, **délai de paiement en segments 30/45/60 j** (valeur envoyée inchangée).
- Lignes : boutons « Ligne libre » / « Catalogue » / « Import IA · CSV » regroupés à droite du titre du bloc ; tableau avec en-tête collant ; **totaux HT / TVA / TTC en pied de bloc toujours visibles** (retirer le résumé de la colonne gauche) ; TTC en 15px indigo.
- `validation.ts` inchangé ; garder `scrollToFirstError`, mais afficher aussi le message d'erreur **sous le champ concerné** (déjà `InlineFieldError`) et non seulement en bannière.
- Mobile (voir §5) : le même composer devient un **assistant en 3 étapes** (Client → Lignes → Récapitulatif) avec barre de progression et total TTC collé au-dessus du bouton « Continuer ». Aucune donnée supplémentaire, uniquement un découpage d'affichage.

### 4.4 Clients — `app/app/clients/page.tsx`

- Tableau : Client (avatar initiales + type) / Contact / Ville / CA encaissé / En attente / Dernier document. Recherche + chips (Tous, Professionnels, Particuliers, Impayés) — les chips filtrent côté client sur les données déjà chargées.
- Panneau droit : identité, **actions « Nouveau devis » / « Facturer » / éditer**, CA encaissé + en attente, coordonnées, liste des derniers documents. Remplace la fiche centrée actuelle et les 3 gros liens du bas.

### 4.5 Paiements — `app/app/payments/page.tsx`

Écran aujourd'hui quasi vide (un tableau). Nouveau : 3 cartes (Encaissé ce mois / Attendu sous 30 jours / Impayés à relancer) + tableau des encaissements (Date, Facture, Client, Moyen, Montant, Statut) + sélecteur de période (Ce mois / Trimestre / Année) + action primaire « Enregistrer un paiement » (mutation de paiement déjà existante).

### 4.6 Produits et Prestations — `components/app/catalog-workspace.tsx`

- Tableau : Désignation (+ catégorie), Référence, Unité, Prix HT, TVA, Stock (Produits) ou Durée (Prestations). Stock sous seuil (`stockAlertThreshold`) en chip ambre.
- Barre de sélection multiple **au-dessus du tableau** (fond `--app-accent-tint`) : « Créer un devis », « Dupliquer », « Supprimer ». Remplacer `confirm()` par `AppDialog tone="danger"`.
- Chips : Actifs / Stock bas / Archivés. Formulaire produit dans la modale existante, champs regroupés (Identité, Prix et TVA, Stock, Notes).

### 4.7 Entreprises — `components/app/companies-workspace.tsx`

Passer du master-detail à une **grille de cartes** (une par espace) : initiales, nom, rôle, chip « Actif », 3 métriques (clients, documents, CA), actions « Activer » / « Profil ». `switchCompany` inchangé.

### 4.8 Paramètres — `app/app/settings/**`

- Remplacer la grille de 16 cartes par une **navigation secondaire à gauche (236px)** avec les groupes existants (Compte, Entreprise, Facturation, Abonnement) et le contenu à droite, largeur de lecture max 720px. Les liens Aide et Légal passent dans un pied de colonne discret.
- Les pages enfants (`profile`, `company`, `numbering`, `templates`, `e-invoicing`, `subscription`, `history`, `notifications`) gardent leurs formulaires ; appliquer `FormSection` + `FormActions` (pied avec « Annuler » / « Enregistrer » + toast de confirmation).
- Numérotation : afficher **le prochain numéro calculé** en sous-titre.

## 5. Responsive

| Palier | Comportement |
|---|---|
| ≥ 1280px | Sidebar 248px + tableau + panneau détail 392px. |
| 1024–1279px | Panneau détail en **overlay** (420px, voile) ; tableau pleine largeur. |
| 900–1023px | Sidebar réduite à **64px, icônes seules** (tooltips au survol) ; en-tête compacté ; colonnes secondaires (Émission, Unité) masquées. |
| < 900px | Sidebar remplacée par une **barre de navigation basse** : Accueil, Devis, **bouton central « + »**, Factures, Clients. Tableaux → **cartes** (numéro + client + montant + statut). Détail → écran plein. Composer → assistant 3 étapes. |

Cibles tactiles ≥ 44px. Réutiliser `use-breakpoint.ts` (déjà présent côté mobile) ou des classes Tailwind `lg:` / `md:` équivalentes.

## 6. Non-régression — à vérifier après implémentation

- Routes et query params inchangés : `?selected=`, `?create=1`, `?client=`, `?fromProducts=`, `?status=`.
- Multi-entreprise : `requireScope(scope)` toujours appelé avant chaque requête ; changement d'espace vide bien les caches (`clear-tenant-cache.ts`).
- Devis → facture, envoi, duplication, paiement partiel, statuts calculés (`resolveInvoiceStatusFromPayments`) : comportements identiques.
- Génération PDF (`lib/domain/pdf/**`) et modèles : intacts, seuls les conteneurs d'aperçu changent.
- Limites d'offre (`enforcePlanLimit`) : messages toujours affichés (désormais en toast + bannière de formulaire).
- Imports catalogue / CSV / IA : boutons déplacés, logique inchangée.
- `npx tsc --noEmit` et `npm run build` sans erreur ; aucune dépendance ajoutée (Tailwind, lucide-react et framer-motion suffisent).
