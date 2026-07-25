import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';

import { DocumentFinalizeStep } from '@/components/quotes/document-finalize-step';
import { QuoteAddLinesStep } from '@/components/quotes/quote-add-lines-step';
import { QuoteClientStep } from '@/components/quotes/quote-client-step';
import { QuoteScreenHeader } from '@/components/quotes/quote-screen-header';
import { QuoteWizardProgress } from '@/components/quotes/quote-wizard-progress';
import { WizardActionBar } from '@/components/ui/wizard-action-bar';
import { WizardScreen } from '@/components/ui/wizard-screen';
import { useClientDocumentMemory } from '@/hooks/use-client-document-memory';
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
import { memoryLinesToQuoteLines } from '@/lib/supabase/client-document-memory';
import { useToast } from '@/providers/toast-provider';
import { getClientDisplayName, type Client } from '@/types/client';
import { createEmptyQuoteLine, type QuoteLineValue } from '@/types/quote';

const TOTAL_STEPS = 3;

type QuoteWizardScreenProps = {
  mode: 'create' | 'edit';
  title: string;
  quoteId?: string;
  initialState?: QuoteWizardState;
  /** When the client is already known (e.g. from fiche client), start on lines. */
  initialStep?: number;
  /** Auto-apply last document lines ("Comme la dernière fois"). */
  autoReplay?: boolean;
  variant?: 'mobile' | 'desktop';
  onStepChange?: (step: number) => void;
};

export function QuoteWizardScreen({
  mode,
  title,
  quoteId,
  initialState,
  initialStep = 1,
  autoReplay = false,
  variant = 'mobile',
  onStepChange,
}: QuoteWizardScreenProps) {
  const { createQuote, updateQuote } = useQuoteMutations();
  const { showError, showSuccess } = useToast();
  const { data: companyProfile } = useCompanyProfile();
  const { data: settings } = useSettings();

  const [step, setStep] = useState(() =>
    Math.min(Math.max(initialStep, 1), TOTAL_STEPS),
  );

  useEffect(() => {
    onStepChange?.(step);
  }, [onStepChange, step]);
  const [state, setState] = useState<QuoteWizardState>(
    initialState ?? createEmptyQuoteWizardState(),
  );
  const memoryAppliedForClient = useRef<string | null>(null);
  const replayApplied = useRef(false);
  const { data: memory, isSuccess: memoryReady } = useClientDocumentMemory(state.clientId);

  const totals = useMemo(() => mapLinesToDocumentTotals(state.lines), [state.lines]);
  const companyName = companyProfile?.companyName?.trim() || 'Votre entreprise';
  const isSaving = mode === 'create' ? createQuote.isPending : updateQuote.isPending;
  const defaultVatRate = settings?.defaultVatRate ?? 20;

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
    if (!state.clientId || !memory || memoryAppliedForClient.current === state.clientId) {
      return;
    }

    memoryAppliedForClient.current = state.clientId;
    const paymentDays = memory.defaults.paymentTermsDays;
    const notes = memory.defaults.notes;

    // eslint-disable-next-line react-hooks/set-state-in-effect -- apply client memory once per client
    setState((current) => ({
      ...current,
      info: {
        ...current.info,
        paymentTermsDays:
          paymentDays != null ? String(paymentDays) : current.info.paymentTermsDays,
        notes: current.info.notes?.trim() ? current.info.notes : notes ?? current.info.notes,
      },
    }));
  }, [memory, state.clientId]);

  useEffect(() => {
    if (!autoReplay || replayApplied.current || !state.clientId || !memoryReady) {
      return;
    }

    replayApplied.current = true;
    const last = memory?.lastDocument;
    if (last && last.lines.length > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot replay from URL
      setState((current) => ({
        ...current,
        lines: memoryLinesToQuoteLines(last.lines),
      }));
      showSuccess('Comme la dernière fois — prestations reprises.');
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- fallback empty line if no history
    setState((current) => ({
      ...current,
      lines: [
        createEmptyQuoteLine({
          vatRate: memory?.defaults.vatRate ?? defaultVatRate,
          discountPercent: memory?.defaults.discountPercent ?? 0,
        }),
      ],
    }));
  }, [
    autoReplay,
    defaultVatRate,
    memory?.defaults.discountPercent,
    memory?.defaults.vatRate,
    memory?.lastDocument,
    memoryReady,
    showSuccess,
    state.clientId,
  ]);

  useEffect(() => {
    if (step !== 2 || state.lines.length > 0 || autoReplay) {
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect -- add starter line when entering step 2
    setState((current) => ({
      ...current,
      lines: [
        createEmptyQuoteLine({
          vatRate: memory?.defaults.vatRate ?? defaultVatRate,
          discountPercent: memory?.defaults.discountPercent ?? 0,
        }),
      ],
    }));
  }, [
    autoReplay,
    step,
    state.lines.length,
    memory?.defaults.vatRate,
    memory?.defaults.discountPercent,
    defaultVatRate,
  ]);

  function handleSelectClient(client: Client) {
    memoryAppliedForClient.current = null;
    replayApplied.current = false;
    setState((current) => ({
      ...current,
      clientId: client.id,
      clientName: getClientDisplayName(client),
    }));
    setStep(2);
  }

  function handleAddLine(line: QuoteLineValue) {
    setState((current) => ({
      ...current,
      lines: [...current.lines, line],
    }));
  }

  function handleReplaceLines(lines: QuoteLineValue[]) {
    setState((current) => ({
      ...current,
      lines,
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
          showError('Renseignez la description, la quantité et le prix de chaque prestation.');
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
            selectedClientName={state.clientName || undefined}
          />
        );
      case 2:
        return (
          <QuoteAddLinesStep
            clientId={state.clientId}
            clientName={state.clientName || undefined}
            defaultVatRate={defaultVatRate}
            lines={state.lines}
            onAddLine={handleAddLine}
            onChangeLine={handleChangeLine}
            onRemoveLine={handleRemoveLine}
            onReplaceLines={handleReplaceLines}
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

  return (
    <WizardScreen
      footer={
        isDesktop ? (
          <WizardActionBar
            backLabel={step === 1 ? 'Annuler' : 'Précédent'}
            onBack={handleBack}
            onPrimary={step < TOTAL_STEPS ? handleNext : handleSave}
            primaryDisabled={step < TOTAL_STEPS ? !canGoNext() : false}
            primaryLabel={primaryActionLabel}
            primaryLoading={step >= TOTAL_STEPS && isSaving}
          />
        ) : undefined
      }
      header={
        isDesktop ? undefined : (
          <>
            <QuoteScreenHeader showBackButton={false} title={title} />
            <QuoteWizardProgress currentStep={step} />
          </>
        )
      }
      toolbar={
        isDesktop ? undefined : (
          <WizardActionBar
            backLabel={step === 1 ? 'Annuler' : 'Précédent'}
            onBack={handleBack}
            onPrimary={step < TOTAL_STEPS ? handleNext : handleSave}
            primaryDisabled={step < TOTAL_STEPS ? !canGoNext() : false}
            primaryLabel={primaryActionLabel}
            primaryLoading={step >= TOTAL_STEPS && isSaving}
          />
        )
      }
      variant={variant}>
      {renderStep()}
    </WizardScreen>
  );
}

function readErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message);
  }

  return '';
}
