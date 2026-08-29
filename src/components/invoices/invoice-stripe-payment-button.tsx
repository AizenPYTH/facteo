import { router, type Href } from 'expo-router';
import { Share } from 'react-native';

import { Button } from '@/components/ui/button';
import { useStripePayment } from '@/hooks/use-stripe-payment';
import { useSubscription } from '@/hooks/use-subscription';
import { useToast } from '@/providers/toast-provider';

type InvoicePaymentLinkButtonProps = {
  invoiceId: string;
  amountDue: number;
  existingPaymentLink?: string | null;
};

/**
 * « Lien de paiement » — DESIGN §5.4
 * Copie / partage le lien destiné au client. N’ouvre jamais le checkout côté vendeur.
 */
export function InvoicePaymentLinkButton({
  invoiceId,
  amountDue,
  existingPaymentLink,
}: InvoicePaymentLinkButtonProps) {
  const { isConfigured, createLink } = useStripePayment(invoiceId);
  const { hasFeature } = useSubscription();
  const { showError, showSuccess } = useToast();
  const isLocked = !hasFeature('stripe_payments');

  async function handlePress() {
    if (isLocked) {
      router.push('/settings/premium' as Href);
      return;
    }

    if (!isConfigured) {
      showError('Le lien de paiement n’est pas encore configuré.');
      return;
    }

    try {
      const url =
        existingPaymentLink ?? (await createLink.mutateAsync(amountDue)).paymentLinkUrl;

      await Share.share({
        message: `Lien de paiement pour votre facture : ${url}`,
        url,
      });
      showSuccess('Lien prêt à être partagé avec votre client.');
    } catch {
      showError('Impossible de préparer le lien de paiement.');
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
      title={isLocked ? 'Lien de paiement (Premium)' : 'Lien de paiement'}
      variant="secondary"
    />
  );
}

/** @deprecated Prefer InvoicePaymentLinkButton */
export const InvoiceStripePaymentButton = InvoicePaymentLinkButton;
