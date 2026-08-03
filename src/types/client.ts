import {
  formatClientFullName,
  getClientDisplayName,
  getClientSecondaryLabel,
  parseClientStoredName,
} from '@/lib/clients/name';
import { formatFrenchPhoneDisplay } from '@/lib/format/phone';

export type Client = {
  id: string;
  lastName: string;
  firstName: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  addressLine2: string | null;
  postalCode: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  website: string | null;
  siren: string | null;
  siret: string | null;
  vatNumber: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ClientFormValues = {
  lastName: string;
  firstName: string;
  company: string;
  email: string;
  phone: string;
  address: string;
  addressLine2: string;
  postalCode: string;
  city: string;
  region: string;
  country: string;
  website: string;
  siren: string;
  siret: string;
  vatNumber: string;
  notes: string;
};

export type CreateClientInput = ClientFormValues;
export type UpdateClientInput = ClientFormValues;

export function createEmptyClientFormValues(): ClientFormValues {
  return {
    lastName: '',
    firstName: '',
    company: '',
    email: '',
    phone: '',
    address: '',
    addressLine2: '',
    postalCode: '',
    city: '',
    region: '',
    country: 'France',
    website: '',
    siren: '',
    siret: '',
    vatNumber: '',
    notes: '',
  };
}

export function mapClientToFormValues(client: Client): ClientFormValues {
  return {
    lastName: client.lastName,
    firstName: client.firstName,
    company: client.company ?? '',
    email: client.email ?? '',
    phone: formatFrenchPhoneDisplay(client.phone) ?? '',
    address: client.address ?? '',
    addressLine2: client.addressLine2 ?? '',
    postalCode: client.postalCode ?? '',
    city: client.city ?? '',
    region: client.region ?? '',
    country: client.country ?? 'France',
    website: client.website ?? '',
    siren: client.siren ?? '',
    siret: client.siret ?? '',
    vatNumber: client.vatNumber ?? '',
    notes: client.notes ?? '',
  };
}

export { formatClientFullName, getClientDisplayName, getClientSecondaryLabel, parseClientStoredName };
