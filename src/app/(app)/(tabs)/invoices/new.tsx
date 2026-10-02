import { useLocalSearchParams } from 'expo-router';

import { InvoiceWizardScreen } from '@/components/invoices/invoice-wizard-screen';

/**
 * `inveq://invoices/new?dictation=…` (raccourci Siri) ouvre la création avec
 * la facture remplie à partir du texte dicté.
 */
export default function NewInvoiceScreen() {
  const { dictation } = useLocalSearchParams<{ dictation?: string }>();
  const text = Array.isArray(dictation) ? dictation[0] : dictation;

  return <InvoiceWizardScreen dictation={text?.trim() || undefined} mode="create" title="Nouvelle facture" />;
}
