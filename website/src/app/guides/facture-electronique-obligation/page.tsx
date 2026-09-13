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

const GUIDE = findGuide('facture-electronique-obligation')!;

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
    question: 'Un PDF envoyé par e-mail est-il une facture électronique ?',
    answer:
      'Non, pas au sens de la réforme. Une facture électronique associe des données structurées, lisibles par une machine, à une représentation lisible par un humain, et transite par une plateforme de dématérialisation. Un PDF classique envoyé en pièce jointe reste une facture papier dématérialisée.',
  },
  {
    question: 'Faut-il changer de logiciel ?',
    answer:
      'Pas nécessairement, mais votre outil doit pouvoir se raccorder à une plateforme de dématérialisation pour émettre et recevoir. C’est le point à vérifier auprès de votre éditeur.',
  },
  {
    question: 'Que se passe-t-il pour les factures aux particuliers ?',
    answer:
      'La réforme porte sur les échanges entre entreprises assujetties à la TVA en France. Les factures adressées à des particuliers ne relèvent pas de cette obligation de transmission entre plateformes.',
  },
  {
    question: 'Comment INVEQ se raccorde-t-il ?',
    answer:
      'INVEQ se connecte à SUPER PDP, une plateforme de dématérialisation. Depuis les réglages de l’application, la connexion s’établit pour l’entreprise active ; l’envoi d’une facture et le suivi de son statut se font ensuite depuis le document.',
  },
];

/**
 * Guide sur l'obligation de facturation électronique.
 *
 * Le calendrier cité est celui de la réforme française telle qu'elle est
 * publiée. Aucune certification ni aucun agrément n'est attribué à INVEQ :
 * l'application se raccorde à une plateforme, elle n'en est pas une.
 */
export default function FactureElectroniqueObligationPage() {
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
        subtitle="Toutes les entreprises sont concernées, mais pas au même moment ni pour la même chose."
        title={GUIDE.title}
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Accueil', path: '/' },
            { name: 'Guides', path: '/guides' },
            { name: 'Obligation de facture électronique', path: `/guides/${GUIDE.slug}` },
          ]}
        />
      </div>

      <ContentSection title="Recevoir et émettre ne sont pas soumis au même calendrier">
        <Prose>
          C’est la distinction la plus utile à retenir. L’obligation de{' '}
          <span className="font-medium text-foreground">recevoir</span> des factures électroniques
          s’applique à toutes les entreprises en même temps, dès septembre 2026, quelle que soit
          leur taille. L’obligation d’
          <span className="font-medium text-foreground">émettre</span>, elle, arrive par vagues.
        </Prose>
        <KeyPoints
          items={[
            'Septembre 2026 : toutes les entreprises doivent être en mesure de recevoir une facture électronique.',
            'Septembre 2026 : les grandes entreprises et les entreprises de taille intermédiaire doivent également émettre.',
            'Septembre 2027 : les PME et les microentreprises doivent émettre à leur tour.',
          ]}
        />
        <Prose>
          Autrement dit, une microentreprise qui ne facture que des particuliers devra tout de même
          pouvoir recevoir les factures de ses fournisseurs professionnels dès la première échéance.
        </Prose>
      </ContentSection>

      <ContentSection title="Ce qu’est réellement une facture électronique">
        <Prose>
          Le terme prête à confusion. Il ne s’agit pas d’un PDF envoyé par e-mail, mais d’un
          document comportant des données structurées exploitables automatiquement, accompagnées
          d’une représentation lisible. Ce document ne circule plus directement d’une entreprise à
          l’autre : il transite par une plateforme de dématérialisation.
        </Prose>
      </ContentSection>

      <ContentSection title="Le rôle de la plateforme">
        <Prose>
          La plateforme reçoit la facture de l’émetteur, la transmet à la plateforme du
          destinataire et remonte les statuts du cycle de vie — dépôt, réception, rejet
          éventuel. C’est elle qui porte le raccordement à l’écosystème, pas votre logiciel de
          facturation.
        </Prose>
        <Prose>
          Le logiciel, lui, doit savoir dialoguer avec une plateforme. INVEQ se raccorde à SUPER PDP
          : la connexion s’établit depuis les réglages de l’entreprise, puis l’envoi et le suivi
          se font depuis la facture elle-même.
        </Prose>
      </ContentSection>

      <ContentSection title="Ce qu’il faut préparer">
        <KeyPoints
          items={[
            'Vérifier que les données d’identification de votre entreprise sont complètes et exactes — SIREN, adresse, numéro de TVA.',
            'S’assurer que les fiches de vos clients professionnels portent leurs identifiants.',
            'Confirmer auprès de votre éditeur que l’outil se raccordera à une plateforme.',
            'Ne pas attendre la dernière échéance : la réception concerne tout le monde dès 2026.',
          ]}
        />
      </ContentSection>

      <FaqBlock items={FAQ} />

      <RelatedLinks
        links={[
          {
            label: 'Facturation électronique avec INVEQ',
            description: 'Le raccordement à SUPER PDP, étape par étape.',
            href: '/facturation-electronique',
          },
          {
            label: 'Plateforme agréée (ex-PDP)',
            description: 'Ce qu’elle fait d’une facture, et comment en choisir une.',
            href: '/guides/plateforme-agreee-pdp',
          },
          {
            label: 'Logiciel de facturation',
            description: 'Le périmètre du produit.',
            href: '/logiciel-facturation',
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
