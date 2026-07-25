'use client';

import { usePathname } from 'next/navigation';

import { SiteShell } from '@/components/layout/site-shell';

const NO_MARKETING_SHELL_PREFIXES = [
  '/app',
  '/login',
  '/register',
  '/onboarding',
  '/mot-de-passe-oublie',
  '/reinitialiser-mot-de-passe',
  '/auth',
  '/mobile',
  // OAuth branding pages — bare HTML for Google verification crawler
  '/produit',
];

export function ConditionalSiteShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const hideShell = NO_MARKETING_SHELL_PREFIXES.some((prefix) => pathname.startsWith(prefix));

  if (hideShell) {
    return <>{children}</>;
  }

  return <SiteShell>{children}</SiteShell>;
}
