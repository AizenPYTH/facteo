import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert } from 'react-native';

import { FeatureIntroModal } from '@/components/feature-intros';
import { DocumentFinalizeStep } from '@/components/quotes/document-finalize-step';
import { QuoteAddLinesStep } from '@/components/quotes/quote-add-lines-step';
import { QuoteClientStep } from '@/components/quotes/quote-client-step';
import { QuoteScreenHeader } from '@/components/quotes/quote-screen-header';
import { QuoteWizardProgress } from '@/components/quotes/quote-wizard-progress';
import { WizardActionBar } from '@/components/ui/wizard-action-bar';
import { WizardScreen } from '@/components/ui/wizard-screen';
import { WizardTotalsSummary } from '@/components/ui/wizard-totals-summary';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { useFeatureIntro } from '@/hooks/use-feature-intro';
import { useQuoteMutations } from '@/hooks/use-quote-mutations';
import { useSettings } from '@/hooks/use-settings';
import { addDaysFrenchDateInput, todayFrenchDateInput } from '@/lib/format/date-input';
import { getQuoteErrorMessage } from '@/lib/quotes/errors';
import {
  createEmptyQuoteWizardState,
  type QuoteWizardState,
} from '@/lib/quotes/form';
import { mapLinesToDocumentTotals } from '@/lib/quotes/mappers';
import { isQuoteInfoValid, areQuoteLinesValid, parseQuoteInfoValues } from '@/lib/quotes/validators';
import { useToast } from '@/providers/toast-provider';
import { getClientDisplayName, type Client } from '@/types/client';
import type { QuoteLineValue } from '@/types/quote';

const TOTAL_STEPS = 3;

type QuoteWizardScreenProps = {
  mode: 'create' | 'edit';
  title: string;
  quoteId?: string;
  initialState?: QuoteWizardState;
  variant?: 'mobile' | 'desktop';
  onStepChange?: (step: number) => void;
};

