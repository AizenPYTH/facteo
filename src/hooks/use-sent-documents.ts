import { useQuery } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { fetchSentDocumentsForDocument } from '@/lib/supabase/sent-documents';
import { sentDocumentsQueryKeys } from '@/lib/supabase/query-keys';
import type { SentDocumentType } from '@/types/sent-document';

export function useSentDocuments(documentType: SentDocumentType, documentId: string) {
  const { user } = useAuth();

  return useQuery({
    queryKey: sentDocumentsQueryKeys.forDocument(user?.id ?? '', documentType, documentId),
    queryFn: () => fetchSentDocumentsForDocument(user!.id, documentType, documentId),
    enabled: Boolean(user?.id && documentId),
  });
}
