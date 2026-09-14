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
  // PAS de `alternates.canonical` ici. Les métadonnées de l'App Router
  // descendent dans l'arbre : une canonique posée sur la racine est héritée par
  // toute page qui n'en déclare pas, et ces pages annonçaient donc à Google que
  // leur version de référence était la page d'accueil — de quoi les faire
  // disparaître de l'index malgré leur contenu propre. Chaque page publique
  // déclare la sienne, y compris `/` (voir src/app/page.tsx).
  title: {
    // La catégorie de produit passe avant la marque : personne ne cherche
    // « INVEQ », on cherche « logiciel de facturation ». Le mot « en ligne »
    // dit l'essentiel — le produit s'utilise depuis un navigateur, sans rien
    // installer ; l'application iOS vient en complément, pas l'inverse.
    default: `${SITE_NAME} — Logiciel de facturation en ligne pour indépendants, artisans et TPE`,
    template: `%s — ${SITE_NAME}`,
  },
  description:
    'Logiciel de facturation en ligne : créez vos devis, convertissez-les en factures, suivez vos encaissements et préparez la facturation électronique. Utilisable directement dans votre navigateur, avec une application iOS en complément. Offre gratuite sans limite de durée.',
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
