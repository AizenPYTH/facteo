import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';
import { createTemplateVariant, type TemplateVariantSpec } from '@/lib/pdf/engine/templates/variants';

type CatalogEntry = TemplateVariantSpec & { base: string };

/**
 * Variantes des modèles : même ossature qu'un modèle existant, mais couleurs,
 * polices et vocabulaire différents. Chaque entrée change au moins deux de ces
 * trois axes pour rester reconnaissable comme un modèle à part.
 */
const VARIANTS: CatalogEntry[] = [
  { base: '25', id: '43', name: 'Émeraude', description: 'Facture en ligne, montant dû en grand, vert émeraude.', category: 'tech', vocabulary: 'corporate', colors: { '#635BFF': '#0F9D6E' }, fonts: { workSans: 'manrope' } },
  { base: '25', id: '44', name: 'Paiement', description: 'Style plateforme de paiement, orange vif et Space Grotesk.', category: 'commerce', vocabulary: 'friendly', colors: { '#635BFF': '#E8590C' }, fonts: { workSans: 'grotesk' } },
  { base: '26', id: '45', name: 'Gazette', description: 'Magazine bleu encre, titre DM Serif et lettrine.', category: 'creatif', vocabulary: 'studio', colors: { '#C8102E': '#1D4ED8' }, fonts: { playfair: 'dmSerif', sourceSerif: 'lora' } },
  { base: '26', id: '46', name: 'Revue', description: 'Revue culturelle verte, Fraunces et Plus Jakarta.', category: 'elegant', vocabulary: 'classic', colors: { '#C8102E': '#0B7A4B' }, fonts: { playfair: 'fraunces', workSans: 'jakarta' } },
  { base: '28', id: '47', name: 'Affiche', description: 'Affiche brutaliste rose, capitales Oswald.', category: 'creatif', vocabulary: 'friendly', colors: { '#E6FF3D': '#FF5C8A' }, fonts: { bebas: 'oswald', grotesk: 'archivo' } },
  { base: '28', id: '48', name: 'Bloc', description: 'Blocs noirs et cyan électrique, titres Syne.', category: 'tech', vocabulary: 'studio', colors: { '#E6FF3D': '#3DDCFF' }, fonts: { bebas: 'syne' } },
  { base: '29', id: '49', name: 'Jardin', description: 'Esprit zen, sceau vert sapin et Lora.', category: 'elegant', vocabulary: 'formal', colors: { '#B23A2E': '#2F5D50' }, fonts: { cormorant: 'lora' } },
  { base: '29', id: '50', name: 'Encre', description: 'Beaucoup de vide, sceau bleu nuit, Baskerville.', category: 'minimal', vocabulary: 'minimal', colors: { '#B23A2E': '#1E3A8A', '#FBF9F4': '#F6F8FB' }, fonts: { cormorant: 'baskerville' } },
  { base: '22', id: '51', name: 'Courrier d’affaires', description: 'Lettre à fenêtre sobre, papier blanc, Baskerville.', category: 'classique', vocabulary: 'corporate', colors: { '#FFFDF9': '#FFFFFF' }, fonts: { lora: 'baskerville' } },
  { base: '22', id: '52', name: 'Lettre d’artisan', description: 'Lettre chaleureuse signée à la main, Source Serif.', category: 'artisan', vocabulary: 'craft', colors: { '#FFFDF9': '#FBF6EC' }, fonts: { lora: 'sourceSerif' } },
  { base: '27', id: '53', name: 'Télex', description: 'Machine à écrire bleue, Space Mono.', category: 'classique', vocabulary: 'ledger', colors: { '#9C2B23': '#1F4E8C', '#F7F3EA': '#F4F6F8' }, fonts: { courier: 'spaceMono' } },
  { base: '24', id: '54', name: 'Cahier', description: 'Cahier d’écolier, encre verte et marge bleue.', category: 'artisan', vocabulary: 'friendly', colors: { '#1D3A8A': '#0B6E4F', '#E88A8A': '#8AB4E8' } },
  { base: '21', id: '55', name: 'Caisse', description: 'Ticket de caisse en Courier.', category: 'commerce', vocabulary: 'craft', fonts: { spaceMono: 'courier' } },
  { base: '21', id: '56', name: 'Reçu', description: 'Reçu étroit en IBM Plex Mono.', category: 'tech', vocabulary: 'studio', fonts: { spaceMono: 'plexMono' } },
  { base: '23', id: '57', name: 'Cerfa', description: 'Formulaire administratif à cases, fond bleuté.', category: 'classique', vocabulary: 'corporate', colors: { '#F2F2EE': '#EAF2FB' }, fonts: { plexSans: 'archivo', plexMono: 'spaceMono' } },
  { base: '30', id: '58', name: 'Registre', description: 'Registre comptable sépia, bandes beiges.', category: 'classique', vocabulary: 'classic', colors: { '#2E7D4F': '#8A5A2B', '#E3F0E3': '#F3E9DA', '#7FA88A': '#C2A57E', '#1E2B22': '#2B2118' }, fonts: { plexSans: 'sourceSerif' } },
  { base: '30', id: '59', name: 'Listing', description: 'Listing informatique à bandes bleues.', category: 'tech', vocabulary: 'ledger', colors: { '#2E7D4F': '#2F5D9E', '#E3F0E3': '#E3ECF7', '#7FA88A': '#7E9CC2', '#1E2B22': '#1B2536' }, fonts: { spaceMono: 'plexMono' } },
  { base: '31', id: '60', name: 'Atelier', description: 'Chantier orange, capitales Bebas.', category: 'artisan', vocabulary: 'craft', colors: { '#F5C400': '#FF7A00' }, fonts: { oswald: 'bebas' } },
  { base: '31', id: '61', name: 'Paysage', description: 'Espaces verts et jardinage, bandeau vert.', category: 'artisan', vocabulary: 'classic', colors: { '#F5C400': '#3CB371' }, fonts: { workSans: 'manrope' } },
  { base: '32', id: '62', name: 'Concept store', description: 'Récapitulatif de commande violet, titres Fraunces.', category: 'commerce', vocabulary: 'retail', colors: { '#E0563B': '#7C3AED' }, fonts: { syne: 'fraunces' } },
  { base: '32', id: '63', name: 'Épicerie', description: 'Épicerie fine, vert sauge et DM Serif.', category: 'commerce', vocabulary: 'friendly', colors: { '#E0563B': '#0E9F6E', '#F6F3EF': '#EEF5EF' }, fonts: { syne: 'dmSerif', manrope: 'jakarta' } },
  { base: '02', id: '64', name: 'Marine', description: 'En-tête bleu marine, Plus Jakarta Sans.', category: 'classique', vocabulary: 'corporate', colors: { '#101014': '#0F2A4A', '#14141A': '#13304F' }, fonts: { archivo: 'jakarta' } },
  { base: '02', id: '65', name: 'Bordeaux', description: 'En-tête bordeaux, titres Playfair.', category: 'elegant', vocabulary: 'formal', colors: { '#101014': '#3B0D1A', '#14141A': '#43101F' }, fonts: { archivo: 'playfair' } },
  { base: '03', id: '66', name: 'Notaire', description: 'Classique vert profond, Source Serif.', category: 'classique', vocabulary: 'formal', colors: { '#123A6B': '#1F5C3A' }, fonts: { plexSans: 'sourceSerif' } },
  { base: '03', id: '67', name: 'Cabinet', description: 'Cabinet de conseil, bordeaux et Manrope.', category: 'classique', vocabulary: 'corporate', colors: { '#123A6B': '#6B1F2A' }, fonts: { plexSans: 'manrope' } },
  { base: '04', id: '68', name: 'Lagon', description: 'Moderne turquoise, Space Grotesk.', category: 'tech', vocabulary: 'studio', colors: { '#4F46E5': '#0E7C86', '#ECEAFB': '#E3F4F5', '#F3F1FD': '#EEF8F9', '#FBFAFF': '#F8FCFC' }, fonts: { manrope: 'grotesk' } },
  { base: '04', id: '69', name: 'Terracotta', description: 'Moderne terre cuite, en Lora.', category: 'creatif', vocabulary: 'friendly', colors: { '#4F46E5': '#C2410C', '#ECEAFB': '#FBE9DF', '#F3F1FD': '#FDF3EC', '#FBFAFF': '#FFFBF8' }, fonts: { manrope: 'lora' } },
  { base: '06', id: '70', name: 'Bauhaus', description: 'Grille suisse bleue, Space Grotesk.', category: 'moderne', vocabulary: 'minimal', colors: { '#D4261E': '#1D4ED8' }, fonts: { archivo: 'grotesk' } },
  { base: '06', id: '71', name: 'Grille verte', description: 'Grille suisse verte, Work Sans.', category: 'moderne', vocabulary: 'classic', colors: { '#D4261E': '#0B7A4B' }, fonts: { archivo: 'workSans' } },
  { base: '07', id: '72', name: 'Platine', description: 'Luxe argenté, Cormorant.', category: 'elegant', vocabulary: 'formal', colors: { '#C6A961': '#8C96A3', '#FAF7F1': '#F7F8FA' }, fonts: { baskerville: 'cormorant' } },
  { base: '07', id: '73', name: 'Boudoir', description: 'Luxe or rose, titres Playfair.', category: 'elegant', vocabulary: 'friendly', colors: { '#C6A961': '#B76E79', '#FAF7F1': '#FCF6F5' }, fonts: { baskerville: 'playfair' } },
  { base: '08', id: '74', name: 'Terminal', description: 'Technique violet, Space Mono.', category: 'tech', vocabulary: 'studio', colors: { '#0E8F82': '#7C3AED' }, fonts: { plexMono: 'spaceMono' } },
  { base: '09', id: '75', name: 'Pop', description: 'Startup framboise, Plus Jakarta Sans.', category: 'moderne', vocabulary: 'friendly', colors: { '#0B7A4B': '#E11D48', '#F3F8F5': '#FDF2F4', '#E6EDEA': '#F6E3E7' }, fonts: { grotesk: 'jakarta' } },
  { base: '10', id: '76', name: 'Galerie', description: 'Serif élégant Fraunces, texte Work Sans.', category: 'elegant', vocabulary: 'studio', fonts: { sourceSerif: 'fraunces', plexSans: 'workSans' } },
  { base: '11', id: '77', name: 'Manifeste', description: 'Typographie massive en Oswald.', category: 'creatif', vocabulary: 'studio', fonts: { archivo: 'oswald' } },
  { base: '14', id: '78', name: 'Métal', description: 'Industriel bleu acier, Oswald.', category: 'artisan', vocabulary: 'craft', colors: { '#C2621B': '#2563EB' }, fonts: { archivo: 'oswald' } },
  { base: '15', id: '79', name: 'Lagune', description: 'Studio créatif bleu ciel, en Manrope.', category: 'creatif', vocabulary: 'friendly', colors: { '#E8574C': '#0EA5E9' }, fonts: { grotesk: 'manrope' } },
  { base: '17', id: '80', name: 'Prune', description: 'En-tête prune, Fraunces.', category: 'elegant', vocabulary: 'classic', colors: { '#1B2027': '#2D1B3D', '#2A3340': '#3D2851' }, fonts: { jakarta: 'fraunces' } },
  { base: '18', id: '81', name: 'Marché', description: 'Bande latérale verte, Work Sans.', category: 'commerce', vocabulary: 'retail', colors: { '#1D6FD1': '#16A34A' }, fonts: { manrope: 'workSans' } },
  { base: '13', id: '82', name: 'Tradition', description: 'Professionnel classique en Lora.', category: 'classique', vocabulary: 'classic', fonts: { plexSans: 'lora' } },
];

/** Construit les variantes à partir des modèles de base déjà enregistrés. */
export function buildTemplateVariants(bases: PdfTemplateDefinition[]): PdfTemplateDefinition[] {
  const byId = new Map(bases.map((template) => [template.id, template]));

  return VARIANTS.flatMap(({ base, ...spec }) => {
    const template = byId.get(base);
    return template ? [createTemplateVariant(template, spec)] : [];
  });
}
