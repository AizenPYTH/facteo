import type { Metadata } from 'next';

import { CtaSection, PageHero } from '@/components/sections/landing-sections';
import {
  Breadcrumbs,
  ContentSection,
  FaqBlock,
  KeyPoints,
  Prose,
  RelatedLinks,
} from '@/components/seo/seo-blocks';
import { SITE_URL } from '@/lib/constants';
import { findGuide } from '@/lib/seo/guides';
import { articleSchema, jsonLd } from '@/lib/seo/schema';

const GUIDE = findGuide('mentions-obligatoires-facture')!;

export const metadata: Metadata = {
  title: GUIDE.title,
  description: GUIDE.description,
  alternates: { canonical: `${SITE_URL}/guides/${GUIDE.slug}` },
  openGraph: {
    title: GUIDE.title,
    description: GUIDE.description,
    type: 'article',
    url: `${SITE_URL}/guides/${GUIDE.slug}`,
  },
};

const FAQ = [
  {
    question: 'Que risque-t-on si une mention manque ?',
    answer:
      'Une facture incomplète peut être refusée par le client, faire échec à la déduction de la TVA par l’acheteur et exposer l’émetteur à une amende administrative. En pratique, le premier effet visible est un paiement retardé le temps de régulariser.',
  },
  {
    question: 'La numérotation doit-elle être continue ?',
    answer:
      'Oui. Les factures doivent se suivre dans une séquence chronologique continue, sans trou ni doublon. Un préfixe par année ou par série est admis tant que la continuité est respectée à l’intérieur de chaque série.',
  },
  {
    question: 'Faut-il indiquer les pénalités de retard même entre professionnels ?',
    answer:
      'Oui, entre professionnels la facture doit mentionner le taux des pénalités de retard ainsi que l’indemnité forfaitaire de 40 € pour frais de recouvrement, prévue par le code de commerce.',
  },
  {
    question: 'Et si je ne facture pas de TVA ?',
    answer:
      'En franchise en base, la facture est établie hors taxes et porte la mention « TVA non applicable, article 293 B du CGI ». Les autres mentions obligatoires restent dues.',
  },
];

/**
 * Guide de référence sur les mentions obligatoires.
 *
 * On s'en tient aux règles stables du droit français. L'indemnité forfaitaire
 * de 40 € est chiffrée parce qu'elle est fixée par le code de commerce et n'a
 * pas varié ; les seuils de TVA, eux, ne sont pas chiffrés ailleurs sur le site
 * précisément parce qu'ils bougent.
 */
