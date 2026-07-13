import { router, type Href } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';

import { QuoteWizardScreen } from '@/components/quotes/quote-wizard-screen';
import { LoadingView } from '@/components/ui/loading-view';
import { useColors } from '@/hooks/use-colors';
import { useQuote } from '@/hooks/use-quote';
import { mapQuoteDetailToWizardState } from '@/lib/quotes/form';
import { useToast } from '@/providers/toast-provider';
import { canEditQuote } from '@/types/quote';

export default function EditQuoteScreen() {
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const quoteId = Array.isArray(id) ? id[0] : id ?? '';
  const { data: quote, isLoading, isFetched } = useQuote(quoteId);
  const { showError } = useToast();

  const initialState = useMemo(
    () => (quote ? mapQuoteDetailToWizardState(quote) : undefined),
    [quote],
  );

  useEffect(() => {
    if (!isFetched) {
      return;
    }

    if (!quote) {
      showError('Devis introuvable.');
      router.back();
      return;
    }

    if (!canEditQuote(quote.status)) {
      showError('Seuls les devis en brouillon peuvent être modifiés.');
      router.replace(`/quotes/${quoteId}` as Href);
    }
  }, [isFetched, quote, quoteId, showError]);

  if (isLoading || !quote || !initialState) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}>
        <LoadingView message="Chargement du devis..." />
      </SafeAreaView>
    );
  }

  if (!canEditQuote(quote.status)) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.backgroundGrouped }}>
        <LoadingView message="Redirection..." />
      </SafeAreaView>
    );
  }

  return (
    <QuoteWizardScreen
      initialState={initialState}
      mode="edit"
      quoteId={quoteId}
      title="Modifier le devis"
    />
  );
}
