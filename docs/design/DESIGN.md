# INVEQ — Design system et règles UX

Référence visuelle : `docs/design/inveq-refonte.html` (maquettes annotées, 20 écrans).
Ce document est la source de vérité pour les tokens et les règles. Aucune couleur, taille ou espacement ne doit être inventé en dehors de ce qui suit.

Périmètre : design et expérience utilisateur uniquement. Ne pas modifier le backend, les règles métier, le système de paiement ni la logique de conformité App Store.

---

## 1. Contraintes non négociables

Décisions prises après un rejet Apple. Ne pas revenir dessus.

- Les abonnements iOS passent exclusivement par Apple In-App Purchase. Pas de Stripe Checkout dans l'app, pas de lien vers `/tarifs`, pas de CTA « acheter sur notre site », aucun prix web affiché.
- Un abonnement acheté sur le web est reconnu dans l'app, et inversement, via le même compte. La synchronisation existante ne doit pas être cassée.
- Aucun parcours d'inscription iOS. Les écrans d'authentification servent la connexion à un compte INVEQ existant. Le renvoi vers la création de compte est un texte informatif, pas un bouton ni un lien d'achat.
- Sign in with Apple est livré en même temps que Google OAuth, au même niveau visuel.
- Un accès « Restaurer mes achats » est présent dans Réglages › Abonnement.

---

## 2. Tokens

### 2.1 Mode clair

| Rôle | Valeur |
| --- | --- |
| Fond d'écran | `#F7F8FA` |
| Surface (carte, barre) | `#FFFFFF` |
| Surface enfoncée / champ inerte | `#F2F4F8` |
| Bordure | `#E8EAF0` |
| Bordure de contrôle (bouton secondaire) | `#C9CEDB` |
| Séparateur de liste | `#EEF0F5` |
| Texte primaire | `#1B1D24` |
| Texte secondaire | `#4C505E` |
| Texte tertiaire / méta | `#75798C` |
| Texte de placeholder | `#9397AB` |
| Accent (lien, état actif, focus) | `#33549B` |
| Accent pressé | `#26407A` |
| Accent teinte de fond | `#EAEFF8` |

### 2.2 Mode sombre

| Rôle | Valeur |
| --- | --- |
| Fond d'écran | `#14161C` |
| Surface | `#1B1E26` |
| Surface enfoncée | `#21242E` |
| Bordure | `#2B2F3A` |
| Bordure de contrôle | `#3A3F4C` |
| Séparateur de liste | `#262A34` |
| Texte primaire | `#E9EBF0` |
| Texte secondaire | `#C3C9D6` |
| Texte tertiaire | `#9AA0B0` |
| Texte inactif | `#6E7482` |
| Accent | `#7FA1E8` |
| Accent teinte de fond | `rgba(127,161,232,.16)` |

Le mode sombre n'est pas une inversion : trois plans distincts (fond, surface, bordure) remplacent l'ombre. L'action primaire s'inverse — surface claire `#E9EBF0` sur texte `#14161C`.

### 2.3 Statuts

| Statut | Clair (texte / fond) | Sombre (texte / fond) |
| --- | --- | --- |
| Payée | `#1C6B4A` / `#E7F2EC` | `#7FD2A4` / `rgba(127,210,164,.15)` |
| Envoyée, à venir | `#33549B` / `#EAEFF8` | `#7FA1E8` / `rgba(127,161,232,.16)` |
| À relancer, à confirmer | `#8A6320` / `#F8F1E2` | `#D8B26A` / `rgba(216,178,106,.15)` |
| En retard | `#9A3B2C` / `#FBEAE6` | `#E8907F` / `rgba(232,144,127,.15)` |
| Brouillon | `#61656F` / `#EFF1F5` | `#9AA0B0` / `#262A34` |

Un statut n'est jamais porté par la seule couleur : puce avec libellé, plus un liseré de 3px à gauche de la ligne pour le retard.

### 2.4 Typographie — Inter

| Usage | Taille / graisse |
| --- | --- |
| Titre d'écran | 27–30 / 500, letter-spacing −0.025em |
| Titre de sheet, sous-écran | 21–25 / 500 |
| Titre de section, ligne de liste | 15–17 / 500 |
| Corps | 15 / 400 |
| Métadonnée | 12–13 / 400 |
| Label de groupe | 11 / 600, uppercase, letter-spacing 0.09em |
| Montant en évidence | 38–40 / 600, `font-variant-numeric: tabular-nums` |
| Montant en ligne | 15–16 / 600, tabulaire |

Tout montant, numéro de document, SIRET et référence est en chiffres tabulaires. Les titres ne dépassent pas 600.

### 2.5 Espacements, rayons, élévation