export default function MentionsObligatoiresPage() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={jsonLd(
          articleSchema({
            headline: GUIDE.title,
            description: GUIDE.description,
            path: `/guides/${GUIDE.slug}`,
            datePublished: GUIDE.published,
          }),
        )}
        type="application/ld+json"
      />

      <PageHero
        eyebrow="Guide"
        subtitle="Une facture incomplète se paie tard. Voici ce qu’elle doit porter, poste par poste."
        title={GUIDE.title}
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Accueil', path: '/' },
            { name: 'Guides', path: '/guides' },
            { name: 'Mentions obligatoires', path: `/guides/${GUIDE.slug}` },
          ]}
        />
      </div>

      <ContentSection title="Identifier le document">
        <KeyPoints
          items={[
            'La date d’émission de la facture.',
            'Un numéro unique, inscrit dans une séquence chronologique continue.',
            'La date de la vente ou de l’achèvement de la prestation, si elle diffère de la date d’émission.',
            'Le numéro du bon de commande, lorsque le client en a émis un.',
          ]}
        />
      </ContentSection>

      <ContentSection title="Identifier les deux parties">
        <Prose>
          Côté émetteur : dénomination sociale, adresse du siège, numéro SIREN ou SIRET, forme
          juridique, et pour les sociétés le capital social ainsi que le numéro RCS suivi de la
          ville d’immatriculation. Le numéro de TVA intracommunautaire s’ajoute dès lors que
          l’entreprise y est assujettie.
        </Prose>
        <Prose>
          Côté client : nom ou dénomination et adresse de facturation, complétés de l’adresse de
          livraison si elle diffère. Le numéro de TVA intracommunautaire du client devient
          nécessaire dans les échanges intracommunautaires et les cas d’autoliquidation.
        </Prose>
      </ContentSection>

      <ContentSection title="Détailler ce qui est facturé">
        <KeyPoints
          items={[
            'La désignation précise de chaque produit ou prestation : nature, et le cas échéant marque et référence.',
            'La quantité, exprimée dans son unité — heures, jours, pièces, mètres.',
            'Le prix unitaire hors taxes.',
            'Le taux de TVA applicable à chaque ligne, lorsque plusieurs taux coexistent.',
            'Les remises, rabais ou ristournes acquis à la date de la vente.',
          ]}
        />
        <Prose>
          Une désignation trop vague — « prestation de services » seul — est l’une des causes les
          plus fréquentes de contestation. Décrire ce qui a réellement été fait protège autant
          l’émetteur que le client.
        </Prose>
      </ContentSection>

      <ContentSection title="Les totaux">
        <KeyPoints
          items={[
            'Le total hors taxes.',
            'Le montant de TVA, ventilé par taux lorsque la facture en comporte plusieurs.',
            'Le total toutes taxes comprises.',
          ]}
        />
      </ContentSection>

      <ContentSection title="Le règlement">
        <KeyPoints
          items={[
            'La date de règlement ou le délai de paiement convenu.',
            'Les conditions d’escompte en cas de paiement anticipé, ou la mention qu’aucun escompte n’est accordé.',
            'Le taux des pénalités de retard applicables.',
            'L’indemnité forfaitaire de 40 € pour frais de recouvrement, due entre professionnels.',
          ]}
        />
        <Prose>
          Ces trois dernières mentions sont souvent oubliées alors qu’elles conditionnent la
          possibilité de réclamer quoi que ce soit en cas d’impayé.
        </Prose>
      </ContentSection>

      <ContentSection title="Les mentions particulières">
        <Prose>
          Certaines situations ajoutent une mention. En franchise en base de TVA, la facture porte
          « TVA non applicable, article 293 B du CGI ». En autoliquidation, elle indique que la TVA
          est due par le preneur. Les artisans du bâtiment doivent par ailleurs faire figurer
          l’assurance professionnelle souscrite, avec les coordonnées de l’assureur et la couverture
          géographique du contrat.
        </Prose>
      </ContentSection>

      <ContentSection title="Ce qu’un logiciel évite">
        <Prose>
          La plupart de ces mentions ne changent jamais d’une facture à l’autre : identité de
          l’entreprise, pénalités, escompte, assurance. Renseignées une fois dans les réglages et
          le pied de page des documents, elles s’impriment ensuite sur chaque facture. Le compteur
          de numérotation, lui, garantit la continuité que la saisie manuelle finit toujours par
          rompre.
        </Prose>
      </ContentSection>

      <FaqBlock items={FAQ} />

      <RelatedLinks
        links={[
          {
            label: 'Comment faire une facture',
            description: 'La marche à suivre, de la préparation à la conservation.',
            href: '/guides/comment-faire-une-facture',
          },
          {
            label: 'Auto-entrepreneurs',
            description: 'Facturer sans TVA et porter la mention 293 B.',
            href: '/facturation-auto-entrepreneur',
          },
          {
            label: 'Logiciel de facturation',
            description: 'Ce qu’INVEQ prend en charge à votre place.',
            href: '/logiciel-facturation',
          },
          {
            label: 'Facture électronique',
            description: 'Le calendrier de la réforme et ses conséquences.',
            href: '/guides/facture-electronique-obligation',
          },
        ]}
      />

      <CtaSection />
    </>
  );
}
