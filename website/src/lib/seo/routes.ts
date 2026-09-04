/**
 * Source unique des routes publiques indexables.
 *
 * Le sitemap et le fichier robots dérivent tous deux de cette liste : ils
 * divergeaient auparavant — `/login` figurait au sitemap alors que la page
 * porte `robots: noindex`, ce qui revient à demander à Google d'explorer une
 * URL qu'on lui interdit ensuite d'indexer.
 *
 * Une route n'entre ici que si elle répond à une intention de recherche et
 * porte un contenu propre. Les pages de compte, les alias de redirection et les
 * pages sans contenu n'y sont pas.
 */

export type PublicRoute = {
  path: string;
  /** Priorité relative au sein du site, pas une promesse faite à Google. */
  priority: number;
  changeFrequency: 'weekly' | 'monthly' | 'yearly';
};

/** Pages produit et commerciales — le cœur du référencement. */
export const PRODUCT_ROUTES: PublicRoute[] = [
  { path: '', priority: 1, changeFrequency: 'weekly' },
  { path: '/logiciel-facturation', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/logiciel-devis-facture', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/facturation-electronique', priority: 0.9, changeFrequency: 'monthly' },
  { path: '/facturation-auto-entrepreneur', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/fonctionnalites', priority: 0.8, changeFrequency: 'monthly' },
  { path: '/tarifs', priority: 0.8, changeFrequency: 'monthly' },
];

/** Guides éditoriaux. Chaque entrée correspond à un article réellement écrit. */
export const GUIDE_ROUTES: PublicRoute[] = [
  { path: '/guides', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/guides/mentions-obligatoires-facture', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/guides/devis-ou-facture', priority: 0.7, changeFrequency: 'yearly' },
  { path: '/guides/facture-electronique-obligation', priority: 0.7, changeFrequency: 'monthly' },
  { path: '/guides/choisir-logiciel-facturation', priority: 0.7, changeFrequency: 'yearly' },
];

/** Pages d'appui : utiles aux visiteurs, secondaires pour la recherche. */
export const SUPPORT_ROUTES: PublicRoute[] = [
  { path: '/faq', priority: 0.6, changeFrequency: 'monthly' },
  { path: '/support', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/telecharger', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/a-propos', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/contact', priority: 0.4, changeFrequency: 'yearly' },
];

/** Pages légales : indexables, mais sans ambition de positionnement. */
export const LEGAL_ROUTES: PublicRoute[] = [
  { path: '/mentions-legales', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/confidentialite', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/conditions-utilisation', priority: 0.2, changeFrequency: 'yearly' },
  { path: '/cookies', priority: 0.2, changeFrequency: 'yearly' },
];

export const INDEXABLE_ROUTES: PublicRoute[] = [
  ...PRODUCT_ROUTES,
  ...GUIDE_ROUTES,
  ...SUPPORT_ROUTES,
  ...LEGAL_ROUTES,
];

/**
 * Chemins interdits à l'exploration.
 *
 * `/app` et les parcours de compte n'ont rien à faire dans l'index : ils
 * exigent une session et n'offrent aucun contenu à un visiteur venu de la
 * recherche. Les alias de redirection sont exclus pour éviter les chaînes
 * inutiles.
 */
export const DISALLOWED_PATHS = [
  '/app',
  '/auth',
  '/onboarding',
  '/login',
  '/register',
  '/connexion',
  '/inscription',
  '/mot-de-passe-oublie',
  '/reinitialiser-mot-de-passe',
  '/mobile/',
  '/api/',
] as const;
