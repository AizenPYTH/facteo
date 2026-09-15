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
import { DEFAULT_PDF_TEMPLATE_ID, type PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

/** Bibliothèque de modèles de document, dans l'ordre de la galerie. */
export const PDF_TEMPLATES: PdfTemplateDefinition[] = [
  template01,
  template02,
  template03,
  template04,
  template05,
  template06,
  template07,
  template08,
  template09,
  template10,
  template11,
  template12,
  template13,
  template14,
  template15,
  template16,
  template17,
  template18,
  template19,
  template20,
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
