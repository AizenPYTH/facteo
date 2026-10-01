import type { VocabularyId } from '@/lib/pdf/engine/templates/vocabulary';
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
  /** Registre de langue (Émetteur / De / Prestataire…). Absent : classique. */
  vocabulary?: VocabularyId;
  /** Famille de style, pour ranger la galerie. */
  category?: TemplateCategory;
  /**
   * Le modèle place lui-même SIREN / SIRET / TVA (`context.issuerLegalIds`)
   * dans sa mise en page. Sinon, l'enveloppe commune les met en bandeau.
   */
  ownsLegalIds?: boolean;
};

export type TemplateCategory =
  | 'classique'
  | 'moderne'
  | 'elegant'
  | 'creatif'
  | 'minimal'
  | 'artisan'
  | 'commerce'
  | 'tech';

export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
  classique: 'Classique',
  moderne: 'Moderne',
  elegant: 'Élégant',
  creatif: 'Créatif',
  minimal: 'Minimal',
  artisan: 'Artisan & BTP',
  commerce: 'Commerce',
  tech: 'Tech & SaaS',
};

/** Modèle « maison » INVEQ. */
export const DEFAULT_PDF_TEMPLATE_ID = '04';
