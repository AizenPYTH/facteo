import type { Metadata } from 'next';

import { CapabilitiesSection } from '@/components/sections/home/capabilities';
import { WorkflowSection } from '@/components/sections/home/workflow';
import { CtaSection, PageHero, PricingSection } from '@/components/sections/landing-sections';
import {
  Breadcrumbs,
  ContentSection,
  FaqBlock,
  KeyPoints,
  Prose,
  RelatedLinks,
} from '@/components/seo/seo-blocks';
import { SITE_URL } from '@/lib/constants';
import { jsonLd, softwareApplicationSchema } from '@/lib/seo/schema';

export const metadata: Metadata = {
  title: 'Logiciel de facturation pour artisans, indépendants et TPE',
  description:
    'Créez vos factures et vos devis, suivez vos encaissements et préparez la facturation électronique. Logiciel français, offre gratuite, application iOS et web.',
  alternates: { canonical: `${SITE_URL}/logiciel-facturation` },
  openGraph: {
    title: 'Logiciel de facturation pour artisans, indépendants et TPE',
    description:
      'Devis, factures, relances et facturation électronique. Offre gratuite, application iOS et web.',
    url: `${SITE_URL}/logiciel-facturation`,
  },
};

const FAQ = [
  {
    question: 'Qu’est-ce qu’un logiciel de facturation ?',
    answer:
      'C’est un outil qui remplace le tableur et le traitement de texte pour émettre vos documents commerciaux. Il tient la numérotation, applique les mentions légales, calcule la TVA et conserve l’historique de ce qui a été envoyé, accepté et payé.',
  },
  {
    question: 'INVEQ est-il vraiment gratuit ?',
    answer:
      'L’offre Micro est à 0 € et sans limite de durée. Les offres payantes débloquent des volumes plus élevés et des fonctions avancées : le détail figure sur la page Tarifs.',
  },
  {
    question: 'Faut-il des compétences en comptabilité ?',
    answer:
      'Non. INVEQ couvre l’émission des devis et des factures et le suivi des règlements, pas la tenue comptable. Vos documents restent exportables en PDF pour votre comptable.',
  },
  {
    question: 'Mes données sont-elles conservées en sécurité ?',
    answer:
      'Les données sont hébergées sur une infrastructure cloud gérée (Supabase), avec chiffrement en transit et sauvegardes. Vous restez propriétaire de vos documents et pouvez les exporter en PDF à tout moment.',
  },
  {
    question: 'Puis-je utiliser INVEQ sur mobile ?',
    answer:
      'Oui, une application iOS est disponible sur l’App Store, en plus de l’interface web sur ordinateur. La version Android est en préparation.',
  },
];

/**
 * Page produit ciblant l'intention « logiciel de facturation ».
 *
 * Elle réutilise les sections produit de l'accueil — parcours d'un document,
 * capacités, tarifs — plutôt que d'en paraphraser le contenu : deux pages qui
 * décriraient la même chose avec des mots différents se concurrenceraient dans
 * les résultats sans mieux répondre à personne.
 *
 * Ce qui lui est propre, c'est le cadrage : ce qu'est un logiciel de
 * facturation, à qui il s'adresse, et ce qu'INVEQ fait réellement.
 */
export default function LogicielFacturationPage() {
  return (
    <>
      <script
        dangerouslySetInnerHTML={jsonLd(softwareApplicationSchema())}
        type="application/ld+json"
      />

      <PageHero
        eyebrow="Logiciel de facturation"
        subtitle="Émettez vos devis et vos factures, suivez vos encaissements et préparez la facturation électronique — depuis votre ordinateur ou votre iPhone."
        title="Le logiciel de facturation des indépendants et des TPE"
      />

      <div className="mx-auto max-w-3xl px-5 pt-10 sm:px-6">
        <Breadcrumbs
          items={[
            { name: 'Accueil', path: '/' },
            { name: 'Logiciel de facturation', path: '/logiciel-facturation' },
          ]}
        />
      </div>

      <ContentSection title="À quoi sert un logiciel de facturation">
        <Prose>
          Une facture n’est pas un simple document : elle engage juridiquement, doit porter des
          mentions obligatoires, s’inscrire dans une numérotation continue et rester conservée.
          Le tableur y arrive un temps, jusqu’au jour où une facture porte deux fois le même
          numéro, où un devis accepté n’est jamais facturé, ou bien où un règlement passe
          inaperçu pendant trois mois.
        </Prose>
        <Prose>
          Un logiciel de facturation prend en charge cette mécanique : il tient la numérotation,
          reprend automatiquement les coordonnées du client, calcule la TVA ligne par ligne et
          conserve l’historique de ce qui a été envoyé, accepté et encaissé.
        </Prose>
      </ContentSection>

      <ContentSection
        lead="INVEQ est conçu pour ceux qui facturent entre deux chantiers ou deux rendez-vous, pas pour un service comptable."
        title="À qui INVEQ s’adresse">
        <KeyPoints
          items={[
            'Artisans du bâtiment : devis chiffrés sur place, signature du client, facture à l’avancement.',
            'Indépendants et freelances : prestations récurrentes issues du catalogue, relances des impayés.',
            'TPE et petites structures : plusieurs entreprises depuis un seul compte, numérotation propre à chacune.',
          ]}
        />
        <Prose>
          Les besoins d’une TPE de cinq personnes et d’un auto-entrepreneur diffèrent surtout par
          le volume, rarement par la nature. INVEQ propose donc le même produit, avec des paliers
          d’usage : c’est l’offre qui change, pas l’outil.
        </Prose>
      </ContentSection>

      <WorkflowSection />
      <CapabilitiesSection />

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
            label: 'Devis et factures',
            description: 'Le parcours complet, du chiffrage au règlement.',
            href: '/logiciel-devis-facture',
          },
          {
            label: 'Facturation électronique',
            description: 'L’échéance, les obligations et le rôle de la plateforme agréée.',
            href: '/facturation-electronique',
          },
          {
            label: 'Auto-entrepreneurs',
            description: 'Franchise en base, mentions à porter, facturation au forfait.',
            href: '/facturation-auto-entrepreneur',
          },
          {
            label: 'Choisir son logiciel',
            description: 'Les critères qui comptent vraiment avant de s’équiper.',
            href: '/guides/choisir-logiciel-facturation',
          },
        ]}
      />

      <CtaSection />
    </>
  );
}
