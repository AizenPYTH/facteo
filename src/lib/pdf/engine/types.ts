import type { Client } from '@/types/client';
import type { CompanyProfile } from '@/types/company-profile';
import type { Settings } from '@/types/settings';

import type { PaymentMethodId } from '@/types/payment-methods';

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
};
