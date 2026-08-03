import { ConfirmationModal } from '@/components/ui/confirmation-modal';
import { usePremiumCheckout } from '@/hooks/use-premium-checkout';
import { useToast } from '@/providers/toast-provider';

export type PlanLimitModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PlanLimitModal({ visible, onClose }: PlanLimitModalProps) {
  const { startCheckout, subscribe, isConfigured } = usePremiumCheckout();
  const { showError, showSuccess } = useToast();

  async function handleUpgrade() {
    if (!isConfigured) {
      showError('Stripe n’est pas encore configuré. Contactez le support.');
      return;
    }

    try {
      onClose();
      const completed = await startCheckout();

      if (completed) {
        showSuccess('INVEQ Premium est activé.');
      }
    } catch (error) {
      showError(readErrorMessage(error));
    }
  }

  return (
    <ConfirmationModal
      cancelLabel="Fermer"
      confirmLabel="Voir les offres"
      destructive={false}
      loading={subscribe.isPending}
      message="Vous avez atteint la limite de votre offre actuelle. Passez à une offre supérieure pour continuer."
      onCancel={onClose}
      onConfirm={() => void handleUpgrade()}
      title="Limite atteinte"
      visible={visible}
    />
  );
}

function readErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return 'Impossible d’ouvrir le paiement Stripe.';
}