export function QuoteWizardScreen({
  mode,
  title,
  quoteId,
  initialState,
  variant = 'mobile',
  onStepChange,
}: QuoteWizardScreenProps) {
  const { createQuote, updateQuote } = useQuoteMutations();
  const { showError, showSuccess } = useToast();
  const { data: companyProfile } = useCompanyProfile();
  const { data: settings } = useSettings();
  const quoteIntro = useFeatureIntro('quote');

  const [step, setStep] = useState(1);

  useEffect(() => {
    onStepChange?.(step);
  }, [onStepChange, step]);

  const [state, setState] = useState<QuoteWizardState>(
    initialState ?? createEmptyQuoteWizardState(),
  );

  const totals = useMemo(() => mapLinesToDocumentTotals(state.lines), [state.lines]);
  const companyName = companyProfile?.companyName?.trim() || 'Votre entreprise';
  const isSaving = mode === 'create' ? createQuote.isPending : updateQuote.isPending;

  useEffect(() => {
    if (state.info.issuedAt) {
      return;
    }

    const validityDays = Number(settings?.quoteValidityDays ?? 30);
    const paymentDays = String(settings?.paymentTermsDays ?? 30);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialise default dates once settings load
    setState((current) => ({
      ...current,
      info: {
        ...current.info,
        issuedAt: todayFrenchDateInput(),
        validUntil: addDaysFrenchDateInput(validityDays),
        paymentTermsDays: paymentDays,
      },
    }));
  }, [settings?.paymentTermsDays, settings?.quoteValidityDays, state.info.issuedAt]);

  function handleSelectClient(client: Client) {
    setState((current) => ({
      ...current,
      clientId: client.id,
      clientName: getClientDisplayName(client),
    }));
  }

  function handleAddLine(line: QuoteLineValue) {
    setState((current) => ({
      ...current,
      lines: [...current.lines, line],
    }));
  }

  function handleChangeLine(index: number, line: QuoteLineValue) {
    setState((current) => ({
      ...current,
      lines: current.lines.map((item, itemIndex) => (itemIndex === index ? line : item)),
    }));
  }

  function handleRemoveLine(index: number) {
    setState((current) => ({
      ...current,
      lines: current.lines.filter((_, itemIndex) => itemIndex !== index),
    }));
  }

  function handleInfoChange(info: QuoteWizardState['info']) {
    setState((current) => ({ ...current, info }));
  }

  /**
   * DESIGN §5.3 : un primaire désactivé affiche toujours la raison juste en
   * dessous — jamais de « Suivant » mort et muet, à aucune étape.
   */
  function getDisabledReason(): string | undefined {
    switch (step) {
      case 1:
        return state.clientId ? undefined : 'Sélectionnez un client pour continuer.';
      case 2:
        if (state.lines.length === 0) {
          return 'Ajoutez au moins une prestation pour continuer.';
        }
        return areQuoteLinesValid(state.lines)
          ? undefined
          : 'Renseignez la description, la quantité et le prix de chaque prestation.';
      case 3:
        if (!state.clientId) {
          return 'Sélectionnez un client pour continuer.';
        }
        if (!areQuoteLinesValid(state.lines)) {
          return 'Vérifiez les prestations avant de continuer.';
        }
        return isQuoteInfoValid(state.info)
          ? undefined
          : 'Renseignez une date d’émission valide.';
      default:
        return undefined;
    }
  }

  const disabledReason = getDisabledReason();
  const canGoNext = !disabledReason;

  function handleNext() {
    if (disabledReason) {
      return;
    }

    if (step < TOTAL_STEPS) {
      setStep((current) => current + 1);
    }
  }

  function handleBack() {
    if (step > 1) {
      setStep((current) => current - 1);
      return;
    }

    Alert.alert('Abandonner le brouillon ?', 'Les informations saisies sur ce devis ne seront pas enregistrées.', [
      { text: 'Continuer', style: 'cancel' },
      {
        text: 'Abandonner',
        style: 'destructive',
        onPress: () => {
          if (router.canGoBack()) {
            router.back();
            return;
          }
          router.replace('/documents' as Href);
        },
      },
    ]);
  }

  async function handleSave() {
    if (!canGoNext || !state.clientId) {
      showError('Le devis est incomplet.');
      return;
    }

    let metadata;

    try {
      metadata = parseQuoteInfoValues(state.info);
    } catch {
      showError('Vérifiez les dates et le délai de paiement.');
      return;
    }

    const input = {
      clientId: state.clientId,
      lines: state.lines,
      ...metadata,
    };

    try {
      if (mode === 'create') {
        await createQuote.mutateAsync(input);
        showSuccess('Devis créé.');
        router.replace('/documents' as Href);
        return;
      }

      if (!quoteId) {
        showError('Devis introuvable.');
        return;
      }

      await updateQuote.mutateAsync({ quoteId, input });
      showSuccess('Devis modifié.');
      router.replace(`/documents/quotes/${quoteId}` as Href);
    } catch (error) {
      showError(getQuoteErrorMessage(readErrorMessage(error)));
    }
  }

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <QuoteClientStep
            onSelectClient={handleSelectClient}
            selectedClientId={state.clientId}
          />
        );
      case 2:
        return (
          <QuoteAddLinesStep
            lines={state.lines}
            onAddLine={handleAddLine}
            onChangeLine={handleChangeLine}
            onRemoveLine={handleRemoveLine}
          />
        );
      case 3:
        return (
          <DocumentFinalizeStep
            clientName={state.clientName}
            companyName={companyName}
            documentType="quote"
            info={state.info}
            lines={state.lines}
            onInfoChange={handleInfoChange}
            totals={totals}
          />
        );
      default:
        return null;
    }
  }

  const primaryActionLabel =
    step === 1
      ? 'Prestations'
      : step === 2
        ? 'Validation'
        : mode === 'create'
          ? 'Créer ce devis'
          : 'Enregistrer ce devis';

  const isDesktop = variant === 'desktop';
  const totalsSummary =
    step === 2 && state.lines.length > 0 ? (
      <WizardTotalsSummary totalHt={totals.subtotalHt} totalTtc={totals.totalTtc} />
    ) : undefined;

  return (
    <WizardScreen
      footer={
        <WizardActionBar
          backLabel={step === 1 ? 'Annuler' : 'Précédent'}
          disabledReason={step < TOTAL_STEPS ? disabledReason : undefined}
          onBack={handleBack}
          onPrimary={step < TOTAL_STEPS ? handleNext : handleSave}
          primaryDisabled={step < TOTAL_STEPS ? !canGoNext : false}
          primaryLabel={primaryActionLabel}
          primaryLoading={step >= TOTAL_STEPS && isSaving}
          summary={totalsSummary}
        />
      }
      header={
        isDesktop ? undefined : (
          <>
            <QuoteScreenHeader showBackButton={false} title={title} />
            <QuoteWizardProgress currentStep={step} />
          </>
        )
      }
      variant={variant}>
      {renderStep()}
      <FeatureIntroModal
        config={quoteIntro.config}
        onClose={quoteIntro.onClose}
        onCta={quoteIntro.onCta}
        onDontShowAgain={quoteIntro.onDontShowAgain}
        visible={quoteIntro.visible}
      />
    </WizardScreen>
  );
}

function readErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message);
  }

  return '';
}
