import type { Metadata } from 'next';

import { FadeIn } from '@/components/ui/fade-in';
import { PageHero } from '@/components/sections/landing-sections';

export const metadata: Metadata = {
  title: 'À propos',
  description: 'Découvrez la mission et les valeurs de Factume.',
};

export default function AboutPage() {
  return (
    <>
      <PageHero
        subtitle="Simplifier la facturation pour les professionnels qui créent de la valeur sur le terrain."
        title="À propos de Factume"
      />
      <section className="px-6 py-20 lg:px-8">
        <FadeIn className="mx-auto max-w-3xl space-y-6 text-lg leading-relaxed text-muted">
          <p>
            Factume est né d’un constat simple : les artisans, freelances et petites entreprises perdent
            trop de temps sur la paperasse administrative.
          </p>
          <p>
            Notre mission est de leur offrir une expérience de facturation moderne, fluide et professionnelle —
            sur ordinateur comme sur mobile.
          </p>
          <p>
            Nous construisons un produit SaaS pensé pour la confiance, la conformité et la simplicité.
          </p>
        </FadeIn>
      </section>
    </>
  );
}
