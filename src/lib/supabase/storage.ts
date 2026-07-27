import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import { readLocalFileAsBytes } from '@/lib/files/read-as-bytes';
import { debugProfileTrace } from '@/lib/supabase/profile-debug';
import type { ProfileUpdate } from '@/types/database';

export const COMPANY_ASSETS_BUCKET = 'company-assets';

/** Signed URL lifetime for logos / signatures (7 days). Refreshed on load. */
export const COMPANY_ASSET_SIGNED_URL_SECONDS = 60 * 60 * 24 * 7;

export type CompanyAssetKind = 'logo' | 'signature';

function buildAssetPath(companyId: string, kind: CompanyAssetKind, extension: string): string {
  const timestamp = Date.now();
  return `${companyId}/${kind}-${timestamp}.${extension}`;
}

/**
 * Extract storage object path from a public URL, signed URL, or raw path.
 */
export function extractCompanyAssetPath(stored: string | null | undefined): string | null {
  if (!stored?.trim()) {
    return null;
  }

  const value = stored.trim();

  const publicMarker = `/storage/v1/object/public/${COMPANY_ASSETS_BUCKET}/`;
  const signMarker = `/storage/v1/object/sign/${COMPANY_ASSETS_BUCKET}/`;

  if (value.includes(publicMarker)) {
    return decodeURIComponent(value.split(publicMarker)[1]?.split('?')[0] ?? '');
  }

  if (value.includes(signMarker)) {
    return decodeURIComponent(value.split(signMarker)[1]?.split('?')[0] ?? '');
  }

  // Raw path: uuid/logo-….ext
  if (!value.startsWith('http') && value.includes('/')) {
    return value.replace(/^\/+/, '');
  }

  return null;
}

export async function createCompanyAssetSignedUrl(
  path: string,
  expiresIn = COMPANY_ASSET_SIGNED_URL_SECONDS,
): Promise<string> {
  const { data, error } = await supabase.storage
    .from(COMPANY_ASSETS_BUCKET)
    .createSignedUrl(path, expiresIn);

  if (error || !data?.signedUrl) {
    logSupabaseError('createCompanyAssetSignedUrl', error);
    throw error ?? new Error('Unable to sign company asset URL.');
  }

  return data.signedUrl;
}

/** Resolve a stored logo/signature value to a usable URL (signed when private). */
export async function resolveCompanyAssetUrl(
  stored: string | null | undefined,
): Promise<string | null> {
  if (!stored?.trim()) {
    return null;
  }

  const path = extractCompanyAssetPath(stored);
  if (!path) {
    return stored;
  }

  try {
    return await createCompanyAssetSignedUrl(path);
  } catch {
    return stored;
  }
}

/**
 * @deprecated Public URLs are blocked after Sprint 1. Prefer signed URLs.
 */
export function getPublicStorageUrl(path: string): string {
  const { data } = supabase.storage.from(COMPANY_ASSETS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

export async function uploadCompanyAsset(
  companyId: string,
  kind: CompanyAssetKind,
  fileUri: string,
  mimeType: string,
): Promise<string> {
  const extension = mimeType.includes('png')
    ? 'png'
    : mimeType.includes('webp')
      ? 'webp'
      : 'jpg';
  const path = buildAssetPath(companyId, kind, extension);
  const bytes = await readLocalFileAsBytes(fileUri);

  const { error } = await supabase.storage.from(COMPANY_ASSETS_BUCKET).upload(path, bytes, {
    contentType: mimeType,
    upsert: true,
  });

  if (error) {
    logSupabaseError('uploadCompanyAsset', error);
    throw error;
  }

  // Persist relative path in DB; UI resolves to signed URL on read.
  return path;
}

export async function deleteCompanyAssetByUrl(publicUrl: string): Promise<void> {
  const path = extractCompanyAssetPath(publicUrl);

  if (!path) {
    return;
  }

  const { error } = await supabase.storage.from(COMPANY_ASSETS_BUCKET).remove([path]);

  if (error) {
    logSupabaseError('deleteCompanyAssetByUrl', error);
    throw error;
  }
}

async function resolveAuthenticatedUserId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();

  if (error) {
    logSupabaseError('resolveAuthenticatedUserId', error);
    throw error;
  }

  const authUserId = data.user?.id ?? null;
  debugProfileTrace('auth.getUser', { authUserId });

  if (!authUserId) {
    throw new Error('Utilisateur non authentifié.');
  }

  return authUserId;
}

export async function ensureUserProfileExists(): Promise<void> {
  const authUserId = await resolveAuthenticatedUserId();

  const { error } = await supabase.rpc('ensure_profile_exists');

  debugProfileTrace('ensure_profile_exists', {
    authUserId,
    rpcError: error?.message ?? null,
    rpcSuccess: !error,
  });

  if (error) {
    logSupabaseError('ensureUserProfileExists', error);
    throw error;
  }
}

export async function updateProfileAssetUrl(
  userId: string,
  kind: CompanyAssetKind,
  url: string | null,
): Promise<void> {
  const authUserId = await resolveAuthenticatedUserId();

  debugProfileTrace('updateProfileAssetUrl.start', {
    authUserId,
    passedUserId: userId,
    idsMatch: authUserId === userId,
    kind,
    url,
  });

  if (authUserId !== userId) {
    throw new Error('Identifiant utilisateur incohérent avec la session.');
  }

  await ensureUserProfileExists();

  const { data: profileBefore, error: profileBeforeError } = await supabase
    .from('profiles')
    .select('id, logo_url, signature_url')
    .eq('id', authUserId)
    .maybeSingle();

  debugProfileTrace('updateProfileAssetUrl.profileBefore', {
    authUserId,
    profileBefore,
    profileBeforeError: profileBeforeError?.message ?? null,
    profileExists: Boolean(profileBefore),
  });

  const now = new Date().toISOString();
  const updatePayload: ProfileUpdate =
    kind === 'logo'
      ? { logo_url: url, updated_at: now }
      : { signature_url: url, updated_at: now };

  const { data, error } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', authUserId)
    .select('id, logo_url, signature_url');

  debugProfileTrace('updateProfileAssetUrl.update', {
    authUserId,
    updatePayload,
    rowsReturned: data?.length ?? 0,
    returning: data ?? null,
    error: error?.message ?? null,
  });

  if (error) {
    logSupabaseError('updateProfileAssetUrl', error);
    throw error;
  }
}
