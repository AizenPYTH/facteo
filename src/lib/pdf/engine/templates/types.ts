import type { TemplateContext } from '@/lib/pdf/engine/templates/context';

/**
 * Un modèle de document = une identité visuelle + une fonction de rendu.
 *
 * Les 20 modèles partagent le même contrat de données (`TemplateContext`) et ne
 * diffèrent que par leur mise en page. Aucun n'accède aux données brutes : le
 * contexte est déjà formaté (montants, dates, TVA par taux, QR).
 */
export type PdfTemplateDefinition = {
  /** '01' … '20'. Stocké dans `settings.invoice_template_id`. */
  id: string;
  name: string;
  description: string;
  /** Couleur d'accent unique du modèle. `null` = modèle sans couleur. */
  accent: string | null;
  /** Couleur du papier (fond de page). */
  paper: string;
  render: (context: TemplateContext) => string;
};

/** Modèle « maison » INVEQ. */
export const DEFAULT_PDF_TEMPLATE_ID = '04';
