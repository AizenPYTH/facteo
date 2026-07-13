import { z } from 'zod';

import { getCompanySearchApiBaseUrl } from '@/lib/company-search/config';
import { CompanySearchError } from '@/lib/company-search/errors';
import type { CompanyLookupResult } from '@/lib/company-search/types';
import { computeFrenchVatNumberFromSiren } from '@/lib/company-search/vat';
import type { CompanySearchProvider } from '@/lib/company-search/providers/types';

const establishmentSchema = z
  .object({
    siret: z.string().optional(),
    adresse: z.string().optional().nullable(),
    geo_adresse: z.string().optional().nullable(),
    numero_voie: z.string().optional().nullable(),
    type_voie: z.string().optional().nullable(),
    libelle_voie: z.string().optional().nullable(),
    complement_adresse: z.string().optional().nullable(),
    code_postal: z.string().optional().nullable(),
    libelle_commune: z.string().optional().nullable(),
  })
  .passthrough();

const companyResultSchema = z
  .object({
    siren: z.string(),
    nom_complet: z.string().optional().nullable(),
    nom_raison_sociale: z.string().optional().nullable(),
    siege: establishmentSchema.optional().nullable(),
    matching_etablissements: z.array(establishmentSchema).optional().nullable(),
  })
  .passthrough();

const searchResponseSchema = z.object({
  results: z.array(companyResultSchema),
});

type Establishment = z.infer<typeof establishmentSchema>;

function formatEstablishmentAddress(establishment: Establishment): string {
  const geo = establishment.geo_adresse?.trim();
  if (geo) {
    return geo;
  }

  const full = establishment.adresse?.trim();
  if (full) {
    return full;
  }

  return [
    establishment.numero_voie,
    establishment.type_voie,
    establishment.libelle_voie,
    establishment.complement_adresse,
  ]
    .filter(Boolean)
    .join(' ')
    .trim();
}

function resolveEstablishment(
  company: z.infer<typeof companyResultSchema>,
  registrationNumber: string,
): Establishment | null {
  const matching = company.matching_etablissements ?? [];

  if (registrationNumber.length === 14) {
    const exactMatch =
      matching.find((item) => item.siret === registrationNumber) ??
      (company.siege?.siret === registrationNumber ? company.siege : null);

    if (exactMatch) {
      return exactMatch;
    }
  }

  return company.siege ?? matching[0] ?? null;
}

function mapToLookupResult(
  company: z.infer<typeof companyResultSchema>,
  registrationNumber: string,
): CompanyLookupResult | null {
  const establishment = resolveEstablishment(company, registrationNumber);

  if (!establishment) {
    return null;
  }

  const companyName =
    company.nom_complet?.trim() ||
    company.nom_raison_sociale?.trim() ||
    '';

  if (!companyName) {
    return null;
  }

  const siren = company.siren;
  const establishmentSiret = establishment.siret?.replace(/\D/g, '') ?? '';
  const siret =
    establishmentSiret.length === 14
      ? establishmentSiret
      : registrationNumber.length === 14
        ? registrationNumber
        : establishmentSiret;

  return {
    companyName,
    address: formatEstablishmentAddress(establishment),
    postalCode: establishment.code_postal?.trim() ?? '',
    city: establishment.libelle_commune?.trim() ?? '',
    country: 'France',
    siren,
    siret,
    vatNumber: computeFrenchVatNumberFromSiren(siren),
  };
}

export const rechercheEntreprisesProvider: CompanySearchProvider = {
  async searchByRegistrationNumber(registrationNumber, options = {}) {
    const baseUrl = getCompanySearchApiBaseUrl();

    if (!baseUrl) {
      throw new CompanySearchError('NOT_CONFIGURED');
    }

    const endpoint = new URL('search', `${baseUrl}/`);
    endpoint.searchParams.set('q', registrationNumber);
    endpoint.searchParams.set('per_page', '1');

    let response: Response;

    try {
      response = await fetch(endpoint.toString(), {
        method: 'GET',
        headers: { Accept: 'application/json' },
        signal: options.signal,
      });
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error;
      }

      throw new CompanySearchError('API_UNAVAILABLE');
    }

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      throw new CompanySearchError('API_UNAVAILABLE');
    }

    let payload: unknown;

    try {
      payload = await response.json();
    } catch {
      throw new CompanySearchError('INVALID_RESPONSE');
    }

    const parsed = searchResponseSchema.safeParse(payload);

    if (!parsed.success) {
      throw new CompanySearchError('INVALID_RESPONSE');
    }

    const company = parsed.data.results[0];

    if (!company) {
      return null;
    }

    return mapToLookupResult(company, registrationNumber);
  },
};
