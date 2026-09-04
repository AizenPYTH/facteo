import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { ConditionalSiteShell } from '@/components/layout/conditional-site-shell';
import { SITE_URL, SITE_NAME } from '@/lib/constants';
import { jsonLd, organizationSchema, websiteSchema } from '@/lib/seo/schema';
import { AuthProvider } from '@/providers/auth-provider';
import { QueryProvider } from '@/providers/query-provider';

import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  applicationName: SITE_NAME,
  alternates: {
    canonical: SITE_URL,
  },
  title: {
    // Le titre par défaut se limitait au nom de marque : aucun signal de
    // recherche pour quelqu'un qui cherche un logiciel de devis ou de facture.
    default: `${SITE_NAME} — Devis et factures pour artisans, indépendants et TPE`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    'Créez vos devis, convertissez-les en factures et suivez vos encaissements. Facturation électronique via plateforme agréée. Application iOS et web pour artisans, indépendants et TPE.',
  keywords: [
    'facturation',
    'devis',
    'facture',
    'artisan',
    'freelance',
    'PME',
    'TPE',
    'gestion commerciale',
    'signature électronique',
    'facturation électronique',
    'INVEQ',
  ],
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    siteName: SITE_NAME,
    url: SITE_URL,
  },
  twitter: {
    card: 'summary_large_image',
  },
  robots: { index: true, follow: true },
  icons: {
    icon: '/favicon.png',
    apple: '/icon.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${inter.variable} h-full scroll-smooth`} lang="fr">
      <body className="min-h-full antialiased">
        {/* Identité de l'éditeur et du site, référencées par @id depuis les
            schémas de page — évite de redéclarer l'organisation partout. */}
        <script dangerouslySetInnerHTML={jsonLd(organizationSchema())} type="application/ld+json" />
        <script dangerouslySetInnerHTML={jsonLd(websiteSchema())} type="application/ld+json" />
        <QueryProvider>
          <AuthProvider>
            <ConditionalSiteShell>{children}</ConditionalSiteShell>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
