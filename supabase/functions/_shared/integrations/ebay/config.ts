/**
 * Configuration eBay.
 *
 * Toutes les valeurs proviennent des secrets Supabase. Rien n'est codé en dur,
 * rien n'est exposé au frontend. Les environnements sandbox et production ont
 * des credentials ET un RuName distincts : ils ne sont jamais mélangés.
 *
 * Endpoints vérifiés sur le contrat OpenAPI officiel eBay `sell_fulfillment`
 * v1.20.0 (securitySchemes.api_auth.flows.authorizationCode) et sur le client
 * officiel `ebay-oauth-nodejs-client` publié par eBay Inc.
 */

export type EbayEnvironment = 'sandbox' | 'production';

/** Identifiant du fournisseur dans les tables génériques d'intégration. */
export const EBAY_PROVIDER = 'ebay';

export type EbayConfig = {
  environment: EbayEnvironment;
  clientId: string;
  clientSecret: string;
  /** RuName eBay. Sert de `redirect_uri` OAuth ; ce n'est PAS une URL. */
  ruName: string;
  authorizeUrl: string;
  tokenUrl: string;
  apiBaseUrl: string;
};

/** Seul scope demandé : lecture des commandes. INVEQ n'écrit rien sur eBay. */
export const EBAY_SCOPES = ['https://api.ebay.com/oauth/api_scope/sell.fulfillment.readonly'];

const ENDPOINTS: Record<EbayEnvironment, Pick<EbayConfig, 'authorizeUrl' | 'tokenUrl' | 'apiBaseUrl'>> = {
  production: {
    authorizeUrl: 'https://auth.ebay.com/oauth2/authorize',
    tokenUrl: 'https://api.ebay.com/identity/v1/oauth2/token',
    apiBaseUrl: 'https://api.ebay.com',
  },
  sandbox: {
    authorizeUrl: 'https://auth.sandbox.ebay.com/oauth2/authorize',
    tokenUrl: 'https://api.sandbox.ebay.com/identity/v1/oauth2/token',
    apiBaseUrl: 'https://api.sandbox.ebay.com',
  },
};

export function isEbayEnvironment(value: unknown): value is EbayEnvironment {
  return value === 'sandbox' || value === 'production';
}

/** Environnement par défaut du projet, `production` sauf configuration contraire. */
export function defaultEbayEnvironment(): EbayEnvironment {
  const raw = Deno.env.get('EBAY_ENVIRONMENT')?.trim().toLowerCase();
  return isEbayEnvironment(raw) ? raw : 'production';
}

function requireEnv(name: string): string {
  const value = Deno.env.get(name)?.trim();
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export function loadEbayConfig(environment: EbayEnvironment = defaultEbayEnvironment()): EbayConfig {
  const prefix = environment === 'sandbox' ? 'EBAY_SANDBOX_' : 'EBAY_';
  return {
    environment,
    clientId: requireEnv(`${prefix}CLIENT_ID`),
    clientSecret: requireEnv(`${prefix}CLIENT_SECRET`),
    ruName: requireEnv(`${prefix}RUNAME`),
    ...ENDPOINTS[environment],
  };
}

/**
 * Marqueur stocké dans `integration_oauth_states.redirect_to` quand la
 * demande vient de l'application mobile. On ne stocke jamais une URL fournie
 * par le client dans ce cas : la cible est résolue côté serveur, ce qui exclut
 * toute redirection ouverte.
 */
export const EBAY_APP_RETURN_MARKER = 'app';

/**
 * Base de redirection après le callback OAuth.
 * L'utilisateur revient sur l'écran d'intégration, jamais sur une page brute.
 */
export function ebayReturnUrl(params: Record<string, string>, target: 'web' | 'app' = 'web'): string {
  const base =
    (target === 'app'
      ? Deno.env.get('EBAY_APP_RETURN_URL')?.trim() || 'inveq://settings/integrations-ebay'
      : null) ||
    Deno.env.get('EBAY_RETURN_URL')?.trim() ||
    // Route du site Next.js (inveq.fr). L'app iOS revient par
    // EBAY_APP_RETURN_URL sur le schéma inveq://.
    //
    // INVEQ_SITE_URL n'est volontairement pas consulté : ce secret est partagé
    // avec SUPER PDP et peut désigner la racine du site, ce qui renverrait
    // l'utilisateur sur une page sans rapport.
    'https://www.inveq.fr/app/settings/integrations/ebay';
  const url = new URL(base);
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return url.toString();
}
