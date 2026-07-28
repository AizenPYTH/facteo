export type ClientParseAmbiguity = {
  field: string;
  options: string[];
  message: string;
};

export type ParsedClientDraft = {
  company: string;
  firstName: string;
  lastName: string;
  address: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  region: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  vatNumber: string;
  siren: string;
  siret: string;
  notes: string;
  confidence: number;
  ambiguities: ClientParseAmbiguity[];
};

export type ParseClientsResult = {
  clients: ParsedClientDraft[];
  warnings: string[];
};

export type ParseClientsInput = {
  text?: string;
  fileName?: string;
  fileBase64?: string;
  mimeType?: string;
};
