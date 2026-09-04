import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/constants';
import { INDEXABLE_ROUTES } from '@/lib/seo/routes';

/**
 * Sitemap dérivé de la liste des routes indexables.
 *
 * L'ancienne version listait `/login`, `/blog` et `/carrieres` : une page de
 * connexion en `noindex`, et deux pages sans contenu. Soumettre à Google des
 * URL qu'on lui interdit d'indexer, ou qui n'ont rien à offrir, dilue le
 * signal sans rien apporter.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return INDEXABLE_ROUTES.map((route) => ({
    url: `${SITE_URL}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
