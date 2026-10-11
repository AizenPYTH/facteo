import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
  // Un onglet resté ouvert sur une ancienne version se recharge à la
  // navigation suivante au lieu de garder l'ancien code (ex. PDF d'avant).
  deploymentId: process.env.VERCEL_DEPLOYMENT_ID || process.env.VERCEL_GIT_COMMIT_SHA || undefined,
};

export default nextConfig;
