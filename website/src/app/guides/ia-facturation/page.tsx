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

const GUIDE = findGuide('ia-facturation')!;

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
    question: 'L’IA peut-elle rédiger une facture à ma place ?',
    answer:
      'Elle peut préremplir des champs à partir d’un document ou d’une image. Elle ne peut pas décider de ce que vous facturez, ni engager votre responsabilité : une facture est un acte juridique, et c’est vous qui l’émettez. Tout outil qui laisse entendre le contraire vend une automatisation qu’il ne tient pas.',
  },
  {
    question: 'Les données envoyées à l’IA sont-elles réutilisées ?',
    answer:
      'C’est la question à poser à chaque éditeur, et la réponse doit figurer dans sa politique de confidentialité, pas dans un argumentaire commercial. Demandez où le traitement a lieu, ce qui est conservé, et pour combien de temps.',
  },
  {
    question: 'Faut-il se méfier des chiffres de gain de temps annoncés ?',
    answer:
      'Les pourcentages de productivité affichés dans ce secteur proviennent presque toujours de l’éditeur qui les publie, sans méthode communiquée. Ils ne sont pas nécessairement faux, mais ils ne sont pas vérifiables. Jugez sur une tâche que vous faites vraiment, en la chronométrant vous-même pendant l’essai.',
  },
  {
    question: 'Que fait l’IA d’INVEQ, exactement ?',
    answer:
      'Une seule chose : à partir d’une photo, elle prépare une fiche produit en remplissant le nom, la description, la référence, l’unité, le prix hors taxes et le taux de TVA. Vous relisez et vous enregistrez. Elle ne rédige pas de factures, ne lit pas celles de vos fournisseurs et ne relance personne. L’assistant IA est inclus dans l’offre Max.',
  },
];

/**
 * Guide sur l'IA en facturation.
 *
 * L'observation qui fonde cette page : les résultats sur « logiciel de
 * facturation avec IA » traitent presque tous d'automatisation comptable —
 * lecture des factures fournisseurs, rapprochements, détection d'anomalies.
 * C'est un métier différent de celui d'un logiciel d'émission de documents.
 *
 * Un lecteur qui cherche « facturation IA » ne sait généralement pas qu'il y a
 * trois sujets derrière un seul mot. Les distinguer est utile en soi, et c'est
 * la seule façon honnête pour INVEQ d'occuper le terrain : en disant ce que
 * son IA fait — préremplir une fiche produit — plutôt qu'en laissant croire
 * qu'elle fait ce que font les outils d'automatisation comptable.
 */
export default function IaFacturationPage() {
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
        subtitle="Trois choses très différentes se cachent derrière « facturation avec IA ». Savoir laquelle on vous vend évite bien des déceptions."
        title={GUIDE.title}
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Accueil', path: '/' },
            { name: 'Guides', path: '/guides' },
            { name: 'L’IA en facturation', path: `/guides/${GUIDE.slug}` },
          ]}
        />
      </div>

      <ContentSection title="Trois usages, un seul mot">
        <Prose>
          Quand un éditeur annonce de l’intelligence artificielle dans sa solution de facturation,
          il parle presque toujours de l’un de ces trois usages. Ils n’ont ni le même intérêt, ni
          les mêmes destinataires.
        </Prose>
        <KeyPoints
          items={[
            'La lecture des factures reçues : l’outil analyse les factures de vos fournisseurs, en extrait les montants et les impute comptablement. C’est le sujet dominant du marché, et il s’adresse à qui tient une comptabilité.',
            'L’extraction depuis un document ou une image : l’outil lit une photo, un bon de commande ou un catalogue et préremplit des champs de saisie. Il fait gagner du temps sur la saisie, pas sur la décision.',
            'La génération de texte : l’outil rédige une relance, une description de prestation, un message d’accompagnement. Utile, mais sans rapport avec la mécanique de la facture.',
          ]}
        />
        <Prose>
          Le premier usage est celui qui occupe l’essentiel des résultats de recherche sur
          « logiciel de facturation avec IA ». Si vous êtes artisan ou indépendant et que votre
          comptable traite vos factures fournisseurs, ce n’est probablement pas ce que vous
          cherchez.
        </Prose>
      </ContentSection>

      <ContentSection title="Ce que l’IA ne fait pas, et ne fera pas de sitôt">
        <Prose>
          Une facture engage juridiquement celui qui l’émet. Aucune automatisation ne décide à
          votre place de ce qui est facturé, à qui, ni à quel prix — et un outil qui prétendrait
          le faire vous exposerait plus qu’il ne vous aiderait. La numérotation continue, les
          mentions obligatoires et la conservation restent des règles, pas des suggestions.
        </Prose>
        <Prose>
          Il faut également se méfier d’un raisonnement fréquent : l’IA ne remplace pas la
          conformité. Un document produit par un modèle n’est pas conforme parce qu’il a été
          produit par un modèle. Ce sont ses mentions et sa place dans la série qui le rendent
          valable.
        </Prose>
      </ContentSection>

      <ContentSection title="Comment évaluer une promesse d’IA">
        <KeyPoints
          items={[
            'Faites-vous préciser lequel des trois usages est concerné. « De l’IA » ne veut rien dire.',
            'Demandez ce qui est fait de vos données : lieu du traitement, durée de conservation, réutilisation éventuelle.',
            'Vérifiez que vous relisez avant enregistrement. Une extraction qui écrit directement en base sans relecture est un risque, pas un gain.',
            'Testez sur vos propres documents pendant l’essai, en chronométrant. Les gains annoncés proviennent des éditeurs eux-mêmes.',
            'Regardez à quelle offre la fonction appartient : une capacité mise en avant sur la page d’accueil se révèle parfois réservée au palier le plus élevé.',
          ]}
        />
      </ContentSection>

      <ContentSection title="Le choix d’INVEQ : la saisie du catalogue">
        <Prose>
          INVEQ relève du deuxième usage, et d’un seul cas dans ce deuxième usage. La corvée qui
          retarde réellement la première facture d’un artisan ou d’un indépendant n’est pas la
          rédaction du document : c’est la constitution du catalogue de prestations et de
          fournitures, ligne par ligne.
        </Prose>
        <Prose>
          Vous photographiez le produit, l’analyse prépare la fiche : nom, description, référence,
          unité, prix hors taxes, taux de TVA. Vous relisez, vous corrigez ce qui doit l’être,
          vous enregistrez. La fiche rejoint le catalogue et devient disponible sur vos devis et
          vos factures.
        </Prose>
        <Prose>
          C’est tout, et c’est volontaire. INVEQ ne lit pas les factures de vos fournisseurs, ne
          rédige pas vos relances et n’impute rien comptablement. L’assistant IA est inclus dans
          l’offre Max ; le reste du produit n’en dépend pas.
        </Prose>
      </ContentSection>

      <FaqBlock items={FAQ} />

      <RelatedLinks
        links={[
          {
            label: 'Logiciel de facturation',
            description: 'La démonstration de l’analyse, et le reste du produit.',
            href: '/logiciel-facturation',
          },
          {
            label: 'Choisir un logiciel',
            description: 'Les critères qui comptent avant les fonctionnalités.',
            href: '/guides/choisir-logiciel-facturation',
          },
          {
            label: 'Comparatif des logiciels français',
            description: 'Les cinq familles du marché, pour se situer.',
            href: '/guides/comparatif-logiciels-facturation',
          },
          {
            label: 'Tarifs',
            description: 'Ce que contient chaque offre, dont l’assistant IA.',
            href: '/tarifs',
          },
        ]}
      />

      <CtaSection />
    </>
  );
}
