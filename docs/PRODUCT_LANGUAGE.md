# INVEQ Product Language

> Design Language = *comment* ça se sent.  
> Product Language = *pourquoi* on construit ainsi, et *comment* on décide.  
> Ensemble, ils empêchent le produit de dériver — même à 80 écrans.

Le Design Language (`docs/DESIGN_LANGUAGE.md` + tokens dans `src/constants/theme/`) est la grammaire visuelle.  
Ce document est la **constitution produit**.

---

## 0. Vision v1 (figée)

**Pour qui :** artisan seul / TPE 1–10 personnes.  
**Pour quoi :** devis → facture → être payé rapidement.  
**Contre qui :** d’abord la **répétition**, pas Pennylane / Tiime / Obat.

### Trois promesses

1. **Je facture en moins d’une minute.**
2. **Je suis payé plus vite.**
3. **Je ne saisis jamais deux fois la même chose.**

### Filtre avant chaque chantier

> Un artisan terrain utilisera-t-il cette fonctionnalité **au moins une fois par semaine** ?  
> Non → pas prioritaire aujourd’hui.

### Règle de PR

Chaque PR doit apporter au moins : **moins de clics**, **moins de saisies**, **moins de décisions**, ou **moins de temps**.  
Sinon elle n’est probablement pas prioritaire.

### Signature produit

**« Comme la dernière fois »** — visible partout où elle apporte de la valeur (Accueil, fiche client, wizards, états vides, documents récents). Jamais cachée dans un menu.

On n’évolue plus la vision : on exécute.

---

## 1. Product Principles (immuables)

Ces 10 règles ne se négocient pas. Une feature qui les viole n’est pas « un compromis » — c’est un bug produit.

### P1 — Trois interactions maximum
Toute action importante (créer un devis, envoyer une facture, ajouter un client) doit être atteignable en **≤ 3 interactions** depuis l’écran courant ou le point d’entrée naturel.  
Si ça demande plus, on a mal placé l’action ou trop fragmenté le flux.

### P2 — Jamais de silence
Aucune action initiée par l’utilisateur ne peut se terminer sans feedback (immédiat ou progressif) : press state, skeleton, toast, état inline, ou transition claire.  
Le vide après un tap = perte de confiance.

### P3 — Le motion guide, il ne décore pas
Une animation existe pour **orienter l’attention**, confirmer une cause→effet, ou adoucir un changement d’état spatial.  
Si on peut la retirer sans perdre de compréhension, on la retire.

### P4 — Vitesse perçue > vitesse réelle
Un skeleton fidèle au layout final bat un spinner plus « rapide ».  
Optimiser le ressenti (structure immédiate, contenu progressif) avant de micro-optimiser des ms invisibles.

### P5 — L’essentiel domine
Sur chaque écran / carte, **une** information primaire doit gagner le scan (montant, statut critique, prochain geste).  
Si tout crie, rien n’est entendu.

### P6 — Simplicité avant densité
On préfère moins d’actions visibles et un chemin clair, plutôt qu’un écran « complet » saturé.  
La densité se gagne par la hiérarchie, pas par l’accumulation.

### P7 — La couleur informe
Les couleurs signalent statut, danger, succès, focus — pas l’esthétique gratuite.  
Pas de nouvelle teinte « pour faire joli ». Le violet/indigo de marque est identité ; le reste est sémantique.

### P8 — Une carte est une unité d’action
Une carte n’est pas un cadre décoratif. Elle regroupe une **entité** (document, client, KPI) et invite à un geste clair (ouvrir, agir).  
Si on ne peut pas nommer l’entité ou l’action, ce n’est pas une carte — c’est du bruit.

### P9 — Compréhension sans tutoriel
Une feature nouvelle doit être utilisable par un artisan pressé **sans onboarding dédié**.  
Labels explicites, empty states narratifs, CTA évidents. Les tooltips sont un pansement, pas une stratégie.

