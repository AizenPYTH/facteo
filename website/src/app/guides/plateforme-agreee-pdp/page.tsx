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

const GUIDE = findGuide('plateforme-agreee-pdp')!;

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
    question: 'PDP et plateforme agréée, est-ce la même chose ?',
    answer:
      'Oui. « Plateforme de dématérialisation partenaire », abrégé en PDP, était la dénomination d’origine ; « plateforme agréée » est le terme retenu depuis. Les deux désignent le même objet, et l’ancien sigle reste très employé dans la documentation des éditeurs.',
  },
  {
    question: 'Mon logiciel de facturation est-il une plateforme agréée ?',
    answer:
      'Le plus souvent non, et ce n’est pas un défaut. Être plateforme agréée suppose une immatriculation auprès de l’administration fiscale et des obligations propres. La plupart des logiciels de facturation se raccordent à une plateforme plutôt que d’en être une. Ce qui compte pour vous, c’est que le raccordement existe.',
  },
  {
    question: 'Dois-je choisir ma plateforme moi-même ?',
    answer:
      'Cela dépend de votre outil. Certains éditeurs vous laissent apporter la plateforme de votre choix, d’autres en intègrent une et s’en occupent. Dans le second cas, la question devient : laquelle, et que se passe-t-il si j’en change.',
  },
  {
    question: 'Comment vérifier qu’une plateforme est bien agréée ?',
    answer:
      'L’administration fiscale publie la liste des plateformes immatriculées et la met à jour. C’est la seule source à considérer : une mention « conforme » ou « agréé » sur un site commercial ne vaut pas immatriculation. En cas de doute, vérifiez le nom de l’opérateur dans la liste officielle.',
  },
];

/**
 * Guide sur les plateformes agréées.
 *
 * La requête est occupée par des pages d'éditeurs qui sont eux-mêmes
 * plateformes, et qui décrivent donc le rôle en se décrivant. L'angle utile
 * pour un artisan ou un indépendant est l'inverse : il ne choisira pas une
 * plateforme, il choisira un logiciel qui en utilise une. Le guide est écrit
 * de ce point de vue.
 *
 * Aucun nombre de plateformes immatriculées n'est cité : la liste évolue, et
 * un chiffre daté sur ce sujet vieillirait mal. On renvoie au principe — la
 * liste officielle fait foi.
 */
export default function PlateformeAgreeePage() {
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
        subtitle="Vous n’aurez probablement jamais à en utiliser une directement. Mais votre logiciel, lui, devra en passer par là."
        title={GUIDE.title}
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Accueil', path: '/' },
            { name: 'Guides', path: '/guides' },
            { name: 'Plateforme agréée', path: `/guides/${GUIDE.slug}` },
          ]}
        />
      </div>

      <ContentSection title="Pourquoi le vocabulaire a changé">
        <Prose>
          La réforme a d’abord parlé de{' '}
          <span className="font-medium text-foreground">
            plateformes de dématérialisation partenaires
          </span>
          , d’où le sigle PDP, omniprésent dans la documentation des éditeurs. Le terme retenu
          depuis est{' '}
          <span className="font-medium text-foreground">plateforme agréée</span>. Les deux
          désignent la même chose ; si vous croisez les deux mots, ce n’est pas que vous avez
          manqué une étape.
        </Prose>
      </ContentSection>

      <ContentSection title="Ce qu’une plateforme fait d’une facture">
        <Prose>
          Une plateforme agréée est un opérateur immatriculé par l’administration fiscale, chargé
          de faire circuler les factures électroniques entre entreprises. Elle occupe la place que
          tenait autrefois la pièce jointe d’un e-mail — mais avec des obligations que l’e-mail
          n’avait pas.
        </Prose>
        <KeyPoints
          items={[
            'Elle reçoit la facture émise par votre logiciel, dans un format structuré normalisé.',
            'Elle en contrôle la conformité avant transmission.',
            'Elle l’achemine vers la plateforme du destinataire, qui la lui remet.',
            'Elle remonte les statuts du cycle de vie : dépôt, réception, rejet éventuel.',
            'Elle transmet à l’administration les données de transaction attendues.',
          ]}
        />
        <Prose>
          Ce dernier point est celui qu’on oublie le plus souvent : la réforme ne sert pas qu’à
          moderniser les échanges, elle sert aussi à donner à l’administration une vision des
          transactions. C’est ce qu’on appelle l’e-reporting, à distinguer de la circulation des
          factures elle-même.
        </Prose>
      </ContentSection>

      <ContentSection title="E-invoicing et e-reporting : deux obligations distinctes">
        <Prose>
          L’<span className="font-medium text-foreground">e-invoicing</span> concerne la facture
          en tant que document : son émission, sa transmission et sa réception entre entreprises
          assujetties à la TVA établies en France. Il y a un destinataire, et il reçoit quelque
          chose.
        </Prose>
        <Prose>
          L’<span className="font-medium text-foreground">e-reporting</span> ne transmet aucun
          document à personne : il communique à l’administration des données relatives à des
          transactions qui échappent au circuit précédent — typiquement les ventes aux
          particuliers et les opérations internationales. Une activité qui ne facture que des
          particuliers n’est pas concernée par l’e-invoicing pour ses ventes, mais peut l’être par
          l’e-reporting.
        </Prose>
      </ContentSection>

      <ContentSection title="Ce qu’il faut vérifier, et dans quel ordre">
        <KeyPoints
          items={[
            'Que votre logiciel de facturation se raccorde effectivement à une plateforme agréée — c’est la seule question qui vous engage.',
            'Que l’opérateur figure bien dans la liste publiée par l’administration fiscale, et non seulement qu’il s’en réclame.',
            'Que la réception est couverte autant que l’émission : la première échéance porte sur la réception, et elle concerne tout le monde.',
            'Que vos données d’identification et celles de vos clients professionnels sont complètes — un SIREN manquant bloque une transmission.',
            'Ce qu’il advient de vos factures si vous quittez l’outil ou si la plateforme change.',
          ]}
        />
      </ContentSection>

      <ContentSection title="Comment INVEQ se situe">
        <Prose>
          INVEQ n’est pas une plateforme agréée, et ne prétend pas l’être : c’est un logiciel de
          facturation qui se raccorde à une plateforme agréée, SUPER PDP. La connexion s’établit
          depuis les réglages de l’entreprise ; l’envoi d’une facture et le suivi de son statut se
          font ensuite depuis le document lui-même.
        </Prose>
        <Prose>
          Le partage des rôles est celui décrit plus haut : INVEQ prépare la facture au format
          attendu et la remet à la plateforme ; l’acheminement, les contrôles et les statuts
          relèvent de la plateforme.
        </Prose>
      </ContentSection>

      <FaqBlock items={FAQ} />

      <RelatedLinks
        links={[
          {
            label: 'Facturation électronique avec INVEQ',
            description: 'Le raccordement en pratique, étape par étape.',
            href: '/facturation-electronique',
          },
          {
            label: 'L’obligation de facture électronique',
            description: 'Qui est concerné, et à partir de quand.',
            href: '/guides/facture-electronique-obligation',
          },
          {
            label: 'Mentions obligatoires',
            description: 'Les données qui doivent figurer sur chaque facture.',
            href: '/guides/mentions-obligatoires-facture',
          },
          {
            label: 'Choisir un logiciel',
            description: 'Les critères à vérifier avant de s’engager.',
            href: '/guides/choisir-logiciel-facturation',
          },
        ]}
      />

      <CtaSection />
    </>
  );
}
