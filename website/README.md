# FACTEO — Plateforme Web unifiée

Site marketing + application web sur **un seul domaine** : `facteo.app`

## Architecture

```
facteo.app/              → Site marketing
facteo.app/login         → Connexion
facteo.app/register      → Inscription
facteo.app/app           → Dashboard (protégé)
facteo.app/app/clients   → Clients
facteo.app/app/invoices  → Factures
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
- Types locaux via `@facteo/types/*` → `website/src/types/`
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
```

### Déploiement Vercel

1. **Settings → General → Root Directory** : `website`
2. **Framework Preset** : Next.js (détection automatique)
3. **Build / Install Command** : laisser vide (défaut Vercel)
4. Ne pas ajouter de `vercel.json` — Vercel lit `website/package.json` directement

### Variables d'environnement (Vercel)

| Variable | Valeur |
|----------|--------|
| `NEXT_PUBLIC_SITE_URL` | `https://facteo.app` |
| `NEXT_PUBLIC_SUPABASE_URL` | Même URL que l'app mobile |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Même clé anon que l'app mobile |

### Supabase Dashboard (obligatoire pour les e-mails)

**Authentication → URL Configuration :**

| Champ | Valeur locale | Valeur production |
|-------|---------------|-------------------|
| Site URL | `http://localhost:3000` | `https://facteo.app` |
| Redirect URLs | `http://localhost:3000/auth/callback` | `https://facteo.app/auth/callback` |

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

- Types : `../src/types/` via alias `@facteo/types/*`
- Services : `website/src/lib/domain/supabase/` (copie avec alias d’imports)
- Validations : `website/src/lib/domain/validations/`

L’UI web est reconstruite en Tailwind (desktop-first), sans React Native Web.
