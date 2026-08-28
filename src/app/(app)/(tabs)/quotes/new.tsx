import { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuoteWizardScreen } from '@/components/quotes/quote-wizard-screen';
import { LoadingView } from '@/components/ui/loading-view';
import { useThemedStyles } from '@/hooks/use-colors';
import { useWizardClientPrefill } from '@/hooks/use-wizard-client-prefill';
import {
  createEmptyQuoteWizardState,
  type QuoteWizardState,
} from '@/lib/quotes/form';

export default function NewQuoteScreen() {
  const styles = useStyles();
  const { isReady, isLoading, prefill, initialStep, autoReplay } = useWizardClientPrefill();

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

  if (!isReady || isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <LoadingView message="Préparation du devis…" />
      </SafeAreaView>
    );
  }

  return (
    <QuoteWizardScreen
      autoReplay={autoReplay}
      initialState={initialState}
      initialStep={initialStep}
      mode="create"
      title="Nouveau devis"
    />
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
  }));
}
