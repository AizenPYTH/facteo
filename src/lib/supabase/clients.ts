import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import { mapFormValuesToClientInsert, mapFormValuesToClientUpdate } from '@/lib/clients/mappers';
import { mapClientRowToClient } from '@/lib/supabase/mappers';
import type { Client, ClientFormValues } from '@/types/client';
import type { DataScope } from '@/types/tenant';
import {
  CLIENTS_PAGE_SIZE,
  type ClientsPage,
  type ClientsPageParams,
} from '@/types/clients-list';
import type { ClientRow } from '@/types/database';

export const CLIENT_COLUMNS =
  'id, user_id, name, email, phone, company, address, address_line2, postal_code, city, region, country, website, siren, siret, vat_number, notes, created_at, updated_at' as const;

function sanitizeSearchTerm(search: string): string {
  return search.trim().replace(/[%_,]/g, '');
}

function applySearchFilter<T extends { or: (filters: string) => T }>(
  query: T,
  search: string,
): T {
  const sanitizedSearch = sanitizeSearchTerm(search);

  if (!sanitizedSearch) {
    return query;
  }

  return query.or(
    [
      `company.ilike.%${sanitizedSearch}%`,
      `name.ilike.%${sanitizedSearch}%`,
      `email.ilike.%${sanitizedSearch}%`,
      `phone.ilike.%${sanitizedSearch}%`,
      `city.ilike.%${sanitizedSearch}%`,
      `address.ilike.%${sanitizedSearch}%`,
      `address_line2.ilike.%${sanitizedSearch}%`,
      `region.ilike.%${sanitizedSearch}%`,
      `country.ilike.%${sanitizedSearch}%`,
      `website.ilike.%${sanitizedSearch}%`,
      `vat_number.ilike.%${sanitizedSearch}%`,
      `siren.ilike.%${sanitizedSearch}%`,
      `siret.ilike.%${sanitizedSearch}%`,
    ].join(','),
  );
}

export async function fetchClientsPage(
  scope: DataScope,
  { search = '', page = 0, pageSize = CLIENTS_PAGE_SIZE }: ClientsPageParams = {},
): Promise<ClientsPage> {
  const from = page * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from('clients')
    .select(CLIENT_COLUMNS, { count: 'exact' })
    .eq('company_id', scope.companyId)
    .is('deleted_at', null)
    .order('name', { ascending: true })
    .range(from, to);

  query = applySearchFilter(query, search);

  const { data, error, count } = await query;

  if (error) {
    logSupabaseError('fetchClientsPage', error);
    return { clients: [], nextPage: null, totalCount: null };
  }

  const clients = (data as ClientRow[] | null)?.map(mapClientRowToClient) ?? [];
  const loadedCount = from + clients.length;
  const hasMore = count !== null ? loadedCount < count : clients.length === pageSize;

  return {
    clients,
    nextPage: hasMore ? page + 1 : null,
    totalCount: count,
  };
}

export async function fetchClientById(scope: DataScope, clientId: string): Promise<Client | null> {
  const { data, error } = await supabase
    .from('clients')
    .select(CLIENT_COLUMNS)
    .eq('company_id', scope.companyId)
    .eq('id', clientId)
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    logSupabaseError('fetchClientById', error);
    return null;
  }

  return data ? mapClientRowToClient(data as ClientRow) : null;
}

export async function createClient(scope: DataScope, input: ClientFormValues): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .insert(mapFormValuesToClientInsert(scope, input))
    .select(CLIENT_COLUMNS)
    .single();

  if (error) {
    logSupabaseError('createClient', error);
    throw error;
  }

  return mapClientRowToClient(data as ClientRow);
}

export async function updateClient(
  scope: DataScope,
  clientId: string,
  input: ClientFormValues,
): Promise<Client> {
  const { data, error } = await supabase
    .from('clients')
    .update(mapFormValuesToClientUpdate(input))
    .eq('company_id', scope.companyId)
    .eq('id', clientId)
    .select(CLIENT_COLUMNS)
    .single();

  if (error) {
    logSupabaseError('updateClient', error);
    throw error;
  }

  return mapClientRowToClient(data as ClientRow);
}

export async function deleteClient(scope: DataScope, clientId: string): Promise<void> {
  const { error } = await supabase
    .from('clients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('company_id', scope.companyId)
    .eq('id', clientId);

  if (error) {
    logSupabaseError('deleteClient', error);
    throw error;
  }
}
