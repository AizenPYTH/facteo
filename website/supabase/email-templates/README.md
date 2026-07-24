# E-mails d’authentification INVEQ

Templates HTML premium (CSS inline, max-width 600px) prêts à coller dans
**Supabase → Authentication → Email Templates**.

## Fichiers

| Template Supabase | Fichier | Subject recommandé |
|-------------------|---------|--------------------|
| Confirm signup | `confirm-signup.html` | `Activez votre compte INVEQ` |
| Reset password | `reset-password.html` | `Réinitialisez votre mot de passe INVEQ` |
| Change email address | `change-email.html` | `Confirmez votre nouvelle adresse e-mail INVEQ` |
| Invite user | `invite.html` | `Vous êtes invité à rejoindre INVEQ` |
| Magic Link | `magic-link.html` | `Votre lien de connexion INVEQ` |

## Installation

1. Ouvrez le fichier HTML correspondant
2. Copiez tout le contenu
3. Collez-le dans le template Supabase (mode HTML / Source)
4. Renseignez le subject recommandé
5. Enregistrez

## Variables Supabase utilisées

| Variable | Templates |
|----------|-----------|
| `{{ .ConfirmationURL }}` | Tous |
| `{{ .SiteURL }}` | Tous (lien logo) |
| `{{ .Email }}` | confirmation, reset, invite, magic link, change email |
| `{{ .NewEmail }}` | change email |
| `{{ .Token }}` | magic link (code OTP de secours) |

## Logo

Par défaut, un wordmark texte **INVEQ** est affiché (fiable sans images).
Pour utiliser le logo image, remplacez le bloc commenté par :

```html
<img src="https://inveq.fr/logo-inveq.png" width="112" alt="INVEQ" style="display:block;border:0;height:auto;" />
```

## Redirections

Dans **Authentication → URL Configuration** :

- **Site URL** (prod) : `https://inveq.fr`
- **Redirect URLs** : `https://inveq.fr/**`, `http://localhost:3000/**`, plus les chemins `/auth/callback`, `/auth/confirm`, `/auth/confirmed`, `/reinitialiser-mot-de-passe`

## SMTP (production)

Pour un envoi depuis INVEQ (et non le branding Supabase), configurez un SMTP custom
(Resend recommandé) dans **Project Settings → Authentication → SMTP Settings**.
