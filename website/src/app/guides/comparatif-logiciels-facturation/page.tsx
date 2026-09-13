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

const GUIDE = findGuide('comparatif-logiciels-facturation')!;

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
    question: 'Pourquoi ce comparatif ne contient-il pas de tableau de prix ?',
    answer:
      'Parce qu’un tableau de prix est faux quelques semaines après sa publication. Les grilles tarifaires changent, les paliers se redécoupent, les promotions vont et viennent. Un chiffre périmé présenté comme actuel induit davantage en erreur qu’une absence de chiffre : nous renvoyons donc aux pages tarifaires des éditeurs, qui font foi.',
  },
  {
    question: 'INVEQ est-il le meilleur choix ?',
    answer:
      'Pour une partie des lecteurs, non, et ce guide est écrit pour que cela se voie. Si vous cherchez à confier votre comptabilité, à suivre des chantiers avec métrés et situations, ou à émettre beaucoup de factures sans rien payer, d’autres familles d’outils répondent mieux. INVEQ est pertinent quand le besoin est d’émettre des devis et des factures proprement, y compris en déplacement.',
  },
  {
    question: 'Faut-il choisir un outil parce qu’il est « certifié » ?',
    answer:
      'Attention au mot. Ce qui existe officiellement, c’est l’immatriculation des plateformes agréées, publiée par l’administration fiscale. Un logiciel de facturation, lui, se raccorde à une telle plateforme : c’est ce raccordement qu’il faut vérifier, pas un label affiché sur une page commerciale.',
  },
  {
    question: 'Peut-on changer d’outil en cours de route ?',
    answer:
      'Oui, et c’est fréquent — le besoin d’un indépendant à ses débuts n’est pas celui qu’il aura trois ans plus tard. Ce qui rend le changement coûteux n’est pas l’outil quitté mais la difficulté à en sortir : vérifiez avant de vous installer que vous pouvez exporter vos documents et vos contacts par vous-même.',
  },
];

/**
 * Comparatif éditorial.
 *
 * La SERP « meilleur logiciel de facturation » est entièrement occupée par des
 * comparatifs, dont beaucoup sont des tableaux de prix. Deux raisons de ne pas
 * en produire un de plus sous cette forme : ces tableaux sont invérifiables
 * dans la durée, et les reproduire n'apporterait rien au lecteur.
 *
 * L'angle retenu est un classement par famille de métier. Les familles, elles,
 * sont stables : un logiciel de comptabilité qui offre la facturation ne
 * deviendra pas un outil de facturation pur le mois prochain. Le lecteur se
 * situe d'abord, puis compare à l'intérieur d'une famille.
 *
 * Contraintes tenues : aucun prix concurrent, aucune fonctionnalité concurrente
 * affirmée au-delà du positionnement que chaque éditeur revendique lui-même,
 * aucun dénigrement. Le guide indique explicitement les cas où INVEQ n'est pas
 * le bon choix.
 */
