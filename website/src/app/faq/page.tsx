import type { Metadata } from 'next';

import { CtaSection, FaqSection, PageHero } from '@/components/sections/landing-sections';
import { FAQ } from '@/lib/content';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Réponses aux questions fréquentes sur Factume : artisans, sécurité, personnalisation, signature.',
};

export default function FaqPage() {
  return (
    <>
      <PageHero subtitle="Tout ce que vous devez savoir avant de commencer." title={FAQ.title} />
      <section className="px-6 py-20 lg:px-8">
        <FaqSection />
      </section>
      <CtaSection />
    </>
  );
}
