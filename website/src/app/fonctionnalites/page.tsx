import type { Metadata } from 'next';

import { CtaSection, FeaturesGrid, PageHero } from '@/components/sections/landing-sections';
import { FEATURES } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Fonctionnalités',
  description: 'Découvrez toutes les fonctionnalités de Factume : clients, devis, factures, PDF, signatures et paiements.',
};

export default function FeaturesPage() {
  return (
    <>
      <PageHero subtitle={FEATURES.subtitle} title={FEATURES.title} />
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <FeaturesGrid showAll />
        </div>
      </section>
      <CtaSection />
    </>
  );
}
