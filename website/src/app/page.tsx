import {
  CtaSection,
  FaqSection,
  FeaturesGrid,
  HeroSection,
  MobileSection,
  PresentationSection,
  PremiumPricingSection,
  TestimonialsSection,
  WhySection,
} from '@/components/sections/landing-sections';
import { FadeIn } from '@/components/ui/fade-in';
import { FEATURES } from '@/lib/content';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <PresentationSection />
      <WhySection />
      <section className="px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" id="features">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              {FEATURES.title}
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">{FEATURES.subtitle}</p>
          </FadeIn>
          <div className="mt-12 sm:mt-14">
            <FeaturesGrid />
          </div>
        </div>
      </section>
      <MobileSection />
      <TestimonialsSection />
      <section className="border-y border-border/60 bg-[#F7F4EF]/50 px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" id="pricing">
        <div className="mx-auto max-w-7xl">
          <PremiumPricingSection showHeader />
        </div>
      </section>
      <section className="px-5 py-20 sm:px-6 sm:py-24 lg:px-8 lg:py-28" id="faq">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              Questions fréquentes
            </h2>
          </FadeIn>
          <div className="mt-12 sm:mt-14">
            <FaqSection />
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
