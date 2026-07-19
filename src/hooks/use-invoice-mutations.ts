import { useMutation, useQueryClient, type InfiniteData } from '@tanstack/react-query';

import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import {
  addInvoicePayment,
  cancelInvoice,
  createInvoice,
  duplicateInvoice,
  markInvoiceAsPaid,
  updateInvoice,
  updateInvoiceStatus,
  type AddPaymentInput,
} from '@/lib/supabase/invoices';
import { dashboardQueryKeys, invoicesQueryKeys } from '@/lib/supabase/query-keys';
import { enforcePlanLimit } from '@/lib/subscription/limit-guard';
import { useSubscriptionContext } from '@/providers/subscription-provider';
import type { CreateInvoiceInput, InvoiceDetail, InvoiceStatus, UpdateInvoiceInput } from '@/types/invoice';
import type { InvoicesPage } from '@/types/invoices-list';

export function useInvoiceMutations() {
  const { scope } = useTenant();
  const { showLimitModal } = useSubscriptionContext();
  const queryClient = useQueryClient();

  function invalidateInvoices(invoiceId?: string) {
    queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
    queryClient.invalidateQueries({ queryKey: dashboardQueryKeys.all });

    if (invoiceId && scope?.companyId) {
      queryClient.invalidateQueries({
        queryKey: invoicesQueryKeys.detail(scope.companyId, invoiceId),
      });
    }
  }

  function updateInvoicesInLists(updater: (invoices: InvoicesPage['invoices']) => InvoicesPage['invoices']) {
    queryClient.setQueriesData<InfiniteData<InvoicesPage>>(
      { queryKey: invoicesQueryKeys.lists() },
      (current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          pages: current.pages.map((page) => ({
            ...page,
            invoices: updater(page.invoices),
          })),
        };
      },
    );
  }

  const createInvoiceMutation = useMutation({
    mutationFn: async (input: CreateInvoiceInput) => {
      await enforcePlanLimit('documents', showLimitModal);
      return createInvoice(requireScope(scope), input);
    },
    onSuccess: () => invalidateInvoices(),
  });

  const updateInvoiceMutation = useMutation({
    mutationFn: ({ invoiceId, input }: { invoiceId: string; input: UpdateInvoiceInput }) =>
      updateInvoice(requireScope(scope), invoiceId, input),
    onSuccess: (_, { invoiceId }) => invalidateInvoices(invoiceId),
  });

  const updateInvoiceStatusMutation = useMutation({
    mutationFn: ({ invoiceId, status }: { invoiceId: string; status: InvoiceStatus }) =>
      updateInvoiceStatus(requireScope(scope), invoiceId, status),
    onMutate: async ({ invoiceId, status }) => {
      if (!scope?.companyId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: invoicesQueryKeys.all });

      const detailKey = invoicesQueryKeys.detail(scope.companyId, invoiceId);
      const previousDetail = queryClient.getQueryData<InvoiceDetail | null>(detailKey);

      if (previousDetail) {
        queryClient.setQueryData(detailKey, { ...previousDetail, status });
      }

      updateInvoicesInLists((invoices) =>
        invoices.map((invoice) => (invoice.id === invoiceId ? { ...invoice, status } : invoice)),
      );

      return { previousDetail };
    },
    onError: (_error, { invoiceId }, context) => {
      if (!scope?.companyId || !context?.previousDetail) {
        return;
      }

      queryClient.setQueryData(invoicesQueryKeys.detail(scope.companyId, invoiceId), context.previousDetail);
    },
    onSettled: (_, __, { invoiceId }) => invalidateInvoices(invoiceId),
  });

  const cancelInvoiceMutation = useMutation({
    mutationFn: (invoiceId: string) => cancelInvoice(requireScope(scope), invoiceId),
    onMutate: async (invoiceId) => {
      if (!scope?.companyId) {
        return {};
      }

      await queryClient.cancelQueries({ queryKey: invoicesQueryKeys.all });

      const detailKey = invoicesQueryKeys.detail(scope.companyId, invoiceId);
      const previousDetail = queryClient.getQueryData<InvoiceDetail | null>(detailKey);

      if (previousDetail) {
        queryClient.setQueryData(detailKey, { ...previousDetail, status: 'canceled' });
      }

      updateInvoicesInLists((invoices) =>
        invoices.map((invoice) =>
          invoice.id === invoiceId ? { ...invoice, status: 'canceled' } : invoice,
        ),
      );

      return { previousDetail };
    },
    onError: (_error, invoiceId, context) => {
      if (!scope?.companyId || !context?.previousDetail) {
        return;
      }

      queryClient.setQueryData(invoicesQueryKeys.detail(scope.companyId, invoiceId), context.previousDetail);
    },
    onSettled: (_, __, invoiceId) => invalidateInvoices(invoiceId),
  });

  const markAsPaidMutation = useMutation({
    mutationFn: ({
      invoiceId,
      paymentMethod,
      paymentReference,
    }: {
      invoiceId: string;
      paymentMethod?: string;
      paymentReference?: string;
    }) => markInvoiceAsPaid(requireScope(scope), invoiceId, paymentMethod, paymentReference),
    onSuccess: (_, { invoiceId }) => invalidateInvoices(invoiceId),
  });

  const addPaymentMutation = useMutation({
    mutationFn: ({ invoiceId, input }: { invoiceId: string; input: AddPaymentInput }) =>
      addInvoicePayment(requireScope(scope), invoiceId, input),
    onSuccess: (_, { invoiceId }) => invalidateInvoices(invoiceId),
  });

  const duplicateInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: string) => {
      await enforcePlanLimit('documents', showLimitModal);
      return duplicateInvoice(requireScope(scope), invoiceId);
    },
    onSuccess: () => invalidateInvoices(),
  });

  return {
    createInvoice: createInvoiceMutation,
    updateInvoice: updateInvoiceMutation,
    updateInvoiceStatus: updateInvoiceStatusMutation,
    cancelInvoice: cancelInvoiceMutation,
    markAsPaid: markAsPaidMutation,
    addPayment: addPaymentMutation,
    duplicateInvoice: duplicateInvoiceMutation,
  };
}
