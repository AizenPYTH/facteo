import { router } from 'expo-router';
import { useState } from 'react';

import { QuoteWizardScreen } from '@/components/quotes/quote-wizard-screen';
import { DesktopWizardFrame } from '@/components/web/desktop/layout/desktop-wizard-frame';
import { useBreakpoint } from '@/hooks/use-breakpoint';

const WIZARD_STEPS = [
  { id: 1, label: 'Client', description: 'Sélectionner ou créer un client' },
  { id: 2, label: 'Prestations', description: 'Ajouter les lignes du devis' },
  { id: 3, label: 'Validation', description: 'Finaliser et envoyer' },
];

export default function NewQuoteScreen() {
  const { isWeb, isDesktop } = useBreakpoint();
  const [currentStep, setCurrentStep] = useState(1);

  if (isWeb && isDesktop) {
    return (
      <DesktopWizardFrame
        currentStep={currentStep}
        onClose={() => router.back()}
        steps={WIZARD_STEPS}
        subtitle="Création guidée — pensée pour le bureau"
        title="Nouveau devis">
        <QuoteWizardScreen
          mode="create"
          onStepChange={setCurrentStep}
          title="Nouveau devis"
          variant="desktop"
        />
      </DesktopWizardFrame>
    );
  }

  return <QuoteWizardScreen mode="create" title="Nouveau devis" />;
}
