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

const GUIDE = findGuide('logiciel-facturation-gratuit')!;

export const metadata: Metadata = {
  title: GUIDE.metaTitle ?? GUIDE.title,
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
    question: 'Un logiciel gratuit est-il conforme ?',
    answer:
      'La gratuité n’a rien à voir avec la conformité. Ce qui rend une facture conforme, ce sont ses mentions et la continuité de sa numérotation — un outil gratuit peut parfaitement les tenir, un outil payant peut les tenir mal. La question à poser porte sur les fonctions, pas sur le prix.',
  },
  {
    question: 'L’offre gratuite d’INVEQ est-elle limitée ?',
    answer:
      'Oui, et c’est la limite principale : trois documents par mois. Le catalogue de prestations, les contacts, le suivi des documents, l’envoi par e-mail et l’export PDF ne sont pas plafonnés. Au-delà de trois devis ou factures dans le mois, il faut passer à une offre payante.',
  },
  {
    question: 'Que se passe-t-il si je repasse d’une offre payante à l’offre gratuite ?',
    answer:
      'C’est la question à poser à tout éditeur, y compris à nous. Vérifiez systématiquement si vos documents antérieurs restent consultables et exportables, ou si l’accès à l’historique suit l’abonnement. La réponse détermine votre liberté de partir.',
  },
  {
    question: 'Pourquoi certains éditeurs offrent-ils la facturation sans limite ?',
    answer:
      'Parce que la facturation n’est pas leur produit. Une banque professionnelle, un cabinet comptable en ligne ou un outil de comptabilité peuvent offrir le module de facturation : il sert à faire entrer des utilisateurs vers l’offre qui, elle, est payante. C’est un modèle parfaitement légitime, mais il faut savoir ce à quoi on adhère.',
  },
];

/**
 * Guide sur les offres gratuites.
 *
 * INVEQ est en position défavorable sur cette requête : plusieurs concurrents
 * offrent la facturation sans plafond de documents, l'offre Micro s'arrête à
 * trois par mois. Deux façons de traiter le sujet : l'éviter, ou l'expliquer.
 *
 * On l'explique. Le plafond est énoncé en toutes lettres, y compris dans la
 * FAQ, et le guide dit pourquoi certains acteurs peuvent offrir davantage —
 * parce que la facturation n'est pas leur produit. Un lecteur qui a besoin de
 * vingt factures gratuites par mois doit pouvoir le comprendre ici et aller
 * ailleurs : une inscription mal orientée ne profite à personne.
 */
export default function LogicielFacturationGratuitPage() {
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
        subtitle="Les offres gratuites sont réelles. Elles ne sont simplement pas gratuites pour les mêmes raisons — et cela se voit à l’usage."
        title={GUIDE.title}
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Accueil', path: '/' },
            { name: 'Guides', path: '/guides' },
            { name: 'Logiciel gratuit', path: `/guides/${GUIDE.slug}` },
          ]}
        />
      </div>

      <ContentSection title="Trois modèles derrière un même mot">
        <Prose>
          « Gratuit » recouvre des situations très différentes, et c’est ce qui rend les
          comparaisons trompeuses. Il vaut la peine de savoir dans lequel des trois cas on se
          trouve, parce que chacun a ses conséquences.
        </Prose>
        <KeyPoints
          items={[
            'Le produit d’appel : la facturation est offerte parce que l’éditeur vend autre chose — un compte bancaire professionnel, de la comptabilité, un accompagnement. C’est le modèle le plus généreux sur les volumes.',
            'La version d’essai permanente : l’outil est gratuit dans une limite de documents, de clients ou d’entreprises, et l’usage régulier bascule naturellement vers une offre payante.',
            'Le financement par ailleurs : publicité, revente de services annexes, ou options facturées à l’acte.',
          ]}
        />
        <Prose>
          Aucun de ces modèles n’est illégitime. Mais le premier suppose d’adhérer à un
          écosystème, le deuxième d’accepter un plafond, le troisième de lire ce qui est facturé
          en plus.
        </Prose>
      </ContentSection>

      <ContentSection title="Les questions qui comptent, avant le prix">
        <KeyPoints
          items={[
            'Que compte le plafond : les documents émis, les clients enregistrés, les entreprises gérées, les utilisateurs ?',
            'Le plafond est-il mensuel ou annuel, et que se passe-t-il quand il est atteint en cours de mois ?',
            'La facture reste-t-elle conforme dans l’offre gratuite — mentions, numérotation continue, personnalisation du pied de page ?',
            'Pouvez-vous exporter vos documents et vos contacts sans passer par le support ?',
            'L’accès à l’historique survit-il à un retour vers l’offre gratuite ?',
            'Le raccordement à une plateforme agréée est-il inclus, ou réservé aux offres payantes ?',
          ]}
        />
        <Prose>
          La dernière question devient déterminante à mesure que la réforme s’applique. Un outil
          gratuit qui ne se raccorderait à aucune plateforme vous laisserait sans solution pour
          les échanges entre professionnels.
        </Prose>
      </ContentSection>

      <ContentSection title="Où se situe INVEQ, sans détour">
        <Prose>
          L’offre Micro d’INVEQ est à 0 €, sans carte bancaire et sans limite de durée. Elle est
          plafonnée à{' '}
          <span className="font-medium text-foreground">trois documents par mois</span>. Le
          catalogue de prestations, les contacts, le suivi des documents, l’envoi par e-mail et
          l’export PDF ne sont pas plafonnés.
        </Prose>
        <Prose>
          Autrement dit : si vous émettez une vingtaine de factures par mois et cherchez à ne rien
          payer, plusieurs outils du marché seront plus adaptés qu’INVEQ, et il n’y a aucune
          raison de le cacher. L’offre Micro sert à travailler pour de bon sur vos propres
          documents avant de décider — pas à faire tourner une activité à plein régime.
        </Prose>
        <Prose>
          Ce qu’INVEQ met en face, à partir des offres payantes, tient en quelques points : le
          passage d’un devis à une facture sans ressaisie, une application iOS utilisable sur le
          chantier, la signature du client à l’écran, un catalogue de prestations, et le
          raccordement à une plateforme agréée. C’est sur ces points qu’il faut nous comparer,
          pas sur le nombre de factures offertes.
        </Prose>
      </ContentSection>

      <FaqBlock items={FAQ} />

      <RelatedLinks
        links={[
          {
            label: 'Tarifs',
            description: 'Le détail de chaque offre et de ses limites.',
            href: '/tarifs',
          },
          {
            label: 'Comparatif des logiciels français',
            description: 'Situer les outils par famille avant d’en essayer un.',
            href: '/guides/comparatif-logiciels-facturation',
          },
          {
            label: 'Choisir un logiciel',
            description: 'Les six critères qui font la différence à l’usage.',
            href: '/guides/choisir-logiciel-facturation',
          },
          {
            label: 'Logiciel de facturation',
            description: 'Le périmètre complet d’INVEQ.',
            href: '/logiciel-facturation',
          },
        ]}
      />

      <CtaSection />
    </>
  );
}
