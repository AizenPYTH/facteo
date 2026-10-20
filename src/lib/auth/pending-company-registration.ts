import type { User } from '@supabase/supabase-js';

import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import type { CompanyLookupResult } from '@/lib/company-search/types';

/**
 * Entreprise trouvée par SIREN / SIRET à l'inscription. Le compte n'a pas
 * encore de session à ce moment-là (e-mail à confirmer) : les informations
 * voyagent dans les métadonnées du compte et sont reprises à la première
 * connexion, puis effacées.
 */
export const PENDING_COMPANY_REGISTRATION_KEY = 'company_registration';

type PendingRegistration = {
  siren: string;
  siret: string;
  address: string;
  postal_code: string;
  city: string;
  country: string;
  vat_number: string;
};

export function toPendingRegistration(result: CompanyLookupResult): PendingRegistration {
  const clean = (value: string | null | undefined, max: number) => (value ?? '').trim().slice(0, max);
  return {
    siren: clean(result.siren, 9).replace(/\s/g, ''),
    siret: clean(result.siret, 20).replace(/\s/g, ''),
    address: clean(result.address, 200),
    postal_code: clean(result.postalCode, 20),
    city: clean(result.city, 100),
    country: clean(result.country, 60),
    vat_number: clean(result.vatNumber, 20).replace(/\s/g, '').toUpperCase(),
  };
}

export function readPendingRegistration(user: User | null | undefined): PendingRegistration | null {
  const value = user?.user_metadata?.[PENDING_COMPANY_REGISTRATION_KEY];
  if (!value || typeof value !== 'object') return null;
  const source = value as Record<string, unknown>;
  const text = (key: keyof PendingRegistration) => (typeof source[key] === 'string' ? (source[key] as string) : '');
  return {
    siren: text('siren'),
    siret: text('siret'),
    address: text('address'),
    postal_code: text('postal_code'),
    city: text('city'),
    country: text('country'),
    vat_number: text('vat_number'),
  };
}

type CompanyFields = {
  address: string | null;
  postal_code: string | null;
  city: string | null;
  country: string | null;
  siret: string | null;
  vat_number: string | null;
};

/**
 * Complète l'entreprise avec les informations trouvées à l'inscription. Seuls
 * les champs encore vides sont remplis : rien de ce qui a été saisi depuis
 * n'est écrasé. Renvoie `true` si l'entreprise a changé.
 */
export async function applyPendingCompanyRegistration(user: User, companyId: string): Promise<boolean> {
  const pending = readPendingRegistration(user);
  if (!pending) return false;

  const { data, error } = await supabase
    .from('companies')
    .select('address, postal_code, city, country, siret, vat_number')
    .eq('id', companyId)
    .maybeSingle();
  if (error || !data) {
    if (error) logSupabaseError('applyPendingCompanyRegistration.read', error);
    return false;
  }

  const current = data as CompanyFields;
  const update: Partial<CompanyFields> & { updated_at?: string } = {};
  for (const key of ['address', 'postal_code', 'city', 'country', 'siret', 'vat_number'] as const) {
    const value = pending[key];
    if (value && !current[key]?.trim()) update[key] = value;
  }

  let changed = false;
  if (Object.keys(update).length > 0) {
    update.updated_at = new Date().toISOString();
    const { error: updateError } = await supabase.from('companies').update(update).eq('id', companyId);
    if (updateError) {
      logSupabaseError('applyPendingCompanyRegistration.update', updateError);
      return false;
    }
    changed = true;
  }

  if (pending.siren) {
    // `companies.siren` vient d'une migration à part : un échec ne bloque rien.
    const { data: sirenRow } = await supabase.from('companies').select('siren').eq('id', companyId).maybeSingle();
    if (!((sirenRow as { siren?: string | null } | null)?.siren ?? '').trim()) {
      const { error: sirenError } = await supabase
        .from('companies')
        .update({ siren: pending.siren })
        .eq('id', companyId);
      if (sirenError) logSupabaseError('applyPendingCompanyRegistration.siren', sirenError);
      else changed = true;
    }
  }

  // Une seule fois : les métadonnées sont effacées une fois l'entreprise complétée.
  const { error: clearError } = await supabase.auth.updateUser({
    data: { [PENDING_COMPANY_REGISTRATION_KEY]: null },
  });
  if (clearError) logSupabaseError('applyPendingCompanyRegistration.clear', clearError);

  return changed;
}
