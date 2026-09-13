import type { Metadata } from 'next';

import { CtaSection, FaqSection, PageHero } from '@/components/sections/landing-sections';
import { Breadcrumbs, RelatedLinks } from '@/components/seo/seo-blocks';
import { SITE_URL } from '@/lib/constants';
import { FAQ } from '@/lib/content';
import { faqSchema, jsonLd } from '@/lib/seo/schema';

export const metadata: Metadata = {
  alternates: { canonical: `${SITE_URL}/faq` },
  // Le gabarit du layout ajoute déjà « — INVEQ » ; le répéter ici doublait la marque.
  title: 'Questions fréquentes sur la facturation',
  description:
    'Adaptation aux artisans, usage sur ordinateur, sécurité des données, personnalisation des documents, signature client, codes promo et résiliation.',
  openGraph: {
    title: 'Questions fréquentes sur INVEQ',
    description: 'Les réponses aux questions posées avant de s’équiper.',
    url: `${SITE_URL}/faq`,
  },
};

/**
 * Le balisage FAQPage est légitime ici : les mêmes questions et réponses sont
 * rendues dans le corps de la page par `FaqSection`, à partir de la même
 * source. Un balisage décrivant du contenu absent serait à retirer.
 */
export default function FaqPage() {
  return (
    <>
      <script dangerouslySetInnerHTML={jsonLd(faqSchema(FAQ.items))} type="application/ld+json" />

      <PageHero
        eyebrow="Aide"
        subtitle="Ce que les artisans et les indépendants nous demandent avant de s’équiper."
        title="Questions fréquentes"
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Accueil', path: '/' },
            { name: 'FAQ', path: '/faq' },
          ]}
        />
      </div>

      <section className="mx-auto max-w-3xl px-5 pb-10 sm:px-6">
        <FaqSection />
      </section>

      <RelatedLinks
        links={[
          {
            label: 'Logiciel de facturation',
            description: 'Le périmètre du produit, en détail.',
            href: '/logiciel-facturation',
          },
          {
            label: 'Guides',
            description: 'Mentions obligatoires, devis, facture électronique.',
            href: '/guides',
          },
          {
            label: 'Tarifs',
            description: 'Les offres et ce qu’elles contiennent.',
            href: '/tarifs',
          },
          {
            label: 'Support',
            description: 'Prendre contact avec l’équipe.',
            href: '/support',
          },
        ]}
      />

      <CtaSection />
    </>
  );
}
