import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { createQuote } from '@/lib/supabase/quotes';
import { quotesQueryKeys } from '@/lib/supabase/query-keys';
import type { CreateQuoteInput } from '@/types/quote';

export function useQuoteMutations() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createQuoteMutation = useMutation({
    mutationFn: (input: CreateQuoteInput) => {
      if (!user?.id) {
        throw new Error('User must be authenticated to create a quote.');
      }

      return createQuote(user.id, input);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all });
    },
  });

  return {
    createQuote: createQuoteMutation,
  };
}
