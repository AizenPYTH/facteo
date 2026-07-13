import { router, type Href } from 'expo-router';
import * as Linking from 'expo-linking';

import { Button } from '@/components/ui/button';
import { useStripePayment } from '@/hooks/use-stripe-payment';
import { useSubscription } from '@/hooks/use-subscription';
import { useToast } from '@/providers/toast-provider';

type InvoiceStripePaymentButtonProps = {
  invoiceId: string;
  amountDue: number;
  existingPaymentLink?: string | null;
};

export function InvoiceStripePaymentButton({
  invoiceId,
  amountDue,
  existingPaymentLink,
}: InvoiceStripePaymentButtonProps) {
  const { isConfigured, createLink, openPaymentLink } = useStripePayment(invoiceId);
  const { hasFeature } = useSubscription();
  const { showError, showSuccess } = useToast();
  const isLocked = !hasFeature('stripe_payments');

  async function handlePress() {
    if (isLocked) {
      router.push('/settings/premium' as Href);
      return;
    }

    if (!isConfigured) {
      showError('Le paiement en ligne n’est pas encore configuré.');
      return;
    }

    try {
      if (existingPaymentLink) {
        await openPaymentLink(existingPaymentLink);
        return;
      }

      const result = await createLink.mutateAsync(amountDue);
      await Linking.openURL(result.paymentLinkUrl);
      showSuccess('Redirection vers Stripe...');
    } catch {
      showError('Impossible d’ouvrir le paiement en ligne.');
    }
  }

  if (amountDue <= 0) {
    return null;
  }

  return (
    <Button
      loading={createLink.isPending}
      onPress={() => {
        void handlePress();
      }}
      title={isLocked ? 'Paiement Stripe (Premium)' : 'Payer en ligne'}
      variant="ghost"
    />
  );
}
