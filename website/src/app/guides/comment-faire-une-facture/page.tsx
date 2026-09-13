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

const GUIDE = findGuide('comment-faire-une-facture')!;

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
    question: 'Peut-on faire une facture sur Word ou Excel ?',
    answer:
      'Rien ne l’interdit, et beaucoup commencent ainsi. La difficulté n’est pas de produire le document, c’est de tenir la série : un tableur ne vous empêchera pas de réutiliser un numéro, d’en sauter un, ni d’oublier qu’une facture n’a jamais été réglée. C’est généralement la première facture impayée qu’on n’a pas vue passer qui décide du changement.',
  },
  {
    question: 'Faut-il envoyer la facture en PDF ?',
    answer:
      'Aujourd’hui, oui : le PDF est le format d’usage entre professionnels comme avec les particuliers. Cela change pour les échanges entre entreprises assujetties à la TVA en France, où la facture devra transiter par une plateforme agréée à mesure que la réforme s’applique.',
  },
  {
    question: 'Combien de temps faut-il conserver une facture ?',
    answer:
      'Les factures se conservent dix ans au titre des obligations comptables. C’est une raison suffisante pour préférer un outil dont vous pouvez ressortir vos documents sans dépendre de personne.',
  },
  {
    question: 'Peut-on modifier une facture déjà envoyée ?',
    answer:
      'Non. Une facture émise ne se corrige pas en la réécrivant : on émet une facture d’avoir, qui annule tout ou partie de la précédente, puis le cas échéant une nouvelle facture. C’est ce qui préserve la continuité de la numérotation.',
  },
];

/**
 * Guide d'entrée de gamme sur l'émission d'une facture.
 *
 * La requête est massivement occupée par des pages de modèles à télécharger.
 * L'angle retenu est différent : décrire la suite d'opérations, y compris ce
 * qui vient après l'envoi — numérotation, relance, conservation, avoir — que
 * les pages de modèles n'abordent pas puisqu'un modèle s'arrête à l'impression.
 *
 * Aucun montant ni seuil n'est chiffré hors de ceux fixés par un texte stable.
 */
