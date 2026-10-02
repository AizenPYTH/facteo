import { useLocalSearchParams } from 'expo-router';

import { InvoiceWizardScreen } from '@/components/invoices/invoice-wizard-screen';

/**
 * `?voice=1` : ouverture par le raccourci Siri. Le texte dicté a été mis de
 * côté par `+native-intent` et est appliqué une fois l'écran prêt.
 */
export default function NewInvoiceScreen() {
  const { voice } = useLocalSearchParams<{ voice?: string }>();

  return <InvoiceWizardScreen fromSiri={voice === '1'} mode="create" title="Nouvelle facture" />;
}
