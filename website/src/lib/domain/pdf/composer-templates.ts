import { PDF_TEMPLATES, resolvePdfTemplate } from '@/lib/pdf/engine/templates';
import {
  DEFAULT_PDF_TEMPLATE_ID,
  TEMPLATE_CATEGORY_LABELS,
  type TemplateCategory,
} from '@/lib/pdf/engine/templates/types';

export type ComposerTemplateOption = {
  id: string;
  label: string;
  description: string;
  primary: string;
  category: TemplateCategory;
};

/**
 * Modèles proposés pendant la création, avec aperçu en temps réel.
 *
 * La liste était figée sur six identifiants de l'ancien moteur
 * (`classic-blue`, `pennylane-clean`…). Ils n'existent plus : la bibliothèque
 * compte désormais les vingt modèles `01` … `20`, partagés avec l'application.
 * Le choix fait au composer portait donc sur des identifiants inconnus du
 * rendu, qui retombait silencieusement sur le modèle par défaut.
 *
 * La liste dérive maintenant du registre : une seule source, aucun décalage
 * possible entre ce qui est proposé et ce qui est rendu.
 */
export const COMPOSER_TEMPLATES: ComposerTemplateOption[] = PDF_TEMPLATES.map((template) => ({
  id: template.id,
  label: template.name,
  description: template.description,
  // Les modèles sans couleur d'accent (noir et blanc assumé) retombent sur la
  // teinte du papier : la pastille reste lisible au lieu d'être vide.
  primary: template.accent ?? template.paper,
  category: template.category ?? 'classique',
}));

export type ComposerTemplateGroup = {
  category: TemplateCategory;
  label: string;
  templates: ComposerTemplateOption[];
};

/** Modèles rangés par catégorie, dans l'ordre des libellés. Les groupes vides sont omis. */
export const COMPOSER_TEMPLATE_GROUPS: ComposerTemplateGroup[] = (
  Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateCategory[]
)
  .map((category) => ({
    category,
    label: TEMPLATE_CATEGORY_LABELS[category],
    templates: COMPOSER_TEMPLATES.filter((template) => template.category === category),
  }))
  .filter((group) => group.templates.length > 0);

/** Ramène tout identifiant — y compris hérité — sur un modèle réellement rendu. */
export function resolveComposerTemplateId(templateId: string): string {
  return resolvePdfTemplate(templateId).id;
}

export function getDefaultComposerTemplateId(
  kind: 'invoice' | 'quote',
  settings?: { quoteTemplateId?: string; invoiceTemplateId?: string } | null,
): string {
  const fromSettings =
    kind === 'invoice' ? settings?.invoiceTemplateId : settings?.quoteTemplateId;

  return fromSettings ? resolveComposerTemplateId(fromSettings) : DEFAULT_PDF_TEMPLATE_ID;
}
