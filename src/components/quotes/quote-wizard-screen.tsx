import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';

import { DocumentFinalizeStep } from '@/components/quotes/document-finalize-step';
import { QuoteAddLinesStep } from '@/components/quotes/quote-add-lines-step';
import { QuoteClientStep } from '@/components/quotes/quote-client-step';
import { QuoteScreenHeader } from '@/components/quotes/quote-screen-header';
import { QuoteWizardProgress } from '@/components/quotes/quote-wizard-progress';
import { DocumentTotalsBar } from '@/components/documents/document-totals-bar';
import { FormNavigationProvider } from '@/components/ui/form/form-navigation';
import { WizardActionBar } from '@/components/ui/wizard-action-bar';
import { WizardScreen } from '@/components/ui/wizard-screen';
import { useCompanyProfile } from '@/hooks/use-company-profile';
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
import { createEmptyQuoteLine, type QuoteLineValue } from '@/types/quote';

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

  useEffect(() => {
    if (step !== 2 || state.lines.length > 0) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- add starter line when entering step 2
    setState((current) => ({
      ...current,
      lines: [createEmptyQuoteLine()],
    }));
  }, [step, state.lines.length]);

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

  function canGoNext(): boolean {
    switch (step) {
      case 1:
        return Boolean(state.clientId);
      case 2:
        return state.lines.length > 0 && areQuoteLinesValid(state.lines);
      case 3:
        return (
          Boolean(state.clientId) &&
          areQuoteLinesValid(state.lines) &&
          isQuoteInfoValid(state.info)
        );
      default:
        return false;
    }
  }

  function showStepError() {
    switch (step) {
      case 1:
        showError('Sélectionnez un client pour continuer.');
        break;
      case 2:
        if (state.lines.length === 0) {
          showError('Ajoutez au moins une prestation au devis.');
        } else {
          showError(
            'Vérifiez chaque prestation : description, quantité, prix, TVA et remise (0 à 100 %).',
          );
        }
        break;
      case 3:
        showError('Renseignez une date d’émission valide.');
        break;
      default:
        showError('Le devis est incomplet.');
    }
  }

  function handleNext() {
    if (!canGoNext()) {
      showStepError();
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

    router.back();
  }

  async function handleSave() {
    if (!state.clientId || !canGoNext()) {
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
        router.replace('/quotes' as Href);
        return;
      }

      if (!quoteId) {
        showError('Devis introuvable.');
        return;
      }

      await updateQuote.mutateAsync({ quoteId, input });
      showSuccess('Devis modifié.');
      router.replace(`/quotes/${quoteId}` as Href);
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
    step < TOTAL_STEPS
      ? 'Suivant'
      : mode === 'create'
        ? 'Créer le devis'
        : 'Enregistrer les modifications';

  const isDesktop = variant === 'desktop';

  const handlePrimary = step < TOTAL_STEPS ? handleNext : () => void handleSave();

  return (
    <WizardScreen
      bodyScroll={step === 3 ? 'aware' : 'none'}
      footer={
        <WizardActionBar
          backLabel={step === 1 ? 'Annuler' : 'Précédent'}
          onBack={handleBack}
          onPrimary={handlePrimary}
          primaryDisabled={step < TOTAL_STEPS ? !canGoNext() : false}
          primaryLabel={primaryActionLabel}
          primaryLoading={step >= TOTAL_STEPS && isSaving}
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
      summary={
        // Dès qu'il y a des lignes, le total reste sous les yeux — y compris
        // pendant la saisie, clavier ouvert.
        step >= 2 && state.lines.length > 0 ? (
          <DocumentTotalsBar lineCount={state.lines.length} totals={totals} />
        ) : null
      }
      variant={variant}>
      <FormNavigationProvider onSubmit={handlePrimary} submitReturnKey="done">
        {renderStep()}
      </FormNavigationProvider>
    </WizardScreen>
  );
}

function readErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message);
  }

  return '';
}
