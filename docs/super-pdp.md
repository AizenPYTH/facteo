# SUPER PDP — facturation électronique INVEQ

Intégration multi-tenant de la Plateforme Agréée **SUPER PDP** dans INVEQ (éditeur SNOWOLF).

Source de vérité API : OpenAPI officiel  
`https://api.superpdp.tech/openapi/superpdp.json` (v1.30.0.beta au moment de l’intégration).

UI Scalar : https://www.superpdp.tech/openapi/

---

## Architecture

```
Mobile / Website (jamais de client_secret ni tokens)
        │  Bearer JWT Supabase
        ▼
Supabase Edge Functions (secrets serveur)
        │  OAuth Authorization Code + Bearer access_token
        ▼
api.superpdp.tech
```

- **Une connexion SUPER PDP par entreprise INVEQ** (`company_superpdp_connections`).
- Les credentials OAuth de l’**application** INVEQ/SNOWOLF (`SUPER_PDP_CLIENT_ID` / `SUPER_PDP_CLIENT_SECRET`) servent uniquement à démarrer le flow OAuth.
- Chaque client INVEQ autorise **son** compte SUPER PDP ; les tokens sont stockés chiffrés, scopés à `company_id`.
- Le frontend ne reçoit **jamais** `access_token` / `refresh_token` / `client_secret`.

---

## OAuth 2.1 Authorization Code

Endpoints officiels :

| Étape | Méthode | URL |
|-------|---------|-----|
| Authorize | GET | `https://api.superpdp.tech/oauth2/authorize` |
| Token | POST | `https://api.superpdp.tech/oauth2/token` |
| Session | GET | `/v1.beta/oauth2_sessions/me` |
| Company | GET | `/v1.beta/companies/me` |

Paramètres authorize documentés (OpenAPI `BearerAuth`) :

- `response_type=code`
- `client_id`
- `redirect_uri`
- `state` (CSRF, généré côté INVEQ)
- optionnel : `login_hint`, `superpdp_company_number`, `superpdp_company_number_scheme` (`sandbox` \| `fr_siren` \| `be_numero_entreprise`)

Scopes : objet vide dans l’OpenAPI — **aucun scope inventé**.

Refresh tokens : **rotation OAuth 2.1** (confirmée par le client PHP officiel Bluerock).  
À chaque refresh, le nouveau `refresh_token` est persisté immédiatement.

### Flow INVEQ

1. UI Paramètres → Facturation électronique → Connecter SUPER PDP  
2. `POST superpdp-oauth-authorize` (JWT + `companyId` validé via `company_members`)  
3. Insertion `superpdp_oauth_states` (state one-time, TTL 10 min, lié à `company_id` + `user_id`)  
4. Redirect utilisateur vers SUPER PDP  
5. Callback `superpdp-oauth-callback` : valide state, échange code, chiffre tokens, upsert connexion  
6. Redirect navigateur vers `/app/settings/e-invoicing?superpdp=connected`

**Interdit** : accepter un `company_id` du callback sans passer par le state serveur.

---

## Variables d’environnement (serveur uniquement)

| Variable | Rôle |
|----------|------|
| `SUPER_PDP_CLIENT_ID` | OAuth app client id |
| `SUPER_PDP_CLIENT_SECRET` | OAuth app client secret (**jamais** Expo / Next public) |
| `SUPER_PDP_REDIRECT_URI` | Doit matcher l’URL enregistrée chez SUPER PDP |
| `SUPER_PDP_API_BASE_URL` | défaut `https://api.superpdp.tech` |
| `SUPER_PDP_TOKEN_ENCRYPTION_KEY` | 32 bytes (64 hex) AES-GCM |
| `SUPER_PDP_SUCCESS_REDIRECT_URL` | UI post-callback (défaut `https://www.inveq.fr/app/settings/e-invoicing`) |
| `INVEQ_SITE_URL` | fallback redirect |
| `SUPER_PDP_WEBHOOK_SHARED_SECRET` | optionnel ; voir section Webhooks |

