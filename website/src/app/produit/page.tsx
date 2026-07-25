import type { Metadata } from 'next';
import Link from 'next/link';

import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: `${SITE_NAME} — Application de facturation et devis`,
  description:
    'INVEQ est une application de facturation et de devis pour artisans, freelances et TPE. Créez, envoyez et suivez vos factures et devis professionnels.',
  alternates: {
    canonical: `${SITE_URL}/produit`,
  },
  openGraph: {
    title: `${SITE_NAME} — Application de facturation et devis`,
    description:
      'INVEQ est une application de facturation et de devis pour artisans, freelances et TPE.',
    url: `${SITE_URL}/produit`,
    siteName: SITE_NAME,
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/oauth-logo.png`,
        width: 512,
        height: 512,
        alt: 'Logo INVEQ',
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

/**
 * Page produit dédiée Google OAuth Branding Verification.
 * Contenu SSR minimal, sans animations : H1 = INVEQ, but clair, logo, liens légaux absolus.
 * À utiliser comme « Application home page » dans Google Cloud Console.
 */
export default function ProduitPage() {
  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl flex-col items-center justify-center px-6 py-16 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element -- asset OAuth figé, pas d’optimisation dynamique */}
      <img
        src="/oauth-logo.png"
        alt="Logo INVEQ"
        width={160}
        height={160}
        className="mb-8 h-40 w-40"
      />

      <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
        INVEQ
      </h1>

      <p className="mt-6 text-lg leading-relaxed text-muted">
        INVEQ est une application de facturation et de devis pour artisans, freelances et petites
        entreprises. Créez, envoyez et suivez vos factures et devis professionnels en quelques
        minutes.
      </p>

      <p className="mt-4 text-base text-muted">
        Connexion sécurisée via Google pour accéder à votre espace INVEQ.
      </p>

      <nav className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
        <a
          href={`${SITE_URL}/confidentialite`}
          className="text-brand underline-offset-4 hover:underline"
        >
          Politique de confidentialité
        </a>
        <a
          href={`${SITE_URL}/conditions-utilisation`}
          className="text-brand underline-offset-4 hover:underline"
        >
          Conditions d&apos;utilisation
        </a>
        <Link href="/" className="text-muted underline-offset-4 hover:underline">
          Accueil
        </Link>
      </nav>
    </main>
  );
}
