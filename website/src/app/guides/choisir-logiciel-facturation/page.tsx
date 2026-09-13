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

const GUIDE = findGuide('choisir-logiciel-facturation')!;

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
    question: 'Un tableur suffit-il pour commencer ?',
    answer:
      'Il tient quelques mois. Les limites arrivent avec la numérotation — un doublon ou un trou dans la série — et avec le suivi des règlements, qu’un tableur ne rappelle jamais. Le point de bascule est généralement la première facture oubliée.',
  },
  {
    question: 'Faut-il un logiciel de comptabilité ou de facturation ?',
    answer:
      'Ce sont deux métiers. La facturation émet les documents et suit les encaissements ; la comptabilité tient les journaux et produit les états financiers. Beaucoup d’indépendants utilisent un outil de facturation et confient la comptabilité à un expert-comptable, en lui transmettant les PDF.',
  },
  {
    question: 'Que vérifier sur la récupération des données ?',
    answer:
      'La capacité à exporter vos documents en PDF et à récupérer vos données clients sans dépendre de l’éditeur. Un outil dont on ne peut pas sortir devient un risque dès que les besoins changent.',
  },
  {
    question: 'Le prix affiché est-il le prix réel ?',
    answer:
      'Regardez ce qui est compté : nombre de documents, nombre de clients, nombre d’entreprises, utilisateurs. Un tarif d’appel bas devient coûteux si chaque palier est vite atteint. Vérifiez aussi ce que devient l’accès à vos documents si vous repassez à l’offre gratuite.',
  },
];

/**
 * Guide d'achat.
 *
 * Écrit pour être utile même à quelqu'un qui choisira un autre outil : les
 * critères sont posés d'abord, INVEQ n'est mentionné qu'à la fin et sans
 * comparatif chiffré avec des concurrents nommés, faute de pouvoir en vérifier
 * les caractéristiques dans le temps.
 */
export default function ChoisirLogicielFacturationPage() {
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
        subtitle="Les listes de fonctionnalités se ressemblent toutes. Voici les six points qui font réellement la différence à l’usage."
        title={GUIDE.title}
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Accueil', path: '/' },
            { name: 'Guides', path: '/guides' },
            { name: 'Choisir un logiciel', path: `/guides/${GUIDE.slug}` },
          ]}
        />
      </div>

      <ContentSection title="1. La conformité, avant tout le reste">
        <Prose>
          Numérotation continue, mentions obligatoires, conservation des documents : ce sont les
          points sur lesquels un outil ne doit pas transiger. Vérifiez que le logiciel gère
          lui-même le compteur, qu’il permet de renseigner un pied de page appliqué à tous les
          documents, et qu’il vous laisse récupérer vos PDF.
        </Prose>
      </ContentSection>

      <ContentSection title="2. La continuité entre devis et facture">
        <Prose>
          C’est le critère le plus sous-estimé. Si convertir un devis accepté suppose de retaper
          les lignes, l’outil vous fera perdre en saisie ce qu’il prétend faire gagner ailleurs —
          et chaque ressaisie est une occasion d’erreur.
        </Prose>
      </ContentSection>

      <ContentSection title="3. Le suivi des règlements">
        <Prose>
          Émettre une facture est facile ; savoir laquelle n’a pas été payée l’est moins. Regardez
          si l’outil distingue les paiements partiels, s’il fait remonter les retards sans que
          vous ayez à les chercher, et s’il conserve un historique des règlements.
        </Prose>
      </ContentSection>

      <ContentSection title="4. La mobilité, si votre métier l’exige">
        <Prose>
          Un artisan qui chiffre sur place n’a pas les mêmes besoins qu’un consultant qui facture
          en fin de mois. Si vous devez faire signer un devis chez le client, une application
          mobile réelle — pas un site adapté au petit écran — change la journée.
        </Prose>
      </ContentSection>

      <ContentSection title="5. La facturation électronique">
        <Prose>
          À partir de septembre 2026, toutes les entreprises doivent pouvoir recevoir des factures
          électroniques. Demandez à l’éditeur comment son outil se raccorde à une plateforme de
          dématérialisation. Une réponse vague sur ce point est un signal.
        </Prose>
      </ContentSection>

      <ContentSection title="6. La réversibilité et le coût réel">
        <KeyPoints
          items={[
            'Pouvez-vous exporter vos documents et vos clients sans passer par le support ?',
            'Que compte l’offre : documents, clients, entreprises, utilisateurs ?',
            'Que devient l’accès à l’historique si vous redescendez d’offre ?',
            'Le tarif affiché est-il hors taxes, et l’engagement est-il mensuel ou annuel ?',
          ]}
        />
      </ContentSection>

      <ContentSection title="Et INVEQ dans tout ça">
        <Prose>
          INVEQ répond à ces six points : compteur de numérotation et pied de page paramétrables,
          conversion d’un devis en facture sans ressaisie, suivi des paiements partiels et des
          retards, application iOS en plus du web, raccordement à une plateforme de
          dématérialisation, et export PDF de tous vos documents. L’offre Micro est gratuite, ce
          qui permet de vérifier tout cela sur vos propres documents avant de vous décider.
        </Prose>
      </ContentSection>

      <FaqBlock items={FAQ} />

      <RelatedLinks
        links={[
          {
            label: 'Logiciel de facturation',
            description: 'Le périmètre complet d’INVEQ.',
            href: '/logiciel-facturation',
          },
          {
            label: 'Comparatif des logiciels français',
            description: 'Les cinq familles du marché, pour se situer.',
            href: '/guides/comparatif-logiciels-facturation',
          },
          {
            label: 'Facture électronique',
            description: 'Le calendrier et les obligations.',
            href: '/guides/facture-electronique-obligation',
          },
          {
            label: 'Mentions obligatoires',
            description: 'La conformité, poste par poste.',
            href: '/guides/mentions-obligatoires-facture',
          },
        ]}
      />

      <CtaSection />
    </>
  );
}
