import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import { ConditionalSiteShell } from '@/components/layout/conditional-site-shell';
import { SITE_URL, SITE_NAME, CONTACT_EMAIL } from '@/lib/constants';
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

const organizationJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: SITE_NAME,
  url: SITE_URL,
  logo: `${SITE_URL}/logo-inveq.png`,
  email: CONTACT_EMAIL,
  description:
    'INVEQ simplifie la facturation, les devis, les signatures et les paiements pour artisans, freelances et PME.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html className={`${inter.variable} h-full scroll-smooth`} lang="fr">
      <body className="min-h-full antialiased">
        <script
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
          type="application/ld+json"
        />
        <QueryProvider>
          <AuthProvider>
            <ConditionalSiteShell>{children}</ConditionalSiteShell>
          </AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
