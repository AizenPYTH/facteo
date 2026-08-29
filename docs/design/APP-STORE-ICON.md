# App Store icon — préparation (étape 4)

L’icône App Store n’a **pas** été remplacée dans ce dépôt.

## Proposition d’alignement

| Élément | Aujourd’hui | Proposition |
| --- | --- | --- |
| Splash (clair) | `#4F46E5` → déjà passé à `#F7F8FA` dans `app.json` | Fond clair DESIGN §2.1 |
| Splash (sombre) | Non supporté nativement par le plugin splash unique | Fond `#14161C` via asset / storyboard iOS au prochain native build |
| Adaptive Android | Fond `#F7F8FA` | Aligné fond d’écran |
| Icône App Store (1024×1024) | Asset store inchangé | **À valider avant remplacement** |

## Marque

Le monogramme / logo INVEQ reste celui des assets existants (`assets/images/icon.png`, `splash-icon.png`). Seuls les fonds indigo legacy `#4F46E5` sont retirés des configs splash / adaptive / notifications.

## Action requise côté produit

Fournir ou valider un fichier `AppIcon-1024.png` (fond `#F7F8FA` ou plein logo) avant soumission ASC. Ne pas merger un remplacement d’icône store sans accord explicite.