export default function ComparatifPage() {
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
        subtitle="Comparer ces outils fonction par fonction ne mène nulle part : ils font tous des devis et des factures. Ce qui les sépare, c’est le métier qu’ils exercent vraiment."
        title={GUIDE.title}
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Accueil', path: '/' },
            { name: 'Guides', path: '/guides' },
            { name: 'Comparatif', path: `/guides/${GUIDE.slug}` },
          ]}
        />
      </div>

      <ContentSection title="Pourquoi les comparatifs habituels n’aident pas">
        <Prose>
          Ouvrez trois comparatifs de logiciels de facturation : vous y trouverez les mêmes
          colonnes — devis, factures, relances, export — cochées partout. C’est normal. Émettre un
          devis et une facture est le socle commun ; aucun éditeur sérieux n’en fait l’impasse.
        </Prose>
        <Prose>
          La différence se joue ailleurs : dans ce que l’outil fait{' '}
          <span className="font-medium text-foreground">en plus</span> de la facturation, et donc
          dans ce qu’il attend de vous. Un logiciel de comptabilité qui offre la facturation ne
          vous demande pas la même chose qu’un outil de facturation seul. Se tromper de famille
          coûte plus cher que de se tromper d’éditeur à l’intérieur d’une famille.
        </Prose>
      </ContentSection>

      <ContentSection
        lead="Chacune répond à un besoin différent. Identifiez la vôtre avant de comparer des noms."
        title="Les cinq familles du marché français">
        <Prose>
          <span className="font-medium text-foreground">1. Les outils de facturation seuls.</span>{' '}
          Leur objet est l’émission des documents commerciaux et le suivi des règlements, rien
          d’autre. Henrri et Facture.net se présentent ainsi, INVEQ également. Ils conviennent
          quand la comptabilité est confiée à un expert-comptable et que le besoin est
          d’émettre proprement. Ils ne tiennent pas vos journaux et ne produisent pas vos
          déclarations.
        </Prose>
        <Prose>
          <span className="font-medium text-foreground">
            2. Les logiciels de comptabilité qui incluent la facturation.
          </span>{' '}
          Indy, Abby, Evoliz ou Pennylane se positionnent sur la tenue comptable des indépendants
          ou des entreprises, la facturation venant en amont de la comptabilité. C’est la famille
          à considérer si vous voulez un seul outil de la facture à la déclaration — au prix d’un
          périmètre plus large à prendre en main.
        </Prose>
        <Prose>
          <span className="font-medium text-foreground">
            3. Les banques professionnelles qui proposent la facturation.
          </span>{' '}
          Qonto, notamment, associe le compte professionnel à un module de facturation. L’intérêt
          est évident : l’encaissement et la facture vivent au même endroit. La contrepartie l’est
          aussi — l’outil suit le compte, et changer de banque devient une décision qui touche
          aussi votre facturation.
        </Prose>
        <Prose>
          <span className="font-medium text-foreground">
            4. Les suites de gestion commerciale et les CRM.
          </span>{' '}
          Axonaut, Sellsy, ou les éditeurs historiques comme EBP et Cegid, adressent la relation
          client de la prospection à l’encaissement. C’est la famille pertinente à partir du
          moment où plusieurs personnes suivent des affaires en parallèle. Pour un artisan seul,
          c’est un outil surdimensionné.
        </Prose>
        <Prose>
          <span className="font-medium text-foreground">5. Les outils métier du bâtiment.</span>{' '}
          INFast, Batappli, Mediabat et d’autres sont conçus pour le BTP : bibliothèques de prix
          de matériaux, métrés, situations de travaux, retenues de garantie. Si votre activité
          repose sur ces notions, aucune des quatre familles précédentes ne les remplacera, et il
          faut aller vers celle-ci.
        </Prose>
      </ContentSection>

      <ContentSection title="Comment se situer en trois questions">
        <KeyPoints
          items={[
            'Qui tient votre comptabilité ? Si c’est un expert-comptable, un outil de facturation seul suffit. Si vous la tenez vous-même, regardez la famille 2.',
            'Combien de personnes émettent des documents ? Au-delà d’une ou deux, la famille 4 devient justifiée.',
            'Votre métier a-t-il un vocabulaire propre — situations, métrés, retenues ? Si oui, la famille 5 s’impose, et le reste est hors sujet.',
          ]}
        />
        <Prose>
          Une fois la famille identifiée, la comparaison entre éditeurs devient beaucoup plus
          simple, et les critères d’usage reprennent la main : continuité entre devis et facture,
          suivi des règlements, mobilité réelle, réversibilité des données.
        </Prose>
      </ContentSection>

      <ContentSection title="Ce que ce guide ne fera pas">
        <Prose>
          Il ne classera pas ces outils du meilleur au moins bon, parce que la question n’a de
          réponse qu’une fois votre situation connue. Il ne publiera pas non plus de tableau de
          prix ni de liste de fonctionnalités concurrentes : ces informations changent, et les
          recopier reviendrait à affirmer aujourd’hui des choses que nous ne vérifierons pas
          demain. Les pages tarifaires des éditeurs font foi.
        </Prose>
        <Prose>
          Ce qu’il peut faire, en revanche, c’est vous éviter d’essayer trois outils d’une famille
          qui ne correspond pas à votre besoin.
        </Prose>
      </ContentSection>

      <ContentSection title="Et INVEQ, honnêtement">
        <Prose>
          INVEQ appartient à la première famille : un outil de facturation, pas un logiciel de
          comptabilité, pas un CRM, pas un outil de BTP. Il est pensé pour les artisans, les
          indépendants et les TPE qui émettent devis et factures, souvent en déplacement — d’où
          l’application iOS, la signature du client à l’écran et le catalogue de prestations.
        </Prose>
        <Prose>
          Les cas où il ne faut pas le choisir sont clairs : si vous voulez confier votre
          comptabilité à l’outil, si vous suivez des chantiers avec situations et métrés, ou si
          vous cherchez un volume élevé de factures sans rien payer — l’offre gratuite d’INVEQ
          s’arrête à trois documents par mois. Dans ces trois cas, une autre famille vous servira
          mieux.
        </Prose>
      </ContentSection>

      <FaqBlock items={FAQ} />

      <RelatedLinks
        links={[
          {
            label: 'Choisir un logiciel',
            description: 'Les six critères qui comptent à l’usage.',
            href: '/guides/choisir-logiciel-facturation',
          },
          {
            label: 'Les logiciels gratuits',
            description: 'Ce que « gratuit » recouvre selon les éditeurs.',
            href: '/guides/logiciel-facturation-gratuit',
          },
          {
            label: 'Logiciel de facturation',
            description: 'Le périmètre exact d’INVEQ.',
            href: '/logiciel-facturation',
          },
          {
            label: 'Tarifs',
            description: 'Nos offres et leurs limites, sans détour.',
            href: '/tarifs',
          },
        ]}
      />

      <CtaSection />
    </>
  );
}