export default function CommentFaireUneFacturePage() {
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
        subtitle="Émettre une facture tient en six opérations. La difficulté n’est pas la première, c’est de tenir les six à chaque fois."
        title={GUIDE.title}
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Accueil', path: '/' },
            { name: 'Guides', path: '/guides' },
            { name: 'Comment faire une facture', path: `/guides/${GUIDE.slug}` },
          ]}
        />
      </div>

      <ContentSection title="1. Réunir les informations avant d’ouvrir le document">
        <Prose>
          L’essentiel du temps passé sur une facture se perd à chercher des données qu’on aurait
          dû avoir sous la main. Avant de commencer, rassemblez l’identité complète du client —
          dénomination, adresse de facturation, et son numéro de TVA intracommunautaire s’il
          s’agit d’un professionnel —, le détail de ce qui a été livré ou réalisé, et les
          conditions convenues : prix, délai de paiement, acompte éventuel déjà versé.
        </Prose>
        <Prose>
          Si un devis a été accepté, tout est déjà là. C’est la raison pour laquelle la conversion
          d’un devis en facture fait gagner bien plus que le temps de saisie : elle supprime
          l’étape où l’on se trompe.
        </Prose>
      </ContentSection>

      <ContentSection title="2. Attribuer un numéro, et ne jamais y revenir">
        <Prose>
          C’est la règle la plus stricte et la plus souvent enfreinte. Les factures doivent se
          suivre dans une séquence chronologique continue, sans trou ni doublon. Vous pouvez
          adopter un préfixe par année ou par série — 2026-001, 2026-002 — à condition que la
          continuité soit respectée à l’intérieur de chaque série.
        </Prose>
        <Prose>
          Une facture annulée ne se supprime pas : son numéro reste consommé, et l’annulation
          passe par un avoir. Un compteur tenu par le logiciel évite l’essentiel de ces
          accidents ; une numérotation saisie à la main les rend inévitables à moyen terme.
        </Prose>
      </ContentSection>

      <ContentSection title="3. Porter les mentions obligatoires">
        <Prose>
          Une facture incomplète peut être refusée par le client, faire échec à la déduction de la
          TVA par l’acheteur et exposer l’émetteur à une sanction. En pratique, le premier effet
          visible est plus prosaïque : le paiement attend la régularisation.
        </Prose>
        <KeyPoints
          items={[
            'La date d’émission et le numéro de la facture.',
            'L’identité complète de l’émetteur et celle du client.',
            'La désignation précise de chaque produit ou prestation, sa quantité et son prix unitaire hors taxes.',
            'Le taux de TVA par ligne, le total hors taxes, le montant de TVA et le total toutes taxes comprises.',
            'La date ou le délai de règlement, les conditions d’escompte, le taux des pénalités de retard.',
            'L’indemnité forfaitaire de 40 € pour frais de recouvrement, due entre professionnels.',
          ]}
        />
        <Prose>
          Le détail poste par poste, y compris les mentions particulières — franchise en base,
          autoliquidation, assurance professionnelle du bâtiment — figure dans le guide consacré
          aux mentions obligatoires.
        </Prose>
      </ContentSection>

      <ContentSection title="4. Décrire ce qui a réellement été fait">
        <Prose>
          « Prestation de services » comme seule désignation est la cause la plus fréquente de
          contestation, et la plus facile à éviter. Nommez l’objet, la quantité dans son unité
          — heures, jours, mètres, pièces — et le prix unitaire. Une ligne compréhensible six mois
          plus tard protège autant l’émetteur que le client.
        </Prose>
        <Prose>
          Si votre activité repose sur des prestations récurrentes, un catalogue vous évite de les
          redécrire à chaque fois, et surtout de les décrire différemment d’une facture à l’autre.
        </Prose>
      </ContentSection>

      <ContentSection title="5. Envoyer, et noter que c’est envoyé">
        <Prose>
          Une facture émise mais non transmise n’existe pas pour le client. Envoyez-la sans
          attendre la fin du mois : le délai de paiement court à partir de la date convenue, pas
          de celle où vous vous en souvenez. Conservez une trace de l’envoi.
        </Prose>
        <Prose>
          À mesure que la réforme de la facturation électronique s’applique, cet envoi change de
          nature pour les échanges entre entreprises assujetties à la TVA en France : la facture
          ne circule plus directement d’une entreprise à l’autre, elle transite par une plateforme
          agréée.
        </Prose>
      </ContentSection>

      <ContentSection title="6. Suivre le règlement, puis conserver">
        <Prose>
          C’est l’étape que l’on abandonne en premier, et celle qui coûte le plus cher. Savoir
          quelles factures restent dues, depuis combien de temps, et lesquelles n’ont été réglées
          qu’en partie, suppose de tenir le suivi au moment de l’encaissement — pas de le
          reconstituer à la fin du trimestre.
        </Prose>
        <Prose>
          Les factures se conservent ensuite dix ans. Vérifiez que vous pouvez, à tout moment,
          ressortir vos documents de l’outil que vous utilisez : c’est la garantie qui compte le
          jour où vous en changez.
        </Prose>
      </ContentSection>

      <FaqBlock items={FAQ} />

      <RelatedLinks
        links={[
          {
            label: 'Mentions obligatoires',
            description: 'La liste complète, poste par poste.',
            href: '/guides/mentions-obligatoires-facture',
          },
          {
            label: 'Devis ou facture ?',
            description: 'Le rôle de chaque document et l’ordre d’émission.',
            href: '/guides/devis-ou-facture',
          },
          {
            label: 'Logiciel de facturation',
            description: 'Ce qu’INVEQ tient à votre place : numérotation, TVA, suivi.',
            href: '/logiciel-facturation',
          },
          {
            label: 'Auto-entrepreneurs',
            description: 'Facturer sans TVA et porter la mention 293 B.',
            href: '/facturation-auto-entrepreneur',
          },
        ]}
      />

      <CtaSection />
    </>
  );
}
