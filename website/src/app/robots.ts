import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/constants';
import { DISALLOWED_PATHS } from '@/lib/seo/routes';

/**
 * Le fichier autorisait tout, y compris l'espace connecté et les parcours de
 * compte. On ferme ce qui n'a rien à faire dans l'index, sans jamais toucher
 * aux ressources nécessaires au rendu : les fichiers `_next/static` restent
 * accessibles, sans quoi Google verrait une page sans style ni script.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [...DISALLOWED_PATHS],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  };
}
