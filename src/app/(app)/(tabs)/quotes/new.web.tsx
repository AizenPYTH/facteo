import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuoteWizardScreen } from '@/components/quotes/quote-wizard-screen';
import { LoadingView } from '@/components/ui/loading-view';
import { DesktopWizardFrame } from '@/components/web/desktop/layout/desktop-wizard-frame';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useThemedStyles } from '@/hooks/use-colors';
import {
  useWizardClientPrefill,
  type WizardClientPrefill,
} from '@/hooks/use-wizard-client-prefill';
import {
  createEmptyQuoteWizardState,
  type QuoteWizardState,
} from '@/lib/quotes/form';

const WIZARD_STEPS = [
  { id: 1, label: 'Client', description: 'Sélectionner ou créer un client' },
  { id: 2, label: 'Prestations', description: 'Ajouter les lignes du devis' },
  { id: 3, label: 'Validation', description: 'Finaliser et envoyer' },
];

export default function NewQuoteScreen() {
  const styles = useStyles();
  const { isReady, isLoading, prefill, initialStep, autoReplay } = useWizardClientPrefill();

  if (!isReady || isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <LoadingView message="Préparation du devis…" />
      </SafeAreaView>
    );
  }

  return <NewQuoteReady autoReplay={autoReplay} initialStep={initialStep} prefill={prefill} />;
}

function NewQuoteReady({
  prefill,
  initialStep,
  autoReplay,
}: {
  prefill: WizardClientPrefill | null;
  initialStep: number;
  autoReplay: boolean;
}) {
  const { isWeb, isDesktop } = useBreakpoint();
  const [currentStep, setCurrentStep] = useState(initialStep);

  const initialState = useMemo<QuoteWizardState | undefined>(() => {
    if (!prefill) {
      return undefined;
    }

    return {
      ...createEmptyQuoteWizardState(),
      clientId: prefill.clientId,
      clientName: prefill.clientName,
    };
  }, [prefill]);

  const wizard = (
    <QuoteWizardScreen
      autoReplay={autoReplay}
      initialState={initialState}
      initialStep={initialStep}
      mode="create"
      onStepChange={setCurrentStep}
      title="Nouveau devis"
      variant={isWeb && isDesktop ? 'desktop' : 'mobile'}
    />
  );

  if (isWeb && isDesktop) {
    return (
      <DesktopWizardFrame
        currentStep={currentStep}
        onClose={() => router.back()}
        steps={WIZARD_STEPS}
        subtitle="Création guidée — pensée pour le bureau"
        title="Nouveau devis">
        {wizard}
      </DesktopWizardFrame>
    );
  }

  return wizard;
}

function useStyles() {
  return useThemedStyles((colors) => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
  }));
}
