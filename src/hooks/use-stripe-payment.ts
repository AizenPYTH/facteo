import { useMutation, useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/use-auth';
import { createInvoicePaymentLink, isStripeConfigured, openPaymentLink } from '@/lib/stripe/payment-link';
import { invoicesQueryKeys } from '@/lib/supabase/query-keys';

export function useStripePayment(invoiceId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createLink = useMutation({
    mutationFn: async (amount: number) => {
      if (!user?.id) {
        throw new Error('Utilisateur non authentifié.');
      }

      return createInvoicePaymentLink(user.id, {
        invoiceId,
        amount,
        allowPartialPayment: true,
      });
    },
    onSuccess: () => {
      if (user?.id) {
        queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.detail(user.id, invoiceId) });
      }
    },
  });

  return {
    isConfigured: isStripeConfigured(),
    createLink,
    openPaymentLink,
  };
}
