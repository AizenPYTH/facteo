import { supabase } from '@/lib/supabase';
import { logSupabaseError } from '@/lib/supabase/errors';
import { readLocalFileAsBytes } from '@/lib/files/read-as-bytes';
import { debugProfileTrace } from '@/lib/supabase/profile-debug';
import { assertCurrentUserFeature } from '@/lib/subscription/enforce';
import type { ProfileUpdate } from '@/types/database';

export const COMPANY_ASSETS_BUCKET = 'company-assets';

export type CompanyAssetKind = 'logo' | 'signature';

function buildAssetPath(companyId: string, kind: CompanyAssetKind, extension: string): string {
  const timestamp = Date.now();
  return `${companyId}/${kind}-${timestamp}.${extension}`;
}

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
  await assertCurrentUserFeature(kind === 'logo' ? 'custom_logo' : 'company_signature');
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

  return getPublicStorageUrl(path);
}

export async function deleteCompanyAssetByUrl(publicUrl: string): Promise<void> {
  const marker = `/storage/v1/object/public/${COMPANY_ASSETS_BUCKET}/`;

  if (!publicUrl.includes(marker)) {
    return;
  }

  const path = publicUrl.split(marker)[1];

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

  const updatedRow = data?.[0] ?? null;

  if (!updatedRow) {
    const { data: profileAfter, error: profileAfterError } = await supabase
      .from('profiles')
      .select('id, logo_url, signature_url')
      .eq('id', authUserId)
      .maybeSingle();

    debugProfileTrace('updateProfileAssetUrl.profileAfterFailure', {
      authUserId,
      profileAfter,
      profileAfterError: profileAfterError?.message ?? null,
    });

    throw new Error('Profil introuvable après mise à jour.');
  }
}
