import type { Metadata } from 'next';

import { CtaSection, PageHero, PricingSection } from '@/components/sections/landing-sections';
import { SUBSCRIPTION_PRICING_COPY } from '@/lib/subscription-plans';

export const metadata: Metadata = {
  title: 'Tarifs',
  description:
    'Offres Factume : Micro gratuit, Basique, Standard et Pro. Paiement mensuel ou annuel HT, sans engagement.',
};

export default function PricingPage() {
  return (
    <>
      <PageHero subtitle={SUBSCRIPTION_PRICING_COPY.subtitle} title={SUBSCRIPTION_PRICING_COPY.title} />
      <section className="px-6 pb-20 pt-4 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PricingSection />
        </div>
      </section>
      <CtaSection />
    </>
  );
}
