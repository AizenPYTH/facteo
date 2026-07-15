import type { Metadata } from 'next';

import { FadeIn } from '@/components/ui/fade-in';
import { PageHero } from '@/components/sections/landing-sections';
import { CONTACT_EMAIL } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Carrières',
  description: 'Rejoignez l’équipe FACTEO.',
};

export default function CareersPage() {
  return (
    <>
      <PageHero
        subtitle="Nous construisons le futur de la facturation pour les PME."
        title="Carrières"
      />
      <section className="px-6 py-20 lg:px-8">
        <FadeIn className="mx-auto max-w-2xl text-center">
          <p className="text-lg text-muted">
            Nous n’avons pas de postes ouverts pour le moment, mais nous sommes toujours intéressés par
            les profils passionnés par le SaaS, le design et la fintech.
          </p>
          <a className="mt-8 inline-block font-semibold text-primary" href={`mailto:${CONTACT_EMAIL}`}>
            {CONTACT_EMAIL}
          </a>
        </FadeIn>
      </section>
    </>
  );
}