- Échelle : 4 / 8 / 12 / 16 / 24 / 32. Marge latérale d'écran : 16. Aucune valeur hors échelle.
- Rayons : 8 puce, 11 champ et bouton, 12–14 carte, 20–22 bottom sheet.
- Élévation, trois niveaux seulement :
  - repos : bordure 1px, aucune ombre ;
  - barre d'action et bottom sheet : `0 -8px 24px rgba(27,29,36,.06)` ;
  - modale : `0 20px 48px rgba(27,29,36,.22)`.
- En mode sombre, l'élévation est une bordure plus claire, pas une ombre.

### 2.6 Icônes

Phosphor, style regular pour les icônes inertes, fill pour l'état actif et les validations. Tailles : 15 chevron de ligne, 17–19 icône de ligne et de bouton, 21–23 onglet.

---

## 3. Composants

### 3.1 Boutons — 5 variantes

| Variante | Clair | Usage |
| --- | --- | --- |
| Primaire | fond `#1B1D24`, texte blanc, h 50–52, r 12, 16/600 | une seule par écran |
| Secondaire | fond surface, bordure `#C9CEDB`, h 44–46, r 11, 15/500 | deux au maximum, côte à côte |
| Tertiaire | texte `#33549B`, sans fond | liens, actions de liste |
| Destructif | fond surface, bordure `#E7CFC9`, texte `#9A3B2C` | suppression, déconnexion |
| Icône | 44×44 minimum, fond `#F2F4F8`, r 11 | en-têtes, barres d'outils |

Aucune action destructive en bouton plein. `:focus-visible` : contour 2px accent, décalage 2px.

### 3.2 Barre d'action

Collante en bas, fond surface, bordure haute, ombre de barre, `padding: 12px 16px 10px` plus le safe area. Elle est poussée par le clavier, jamais recouverte. Elle peut contenir, au-dessus du bouton, un récapitulatif (total, nombre de sélections) et, en dessous, une ligne d'explication de 12px.

### 3.3 Champs et groupes

Deux formes selon le contexte :
- champ autonome : hauteur 50, bordure 1px, r 11, label 12/600 au-dessus, icône de gauche optionnelle ;
- groupe de champs : carte unique, séparateurs `#EEF0F5`, label et valeur empilés dans chaque ligne.

Chaque label porte son statut : `requis` en `#9A3B2C`, `· facultatif` en tertiaire. Aucun champ requis ne se trouve dans une section repliée. Les erreurs sont inline, sous le champ, jamais en toast technique.

### 3.4 Lignes de liste

Carte à séparateurs. Structure : icône ou avatar 38×38 → titre 15/500 et méta 12 → valeur à droite en 15–16/600 tabulaire → puce de statut ou chevron. Le retard ajoute un liseré gauche de 3px. Les actions rapides sont en glissé : relancer, marquer payée, partager.

### 3.5 Segmented, chips, puces

- Segmented : conteneur `#ECEEF4`, r 10–11, padding 3, option active en surface blanche avec ombre 1px.
- Chip de filtre : r 9, 13/500 ; active en `#1B1D24` texte blanc ; porte son compteur.
- Puce de statut : r 6, 11/600, teinte de fond du statut.

### 3.6 Bottom sheet et confirmation

Fond assombri `rgba(27,29,36,.42)`, sheet ancré en bas, r 20–22, ombre de modale.

Une confirmation conséquente ne demande pas « êtes-vous sûr ». Elle montre le résultat : un tableau de conséquences (numéro attribué, montant, échéance, nouvel état), une phrase sur ce qui ne se produira pas, puis le primaire et Annuler en tertiaire.

### 3.7 Mouvement

220 ms en sortie, 260 ms en entrée, courbe iOS standard. Une ligne ajoutée glisse et se surligne 400 ms. Un changement de statut est une transition de couleur, sans rebond. Haptique légère sur validation uniquement. `Réduire les animations` coupe les transitions de liste et remplace les démos par leurs vignettes fixes.

---

## 4. Navigation

- Cinq positions : Accueil, Documents, **Créer** (bouton central, ouvre un sheet Facture / Devis / Client), Clients, Réglages. Réglages devient un onglet et n'est plus derrière un engrenage.
- Factures et devis vivent sous Documents, séparés par un segmented.
- Règle absolue : aucun écran n'est un cul-de-sac. Pour chaque écran, quatre réponses doivent être visibles — où suis-je, comment revenir, quelle est l'action principale, comment annuler.
- Tout en-tête de retour nomme sa destination (« Documents », « Clients », « Réglages »).
- `router.back()` est toujours gardé par `canGoBack()`, avec repli sur la liste racine — cas du deep link et de l'ouverture à froid.
- Les états de chargement portent le même en-tête que l'écran chargé. Jamais de plein écran sans sortie.
- Écrans légaux et modales : croix de fermeture explicite.
- Les démos sont accessibles depuis Réglages › Découvrir INVEQ.

