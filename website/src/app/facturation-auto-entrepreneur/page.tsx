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

export const metadata: Metadata = {
  title: 'Facturation auto-entrepreneur : logiciel et mentions à porter',
  description:
    'Facturez en franchise en base de TVA : taux à 0 %, mention de l’article 293 B du CGI en pied de facture, numérotation continue. Offre gratuite, application iOS et web.',
  alternates: { canonical: `${SITE_URL}/facturation-auto-entrepreneur` },
  openGraph: {
    title: 'Facturation auto-entrepreneur : logiciel et mentions à porter',
    description:
      'TVA à 0 %, mention 293 B en pied de facture, numérotation continue. Offre gratuite.',
    url: `${SITE_URL}/facturation-auto-entrepreneur`,
  },
};

const FAQ = [
  {
    question: 'Un auto-entrepreneur doit-il facturer la TVA ?',
    answer:
      'Pas tant qu’il relève de la franchise en base de TVA : la facture est alors établie en hors taxes, sans TVA, et doit porter la mention « TVA non applicable, article 293 B du CGI ». Au-delà des seuils, ou sur option, la TVA s’applique normalement. Les seuils sont révisés périodiquement : vérifiez la valeur en vigueur auprès de l’administration.',
  },
  {
    question: 'Comment paramétrer la TVA à 0 % dans INVEQ ?',
    answer:
      'Dans les réglages de l’entreprise, la « TVA par défaut » se règle sur 0. Toutes les nouvelles lignes de devis et de factures partent alors de ce taux, et le total TTC est égal au total HT.',
  },
  {
    question: 'Où ajouter la mention 293 B du CGI ?',
    answer:
      'Les réglages comportent un « Pied de page devis » et un « Pied de page factures ». La mention saisie une fois s’imprime sur tous les documents concernés, sans avoir à la retaper.',
  },
  {
    question: 'La numérotation doit-elle être continue ?',
    answer:
      'Oui, une facture doit s’inscrire dans une séquence continue, sans trou ni doublon. INVEQ gère le compteur et le préfixe pour vous ; le prochain numéro est visible dans les réglages.',
  },
  {
    question: 'INVEQ convient-il pour une activité qui démarre ?',
    answer:
      'L’offre Micro est gratuite et sans limite de durée. Elle couvre la création de devis et de factures et le suivi des règlements ; les offres payantes servent surtout quand le volume augmente.',
  },
];

/**
 * Page ciblant « facturation auto-entrepreneur ».
 *
 * Elle existe parce que ce public a un besoin réellement distinct : facturer
 * sans TVA et porter la mention de l'article 293 B. La réponse est concrète et
 * s'appuie sur des réglages qui existent — TVA par défaut, pied de page des
 * documents, compteur de numérotation.
 *
 * Les seuils de la franchise en base ne sont volontairement pas chiffrés : ils
 * ont été révisés plusieurs fois et une valeur périmée sur un site de
 * facturation serait pire qu'une absence de valeur. On renvoie à la source
 * officielle.
 */
export default function FacturationAutoEntrepreneurPage() {
  return (
    <>
      <PageHero
        eyebrow="Auto-entrepreneurs"
        subtitle="Facturer sans TVA suppose deux réglages et une mention. Une fois posés, ils s’appliquent à tous vos documents."
        title="Facturation pour auto-entrepreneurs"
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Accueil', path: '/' },
            { name: 'Logiciel de facturation', path: '/logiciel-facturation' },
            { name: 'Auto-entrepreneurs', path: '/facturation-auto-entrepreneur' },
          ]}
        />
      </div>

      <ContentSection title="Ce que la franchise en base change sur vos factures">
        <Prose>
          Sous le régime de la franchise en base de TVA, vous ne collectez pas la taxe et ne la
          déduisez pas. Concrètement, vos factures ne comportent aucune ligne de TVA : le total
          TTC est égal au total HT, et le document doit porter la mention{' '}
          <span className="font-medium text-foreground">
            « TVA non applicable, article 293 B du CGI »
          </span>
          .
        </Prose>
        <Prose>
          Les seuils qui conditionnent ce régime ont été modifiés à plusieurs reprises. Plutôt que
          d’afficher ici un montant qui pourrait être périmé, vérifiez la valeur en vigueur sur le
          site de l’administration fiscale avant de vous positionner.
        </Prose>
      </ContentSection>

      <ContentSection
        lead="Trois réglages, une fois pour toutes."
        title="Comment le paramétrer dans INVEQ">
        <KeyPoints
          items={[
            'Réglages de l’entreprise → « TVA par défaut » à 0 : toutes les nouvelles lignes partent sans taxe.',
            'Réglages → « Pied de page factures » : saisissez-y la mention 293 B, elle s’imprimera sur chaque document.',
            'Réglages → préfixe et prochain numéro : la séquence reste continue, sans trou ni doublon.',
          ]}
        />
        <Prose>
          Le même pied de page existe pour les devis. Si vous facturez au forfait, le catalogue de
          prestations évite de resaisir vos tarifs habituels à chaque document.
        </Prose>
      </ContentSection>

      <ContentSection title="Ce qui reste identique aux autres régimes">
        <Prose>
          Le reste des obligations ne change pas : identification de l’émetteur et du client, date
          d’émission, numéro unique, désignation précise des prestations, prix unitaire, date ou
          délai de règlement et conditions d’escompte, pénalités de retard. Ces éléments figurent
          sur le guide des mentions obligatoires.
        </Prose>
      </ContentSection>

      <FaqBlock items={FAQ} />

      <RelatedLinks
        links={[
          {
            label: 'Mentions obligatoires',
            description: 'La liste complète de ce qui doit figurer sur une facture.',
            href: '/guides/mentions-obligatoires-facture',
          },
          {
            label: 'Facture électronique',
            description: 'Qui est concerné, et à partir de quand.',
            href: '/guides/facture-electronique-obligation',
          },
          {
            label: 'Devis et factures',
            description: 'Le parcours d’un document, du chiffrage au règlement.',
            href: '/logiciel-devis-facture',
          },
          {
            label: 'Tarifs',
            description: 'L’offre Micro est gratuite, sans limite de durée.',
            href: '/tarifs',
          },
        ]}
      />

      <CtaSection />
    </>
  );
}
