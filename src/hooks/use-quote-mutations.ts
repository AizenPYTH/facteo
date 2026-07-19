import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import {
  createQuote,
  deleteQuote,
  duplicateQuote,
  updateQuote,
  updateQuoteStatus,
} from '@/lib/supabase/quotes';
import { convertQuoteToInvoice } from '@/lib/supabase/invoices';
import { enforcePlanLimit } from '@/lib/subscription/limit-guard';
import { quotesQueryKeys, invoicesQueryKeys } from '@/lib/supabase/query-keys';
import { useSubscriptionContext } from '@/providers/subscription-provider';
import type { CreateQuoteInput, QuoteDetail, QuoteStatus, UpdateQuoteInput } from '@/types/quote';
import type { QuotesPage } from '@/types/quotes-list';

export function useQuoteMutations() {
  const { scope } = useTenant();
  const { showLimitModal } = useSubscriptionContext();
  const queryClient = useQueryClient();

  function invalidateQuotes(quoteId?: string) {
    queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all });

    if (quoteId && scope?.companyId) {
      queryClient.invalidateQueries({
        queryKey: quotesQueryKeys.detail(scope.companyId, quoteId),
      });
    }
  }

  function updateQuotesInLists(updater: (quotes: QuotesPage['quotes']) => QuotesPage['quotes']) {
    queryClient.setQueriesData<InfiniteData<QuotesPage>>(
      { queryKey: quotesQueryKeys.lists() },
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            quotes: updater(page.quotes),
          })),
        };
      },
    );
  }

  const createQuoteMutation = useMutation({
    mutationFn: async (input: CreateQuoteInput) => {
      await enforcePlanLimit('documents', showLimitModal);
      return createQuote(requireScope(scope), input);
    },
    onSuccess: () => invalidateQuotes(),
  });

  const updateQuoteMutation = useMutation({
    mutationFn: ({ quoteId, input }: { quoteId: string; input: UpdateQuoteInput }) =>
      updateQuote(requireScope(scope), quoteId, input),
    onSuccess: (_, { quoteId }) => invalidateQuotes(quoteId),
  });

  const updateQuoteStatusMutation = useMutation({
    mutationFn: ({ quoteId, status }: { quoteId: string; status: QuoteStatus }) =>
      updateQuoteStatus(requireScope(scope), quoteId, status),
    onMutate: async ({ quoteId, status }) => {
      if (!scope?.companyId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: quotesQueryKeys.all });

      const detailKey = quotesQueryKeys.detail(scope.companyId, quoteId);
      const previousDetail = queryClient.getQueryData<QuoteDetail | null>(detailKey);

      if (previousDetail) {
        queryClient.setQueryData(detailKey, { ...previousDetail, status });
      }

      updateQuotesInLists((quotes) =>
        quotes.map((quote) => (quote.id === quoteId ? { ...quote, status } : quote)),
      );

      return { previousDetail };
    },
    onError: (_error, { quoteId }, context) => {
      if (!scope?.companyId || !context?.previousDetail) {
        return;
      }

      queryClient.setQueryData(quotesQueryKeys.detail(scope.companyId, quoteId), context.previousDetail);
    },
    onSettled: (_, __, { quoteId }) => invalidateQuotes(quoteId),
  });

  const deleteQuoteMutation = useMutation({
    mutationFn: (quoteId: string) => deleteQuote(requireScope(scope), quoteId),
    onMutate: async (quoteId) => {
      await queryClient.cancelQueries({ queryKey: quotesQueryKeys.all });
      updateQuotesInLists((quotes) => quotes.filter((quote) => quote.id !== quoteId));
      return {};
    },
    onSettled: () => invalidateQuotes(),
  });

  const duplicateQuoteMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      await enforcePlanLimit('documents', showLimitModal);
      return duplicateQuote(requireScope(scope), quoteId);
    },
    onSuccess: () => invalidateQuotes(),
  });

  const convertToInvoiceMutation = useMutation({
    mutationFn: async (quoteId: string) => {
      await enforcePlanLimit('documents', showLimitModal);
      return convertQuoteToInvoice(requireScope(scope), quoteId);
    },
    onSuccess: () => {
      invalidateQuotes();
      queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  return {
    createQuote: createQuoteMutation,
    updateQuote: updateQuoteMutation,
    updateQuoteStatus: updateQuoteStatusMutation,
    deleteQuote: deleteQuoteMutation,
    duplicateQuote: duplicateQuoteMutation,
    convertToInvoice: convertToInvoiceMutation,
  };
}