Supabase fournit déjà : `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

### Callback URL à déclarer chez SUPER PDP

```
https://<PROJECT_REF>.supabase.co/functions/v1/superpdp-oauth-callback
```

---

## Base de données

Migration : `supabase/migrations/20260902120000_super_pdp_einvoicing.sql`

- `company_superpdp_connections` — tokens chiffrés, **pas d’accès authenticated**
- vue / RPC statut sans secrets
- `superpdp_oauth_states` — CSRF one-time
- colonnes e-facture sur `invoices`
- `superpdp_received_invoices` — réception
- `superpdp_webhook_events` — idempotence événements
- `superpdp_directory_lookups` — cache annuaire
- `companies.siren`, `has_vat_on_debits`, `vat_regime`

RLS : une entreprise A ne lit jamais les tokens de B (tokens hors SELECT client).

---

## Edge Functions

| Function | Rôle |
|----------|------|
| `superpdp-oauth-authorize` | Génère state + URL authorize |
| `superpdp-oauth-callback` | Échange code, stocke tokens |
| `superpdp-connection` | Statut / verify (sans tokens) |
| `superpdp-disconnect` | Révoque localement |
| `superpdp-directory-lookup` | Annuaire FR (`/v1.beta/french_directory/entries`) |
| `superpdp-send-invoice` | Convert en16931→CII puis POST invoices + `external_id` |
| `superpdp-sync` | Poll invoices / invoice_events |
| `superpdp-webhook` | Récepteur conditionnel (voir blockers) |

---

## Émission

1. Validation données INVEQ  
2. Build JSON `en_invoice` (schéma OpenAPI officiel)  
3. `POST /v1.beta/invoices/convert?from=en16931&to=cii` (public)  
4. `POST /v1.beta/invoices` `Content-Type: application/xml` + `external_id=<invoice.uuid>`  

**Idempotence** :

- Si `superpdp_invoice_id` déjà présent → pas de second envoi  
- `external_id` = `invoices.id` (≤ 36 caractères, contrainte API)  
- Claim DB avant l’appel distant  

PDF classique INVEQ inchangé (parallèle à la facture électronique).

---

## Mapping des statuts

SUPER PDP n’a **pas** de state machine exclusive (événements cumulés).  
INVEQ dérive un résumé `electronic_invoice_status`.

| SUPER PDP | INVEQ |
|-----------|-------|
| `api:uploaded`, `api:validated`, `fr:200` | `submitted` |
| `api:sent`, `fr:201`, `fr:203` | `delivered` |
| `api:received`, `fr:202` | `received` |
| `api:accepted`, `fr:204`–`fr:206`, `fr:209` | `accepted` |
| `api:rejected`, `fr:207`, `fr:210`, `fr:213`, `fr:501` | `rejected` |
| `fr:211`, `fr:212` | `paid` |
| `api:invalid` | `error` |

Détail officiel des `fr:*` : documentation SUPER PDP `/documentation/6` (référencée dans l’OpenAPI).

---

## Annuaire

- `GET /v1.beta/french_directory/entries?number={SIREN}` — **public** (security: [])  
- Entrées actives → « Client compatible facturation électronique »  
- N’bloque pas l’émission PDF classique  

Inscription annuaire de **votre** entreprise : `POST /v1.beta/directory_entries` (authentifié) — UI « Annuaire : Inscrit / Non inscrit » via liste des entrées.

---

## Réception

`GET /v1.beta/invoices?direction=in` via `superpdp-sync` → table `superpdp_received_invoices`.  
Pas de marquage automatique « payé ».  
Pas d’import achats (module absent).

---

## E-reporting

Endpoints officiels exposés (à utiliser via SUPER PDP, **sans inventer de règles fiscales**) :

- `/v1.beta/ereportings`, `/preview`, `/{id}`
- `/v1.beta/b2c_transactions`, `/v1.beta/b2c_payments`
- `/v1.beta/b2bint_invoices`, `/v1.beta/b2bint_payments`

`processing_rule` documenté : `B2B`, `B2BInt`, `B2C`, …  
L’architecture délègue le reporting à SUPER PDP après émission conforme.  
**Aucune règle fiscale approximative n’est codée dans INVEQ.**

---

## Formats

Supportés par SUPER PDP : JSON EN16931, Factur-X, CII, UBL.  
INVEQ génère JSON → convertit en **CII XML** via l’API officielle (évite un générateur XML local).  
Validation AFNOR : `POST /v1.beta/validation_reports` (public) — utilisable en pré-contrôle.

---

## Webhooks — point bloquant

L’OpenAPI produit SUPER PDP **ne documente pas** d’endpoint d’enregistrement webhook ni de schéma de signature pour `api.superpdp.tech`.

L’API AFNOR XP Z12-013 Flow documente `Afnor-Signature` / `Afnor-Signature-Timestamp` — **API distincte**.

Donc :

1. Sync cycle de vie = **polling** `invoice_events` (`superpdp-sync`)  
2. `superpdp-webhook` reste désactivé (503) tant que `SUPER_PDP_WEBHOOK_SHARED_SECRET` n’est pas défini **et** que SUPER PDP n’a pas confirmé le schéma de signature  

Ne pas inventer un HMAC « comme Facturino ».

---

## Portabilité Qonto → SUPER PDP

Traitée **administrativement par SUPER PDP**.  
INVEQ permet seulement de vérifier le rattachement après migration.  
Aucune migration Qonto fictive, aucune suppression de données Qonto dans INVEQ.

---

## Multi-tenant / sécurité

- State OAuth lié à `company_id`  
- Membership vérifiée avant authorize / send / sync  
- Tokens AES-GCM  
- Logs sans secrets  
- Mobile → INVEQ API only  

---

## UI

- Mobile : Paramètres → Facturation électronique  
- Website : `/app/settings/e-invoicing`  
- Facture : action « Envoyer en facture électronique »  
- Factures reçues : `/settings/e-invoicing-received` et `/app/settings/e-invoicing/received`

---

## Déploiement

1. Appliquer la migration SQL sur le projet Supabase  
2. Définir les secrets Edge (table ci-dessus)  
3. Déployer les fonctions `superpdp-*`  
4. Enregistrer `SUPER_PDP_REDIRECT_URI` chez SUPER PDP  
5. Tester OAuth en sandbox (`remote_env`) avant production  

---

## Tests

Voir :

- `supabase/functions/_shared/superpdp/status-map.test.ts`
- `supabase/functions/_shared/superpdp/en-invoice.test.ts`
- `src/lib/superpdp/__tests__/status-map.test.ts` (miroir Node si Vitest dispo)

Couverture cible : mapping statuts, builder EN16931, idempotence claim, state OAuth one-time (intégration), isolation tenant.
