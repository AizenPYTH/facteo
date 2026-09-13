import type { Metadata } from 'next';

import {
  CtaSection,
  MobileSection,
  PageHero,
  PricingSection,
} from '@/components/sections/landing-sections';
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
  title: 'Logiciel de devis et facture pour artisans',
  description:
    'Chiffrer sur le chantier, faire signer le devis à l’écran, le convertir en facture sans ressaisie. Application iOS et web, catalogue de prestations, offre gratuite.',
  alternates: { canonical: `${SITE_URL}/logiciel-devis-facture-artisan` },
  openGraph: {
    title: 'Logiciel de devis et facture pour artisans',
    description:
      'Chiffrer sur place, faire signer, convertir en facture. Application iOS et web pour les artisans.',
    url: `${SITE_URL}/logiciel-devis-facture-artisan`,
  },
};

const FAQ = [
  {
    question: 'INVEQ est-il un logiciel de bâtiment ?',
    answer:
      'Non, et la distinction est importante. INVEQ ne gère ni les métrés, ni les situations de travaux, ni les retenues de garantie, et n’embarque pas de bibliothèque de prix de matériaux. C’est un logiciel de devis et de factures utilisable par un artisan, pas un progiciel de suivi de chantier. Si votre activité repose sur ces notions, un outil spécialisé BTP vous servira mieux.',
  },
  {
    question: 'Le client peut-il signer le devis sur place ?',
    answer:
      'Oui. La signature se fait au doigt sur l’écran du téléphone ou de la tablette, et elle est intégrée au PDF du document. La signature électronique est disponible à partir de l’offre Standard.',
  },
  {
    question: 'Puis-je préparer un devis sans réseau sur le chantier ?',
    answer:
      'INVEQ a besoin d’une connexion pour enregistrer et synchroniser vos documents. En zone mal couverte, la pratique la plus sûre reste de préparer le chiffrage depuis le catalogue puis de finaliser dès que le réseau revient.',
  },
  {
    question: 'Comment éviter de retaper mes prestations à chaque devis ?',
    answer:
      'Par le catalogue. Vous y enregistrez vos prestations et vos fournitures avec leur unité, leur prix hors taxes et leur taux de TVA ; elles s’insèrent ensuite en une sélection. Le catalogue est illimité, y compris dans l’offre gratuite.',
  },
  {
    question: 'Et pour la facturation électronique ?',
    answer:
      'INVEQ se raccorde à SUPER PDP, une plateforme agréée. La connexion s’établit depuis les réglages de l’entreprise, puis l’envoi et le suivi du statut se font depuis la facture. INVEQ n’est pas lui-même une plateforme agréée : c’est un logiciel qui s’y raccorde.',
  },
];

const BREADCRUMB = [
  { name: 'Accueil', path: '/' },
  { name: 'Logiciel de facturation', path: '/logiciel-facturation' },
  { name: 'Artisans', path: '/logiciel-devis-facture-artisan' },
];

/**
 * Page dédiée aux artisans.
 *
 * Justification de son existence, puisque la règle du site est de ne pas
 * multiplier les pages proches : la recherche « logiciel devis facture
 * artisan » est tenue par des progiciels de BTP — bibliothèques de prix,
 * métrés, situations, retenues de garantie — vendus plusieurs dizaines d'euros
 * par mois. Ni le jeu concurrentiel ni le besoin ne recoupent ceux de la page
 * pivot, qui s'adresse aux indépendants et aux TPE en général.
 *
 * Le contenu propre tient à trois choses qui ne figurent nulle part ailleurs :
 * le déroulé d'un chiffrage fait sur place, la signature à l'écran, et surtout
 * la limite — INVEQ n'est pas un outil de suivi de chantier. Dire clairement
 * pour qui l'outil ne convient pas évite des inscriptions mal orientées, qui ne
 * profitent à personne.
 */
