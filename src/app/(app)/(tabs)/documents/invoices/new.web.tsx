import { router } from 'expo-router';
import { useState } from 'react';

import { InvoiceWizardScreen } from '@/components/invoices/invoice-wizard-screen';
import { DesktopWizardFrame } from '@/components/web/desktop/layout/desktop-wizard-frame';
import { useBreakpoint } from '@/hooks/use-breakpoint';

const WIZARD_STEPS = [
  { id: 1, label: 'Client', description: 'Sélectionner ou créer un client' },
  { id: 2, label: 'Prestations', description: 'Ajouter les lignes de facturation' },
  { id: 3, label: 'Validation', description: 'Finaliser et envoyer' },
];

export default function NewInvoiceScreen() {
  const { isWeb, isDesktop } = useBreakpoint();
  const [currentStep, setCurrentStep] = useState(1);

  if (isWeb && isDesktop) {
    return (
      <DesktopWizardFrame
        currentStep={currentStep}
        onClose={() => router.back()}
        steps={WIZARD_STEPS}
        subtitle="Création guidée — pensée pour le bureau"
        title="Nouvelle facture">
        <InvoiceWizardScreen
          mode="create"
          onStepChange={setCurrentStep}
          title="Nouvelle facture"
          variant="desktop"
        />
      </DesktopWizardFrame>
    );
  }

  return <InvoiceWizardScreen mode="create" title="Nouvelle facture" />;
}
