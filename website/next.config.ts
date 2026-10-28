import type { NextConfig } from 'next';

import { NOINDEX_PATHS } from './src/lib/seo/routes';

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  // Un onglet resté ouvert sur une ancienne version se recharge à la
  // navigation suivante au lieu de garder l'ancien code (ex. PDF d'avant).
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || undefined,
  // Pages de compte et espace connecté : explorables (robots.txt les laisse
  // passer) mais jamais indexées. Voir `NOINDEX_PATHS`.
  async headers() {
    return NOINDEX_PATHS.flatMap((path) =>
      [path, `${path}/:path*`].map((source) => ({
        source,
        headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }],
      })),
    );
  },
};

export default nextConfig;
