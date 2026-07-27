import type { Metadata } from 'next';

import { CtaSection, PageHero } from '@/components/sections/landing-sections';
import { PremiumPricingSection } from '@/components/sections/premium-pricing-section';
import { PREMIUM_MARKETING, PREMIUM_PRICE_DISPLAY } from '@/lib/premium-marketing';

export const metadata: Metadata = {
  title: 'Tarifs',
  description: `INVEQ Gratuit et Premium (${PREMIUM_PRICE_DISPLAY}). Comparez les offres et souscrivez en ligne via Stripe.`,
};

export default function PricingPage() {
  return (
    <>
      <PageHero subtitle={PREMIUM_MARKETING.subtitle} title="Tarifs" />
      <section className="px-6 pb-20 pt-4 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <PremiumPricingSection />
        </div>
      </section>
      <CtaSection />
    </>
  );
}
