import { template01 } from '@/lib/pdf/engine/templates/designs/01-minimal-white';
import { template02 } from '@/lib/pdf/engine/templates/designs/02-premium-black';
import { template03 } from '@/lib/pdf/engine/templates/designs/03-corporate-blue';
import { template04 } from '@/lib/pdf/engine/templates/designs/04-modern-purple';
import { template05 } from '@/lib/pdf/engine/templates/designs/05-editorial';
import { template06 } from '@/lib/pdf/engine/templates/designs/06-swiss-grid';
import { template07 } from '@/lib/pdf/engine/templates/designs/07-luxury';
import { template08 } from '@/lib/pdf/engine/templates/designs/08-tech';
import { template09 } from '@/lib/pdf/engine/templates/designs/09-startup';
import { template10 } from '@/lib/pdf/engine/templates/designs/10-elegant-serif';
import { template11 } from '@/lib/pdf/engine/templates/designs/11-bold-typography';
import { template12 } from '@/lib/pdf/engine/templates/designs/12-soft-rounded';
import { template13 } from '@/lib/pdf/engine/templates/designs/13-professional-business';
import { template14 } from '@/lib/pdf/engine/templates/designs/14-industrial';
import { template15 } from '@/lib/pdf/engine/templates/designs/15-creative-studio';
import { template16 } from '@/lib/pdf/engine/templates/designs/16-clean-accounting';
import { template17 } from '@/lib/pdf/engine/templates/designs/17-dark-header';
import { template18 } from '@/lib/pdf/engine/templates/designs/18-side-accent';
import { template19 } from '@/lib/pdf/engine/templates/designs/19-full-width-modern';
import { template20 } from '@/lib/pdf/engine/templates/designs/20-ultra-minimal';
import { template21 } from '@/lib/pdf/engine/templates/designs/21-receipt';
import { template22 } from '@/lib/pdf/engine/templates/designs/22-letter';
import { template23 } from '@/lib/pdf/engine/templates/designs/23-form';
import { template24 } from '@/lib/pdf/engine/templates/designs/24-notebook';
import { template25 } from '@/lib/pdf/engine/templates/designs/25-saas';
import { template26 } from '@/lib/pdf/engine/templates/designs/26-magazine';
import { template27 } from '@/lib/pdf/engine/templates/designs/27-typewriter';
import { template28 } from '@/lib/pdf/engine/templates/designs/28-brutalist';
import { template29 } from '@/lib/pdf/engine/templates/designs/29-zen';
import { template30 } from '@/lib/pdf/engine/templates/designs/30-ledger';
import { template31 } from '@/lib/pdf/engine/templates/designs/31-worksite';
import { template32 } from '@/lib/pdf/engine/templates/designs/32-shop';
import { DEFAULT_PDF_TEMPLATE_ID, type PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

/**
 * Registre de langue et famille des 20 premiers modèles. Le vocabulaire varie
 * d'un modèle à l'autre pour qu'aucune facture ne « sente » le même logiciel.
 */
const LEGACY_STYLE: Record<string, Pick<PdfTemplateDefinition, 'vocabulary' | 'category'>> = {
  '01': { vocabulary: 'minimal', category: 'minimal' },
  '02': { vocabulary: 'studio', category: 'elegant' },
  '03': { vocabulary: 'corporate', category: 'classique' },
  '04': { vocabulary: 'classic', category: 'moderne' },
  '05': { vocabulary: 'friendly', category: 'creatif' },
  '06': { vocabulary: 'studio', category: 'creatif' },
  '07': { vocabulary: 'formal', category: 'elegant' },
  '08': { vocabulary: 'minimal', category: 'tech' },
  '09': { vocabulary: 'friendly', category: 'tech' },
  '10': { vocabulary: 'formal', category: 'elegant' },
  '11': { vocabulary: 'studio', category: 'creatif' },
  '12': { vocabulary: 'friendly', category: 'moderne' },
  '13': { vocabulary: 'corporate', category: 'classique' },
  '14': { vocabulary: 'craft', category: 'artisan' },
  '15': { vocabulary: 'studio', category: 'creatif' },
  '16': { vocabulary: 'ledger', category: 'classique' },
  '17': { vocabulary: 'corporate', category: 'moderne' },
  '18': { vocabulary: 'retail', category: 'commerce' },
  '19': { vocabulary: 'retail', category: 'commerce' },
  '20': { vocabulary: 'minimal', category: 'minimal' },
};

/** Bibliothèque de modèles de document, dans l'ordre de la galerie. */
export const PDF_TEMPLATES: PdfTemplateDefinition[] = [
  { ...template01, ...LEGACY_STYLE[template01.id] },
  { ...template02, ...LEGACY_STYLE[template02.id] },
  { ...template03, ...LEGACY_STYLE[template03.id] },
  { ...template04, ...LEGACY_STYLE[template04.id] },
  { ...template05, ...LEGACY_STYLE[template05.id] },
  { ...template06, ...LEGACY_STYLE[template06.id] },
  { ...template07, ...LEGACY_STYLE[template07.id] },
  { ...template08, ...LEGACY_STYLE[template08.id] },
  { ...template09, ...LEGACY_STYLE[template09.id] },
  { ...template10, ...LEGACY_STYLE[template10.id] },
  { ...template11, ...LEGACY_STYLE[template11.id] },
  { ...template12, ...LEGACY_STYLE[template12.id] },
  { ...template13, ...LEGACY_STYLE[template13.id] },
  { ...template14, ...LEGACY_STYLE[template14.id] },
  { ...template15, ...LEGACY_STYLE[template15.id] },
  { ...template16, ...LEGACY_STYLE[template16.id] },
  { ...template17, ...LEGACY_STYLE[template17.id] },
  { ...template18, ...LEGACY_STYLE[template18.id] },
  { ...template19, ...LEGACY_STYLE[template19.id] },
  { ...template20, ...LEGACY_STYLE[template20.id] },
  template21,
  template22,
  template23,
  template24,
  template25,
  template26,
  template27,
  template28,
  template29,
  template30,
  template31,
  template32,
];

export const PDF_TEMPLATE_MAP = new Map(PDF_TEMPLATES.map((template) => [template.id, template]));

/**
 * Identifiants de l'ancienne bibliothèque, encore présents dans
 * `settings.invoice_template_id` tant que la migration n'a pas tourné, ou dans
 * un cache local. On les fait pointer vers le modèle le plus proche plutôt que
 * de renvoyer tout le monde sur le modèle par défaut.
 */
const LEGACY_TEMPLATE_IDS: Record<string, string> = {
  'classic-blue': '03',
  'pennylane-clean': '09',
  'indy-modern': '04',
  'henrri-minimal': '01',
  'quickbooks-pro': '13',
  'stripe-sleek': '12',
  'freebe-fresh': '09',
  'navy-corporate': '03',
  'emerald-finance': '09',
  'slate-professional': '17',
  'warm-amber': '14',
  'rose-elegant': '15',
  'teal-modern': '08',
  'charcoal-bold': '11',
  'sky-open': '18',
  'purple-creative': '04',
  'coral-vibrant': '15',
  'forest-organic': '09',
  'midnight-premium': '02',
  'sandstone-classic': '07',
  'graphite-tech': '08',
};

export function resolvePdfTemplate(templateId?: string | null): PdfTemplateDefinition {
  if (templateId) {
    const direct = PDF_TEMPLATE_MAP.get(templateId);

    if (direct) {
      return direct;
    }

    const migrated = LEGACY_TEMPLATE_IDS[templateId];

    if (migrated) {
      return PDF_TEMPLATE_MAP.get(migrated) ?? PDF_TEMPLATE_MAP.get(DEFAULT_PDF_TEMPLATE_ID)!;
    }
  }

  return PDF_TEMPLATE_MAP.get(DEFAULT_PDF_TEMPLATE_ID)!;
}

export { LEGACY_TEMPLATE_IDS };
