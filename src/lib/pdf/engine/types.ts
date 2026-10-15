import type { Client } from '@/types/client';
import type { CompanyProfile } from '@/types/company-profile';
import type { Settings } from '@/types/settings';

import type { PaymentMethodId } from '@/types/payment-methods';
import type {
  IssuerLegalId,
  LegalIdsPlacement,
  StampColor,
  StampPosition,
} from '@/types/pdf-options';

export type PdfCompanyInfo = Pick<
  CompanyProfile,
  | 'companyName'
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'address'
  | 'postalCode'
  | 'city'
  | 'country'
  | 'siret'
  | 'vatNumber'
> & {
  iban?: string;
  bic?: string;
  paymentMethods?: PaymentMethodId[];
  logoUrl?: string | null;
  /** Largeur / hauteur du logo (mesurée à l'embarquement) : dimensionne le logo selon sa forme. */
  logoRatio?: number | null;
  signatureUrl?: string | null;
  /** SIREN saisi à part. Absent : 9 premiers chiffres du SIRET. */
  siren?: string | null;
};

export type PdfClientInfo = Pick<
  Client,
  | 'lastName'
  | 'firstName'
  | 'company'
  | 'email'
  | 'phone'
  | 'address'
  | 'postalCode'
  | 'city'
  | 'country'
  | 'vatNumber'
> & {
  /** Hors de France : numéro national du client (NIPC au Portugal…). */
  siret?: string | null;
  siren?: string | null;
};

export type PdfDocumentLine = {
  /** Nom court de la prestation. Peut être vide (anciennes lignes : description seule). */
  title?: string;
  /** Détail de la prestation. Peut être vide (titre seul). */
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
  discountPercent: string;
};

export type PdfDocumentTotals = {
  subtotalHt: number;
  totalVat: number;
  totalTtc: number;
  amountDue?: number;
};

export type PdfDocumentKind = 'quote' | 'invoice';

export type PdfDocumentInput = {
  kind: PdfDocumentKind;
  number: string;
  issuedAt: string | null;
  dueOrValidUntil: string | null;
  notes?: string | null;
  lines: PdfDocumentLine[];
  totals: PdfDocumentTotals;
  company: PdfCompanyInfo;
  client: PdfClientInfo;
  settings?: Settings | null;
  showPaymentQr?: boolean;
  clientSignature?: {
    url: string;
    signedAt: string;
  } | null;
  templateId?: string | null;
  /**
   * Statut réel du document (`invoices.status` / `quotes.status`).
   * Seul le modèle 04 l'affiche ; les autres l'ignorent, conformément au handoff.
   */
  status?: string | null;
  /** Date d'encaissement, affichée dans le cachet « Payée ». */
  paidAt?: string | null;
  /** Remplace « Facture » / « Devis » dans le titre du document. */
  documentTitle?: string | null;
  /** Identifiants de l'émetteur affichés en tête. Absent : SIRET et TVA. */
  issuerLegalIds?: IssuerLegalId[] | null;
  /** Emplacement de ces identifiants. Absent ou 'auto' : celui du modèle. */
  legalIdsPlacement?: LegalIdsPlacement | null;
  /** Client hors de France : imprimer son numéro national (NIPC…). Absent : oui. */
  showClientId?: boolean | null;
  /** Emplacement de ce numéro. Absent ou 'auto' : sous l'adresse du client. */
  clientIdPlacement?: LegalIdsPlacement | null;
  /** Cachet « Facture payée ». Absent : couleur et emplacement du modèle. */
  stampColor?: StampColor | null;
  stampPosition?: StampPosition | null;
  /** Afficher l'e-mail de l'entreprise. Absent : affiché sur un devis, masqué sur une facture. */
  showIssuerEmail?: boolean;
  /** Masquer le logo sur ce document. Le logo n'apparaît que si `settings.showLogo` est activé. */
  showLogo?: boolean | null;
  /** Mention de paiement choisie sur la facture, imprimée en tête des mentions du bas de page. */
  paymentMention?: string | null;
};
