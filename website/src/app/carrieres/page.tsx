import type { Metadata } from 'next';
import Link from 'next/link';

import { FadeIn } from '@/components/ui/fade-in';
import { PageHero } from '@/components/sections/landing-sections';
import { CONTACT_EMAIL, hasPublicContactEmail } from '@/lib/constants';

export const metadata: Metadata = {
  title: 'Carrières',
  description: 'Rejoignez l’équipe INVEQ.',
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
          {hasPublicContactEmail ? (
            <a className="mt-8 inline-block font-semibold text-primary" href={`mailto:${CONTACT_EMAIL}`}>
              {CONTACT_EMAIL}
            </a>
          ) : (
            <Link className="mt-8 inline-block font-semibold text-primary hover:underline" href="/contact">
              Nous contacter
            </Link>
          )}
        </FadeIn>
      </section>
    </>
  );
}
