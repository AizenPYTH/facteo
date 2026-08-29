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

/** Choix explicite en tête de formulaire — DESIGN §5.5. UI only, non persisté. */
export type ClientKind = 'company' | 'person';

export type ClientFormValues = {
  clientKind: ClientKind;
  lastName: string;
  firstName: string;
  company: string;
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
    clientKind: 'person',
    lastName: '',
    firstName: '',
    company: '',
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
    clientKind: client.company?.trim() ? 'company' : 'person',
    lastName: client.lastName,
    firstName: client.firstName,
    company: client.company ?? '',
    email: client.email ?? '',
    phone: formatFrenchPhoneDisplay(client.phone) ?? '',
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

export { formatClientFullName, getClientDisplayName, getClientSecondaryLabel, parseClientStoredName };