### P10 — Confiance avant cleverness
INVEQ facture de l’argent réel. On privilégie clarté, prévisibilité et réversibilité (brouillon, confirmation destructive) sur les patterns « malins » ou surprenants.

---

## 2. UX Principles (comportements cohérents)

Chaque situation ci-dessous a **un** comportement produit. Pas de variante locale « parce que cet écran est spécial ».

### Navigation
- Structure prévisible : tabs pour les piliers (accueil, documents, clients, réglages), stack pour le détail.
- Retour toujours possible ; pas de piège modal sans dismiss clair.
- Le titre d’écran nomme le **lieu**, pas le marketing.

### Recherche
- Même pattern partout : champ contained, placeholder actionnable (« Rechercher un client… »), résultats instantanés ou skeleton.
- État vide de recherche ≠ empty state métier (« Aucun résultat » ≠ « Créez votre premier client »).

### Création
- Point d’entrée unique et visible (FAB ou CTA primaire de section).
- Flux : **essentiel d’abord**, options ensuite (progressive disclosure).
- Brouillon / sortie : ne jamais perdre de données sans le dire.

### Suppression
- Destructive = confirmation explicite (sheet ou dialog), libellé qui nomme l’objet (« Supprimer le devis FAC-… »).
- Haptic + feedback toast après succès.
- Irréversible clairement annoncé.

### Confirmation
- Réservée aux actions destructives ou financières à fort impact.
- Pas de confirmation pour les gestes banals (sinon fatigue et clics aveugles).

### Sucès
- Toujours : feedback Interaction Language (`toast` + haptic succès + icône) pour les actions abouties importantes.
- Auto-dismiss selon Design Language (≈ 2,8 s).
- Optionnel : rester sur place ou naviguer — le succès ne doit pas kidnapper l’utilisateur sans raison.

### Erreur
- Message **humain + actionnable** (« Impossible d’envoyer. Vérifiez la connexion. »), pas de code technique brut.
- Toast / banner selon gravité ; erreurs de champ **inline** sur le champ fautif.
- Haptic erreur pour les échecs d’action globale.

### Chargement
- Layout connu → **skeleton** (Design Language).
- Action ponctuelle inconnue → spinner inline sur le contrôle.
- Jamais un écran blanc.

### Vide (empty)
- Explique *pourquoi* c’est vide + **une** action suivante évidente.
- Ton accueillant, pas culpabilisant.
- Même structure visuelle partout (icon well + titre + description + CTA).

### Offline
- Bannière discrète et persistante quand le réseau manque.
- Les actions qui nécessitent le réseau échouent clairement ; pas de faux succès.
- Les données déjà chargées restent consultables si possible (cache React Query).

### Synchronisation
- Silencieuse quand elle réussit.
- Visible seulement si l’utilisateur doit attendre ou réessayer.
- Pas de « Syncing… » permanent anxiogène.

### Notifications
- Utiles, rares, actionnables.
- Pas de spam promotionnel dans le produit métier.
- Préférences utilisateur respectées (écran réglages unique).

---

## 3. Cognitive Load (charge mentale)

### Budget par écran (cible)

| Mesure | Cible | Alerte |
|--------|-------|--------|
| Décisions simultanées visibles | ≤ 3 | > 5 = simplifier |
| Actions primaires visibles | 1 | > 2 = hiérarchiser |
| Actions secondaires visibles | ≤ 3 | le reste en menu / overflow |
| Couleurs sémantiques utiles | ≤ 4 hors neutres | arc-en-ciel = échec |
| Niveaux typographiques distincts | ≤ 4 | plus = bruit |

### Questions obligatoires à chaque review d’écran

1. Quelle est **la** chose que l’utilisateur doit comprendre en 3 secondes ?
2. Combien de boutons / gestes peut-il faire sans scroller ?
3. Que peut-on **retirer** sans casser la tâche ?
4. Est-ce qu’une information secondaire vole la vedette au primaire ?

