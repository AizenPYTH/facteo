import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useTenant } from '@/hooks/use-tenant';
import type { CompanyProfileAssets } from '@/hooks/use-company-profile-assets';
import {
  cacheCompanyAssetUrl,
  getCachedCompanyAssetUrl,
  pickCompanyAsset,
} from '@/lib/company-assets/image';
import { updateCompanyAssetUrl } from '@/lib/supabase/companies';
import {
  deleteCompanyAssetByUrl,
  uploadCompanyAsset,
  type CompanyAssetKind,
} from '@/lib/supabase/storage';
import { requireScope } from '@/lib/tenant/scope';
import { profilesQueryKeys } from '@/lib/supabase/query-keys';

export type CompanyAssetMutationResult =
  | { status: 'cancelled' }
  | { status: 'success'; url: string | null };

export function useCompanyAsset(kind: CompanyAssetKind) {
  const { scope } = useTenant();
  const queryClient = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: async (currentUrl: string | null): Promise<CompanyAssetMutationResult> => {
      const activeScope = requireScope(scope);
      const picked = await pickCompanyAsset(kind);

      if (!picked) {
        return { status: 'cancelled' };
      }

      if (currentUrl) {
        try {
          await deleteCompanyAssetByUrl(currentUrl);
        } catch {
          // Ignore delete errors for replaced assets.
        }
      }

      const publicUrl = await uploadCompanyAsset(
        activeScope.companyId,
        kind,
        picked.uri,
        picked.mimeType,
      );
      const field = kind === 'logo' ? 'logo_url' : 'signature_url';
      await updateCompanyAssetUrl(activeScope.companyId, field, publicUrl);
      await cacheCompanyAssetUrl(activeScope.companyId, kind, publicUrl);
      return { status: 'success', url: publicUrl };
    },
    onSuccess: (result) => {
      if (result.status !== 'success' || !scope?.companyId) {
        return;
      }

      queryClient.setQueryData<CompanyProfileAssets>(
        profilesQueryKeys.assets(scope.companyId),
        (current) => {
          if (!current) {
            return {
              logoUrl: kind === 'logo' ? result.url : null,
              signatureUrl: kind === 'signature' ? result.url : null,
            };
          }

          return {
            ...current,
            [kind === 'logo' ? 'logoUrl' : 'signatureUrl']: result.url,
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: profilesQueryKeys.company(scope.companyId) });
      queryClient.invalidateQueries({ queryKey: profilesQueryKeys.assets(scope.companyId) });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (currentUrl: string | null): Promise<CompanyAssetMutationResult> => {
      const activeScope = requireScope(scope);

      if (currentUrl) {
        await deleteCompanyAssetByUrl(currentUrl);
      }

      const field = kind === 'logo' ? 'logo_url' : 'signature_url';
      await updateCompanyAssetUrl(activeScope.companyId, field, null);
      await cacheCompanyAssetUrl(activeScope.companyId, kind, null);
      return { status: 'success', url: null };
    },
    onSuccess: (result) => {
      if (result.status !== 'success' || !scope?.companyId) {
        return;
      }

      queryClient.setQueryData<CompanyProfileAssets>(
        profilesQueryKeys.assets(scope.companyId),
        (current) => {
          if (!current) {
            return {
              logoUrl: null,
              signatureUrl: null,
            };
          }

          return {
            ...current,
            [kind === 'logo' ? 'logoUrl' : 'signatureUrl']: null,
          };
        },
      );

      queryClient.invalidateQueries({ queryKey: profilesQueryKeys.company(scope.companyId) });
      queryClient.invalidateQueries({ queryKey: profilesQueryKeys.assets(scope.companyId) });
    },
  });

  async function getOfflineFallback(companyId: string): Promise<string | null> {
    return getCachedCompanyAssetUrl(companyId, kind);
  }

  return {
    uploadAsset: uploadMutation,
    deleteAsset: deleteMutation,
    getOfflineFallback,
  };
}
