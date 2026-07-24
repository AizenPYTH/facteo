# INVEQ — Plateforme Web unifiée

Site marketing + application web sur **un seul domaine** : `inveq.app`

## Architecture

```
inveq.app/              → Site marketing
inveq.app/login         → Connexion
inveq.app/register      → Inscription
inveq.app/app           → Dashboard (protégé)
inveq.app/app/clients   → Clients
inveq.app/app/invoices  → Factures
…

Application mobile       → Expo (iOS / Android) — inchangée
```

## Stack

- **Next.js 16** (App Router)
- **Supabase** (auth + données, `@supabase/ssr`)
- **React Query** (état serveur)
- **Tailwind CSS v4** + Framer Motion
- **Logique métier** : copie autonome dans `website/src/lib/domain/` (aucune dépendance Expo)

## Indépendance Expo / Next.js

Le dossier `website/` est **totalement indépendant** de l'app mobile Expo :

- Aucun package `expo-*` ni `react-native` dans `package.json`
- Variables d'environnement préfixées `NEXT_PUBLIC_*` uniquement
- Types locaux via `@inveq/types/*` → `website/src/types/`
- ESLint interdit les imports Expo/React Native (voir `eslint.config.mjs`)

L'app Expo reste à la racine du monorepo ; les deux projets partagent la même base Supabase mais pas de code runtime commun.

## Développement local

```bash
cd website
npm install
cp .env.example .env.local
# Renseigner NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY
npm run dev
```

## Variables d'environnement

Copier `.env.example` vers `.env.local` et renseigner les clés Supabase (même projet que l'app mobile, mais variables `NEXT_PUBLIC_*` ici) :

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
NEXT_PUBLIC_COMPANY_SEARCH_API_URL=https://recherche-entreprises.api.gouv.fr
NEXT_PUBLIC_COMPANY_SEARCH_PROVIDER=recherche-entreprises
```

La recherche SIREN / SIRET (préremplissage client) nécessite `NEXT_PUBLIC_COMPANY_SEARCH_API_URL`
et un abonnement Premium (`siren_search`), comme sur l’app mobile.

### Déploiement Vercel (monorepo INVEQ + Expo)

Le dépôt contient deux apps indépendantes (Expo à la racine, Next.js dans `website/`).
Next.js détecte automatiquement le monorepo via le `package-lock.json` racine et produit
`relativeAppDir: "website"` dans `.next/required-server-files.json`.

**Réglages obligatoires dans Vercel → Settings → General / Build :**

| Paramètre | Valeur |
|-----------|--------|
| Root Directory | *(vide — racine du repo)* |
| Framework Preset | Next.js (auto) |
| Install Command | *(vide — défaut)* |
| Build Command | *(vide — défaut)* |
| Output Directory | *(vide — ne jamais mettre `website/.next`)* |
| Include files outside Root Directory | Désactivé |

Ne pas ajouter de `vercel.json`. Ne pas définir `outputFileTracingRoot` ni `turbopack.root`
dans `next.config.ts` : ces options forcent `relativeAppDir: ""` et font chercher
`.next/package.json` à la racine du repo au lieu de `website/.next/`.

### Variables d'environnement (Vercel)

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://inveq.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Même URL que l'app mobile |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Même clé anon que l'app mobile |
| `NEXT_PUBLIC_COMPANY_SEARCH_API_URL` | `https://recherche-entreprises.api.gouv.fr` |
| `NEXT_PUBLIC_COMPANY_SEARCH_PROVIDER` | `recherche-entreprises` (optionnel) |

### Supabase Dashboard (obligatoire pour les e-mails)

**Authentication → URL Configuration :**

| Champ | Valeur locale | Valeur production |
|-------|---------------|-------------------|
| Site URL | `http://localhost:3000` | `https://inveq.app` |
| Redirect URLs | `http://localhost:3000/auth/callback` | `https://inveq.app/auth/callback` |

Sans ces URLs, les e-mails de confirmation et de mot de passe oublié ne fonctionneront pas.

## Pages publiques

| Route | Description |
|-------|-------------|
| `/` | Accueil |
| `/fonctionnalites` | Fonctionnalités |
| `/tarifs` | Tarifs |
| `/faq` | FAQ |
| `/contact` | Contact |
| `/support` | Support |
| `/a-propos` | À propos |
| `/carrieres` | Carrières (placeholder) |
| `/telecharger` | Télécharger |
| `/blog` | Blog (placeholder) |
| Pages légales | `/confidentialite`, `/conditions-utilisation`, etc. |

## Application web (`/app`)

| Route | Description |
|-------|-------------|
| `/app` | Tableau de bord |
| `/app/clients` | Clients |
| `/app/quotes` | Devis |
| `/app/invoices` | Factures |
| `/app/payments` | Paiements |
| `/app/companies` | Entreprises |
| `/app/settings` | Paramètres |

## Réutilisation du code Expo

La logique métier (services Supabase, validations, types, formatters) est partagée :

- Types : `../src/types/` via alias `@inveq/types/*`
- Services : `website/src/lib/domain/supabase/` (copie avec alias d’imports)
- Validations : `website/src/lib/domain/validations/`

L’UI web est reconstruite en Tailwind (desktop-first), sans React Native Web.
