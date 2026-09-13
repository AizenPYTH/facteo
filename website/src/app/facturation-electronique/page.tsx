import type { Metadata } from 'next';

import { SITE_URL } from '@/lib/constants';

import { CtaSection } from '@/components/sections/landing-sections';
import { RelatedLinks } from '@/components/seo/seo-blocks';
import {
  EInvoicingChainSection,
  EInvoicingChangesSection,
  EInvoicingConnectionSection,
  EInvoicingFaqSection,
  EInvoicingHero,
  EInvoicingIntroSection,
  EInvoicingPlatformSection,
} from '@/components/sections/e-invoicing-sections';

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/facturation-electronique` },
  title: 'Facturation électronique',
  description:
    'Facturation électronique avec INVEQ : ce qui change pour votre entreprise, comment INVEQ se connecte à la plateforme agréée SUPER PDP, et le parcours de connexion étape par étape.',
};

export default function EInvoicingPage() {
  return (
    <>
      <EInvoicingHero />
      <EInvoicingIntroSection />
      <EInvoicingChangesSection />
      <EInvoicingChainSection />
      <EInvoicingPlatformSection />
      <EInvoicingConnectionSection />
      <EInvoicingFaqSection />

      <RelatedLinks
        links={[
          {
            label: 'Plateforme agréée (ex-PDP)',
            description: 'Ce qu’elle fait d’une facture, et pourquoi le terme a changé.',
            href: '/guides/plateforme-agreee-pdp',
          },
          {
            label: 'L’obligation de facture électronique',
            description: 'Qui est concerné, et à partir de quand.',
            href: '/guides/facture-electronique-obligation',
          },
          {
            label: 'Logiciel de facturation',
            description: 'Le périmètre complet d’INVEQ.',
            href: '/logiciel-facturation',
          },
          {
            label: 'Mentions obligatoires',
            description: 'Les données que doit porter chaque facture.',
            href: '/guides/mentions-obligatoires-facture',
          },
        ]}
      />

      <CtaSection />
    </>
  );
}