### Si l’écran est trop chargé — recettes

- Découper en étapes (wizard) plutôt qu’empiler.
- Progressive disclosure (avancé derrière « Plus d’options »).
- Déplacer les métadonnées en caption / détail.
- Une carte = une entité ; fusionner les blocs redondants.

---

## 4. Future Proof (anti-dérive à 80 écrans)

Ces garde-fous existent pour que 2028 ressemble encore à INVEQ.

### Interdit sans RFC produit + Design Language update

| Élément | Règle |
|---------|--------|
| Nouveau composant UI | Justifier pourquoi un rôle existant ne suffit pas ; sinon étendre le rôle, ne pas forker |
| Nouveau rayon | **Interdit** — utiliser `radius.*` uniquement |
| Nouvelle ombre / élévation | **Interdit** — `elevation[0–4]` uniquement |
| Nouvelle durée / spring | **Interdit** — `duration.*` / `spring.*` uniquement |
| Nouvelle couleur | **Interdit** sans validation explicite + ajout aux tokens `colors` |
| Nouvelle animation « one-off » | **Interdit** — composer Motion Language |
| Nouvelle variante de bouton / carte | Préférer props d’un composant officiel |

### Processus

1. Besoin réel utilisateur documenté en 3 lignes.
2. Mapping aux Product Principles (P1–P10).
3. Composition Design Language (pas de pixels orphelins).
4. Feature Quality Checklist validée (section 5).
5. PR **petite**, réversible, un intent clair.

### Dette visuelle

Toute exception temporaire (hotfix) doit porter un commentaire `// PRODUCT_DEBT:` + ticket.  
Les dettes non listées sont considérées comme des régressions.

---

## 5. Feature Quality Checklist

**Aucune feature n’est « terminée » tant que cette liste n’est pas cochée.**

### Design Language
- [ ] Motion Language (`duration` / `spring` / pas d’anim gratuite)
- [ ] Surface Language (`surface.*` / `elevation` — famille cards respectée)
- [ ] Typography Language (`type.*` — un primaire clair)
- [ ] Interaction Language (press recipe + haptics + feedback succès/erreur)
- [ ] Component Language (catalogue officiel, pas de one-shot)

### Product Language
- [ ] Product Principles P1–P10 respectés (ou exception écrite)
- [ ] UX Principles de la situation couverte (création, erreur, vide, etc.)
- [ ] Cognitive load dans les budgets (section 3)
- [ ] Compréhensible sans tutoriel (P9)

### Qualité d’exécution
- [ ] Accessibilité : labels, rôles, contraste, zones de tap ≥ 44pt
- [ ] Performance perçue : skeleton / pas de jank évident sur device moyen
- [ ] États : loading, empty, error, success traités
- [ ] Offline / échec réseau : message actionnable si pertinent
- [ ] Dark mode : pas de régression grossière

### Ingénierie
- [ ] PR petite, testable, réversible
- [ ] Pas de magic numbers de motion / radius / shadow
- [ ] Code aligné tokens (`src/constants/theme/*`)

---

## 6. Application (après validation de cette couche)

Ordre d’application du Design Language **sous** ce Product Language :

1. Dashboard  
2. Documents (cards + listes)  
3. Clients  
4. Formulaires  
5. Navigation  
6. Settings  

**Format de PR :** un intent spectaculaire pour l’œil, scope petit, diff lisible, rollback facile.

---

## 7. North star

Nous ne construisons pas seulement un logiciel de facturation.  
Nous construisons un produit dont la **cohérence**, l’**identité** et la **qualité d’exécution** restent intactes quand le nombre d’écrans multiplie.

Si une décision future force à choisir entre « feature de plus » et « cohérence », **la cohérence gagne** — jusqu’à ce qu’on mette à jour volontairement ce document.
