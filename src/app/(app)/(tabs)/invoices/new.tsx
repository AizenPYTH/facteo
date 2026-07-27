import { useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InvoiceWizardScreen } from '@/components/invoices/invoice-wizard-screen';
import { LoadingView } from '@/components/ui/loading-view';
import { useThemedStyles } from '@/hooks/use-colors';
import { useWizardClientPrefill } from '@/hooks/use-wizard-client-prefill';
import {
  createEmptyInvoiceWizardState,
  type InvoiceWizardState,
} from '@/lib/invoices/form';

export default function NewInvoiceScreen() {
  const styles = useStyles();
  const { isReady, isLoading, prefill, initialStep, autoReplay } = useWizardClientPrefill();

  const initialState = useMemo<InvoiceWizardState | undefined>(() => {
    if (!prefill) {
      return undefined;
    }

    return {
      ...createEmptyInvoiceWizardState(),
      clientId: prefill.clientId,
      clientName: prefill.clientName,
    };
  }, [prefill]);

  if (!isReady || isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <LoadingView message="Préparation de la facture…" />
      </SafeAreaView>
    );
  }

  return (
    <InvoiceWizardScreen
      autoReplay={autoReplay}
      initialState={initialState}
      initialStep={initialStep}
      mode="create"
      title="Nouvelle facture"
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
