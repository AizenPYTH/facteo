import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';

import { CtaSection, PageHero } from '@/components/sections/landing-sections';
import { Breadcrumbs } from '@/components/seo/seo-blocks';
import { Reveal, RevealGroup, RevealItem } from '@/components/ui/reveal';
import { SITE_URL } from '@/lib/constants';
import { GUIDES } from '@/lib/seo/guides';

export const metadata: Metadata = {
  title: 'Guides de la facturation',
  description:
    'Mentions obligatoires, différence entre devis et facture, obligation de facture électronique, choix d’un logiciel : des réponses courtes et vérifiables.',
  alternates: { canonical: `${SITE_URL}/guides` },
};

/**
 * Hub éditorial.
 *
 * Remplace la page « Blog — bientôt disponible », qui était référencée au
 * sitemap sans rien contenir. Une page annoncée mais vide coûte de la confiance
 * au visiteur et du budget d'exploration au moteur.
 */
export default function GuidesPage() {
  return (
    <>
      <PageHero
        eyebrow="Ressources"
        subtitle="Ce qu’il faut savoir avant d’émettre un document commercial, expliqué sans jargon et sans détour."
        title="Guides de la facturation"
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Accueil', path: '/' },
            { name: 'Guides', path: '/guides' },
          ]}
        />
      </div>

      <section className="mx-auto max-w-3xl px-5 pb-6 sm:px-6">
        <Reveal>
          <p className="text-[15.5px] leading-relaxed text-muted">
            Quatre guides, écrits pour être utiles même si vous n’utilisez pas INVEQ. Quand une
            règle dépend d’un seuil ou d’une date susceptible de bouger, nous le disons plutôt que
            d’avancer un chiffre qui vieillirait mal.
          </p>
        </Reveal>
      </section>

      <RevealGroup className="mx-auto max-w-3xl space-y-3 px-5 pb-12 sm:px-6">
        {GUIDES.map((guide) => (
          <RevealItem key={guide.slug}>
            <Link
              className="focus-ring lift group block rounded-2xl border border-border bg-surface p-5 sm:p-6"
              href={`/guides/${guide.slug}`}>
              <div className="flex items-start justify-between gap-4">
                <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-foreground">
                  {guide.cardTitle}
                </h2>
                <ArrowRight
                  aria-hidden
                  className="mt-1 shrink-0 text-muted transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-primary"
                  size={17}
                />
              </div>
              <p className="mt-2.5 text-[14.5px] leading-relaxed text-muted">{guide.description}</p>
              <p className="mt-3 flex items-center gap-1.5 text-[12px] text-muted/80">
                <Clock aria-hidden size={12} />
                {guide.readingMinutes} min de lecture
              </p>
            </Link>
          </RevealItem>
        ))}
      </RevealGroup>

      <CtaSection />
    </>
  );
}
