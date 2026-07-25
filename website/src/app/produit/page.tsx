import type { Metadata } from 'next';

import { SITE_NAME, SITE_URL } from '@/lib/constants';

export const metadata: Metadata = {
  title: {
    absolute: SITE_NAME,
  },
  description:
    'INVEQ is an invoicing and quotes application for freelancers, tradespeople and small businesses. Create, send and track professional invoices and quotes.',
  applicationName: SITE_NAME,
  alternates: {
    canonical: `${SITE_URL}/produit`,
  },
  openGraph: {
    title: SITE_NAME,
    description:
      'INVEQ is an invoicing and quotes application for freelancers, tradespeople and small businesses.',
    url: `${SITE_URL}/produit`,
    siteName: SITE_NAME,
    locale: 'fr_FR',
    type: 'website',
    images: [
      {
        url: `${SITE_URL}/oauth-logo.png`,
        width: 512,
        height: 512,
        alt: SITE_NAME,
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
  },
};

const softwareJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'SoftwareApplication',
  name: SITE_NAME,
  applicationCategory: 'BusinessApplication',
  operatingSystem: 'Web, iOS, Android',
  url: `${SITE_URL}/produit`,
  description:
    'INVEQ is an invoicing and quotes application for freelancers, tradespeople and small businesses.',
};

/**
 * Page produit OAuth Branding (version Next).
 * Préférer https://www.inveq.fr/inveq.html (HTML statique) comme Application home page.
 */
export default function ProduitPage() {
  return (
    <main
      style={{
        maxWidth: '40rem',
        margin: '0 auto',
        padding: '3rem 1.25rem 4rem',
        textAlign: 'center',
        fontFamily: 'Georgia, Times New Roman, serif',
        lineHeight: 1.55,
      }}
    >
      <script
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareJsonLd) }}
        type="application/ld+json"
      />

      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/oauth-logo.png"
        alt="INVEQ"
        width={160}
        height={160}
        style={{ display: 'block', margin: '0 auto 1.5rem', width: 160, height: 160 }}
      />

      <h1 id="app-name" style={{ fontSize: '2.75rem', margin: '0 0 1rem' }}>
        INVEQ
      </h1>

      <h2 style={{ fontSize: '1.15rem', margin: '2rem 0 0.75rem' }}>
        Purpose of the application
      </h2>
      <p style={{ margin: '0.75rem 0', fontSize: '1.05rem' }}>
        INVEQ is an application for creating invoices and quotes. Freelancers, tradespeople and
        small businesses use INVEQ to create, send and track professional invoices and quotes.
      </p>

      <h2 style={{ fontSize: '1.15rem', margin: '2rem 0 0.75rem' }}>
        Objectif de l&apos;application
      </h2>
      <p style={{ margin: '0.75rem 0', fontSize: '1.05rem' }}>
        INVEQ est une application de facturation et de devis. Les artisans, freelances et petites
        entreprises utilisent INVEQ pour créer, envoyer et suivre leurs factures et devis
        professionnels.
      </p>

      <nav
        aria-label="Legal"
        style={{
          marginTop: '2.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '1rem 1.5rem',
          justifyContent: 'center',
          fontFamily: 'system-ui, sans-serif',
          fontSize: '0.95rem',
        }}
      >
        <a href={`${SITE_URL}/confidentialite`} style={{ color: '#1d4ed8' }}>
          Privacy Policy
        </a>
        <a href={`${SITE_URL}/confidentialite`} style={{ color: '#1d4ed8' }}>
          Politique de confidentialité
        </a>
        <a href={`${SITE_URL}/conditions-utilisation`} style={{ color: '#1d4ed8' }}>
          Terms of Service
        </a>
        <a href={`${SITE_URL}/conditions-utilisation`} style={{ color: '#1d4ed8' }}>
          Conditions d&apos;utilisation
        </a>
      </nav>
    </main>
  );
}
