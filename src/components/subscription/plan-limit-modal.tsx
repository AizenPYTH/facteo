import { router, type Href } from 'expo-router';

import { ConfirmationModal } from '@/components/ui/confirmation-modal';

export type PlanLimitModalProps = {
  visible: boolean;
  onClose: () => void;
};

export function PlanLimitModal({ visible, onClose }: PlanLimitModalProps) {
  return (
    <ConfirmationModal
      cancelLabel="Fermer"
      confirmLabel="Voir les offres"
      destructive={false}
      message="Vous avez atteint la limite de votre offre actuelle. Passez à une offre supérieure pour continuer."
      onCancel={onClose}
      onConfirm={() => {
        onClose();
        router.push('/settings/premium' as Href);
      }}
      title="Limite atteinte"
      visible={visible}
    />
  );
}
