import { useQuery } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase';

/**
 * Logos et signatures d'entreprise : le bucket `company-assets` est privé.
 * Les URL enregistrées (« …/object/public/company-assets/… ») ne répondent
 * donc pas telles quelles ; on les remplace par une URL signée de courte durée,
 * obtenue avec la session de l'utilisateur.
 */

const BUCKET = 'company-assets';
const ASSET_URL_PATTERN = new RegExp(`/storage/v1/object/(?:public|sign|authenticated)/${BUCKET}/([^?#]+)`);
const SIGNED_TTL_SECONDS = 3600;

const signedCache = new Map<string, { url: string; expiresAt: number }>();

export function companyAssetPath(url: string | null | undefined): string | null {
  if (!url) return null;
  const match = url.match(ASSET_URL_PATTERN);
  return match ? decodeURIComponent(match[1]) : null;
}

/** URL lisible (signée si besoin), ou null si le fichier est inaccessible. */
export async function resolveCompanyAssetUrl(url: string | null | undefined): Promise<string | null> {
  if (!url) return null;
  const path = companyAssetPath(url);
  if (!path) return url;

  const cached = signedCache.get(path);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.url;

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, SIGNED_TTL_SECONDS);
  if (error || !data?.signedUrl) return null;
  signedCache.set(path, { url: data.signedUrl, expiresAt: Date.now() + SIGNED_TTL_SECONDS * 1000 });
  return data.signedUrl;
}

/** Pour <Image source={{ uri }} /> : URL signée du logo ou de la signature. */
export function useCompanyAssetSrc(url: string | null | undefined): string | null {
  const needsSigning = Boolean(companyAssetPath(url));
  const query = useQuery({
    queryKey: ['company-asset-src', url ?? null],
    queryFn: () => resolveCompanyAssetUrl(url),
    enabled: needsSigning,
    staleTime: 45 * 60 * 1000,
    gcTime: 50 * 60 * 1000,
  });
  if (!url) return null;
  return needsSigning ? (query.data ?? null) : url;
}