---

## 5. Règles par parcours

### 5.1 Connexion

Email et mot de passe, « Mot de passe oublié » au niveau du champ, séparateur « ou continuer avec », puis Apple et Google. Le primaire « Se connecter » est en bas, poussé par le clavier. Un texte de pied indique où créer un compte, sans bouton ni lien d'achat.

### 5.2 Tableau de bord

Un seul chiffre en tête : le reste à encaisser, décomposé en une barre de trois segments (retard, échoit sous 7 jours, à venir). Puis « À faire maintenant » : deux lignes actionnables au maximum. Puis l'activité récente. Pas de grille de petites cartes de statistiques.

### 5.3 Wizard facture et devis

- Jauge de progression en trois segments, pas trois pastilles.
- Actions en bas dans la barre collante. Le libellé du primaire nomme l'étape suivante (« Prestations », « Validation »).
- Un primaire désactivé affiche toujours la raison juste en dessous. Jamais de « Suivant » mort et muet.
- Sortie après saisie : alerte « Abandonner le brouillon ? ».
- Étape Prestations : trois entrées exposées d'emblée — Scanner, Catalogue, Saisie libre. Chaque ligne montre quantité, prix unitaire, TVA et remise en puces. Aucune ligne vide créée automatiquement. Le total vit dans la barre d'action.
- Dates par sélecteur natif, jamais en texte libre. **L'échéance saisie manuellement n'est jamais recalculée** par une modification ultérieure des informations finales.
- La copie nomme le document courant : « cette facture » / « ce devis », jamais une chaîne figée.

### 5.4 Détail facture et devis

Structure identique pour les deux, à un signe près : une puce noire « DEVIS » en tête du devis.

- Une primaire dictée par l'état : Envoyer si brouillon, Relancer si en retard, aucune si payée.
- Deux secondaires au maximum, le reste sous le menu « … ».
- « Payer en ligne » devient **« Lien de paiement »** : copie ou partage du lien destiné au client. L'app n'ouvre jamais le checkout côté vendeur. Une phrase sous les actions dit ce qui va se passer.
- Aperçu PDF en carte, avec Ouvrir et Partager.
- Historique daté à la place des compteurs décoratifs.
- Conversion devis → facture : confirmation montrant le numéro créé, le montant, l'échéance calculée et le nouvel état du devis. La facture est créée en brouillon, rien n'est envoyé.
- Changement de statut d'un devis, effacement de signature, suppression de logo ou de signature : confirmation obligatoire.

### 5.5 Clients

Règle métier : **nom/prénom OU entreprise**, résolue par un choix explicite Entreprise / Particulier en haut du formulaire. Le formulaire n'expose que les champs du type retenu. `lastName` n'est plus requis pour une société.

- Liste : une icône distingue entreprise et particulier ; nombre de documents et alerte de retard visibles.
- SIRET présenté comme un accélérateur de saisie, pas comme un mur premium ; validation Luhn cohérente entre clients et entreprises ; la saisie manuelle reste toujours possible.
- Suppression : dire « archivé, restaurable » puisque la donnée est en soft-delete. Ne pas écrire « irréversible ».

### 5.6 Scanner produit

Parcours en quatre temps : viser → identifier → **vérifier** → ajouter.

- Seul écran sombre de l'app. Segmented à trois entrées : Scanner (caméra), Référence (saisie manuelle), Photo (analyse IA, Premium, annoncée avant la prise de vue).
- Tant que la caméra n'est pas stabilisée, l'entrée par défaut est Référence et l'onglet Scanner affiche l'état réel. Aucun bouton ne promet un scan qui n'existe pas.
- **Aucun résultat n'entre dans un document sans l'écran de vérification** : ce qui a été reconnu, la source, le prix, la TVA, la quantité, et le montant de la ligne calculé avant l'ajout. Actions : Ajouter, Corriger, Scanner le suivant.
- Un scan non reconnu propose ressayer, saisir la référence, créer le produit. Jamais un échec muet.

### 5.7 Assistant IA

L'IA propose, l'utilisateur décide : lignes à cocher, total recalculé en pied, ligne peu fiable marquée « prix à confirmer ». Le primaire nomme le document courant. L'écriture dans le catalogue n'est jamais forcée : `persistCatalog` devient un choix explicite après l'ajout.

### 5.8 Galerie de modèles

Aucun enregistrement au swipe. Annuler en haut, « Utiliser ce modèle » en bas, état intermédiaire assumé. Deux badges distincts : « Sélectionné » et « Modèle actuel : … ». Colonne de vignettes pour naviguer autrement qu'au glissé. Ligne de pied sur la portée : appliqué aux prochains documents, les documents émis ne changent pas.

