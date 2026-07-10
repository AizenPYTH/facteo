import { router, type Href } from 'expo-router';
import { useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  QuoteClientStep,
  QuoteLinesStep,
  QuoteProductsStep,
  QuoteScreenHeader,
  QuoteSummaryStep,
  QuoteWizardProgress,
} from '@/components/quotes';
import { Button } from '@/components/ui/button';
import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import { useInfiniteProducts } from '@/hooks/use-products';
import { useQuoteMutations } from '@/hooks/use-quote-mutations';
import { mapQuoteLinesToDocumentTotals } from '@/lib/quotes/mappers';
import { getQuoteErrorMessage } from '@/lib/quotes/errors';
import { areQuoteLinesValid } from '@/lib/quotes/validators';
import { useToast } from '@/providers/toast-provider';
import type { QuoteLineValue } from '@/types/quote';

const TOTAL_STEPS = 4;

export default function NewQuoteScreen() {
  const { createQuote } = useQuoteMutations();
  const { showError, showSuccess } = useToast();
  const { products } = useInfiniteProducts('');

  const [step, setStep] = useState(1);
  const [clientId, setClientId] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [lines, setLines] = useState<QuoteLineValue[]>([]);

  const totals = useMemo(() => mapQuoteLinesToDocumentTotals(lines), [lines]);

  function handleSelectClient(client: { id: string; name: string; company: string | null }) {
    setClientId(client.id);
    setClientName(client.company?.trim() || client.name);
  }

  function handleAddLine(line: QuoteLineValue) {
    setLines((current) => [...current, line]);
  }

  function handleChangeLine(index: number, line: QuoteLineValue) {
    setLines((current) => current.map((item, itemIndex) => (itemIndex === index ? line : item)));
  }

  function handleRemoveLine(index: number) {
    setLines((current) => current.filter((_, itemIndex) => itemIndex !== index));
  }

  function canGoNext(): boolean {
    switch (step) {
      case 1:
        return Boolean(clientId);
      case 2:
        return lines.length > 0;
      case 3:
        return areQuoteLinesValid(lines);
      case 4:
        return areQuoteLinesValid(lines) && Boolean(clientId);
      default:
        return false;
    }
  }

  function handleNext() {
    if (!canGoNext()) {
      if (step === 1) {
        showError('Sélectionnez un client pour continuer.');
      } else if (step === 2) {
        showError('Ajoutez au moins un produit ou service.');
      } else if (step === 3) {
        showError('Vérifiez les quantités et les montants de chaque ligne.');
      }

      return;
    }

    if (step < TOTAL_STEPS) {
      setStep((current) => current + 1);
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep((current) => current - 1);
    } else {
      router.back();
    }
  }

  async function handleSave() {
    if (!clientId || !areQuoteLinesValid(lines)) {
      showError('Le devis est incomplet.');
      return;
    }

    try {
      await createQuote.mutateAsync({
        clientId,
        lines,
      });
      showSuccess('Devis enregistré avec succès');
      router.replace('/quotes' as Href);
    } catch (error) {
      const rawMessage =
        error && typeof error === 'object' && 'message' in error
          ? String((error as { message: string }).message)
          : "Une erreur est survenue lors de l'enregistrement.";

      showError(getQuoteErrorMessage(rawMessage));
    }
  }

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <QuoteClientStep onSelectClient={handleSelectClient} selectedClientId={clientId} />
        );
      case 2:
        return <QuoteProductsStep lines={lines} onAddLine={handleAddLine} />;
      case 3:
        return (
          <QuoteLinesStep
            lines={lines}
            onChangeLine={handleChangeLine}
            onRemoveLine={handleRemoveLine}
            products={products}
          />
        );
      case 4:
        return <QuoteSummaryStep clientName={clientName} lines={lines} totals={totals} />;
      default:
        return null;
    }
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <QuoteScreenHeader title="Nouveau devis" />
        <QuoteWizardProgress currentStep={step} />
      </View>

      <View style={styles.body}>{renderStep()}</View>

      <View style={styles.footer}>
        <Button onPress={handleBack} title={step === 1 ? 'Annuler' : 'Précédent'} variant="ghost" />
        {step < TOTAL_STEPS ? (
          <Button disabled={!canGoNext()} onPress={handleNext} title="Suivant" />
        ) : (
          <Button
            loading={createQuote.isPending}
            onPress={handleSave}
            title="Enregistrer le devis"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundGrouped,
  },
  header: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  scroll: {
    flex: 1,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.screenPaddingHorizontal,
  },
  content: {
    paddingBottom: spacing.lg,
    flexGrow: 1,
  },
  footer: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    backgroundColor: colors.surface,
  },
});
