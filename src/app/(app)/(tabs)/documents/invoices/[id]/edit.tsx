import { router, type Href } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { InvoiceWizardScreen } from '@/components/invoices/invoice-wizard-screen';
import { LoadingView } from '@/components/ui/loading-view';
import { useColors } from '@/hooks/use-colors';
import { useInvoice } from '@/hooks/use-invoices';
import { mapInvoiceDetailToWizardState } from '@/lib/invoices/form';
import { useToast } from '@/providers/toast-provider';
import { canEditInvoice } from '@/types/invoice';

export default function EditInvoiceScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const invoiceId = Array.isArray(id) ? id[0] : id ?? '';
  const { data: invoice, isLoading, isFetched } = useInvoice(invoiceId);
  const { showError } = useToast();

  const initialState = useMemo(
    () => (invoice ? mapInvoiceDetailToWizardState(invoice) : undefined),
    [invoice],
  );

  useEffect(() => {
    if (!isFetched) {
      return;
    }

    if (!invoice) {
      showError('Facture introuvable.');
      router.back();
      return;
    }

    if (!canEditInvoice(invoice.status)) {
      showError('Seules les factures en brouillon peuvent être modifiées.');
      router.replace(`/documents/invoices/${invoiceId}` as Href);
    }
  }, [invoice, invoiceId, isFetched, showError]);

  if (isLoading || !invoice || !initialState) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}>
        <LoadingView message="Chargement de la facture..." />
      </SafeAreaView>
    );
  }

  if (!canEditInvoice(invoice.status)) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}>
        <LoadingView message="Redirection..." />
      </SafeAreaView>
    );
  }

  return (
    <InvoiceWizardScreen
      initialState={initialState}
      invoiceId={invoiceId}
      mode="edit"
      title="Modifier la facture"
    />
  );
}
