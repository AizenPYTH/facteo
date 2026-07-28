import type { Metadata } from 'next';

import { CtaSection, PageHero } from '@/components/sections/landing-sections';
import { PricingSection } from '@/components/sections/pricing-section';
import { SUBSCRIPTION_PRICING_COPY } from '@/lib/subscription-plans';

export const metadata: Metadata = {
  title: 'Tarifs',
  description:
    'Offres INVEQ Micro, Basique, Standard, Pro et Max. Souscription Stripe mensuelle ou annuelle.',
};

export default function PricingPage() {
  return (
    <>
      <PageHero subtitle={SUBSCRIPTION_PRICING_COPY.subtitle} title="Tarifs" />
      <section className="px-6 pb-20 pt-4 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PricingSection />
        </div>
      </section>
      <CtaSection />
    </>
  );
}
