import {
  CtaSection,
  FaqSection,
  FeaturesGrid,
  HeroSection,
  MobileSection,
  PresentationSection,
  PricingSection,
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
      <section className="px-6 py-20 lg:px-8" id="features">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold text-foreground">{FEATURES.title}</h2>
            <p className="mx-auto mt-4 max-w-xl text-muted">{FEATURES.subtitle}</p>
          </FadeIn>
          <div className="mt-12">
            <FeaturesGrid />
          </div>
        </div>
      </section>
      <MobileSection />
      <TestimonialsSection />
      <section className="bg-slate-50 px-6 py-20 lg:px-8" id="pricing">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Tarifs simples et transparents</h2>
            <p className="mt-4 text-muted">Commencez gratuitement, passez à Premium quand vous êtes prêt.</p>
          </FadeIn>
          <div className="mt-12">
            <PricingSection />
          </div>
        </div>
      </section>
      <section className="px-6 py-20 lg:px-8" id="faq">
        <div className="mx-auto max-w-6xl">
          <FadeIn className="text-center">
            <h2 className="text-3xl font-bold text-foreground">Questions fréquentes</h2>
          </FadeIn>
          <div className="mt-12">
            <FaqSection />
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
