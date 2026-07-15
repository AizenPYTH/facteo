import { PDF_TEMPLATES } from '@/lib/pdf/engine/templates';

export type ComposerTemplateOption = {
  id: string;
  label: string;
  description: string;
  primary: string;
};

/** Modèles proposés pendant la création (aperçu temps réel). */
export const COMPOSER_TEMPLATES: ComposerTemplateOption[] = [
  { id: 'classic-blue', label: 'Classique', description: 'Équilibré et professionnel', primary: '#2563EB' },
  { id: 'pennylane-clean', label: 'Moderne', description: 'Épuré avec bandeau coloré', primary: '#00B386' },
  { id: 'stripe-sleek', label: 'Premium', description: 'Design tech haut de gamme', primary: '#635BFF' },
  { id: 'henrri-minimal', label: 'Minimal', description: 'Ultra sobre', primary: '#18181B' },
  { id: 'indy-modern', label: 'Indy', description: 'Typographie aérée', primary: '#5B4FFF' },
  { id: 'quickbooks-pro', label: 'Comptable', description: 'Structure classique', primary: '#2CA01C' },
];

export function resolveComposerTemplateId(templateId: string): string {
  const known = COMPOSER_TEMPLATES.some((t) => t.id === templateId);
  if (known) return templateId;
  const fallback = PDF_TEMPLATES.find((t) => t.id === templateId);
  return fallback?.id ?? COMPOSER_TEMPLATES[0].id;
}

export function getDefaultComposerTemplateId(
  kind: 'invoice' | 'quote',
  settings?: { quoteTemplateId?: string; invoiceTemplateId?: string } | null,
): string {
  const fromSettings =
    kind === 'invoice' ? settings?.invoiceTemplateId : settings?.quoteTemplateId;
  if (fromSettings) return resolveComposerTemplateId(fromSettings);
  return COMPOSER_TEMPLATES[0].id;
}
