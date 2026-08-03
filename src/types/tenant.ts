import type { PaymentMethodId } from '@/types/payment-methods';

export type DataScope = {
  userId: string;
  companyId: string;
};

export type CompanyMemberRole = 'owner' | 'admin' | 'member';

export type TenantCompany = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  legalForm: string | null;
  shareCapital: string | null;
  rcsCity: string | null;
  siren: string | null;
  siret: string | null;
  vatNumber: string | null;
  iban: string | null;
  bic: string | null;
  paymentMethods: PaymentMethodId[];
  logoUrl: string | null;
  signatureUrl: string | null;
  role: CompanyMemberRole;
  createdAt: string;
  updatedAt: string;
};

export type CreateCompanyInput = {
  name: string;
};
