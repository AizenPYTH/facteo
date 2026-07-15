import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { NextConfig } from 'next';

const websiteRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  // Isole le build au dossier website (monorepo FACTEO + Expo).
  outputFileTracingRoot: websiteRoot,
  turbopack: {
    root: websiteRoot,
  },
  typescript: {
    tsconfigPath: './tsconfig.json',
  },
};

export default nextConfig;