### 5.9 Réglages

Trois groupes, Facturation en premier : Facturation (entreprise, TVA et mentions, numérotation, modèles), Compte (abonnement, sécurité, notifications), Assistance (Découvrir INVEQ, aide, légal). Chaque ligne affiche sa valeur actuelle à droite. Un seul lien destructif, en bas, sans bouton plein.

### 5.10 Abonnement

Écran d'offre complet, atteint depuis Réglages et depuis chaque limite Premium : plan actuel, deux durées, liste de ce qui se débloque. Le primaire indique l'achat Apple et son prix. Sous le bouton : paiement via le compte Apple, renouvellement automatique, résiliation dans les réglages iOS. « Restaurer mes achats » visible. Un abonnement souscrit sur le web arrive comme plan actuel et remplace le bloc d'offre par l'état de l'abonnement.

Vocabulaire : un mot par notion. **Premium** pour le plan, **Standard** et **Pro** pour les paliers. Plus de micro / basique.

### 5.11 États vides et messages

Un état vide dit toujours ce qui est filtré et propose l'action qui le vide : « Aucune facture payée sur cette période », pas « Aucune facture ». Les messages d'erreur sont en langage métier, jamais un code technique en toast.

---

## 6. Feature introductions

Six intros : Factures, Devis, Scanner, Assistant IA, Modèles, Statistiques.

Format : 3 scènes, 1,2 à 1,4 s chacune, **4 s au total maximum**. Avance automatique, tap pour passer, jauge de trois segments visible. La scène est une interface INVEQ en réduction — mêmes cartes, mêmes puces, mêmes montants — pas une illustration. Une seule chose bouge par scène, en translation et fondu.

Sous la scène : la promesse en une phrase, puis les trois étapes en vignettes fixes, pour que celui qui coupe l'animation comprenne quand même. Pied : primaire qui lance la fonctionnalité, puis « Plus tard » et « Ne plus afficher » en tertiaire.

Apparition : une intro par fonctionnalité, une seule fois, au moment où l'utilisateur y arrive. Une intro par session, deux jours d'écart minimum. Jamais de carrousel d'accueil. Toutes rejouables depuis Réglages › Découvrir INVEQ.

Déclencheurs : Factures à la première ouverture de Documents ; Devis à la première bascule sur l'onglet Devis ; Scanner au premier passage à l'étape Prestations ; IA au premier accès à l'entrée Photo ; Modèles à la première ouverture de la galerie ; Statistiques à la troisième facture payée.

---

## 7. iPad Air 11"

Trois colonnes en paysage : rail de navigation 78px, liste 376px, document sur le reste. La ligne sélectionnée reste surlignée. Le document peut porter un panneau d'aperçu PDF permanent de 340px.

Seule inversion de règle : sur tablette, les actions du document remontent en haut à droite — le pouce n'est plus la contrainte.

En portrait, la liste devient un panneau escamotable et le document prend toute la largeur. Sous 700px de large, retour exact aux écrans iPhone. Safe areas et largeur maximale de contenu respectées dans les deux orientations.

---

## 8. Accessibilité

- Cible tactile 44×44 minimum, y compris les icônes d'en-tête et les pas de quantité.
- Contraste 4,5:1 pour tout texte sous 19px, 3:1 pour les grands titres et les icônes, vérifié dans les deux modes.
- Le statut n'est jamais porté par la seule couleur.
- Dynamic Type jusqu'à XXL sans troncature : les barres d'action passent en colonne au-delà de L.
- Étiquettes VoiceOver sur chaque icône seule. Les montants sont lus en euros, pas chiffre par chiffre.
- `Réduire les animations` respecté.

---

## 9. Ordre d'implémentation

**Étape 1 — Fondations.** Tokens des deux modes, 5 variantes de bouton, champ, carte, ligne de liste, puce de statut, barre d'action collante. Suppression des `Colors` / `Spacing` legacy. Rien d'autre ne bouge avant.

**Étape 2 — Sorties et libellés.** En-têtes de retour gardés par `canGoBack`, chargements avec en-tête, actions descendues en bas, libellés honnêtes (lien de paiement, référence produit), confirmations manquantes, états vides contextuels. Moitié des griefs de l'audit, aucune donnée touchée.

**Étape 3 — Parcours.** Wizard facture et devis, client Particulier / Entreprise, détail des documents, galerie de modèles, écran d'abonnement IAP, scanner et son écran de vérification.

**Étape 4 — Finition.** iPad master/detail, feature introductions, micro-interactions, passe d'accessibilité, relecture des deux modes écran par écran.

Travailler écran par écran. Signaler tout conflit entre la maquette et le code existant plutôt que de trancher seul.
