import type { Metadata } from 'next';

import { CtaSection } from '@/components/sections/landing-sections';
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
      <CtaSection />
    </>
  );
}
