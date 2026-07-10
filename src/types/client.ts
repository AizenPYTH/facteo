export type Client = {
  id: string;
  company: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  postalCode: string | null;
  city: string | null;
  country: string | null;
  siren: string | null;
  siret: string | null;
  vatNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientFormValues = {
  company: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  siren: string;
  siret: string;
  vatNumber: string;
  notes: string;
};

export type CreateClientInput = ClientFormValues;
export type UpdateClientInput = ClientFormValues;

export function createEmptyClientFormValues(): ClientFormValues {
  return {
    company: '',
    contactName: '',
    email: '',
    phone: '',
    address: '',
    postalCode: '',
    city: '',
    country: 'France',
    siren: '',
    siret: '',
    vatNumber: '',
    notes: '',
  };
}

export function mapClientToFormValues(client: Client): ClientFormValues {
  return {
    company: client.company ?? '',
    contactName: client.name,
    email: client.email ?? '',
    phone: client.phone ?? '',
    address: client.address ?? '',
    postalCode: client.postalCode ?? '',
    city: client.city ?? '',
    country: client.country ?? 'France',
    siren: client.siren ?? '',
    siret: client.siret ?? '',
    vatNumber: client.vatNumber ?? '',
    notes: client.notes ?? '',
  };
}
