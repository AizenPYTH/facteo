import type { Metadata } from 'next';

import { CapabilitiesSection } from '@/components/sections/home/capabilities';
import { WorkflowSection } from '@/components/sections/home/workflow';
import { CtaSection, MobileSection, PageHero } from '@/components/sections/landing-sections';

export const metadata: Metadata = {
  title: 'Fonctionnalités',
  description:
    'Devis, factures, clients, catalogue, signature et suivi des encaissements. Découvrez comment INVEQ accompagne un document du premier chiffrage au règlement.',
};

/**
 * La page se contentait d'une grille d'icônes en huit cartes de même poids.
 * Elle reprend maintenant les sections produit de l'accueil : le parcours d'un
 * document, puis les capacités, montrées plutôt qu'énumérées.
 */
export default function FeaturesPage() {
  return (
    <>
      <PageHero
        eyebrow="Le produit"
        subtitle="Tout ce qu’il faut pour chiffrer, facturer et être payé — sans logiciel comptable à apprendre."
        title="Vos devis et vos factures, de bout en bout"
      />
      <WorkflowSection />
      <CapabilitiesSection />
      <MobileSection />
      <CtaSection />
    </>
  );
}
