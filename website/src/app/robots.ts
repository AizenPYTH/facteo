import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/constants';
import { DISALLOWED_PATHS } from '@/lib/seo/routes';

/**
 * Tout est explorable sauf les points d'API. Les pages de compte et l'espace
 * connecté ne sont pas bloqués ici : bloquées, elles ne pouvaient pas montrer
 * leur `noindex` à Google (« Bloquée par le fichier robots.txt » dans la Search
 * Console). Elles sont écartées de l'index par l'en-tête `X-Robots-Tag`
 * (`NOINDEX_PATHS`, next.config.ts). Les fichiers `_next/static` restent
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
