# Configuration Google OAuth — marque INVEQ

Le message « Accéder à l’application eogyopufctnqasjhsthp.supabase.co » vient de
**Google Cloud Console** (écran de consentement OAuth), pas du code INVEQ.

## 1. Google Cloud Console

1. Ouvrir [Google Cloud Console](https://console.cloud.google.com/) → le projet lié à INVEQ
2. **APIs & Services** → **OAuth consent screen**
3. Renseigner :

| Champ | Valeur |
|-------|--------|
| App name | `INVEQ` |
| User support email | ton e-mail |
| Application home page | `https://www.inveq.fr/inveq.html` (HTML statique dédié branding OAuth — pas `/`) |
| Application privacy policy | `https://www.inveq.fr/confidentialite` |
| Application terms of service | `https://www.inveq.fr/conditions-utilisation` |
| Authorized domains | `inveq.fr` (+ `supabase.co` si demandé) |
| App logo | `website/public/oauth-logo.png` (carré 512×512, icône + texte INVEQ, ≤ 120 Ko) |

4. Enregistrer → **Publish app** (ou rester en Testing avec des test users)

## 2. Identifiants OAuth

**APIs & Services** → **Credentials** → client OAuth **Web** :

- Authorized JavaScript origins :
  - `https://www.inveq.fr`
  - `http://localhost:3000`
- Authorized redirect URIs :
  - `https://eogyopufctnqasjhsthp.supabase.co/auth/v1/callback`
  - (ne pas remplacer par inveq.fr — Supabase reçoit le callback Google)

## 3. Supabase

**Authentication** → **URL Configuration** :

- Site URL : `https://www.inveq.fr`
- Redirect URLs :
  - `https://www.inveq.fr/auth/callback`
  - `http://localhost:3000/auth/callback`

**Authentication** → **Providers** → **Google** :
- Client ID / Secret = ceux du client Web Google Cloud

## 4. Vérification

Après publication du consentement Google, la fenêtre doit afficher **INVEQ**
(et non le sous-domaine Supabase). Un délai de quelques minutes est possible.
