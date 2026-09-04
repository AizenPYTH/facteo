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

export const metadata: Metadata = {
  title: 'Logiciel de devis et factures : du chiffrage au règlement',
  description:
    'Créez un devis, faites-le signer, convertissez-le en facture sans ressaisie et suivez le paiement. Remises, TVA, unités et relances dans un seul outil.',
  alternates: { canonical: `${SITE_URL}/logiciel-devis-facture` },
  openGraph: {
    title: 'Logiciel de devis et factures : du chiffrage au règlement',
    description:
      'Devis signé, conversion en facture sans ressaisie, suivi des encaissements.',
    url: `${SITE_URL}/logiciel-devis-facture`,
  },
};

const FAQ = [
  {
    question: 'Comment transformer un devis en facture ?',
    answer:
      'Depuis le devis accepté, une seule action crée la facture correspondante. Les lignes, les quantités, les remises et la TVA sont reprises telles quelles ; la facture reçoit son propre numéro dans la série des factures, et le devis d’origine reste consultable.',
  },
  {
    question: 'Un devis signé vaut-il engagement ?',
    answer:
      'Un devis accepté et signé par le client constitue un accord sur le contenu et le prix de la prestation. INVEQ enregistre la signature du client sur l’écran et l’intègre au PDF, ce qui matérialise cette acceptation.',
  },
  {
    question: 'Peut-on appliquer une remise sur une ligne ?',
    answer:
      'Oui. Chaque ligne accepte une remise en pourcentage, appliquée au montant HT avant calcul de la TVA. Le détail apparaît dans les totaux du document et sur le PDF.',
  },
  {
    question: 'Comment suivre les factures impayées ?',
    answer:
      'Le tableau de bord fait remonter les encaissements du mois, les montants en attente et les factures en retard. Les paiements partiels sont enregistrés au fil de l’eau, avec le reste à payer recalculé.',
  },
];

/**
 * Page ciblant l'intention « logiciel devis facture ».
 *
 * Son angle propre est la continuité entre les deux documents — ce que cherche
 * précisément quelqu'un qui tape cette requête. La page « logiciel de
 * facturation » couvre le périmètre général ; celle-ci ne le répète pas, elle
 * détaille l'enchaînement.
 */
export default function LogicielDevisFacturePage() {
  return (
    <>
      <PageHero
        eyebrow="Devis et factures"
        subtitle="Un devis accepté ne devrait jamais être retapé. Chez INVEQ, il devient une facture en gardant ses lignes, ses remises et sa TVA."
        title="Logiciel de devis et de factures"
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Accueil', path: '/' },
            { name: 'Logiciel de facturation', path: '/logiciel-facturation' },
            { name: 'Devis et factures', path: '/logiciel-devis-facture' },
          ]}
        />
      </div>

      <ContentSection title="Devis et facture ne servent pas au même moment">
        <Prose>
          Le devis précède la prestation : il propose un prix et engage l’entreprise sur ce
          montant pendant sa durée de validité. La facture vient après : elle constate ce qui a
          été livré et déclenche le paiement. Entre les deux, il ne devrait y avoir aucune
          ressaisie — c’est pourtant là que la plupart des erreurs se glissent.
        </Prose>
        <KeyPoints
          items={[
            'Le devis porte une durée de validité ; la facture porte une échéance de règlement.',
            'Les deux séries de numéros sont indépendantes et continues.',
            'Un devis refusé ou expiré reste dans l’historique, il ne disparaît pas.',
          ]}
        />
      </ContentSection>

      <WorkflowSection />

      <ContentSection
        lead="Trois détails qui font gagner du temps sur chaque document."
        title="Ce que le logiciel prend en charge">
        <KeyPoints
          items={[
            'Le catalogue : vos produits et prestations récurrents, avec prix et TVA déjà renseignés.',
            'Les remises et les unités par ligne, reprises telles quelles à la conversion.',
            'La signature du client sur l’écran, intégrée au PDF envoyé.',
            'Les paiements partiels, avec un reste à payer recalculé à chaque règlement.',
          ]}
        />
      </ContentSection>

      <FaqBlock items={FAQ} />

      <RelatedLinks
        links={[
          {
            label: 'Devis ou facture ?',
            description: 'Ce qui distingue les deux documents, et quand émettre l’un ou l’autre.',
            href: '/guides/devis-ou-facture',
          },
          {
            label: 'Mentions obligatoires',
            description: 'Ce que la loi impose de faire figurer sur une facture.',
            href: '/guides/mentions-obligatoires-facture',
          },
          {
            label: 'Logiciel de facturation',
            description: 'Le périmètre complet du produit.',
            href: '/logiciel-facturation',
          },
          {
            label: 'Tarifs',
            description: 'Les offres, de la formule gratuite aux volumes élevés.',
            href: '/tarifs',
          },
        ]}
      />

      <CtaSection />
    </>
  );
}
