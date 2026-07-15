import type { Metadata } from 'next';

import { CtaSection, PageHero, PricingSection } from '@/components/sections/landing-sections';
import { PRICING } from '@/lib/content';

export const metadata: Metadata = {
  title: 'Tarifs',
  description: 'Tarifs FACTEO : offre Standard gratuite et Premium à 19 €/mois. Sans engagement.',
};

export default function PricingPage() {
  return (
    <>
      <PageHero subtitle={PRICING.subtitle} title={PRICING.title} />
      <section className="px-6 py-20 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <PricingSection />
        </div>
      </section>
      <CtaSection />
    </>
  );
}
