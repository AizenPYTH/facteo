'use client';

import { useQuery } from '@tanstack/react-query';

import { companyAssetDisplayUrl, companyAssetPath } from '@/lib/domain/company-assets/logo-image';

/**
 * Adresse affichable d'un logo ou d'une signature d'entreprise : le bucket est
 * privé, l'URL enregistrée ne répond pas telle quelle. URL signée 1 h,
 * renouvelée avant expiration.
 */
export function useCompanyAssetSrc(url: string | null | undefined): string | null {
  const needsSigning = Boolean(companyAssetPath(url));
  const query = useQuery({
    queryKey: ['company-asset-src', url ?? null],
    queryFn: () => companyAssetDisplayUrl(url),
    enabled: needsSigning,
    staleTime: 45 * 60 * 1000,
    gcTime: 50 * 60 * 1000,
  });
  if (!url) return null;
  return needsSigning ? (query.data ?? null) : url;
}
