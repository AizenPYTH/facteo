import {
  CtaSection,
  FaqSection,
  MobileSection,
  PricingSection,
} from '@/components/sections/landing-sections';
import { CapabilitiesSection } from '@/components/sections/home/capabilities';
import { Hero } from '@/components/sections/home/hero';
import { MandateSection } from '@/components/sections/home/mandate';
import { ProblemSection } from '@/components/sections/home/problem';
import { WorkflowSection } from '@/components/sections/home/workflow';
import { Reveal } from '@/components/ui/reveal';
import { SITE_URL } from '@/lib/constants';
import { jsonLd, softwareApplicationSchema } from '@/lib/seo/schema';

import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: SITE_URL },
};

/**
 * Narration de la page d'accueil.
 *
 * Hero (ce que fait le produit) → le problème → le parcours d'un document →
 * ce que sait faire l'application → l'échéance légale → mobile → tarifs → FAQ
 * → invitation.
 *
 * Chaque section répond à une question que se pose le visiteur dans cet ordre.
 * Les sections « Présentation » et « Pourquoi » d'origine disaient la même
 * chose deux fois en listes de puces ; elles sont fondues dans le parcours.
 */
export default function HomePage() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={jsonLd(softwareApplicationSchema())}
        type="application/ld+json"
      />
      <Hero />
      <ProblemSection />
      <WorkflowSection />
      <CapabilitiesSection />
      <MandateSection />
      <MobileSection />

      <section
        className="border-y border-border/60 bg-[#F7F4EF]/50 px-5 py-[var(--section-y)] sm:px-6 lg:px-8 lg:py-[var(--section-y-lg)]"
        id="pricing">
        <div className="mx-auto max-w-7xl">
          <PricingSection showHeader />
        </div>
      </section>

      <section
        className="px-5 py-[var(--section-y)] sm:px-6 lg:px-8 lg:py-[var(--section-y-lg)]"
        id="faq">
        <div className="mx-auto max-w-3xl">
          <Reveal className="text-center">
            <h2 className="text-[1.75rem] font-semibold tracking-[-0.03em] text-foreground sm:text-4xl">
              Questions fréquentes
            </h2>
          </Reveal>
          <div className="mt-10 sm:mt-12">
            <FaqSection />
          </div>
        </div>
      </section>

      <CtaSection />
    </>
  );
}
