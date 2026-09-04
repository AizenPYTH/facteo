import type { Metadata } from 'next';

import { WorkflowSection } from '@/components/sections/home/workflow';
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

const GUIDE = findGuide('devis-ou-facture')!;

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
    question: 'Un devis est-il obligatoire ?',
    answer:
      'Pas systématiquement, mais il le devient dans plusieurs cas prévus par la réglementation, notamment pour certains travaux et prestations à domicile au-delà d’un certain montant. Au-delà de l’obligation, un devis accepté fixe le prix et limite les contestations.',
  },
  {
    question: 'Peut-on facturer sans avoir émis de devis ?',
    answer:
      'Oui. Le devis est une proposition commerciale, la facture constate la prestation. Rien n’impose de passer par l’un pour émettre l’autre.',
  },
  {
    question: 'Un devis signé peut-il être modifié ?',
    answer:
      'Une fois accepté, il vaut accord sur le prix et le contenu. Toute évolution passe par un nouveau devis ou un avenant accepté à son tour : modifier unilatéralement un devis signé n’a pas de valeur.',
  },
  {
    question: 'Les numéros de devis et de factures sont-ils liés ?',
    answer:
      'Non, ce sont deux séries indépendantes. Seules les factures sont soumises à l’exigence de numérotation continue. INVEQ gère un compteur et un préfixe distincts pour chaque série.',
  },
];

/**
 * Guide comparatif devis / facture.
 *
 * Le sujet a une intention informationnelle claire, distincte de la page
 * produit `/logiciel-devis-facture` : ici on explique la différence entre deux
 * documents, là on montre comment l'outil enchaîne l'un vers l'autre.
 */
export default function DevisOuFacturePage() {
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
        subtitle="L’un propose, l’autre constate. La confusion entre les deux coûte des impayés."
        title={GUIDE.title}
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Accueil', path: '/' },
            { name: 'Guides', path: '/guides' },
            { name: 'Devis ou facture', path: `/guides/${GUIDE.slug}` },
          ]}
        />
      </div>

      <ContentSection title="Le devis : une proposition qui engage sur un prix">
        <Prose>
          Le devis précède la prestation. Il décrit ce qui sera fait, à quel prix, et pendant
          combien de temps cette proposition reste valable. Tant qu’il n’est pas accepté, il
          n’engage que celui qui l’émet — et seulement dans la limite de sa durée de validité.
        </Prose>
        <KeyPoints
          items={[
            'Il porte une durée de validité, au-delà de laquelle le prix n’est plus garanti.',
            'Accepté et signé, il vaut accord sur le contenu et le montant.',
            'Il n’est pas soumis à l’exigence de numérotation continue des factures.',
            'Refusé ou expiré, il reste utile : il documente ce qui a été proposé.',
          ]}
        />
      </ContentSection>

      <ContentSection title="La facture : un constat qui déclenche le paiement">
        <Prose>
          La facture intervient après. Elle constate ce qui a été livré ou réalisé et ouvre le
          délai de règlement. Contrairement au devis, elle est un document comptable et fiscal :
          numérotation continue, mentions obligatoires, conservation.
        </Prose>
        <KeyPoints
          items={[
            'Elle porte une échéance de règlement, pas une durée de validité.',
            'Elle s’inscrit dans une séquence continue, sans trou ni doublon.',
            'Elle doit porter les mentions légales, y compris pénalités et indemnité de recouvrement.',
            'Elle sert de pièce justificative pour la comptabilité des deux parties.',
          ]}
        />
      </ContentSection>

      <ContentSection
        lead="La ressaisie entre les deux documents est le moment où les erreurs apparaissent : une ligne oubliée, une remise perdue, un taux de TVA qui change."
        title="Passer du devis à la facture">
        <Prose>
          Le bon réflexe est de reprendre le devis accepté tel quel, sans le retaper. Les lignes,
          les quantités, les remises et les taux doivent suivre à l’identique ; seule la
          numérotation change, puisque la facture entre dans sa propre série.
        </Prose>
      </ContentSection>

      <WorkflowSection />

      <FaqBlock items={FAQ} />

      <RelatedLinks
        links={[
          {
            label: 'Mentions obligatoires',
            description: 'Ce que doit porter une facture pour être conforme.',
            href: '/guides/mentions-obligatoires-facture',
          },
          {
            label: 'Logiciel de devis et factures',
            description: 'La conversion sans ressaisie, en pratique.',
            href: '/logiciel-devis-facture',
          },
          {
            label: 'Choisir un logiciel',
            description: 'Les critères qui comptent avant de s’équiper.',
            href: '/guides/choisir-logiciel-facturation',
          },
          {
            label: 'Auto-entrepreneurs',
            description: 'Facturer en franchise en base de TVA.',
            href: '/facturation-auto-entrepreneur',
          },
        ]}
      />

      <CtaSection />
    </>
  );
}
