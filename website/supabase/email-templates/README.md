# E-mails d’authentification FACTEO

Les e-mails de confirmation / mot de passe oublié sont envoyés par **Supabase Auth**.
Par défaut, l’expéditeur et le design sont ceux de Supabase — d’où le mail « bizarre ».

## 1. Templates FACTEO (immédiat)

Dans le dashboard Supabase → **Authentication** → **Email Templates** :

| Template Supabase | Fichier à coller | Subject recommandé |
|-------------------|------------------|--------------------|
| Confirm signup | `confirm-signup.html` | `Activez votre compte FACTEO` |
| Reset password | `reset-password.html` | `Réinitialisez votre mot de passe FACTEO` |

1. Ouvrez le fichier HTML correspondant
2. Copiez tout le contenu
3. Collez-le dans le template Supabase (mode HTML / Source)
4. Enregistrez

Variables utilisées : `{{ .ConfirmationURL }}`

## 2. Redirections (important pour éviter la page vide)

Dans **Authentication** → **URL Configuration** :

- **Site URL** (local) : `http://localhost:3000`
- **Site URL** (prod) : `https://facteo.app` (ou ton domaine)
- **Redirect URLs** (ajouter toutes) :
  - `http://localhost:3000/auth/callback`
  - `http://localhost:3000/auth/confirm`
  - `http://localhost:3000/auth/confirmed`
  - `http://localhost:3000/reinitialiser-mot-de-passe`
  - `https://TON_DOMAINE/auth/callback`
  - `https://TON_DOMAINE/**`

Dans `website/.env.local` :

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 3. Vrai envoi (SMTP custom — Resend recommandé)

Toujours dans Supabase → **Project Settings** → **Authentication** → **SMTP Settings** :

1. Crée un compte [Resend](https://resend.com)
2. Vérifie ton domaine (`facteo.app`) ou utilise le domaine de test Resend
3. Active Custom SMTP dans Supabase :

| Champ | Valeur typique Resend |
|-------|------------------------|
| Sender email | `noreply@facteo.app` |
| Sender name | `FACTEO` |
| Host | `smtp.resend.com` |
| Port | `465` |
| User | `resend` |
| Password | ta clé API Resend |

Après ça, les e-mails partent de **FACTEO**, avec ton design, plus le branding Supabase.
