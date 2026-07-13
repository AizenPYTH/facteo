import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { deleteDocumentSignatureByUrl } from '@/lib/supabase/document-signatures-storage';
import { subscriptionQueryKeys } from '@/lib/supabase/query-keys';
import {
  deleteDocumentSignature,
  fetchDocumentSignature,
  upsertDocumentSignature,
  type DocumentSignature,
} from '@/lib/supabase/subscriptions';
import { uploadDocumentSignatureFromDataUri } from '@/lib/supabase/document-signatures-storage';

export function useDocumentSignature(
  documentType: 'quote' | 'invoice',
  documentId: string,
) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const queryKey = subscriptionQueryKeys.documentSignature(documentType, documentId);

  const signatureQuery = useQuery({
    queryKey,
    queryFn: () => fetchDocumentSignature(documentType, documentId),
    enabled: Boolean(documentId),
  });

  const saveSignatureMutation = useMutation({
    mutationFn: async (input: { dataUri: string; signerName?: string | null }) => {
      if (!user?.id) {
        throw new Error('User must be authenticated.');
      }

      const existing = signatureQuery.data;
      const previousUrl = existing?.signatureUrl ?? null;

      const signatureUrl = await uploadDocumentSignatureFromDataUri(
        user.id,
        documentType,
        documentId,
        input.dataUri,
      );

      try {
        return await upsertDocumentSignature({
          userId: user.id,
          documentType,
          documentId,
          signatureUrl,
          signerName: input.signerName ?? null,
        });
      } catch (error) {
        await deleteDocumentSignatureByUrl(signatureUrl).catch(() => undefined);
        throw error;
      } finally {
        if (previousUrl && previousUrl !== signatureUrl) {
          await deleteDocumentSignatureByUrl(previousUrl).catch(() => undefined);
        }
      }
    },
    onSuccess: (savedSignature) => {
      queryClient.setQueryData<DocumentSignature | null>(queryKey, savedSignature);
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  const clearSignatureMutation = useMutation({
    mutationFn: async () => {
      const existing = signatureQuery.data;

      if (existing?.signatureUrl) {
        await deleteDocumentSignatureByUrl(existing.signatureUrl);
      }

      await deleteDocumentSignature(documentType, documentId);
    },
    onSuccess: () => {
      queryClient.setQueryData<DocumentSignature | null>(queryKey, null);
      void queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    signature: signatureQuery.data ?? null,
    isLoading: signatureQuery.isLoading,
    saveSignature: saveSignatureMutation,
    clearSignature: clearSignatureMutation,
  };
}
