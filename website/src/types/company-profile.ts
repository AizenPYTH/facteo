import type { PaymentMethodId } from '@/types/payment-methods';
import { DEFAULT_PAYMENT_METHODS } from '@/types/payment-methods';

export type CompanyProfile = {
  id: string;
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  legalForm: string;
  shareCapital: string;
  rcsCity: string;
  siren: string;
  siret: string;
  vatNumber: string;
  iban: string;
  bic: string;
  paymentMethods: PaymentMethodId[];
  logoUrl: string | null;
  signatureUrl: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CompanyProfileFormValues = {
  companyName: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  legalForm: string;
  shareCapital: string;
  rcsCity: string;
  siren: string;
  siret: string;
  vatNumber: string;
  iban: string;
  bic: string;
  paymentMethods: PaymentMethodId[];
};

export type UpdateCompanyProfileInput = CompanyProfileFormValues;

export function createEmptyCompanyProfileFormValues(): CompanyProfileFormValues {
  return {
    companyName: '',
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'France',
    legalForm: '',
    shareCapital: '',
    rcsCity: '',
    siren: '',
    siret: '',
    vatNumber: '',
    iban: '',
    bic: '',
    paymentMethods: [...DEFAULT_PAYMENT_METHODS],
  };
}