export default function ArtisanPage() {
  return (
    <>
      <PageHero
        eyebrow="Artisans"
        subtitle="Chiffrer devant le client, faire signer, et que la facture reprenne le devis sans qu’on retape une ligne."
        title="Logiciel de devis et de facture pour artisans"
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs items={BREADCRUMB} />
      </div>

      <ContentSection title="Le devis se fait sur le chantier, pas le soir">
        <Prose>
          C’est la particularité du métier : le chiffrage a lieu devant le client, pendant la
          visite, et la décision se prend souvent dans la foulée. Repartir avec « je vous envoie
          ça ce week-end » coûte des affaires — le temps que le devis parte, deux confrères sont
          passés.
        </Prose>
        <Prose>
          Le déroulé utile tient en quatre gestes : ouvrir un devis pour le client, insérer les
          lignes depuis le catalogue, ajuster les quantités et la remise éventuelle, faire signer.
          Ce qui suppose que le catalogue soit prêt avant la visite, et que l’outil tienne dans une
          main.
        </Prose>
      </ContentSection>

      <ContentSection
        lead="Ce qui sert vraiment quand on facture entre deux interventions."
        title="Ce qu’INVEQ apporte à un artisan">
        <KeyPoints
          items={[
            'Un catalogue de prestations et de fournitures, avec unité, prix hors taxes et taux de TVA — illimité, y compris dans l’offre gratuite.',
            'La signature du client au doigt sur l’écran, intégrée au PDF du document (à partir de l’offre Standard).',
            'La conversion d’un devis accepté en facture, qui conserve les lignes, les remises et la TVA — sans ressaisie.',
            'Le suivi des règlements, y compris partiels, pour savoir ce qui reste dû sans reconstituer les comptes.',
            'Une application iOS native, en plus de l’interface web sur ordinateur.',
            'Le raccordement à une plateforme agréée pour la facturation électronique.',
          ]}
        />
      </ContentSection>

      <ContentSection title="Les mentions propres au bâtiment">
        <Prose>
          Au-delà des mentions obligatoires communes à toutes les factures, les artisans du
          bâtiment doivent faire figurer leur assurance professionnelle : le nom de l’assureur,
          les coordonnées du contrat et sa couverture géographique. Cette mention ne change pas
          d’un document à l’autre — elle se renseigne une fois dans le pied de page paramétrable
          et s’imprime ensuite sur tous vos devis et vos factures.
        </Prose>
        <Prose>
          Il en va de même du taux des pénalités de retard et de l’indemnité forfaitaire de 40 €
          pour frais de recouvrement, dues entre professionnels et souvent oubliées alors
          qu’elles conditionnent la possibilité de réclamer en cas d’impayé.
        </Prose>
      </ContentSection>

      <ContentSection title="Ce qu’INVEQ n’est pas">
        <Prose>
          Les outils qui dominent la recherche « logiciel devis facture artisan » sont des
          progiciels de BTP. Ils apportent des bibliothèques de prix de matériaux, des métrés, des
          situations de travaux, des retenues de garantie, parfois de la planification d’équipes.
          INVEQ ne fait rien de tout cela, et il vaut mieux le savoir avant de s’inscrire.
        </Prose>
        <Prose>
          Si vous conduisez des chantiers longs, facturés à l’avancement par situations
          successives, avec des équipes à planifier, un outil spécialisé sera plus juste. INVEQ
          s’adresse à l’artisan dont l’activité tient en interventions et en petits chantiers, qui
          veut chiffrer vite, facturer proprement et suivre ses encaissements — sans acheter un
          progiciel pour cela.
        </Prose>
      </ContentSection>

      <MobileSection />

      <section
        className="border-y border-border/60 bg-[#F7F4EF]/50 px-5 py-[var(--section-y)] sm:px-6 lg:px-8 lg:py-[var(--section-y-lg)]"
        id="tarifs">
        <div className="mx-auto max-w-7xl">
          <PricingSection showHeader />
        </div>
      </section>

      <FaqBlock items={FAQ} />

      <RelatedLinks
        links={[
          {
            label: 'Logiciel de facturation',
            description: 'Le périmètre complet du produit.',
            href: '/logiciel-facturation',
          },
          {
            label: 'Devis et factures',
            description: 'La continuité entre les deux documents.',
            href: '/logiciel-devis-facture',
          },
          {
            label: 'Mentions obligatoires',
            description: 'Dont l’assurance professionnelle du bâtiment.',
            href: '/guides/mentions-obligatoires-facture',
          },
          {
            label: 'Comparatif des logiciels français',
            description: 'Les cinq familles du marché, dont les outils BTP.',
            href: '/guides/comparatif-logiciels-facturation',
          },
        ]}
      />

      <CtaSection />
    </>
  );
}
