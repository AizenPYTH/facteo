# App Store icon — préparation (étape 4)

> [!IMPORTANT]
> **NOT applied to the binary — awaiting approval.**
> Ce candidat n’est référencé ni par `app.json`, ni par la configuration App Store.

L’icône App Store utilisée par l’application n’a **pas** été remplacée dans ce dépôt.

## Candidat préparé

- Fichier : [`docs/design/app-store-icon-1024-candidate.png`](./app-store-icon-1024-candidate.png)
- Format : PNG RGB opaque, `1024 × 1024`
- Fond : `#F7F8FA` (token « Fond d’écran », DESIGN §2.1)
- Marque : visuel INVEQ existant repris depuis `assets/images/icon.png`, sans nouveau dessin
- Taille : `306577` octets
- SHA-256 : `72ae6f0cd5bcbe259e202ffb0c61bce8b94ac721ca0f31074da9c47a3a597a88`

## Proposition d’alignement

| Élément | Aujourd’hui | Proposition |
| --- | --- | --- |
| Splash (clair) | `#4F46E5` → déjà passé à `#F7F8FA` dans `app.json` | Fond clair DESIGN §2.1 |
| Splash (sombre) | Non supporté nativement par le plugin splash unique | Fond `#14161C` via asset / storyboard iOS au prochain native build |
| Adaptive Android | Fond `#F7F8FA` | Aligné fond d’écran |
| Icône App Store (1024×1024) | Asset store inchangé | **À valider avant remplacement** |

## Marque

Le monogramme / logo INVEQ reste celui des assets existants (`assets/images/icon.png`, `splash-icon.png`). Le candidat conserve le visuel centré et remplace uniquement le fond clair connecté aux bords par le token `#F7F8FA`, afin de préserver les détails blancs internes de la marque.

## Action requise côté produit

Valider le candidat ci-dessus avant toute application dans `app.json`, un asset natif ou App Store Connect. Ne pas merger un remplacement d’icône store sans accord explicite.
