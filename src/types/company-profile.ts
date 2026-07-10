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
  siret: string;
  vatNumber: string;
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
  siret: string;
  vatNumber: string;
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
    siret: '',
    vatNumber: '',
  };
}
