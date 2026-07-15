/** Résultat normalisé d'une recherche d'entreprise (indépendant du fournisseur). */
export type CompanyLookupResult = {
  companyName: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  siren: string;
  siret: string;
  vatNumber: string | null;
};

export type CompanySearchErrorCode =
  | 'NOT_CONFIGURED'
  | 'INVALID_REGISTRATION_NUMBER'
  | 'COMPANY_NOT_FOUND'
  | 'API_UNAVAILABLE'
  | 'INVALID_RESPONSE';

export type CompanySearchProviderId = 'recherche-entreprises';

export type CompanySearchOptions = {
  signal?: AbortSignal;
};
