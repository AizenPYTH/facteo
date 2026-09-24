import type { Client } from '@/types/client';
import type { CompanyProfile } from '@/types/company-profile';
import type { Settings } from '@/types/settings';

import type { PaymentMethodId } from '@/types/payment-methods';
import type {
  InvoiceAddresses,
  IssuerLegalId,
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
>;

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
  /** Cachet « Facture payée ». Absent : couleur et emplacement du modèle. */
  stampColor?: StampColor | null;
  stampPosition?: StampPosition | null;
  /** Afficher l'e-mail de l'entreprise. Absent : affiché sur un devis, masqué sur une facture. */
  showIssuerEmail?: boolean;
  /** Vendu par, place de marché, facturation, livraison. Vides : non affichés. */
  addresses?: InvoiceAddresses | null;
};
