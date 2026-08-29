import { router, type Href } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';

import { InvoiceScreenHeader } from '@/components/invoices/invoice-screen-header';
import { FeatureIntroModal } from '@/components/feature-intros';
import { DocumentFinalizeStep } from '@/components/quotes/document-finalize-step';
import { QuoteAddLinesStep } from '@/components/quotes/quote-add-lines-step';
import { QuoteClientStep } from '@/components/quotes/quote-client-step';
import { QuoteWizardProgress } from '@/components/quotes/quote-wizard-progress';
import { WizardActionBar } from '@/components/ui/wizard-action-bar';
import { WizardScreen } from '@/components/ui/wizard-screen';
import { WizardTotalsSummary } from '@/components/ui/wizard-totals-summary';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { useFeatureIntro } from '@/hooks/use-feature-intro';
import { useInvoiceMutations } from '@/hooks/use-invoice-mutations';
import { useSettings } from '@/hooks/use-settings';
import {
  addDaysFrenchDateInput,
  frenchDateInputToIso,
  todayFrenchDateInput,
} from '@/lib/format/date-input';
import { getInvoiceErrorMessage } from '@/lib/invoices/errors';
import {
  createEmptyInvoiceWizardState,
  type InvoiceWizardState,
} from '@/lib/invoices/form';
import { mapInvoiceLinesToDocumentTotals } from '@/lib/invoices/mappers';
import {
  areInvoiceLinesValid,
  isInvoiceInfoValid,
  parseInvoiceInfoValues,
} from '@/lib/invoices/validators';
import { useToast } from '@/providers/toast-provider';
import { getClientDisplayName, type Client } from '@/types/client';
import type { InvoiceLineValue } from '@/types/invoice';
import type { QuoteLineValue } from '@/types/quote';

const TOTAL_STEPS = 3;

function asQuoteLines(lines: InvoiceLineValue[]): QuoteLineValue[] {
  return lines;
}

type InvoiceWizardScreenProps = {
  mode: 'create' | 'edit';
  title: string;
  invoiceId?: string;
  initialState?: InvoiceWizardState;
  variant?: 'mobile' | 'desktop';
  onStepChange?: (step: number) => void;
};

export function InvoiceWizardScreen({
  mode,
  title,
  invoiceId,
  initialState,
  variant = 'mobile',
  onStepChange,
}: InvoiceWizardScreenProps) {
  const { createInvoice, updateInvoice } = useInvoiceMutations();
  const { showError, showSuccess } = useToast();
  const { data: companyProfile } = useCompanyProfile();
  const { data: settings } = useSettings();
  const invoiceIntro = useFeatureIntro('invoice');

  const [step, setStep] = useState(1);

  useEffect(() => {
    onStepChange?.(step);
  }, [onStepChange, step]);

  const [state, setState] = useState<InvoiceWizardState>(
    initialState ?? createEmptyInvoiceWizardState(),
  );
  const dueAtTouchedRef = useRef(false);

  const totals = useMemo(() => mapInvoiceLinesToDocumentTotals(state.lines), [state.lines]);
  const companyName = companyProfile?.companyName?.trim() || 'Votre entreprise';
  const isSaving = mode === 'create' ? createInvoice.isPending : updateInvoice.isPending;

  useEffect(() => {
    if (state.info.issuedAt) {
      return;
    }

    const paymentDays = Number(settings?.paymentTermsDays ?? 30);

    // eslint-disable-next-line react-hooks/set-state-in-effect -- initialise default dates once settings load
    setState((current) => ({
      ...current,
      info: {
        ...current.info,
        issuedAt: todayFrenchDateInput(),
        dueAt: addDaysFrenchDateInput(paymentDays),
        paymentTermsDays: String(paymentDays),
      },
    }));
  }, [settings?.paymentTermsDays, state.info.issuedAt]);

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

  function handleInfoChange(info: InvoiceWizardState['info']) {
    setState((current) => ({ ...current, info }));
  }

  function handleDueAtChange(dueAt: string) {
    dueAtTouchedRef.current = true;
    setState((current) => ({
      ...current,
      info: { ...current.info, dueAt },
    }));
  }

  function handleFinalizeInfoChange(info: {
    issuedAt: string;
    validUntil: string;
    paymentTermsDays: string;
    notes: string;
    internalNotes: string;
  }) {
    const next = {
      ...state.info,
      issuedAt: info.issuedAt,
      paymentTermsDays: info.paymentTermsDays,
      notes: info.notes,
    };

    const days = Number(info.paymentTermsDays);
    if (
      !dueAtTouchedRef.current &&
      info.issuedAt &&
      /^\d+$/.test(info.paymentTermsDays) &&
      days > 0
    ) {
      const issuedIso = frenchDateInputToIso(info.issuedAt);
      if (issuedIso) {
        next.dueAt = addDaysFrenchDateInput(days, new Date(issuedIso));
      }
    }

    handleInfoChange(next);
  }

  function getDisabledReason(): string | undefined {
    switch (step) {
      case 1:
        return state.clientId ? undefined : 'Sélectionnez un client pour continuer.';
      case 2:
        if (state.lines.length === 0) {
          return 'Ajoutez au moins une prestation pour continuer.';
        }
        return areInvoiceLinesValid(state.lines)
          ? undefined
          : 'Renseignez la description, la quantité et le prix de chaque prestation.';
      case 3:
        if (!state.clientId) {
          return 'Sélectionnez un client pour continuer.';
        }
        if (!areInvoiceLinesValid(state.lines)) {
          return 'Vérifiez les prestations avant de continuer.';
        }
        return isInvoiceInfoValid(state.info)
          ? undefined
          : 'Renseignez une date d’émission valide.';
      default:
        return undefined;
    }
  }

  const disabledReason = getDisabledReason();
  const canProceed = !disabledReason;

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

    Alert.alert(
      'Abandonner le brouillon ?',
      'Les informations saisies sur cette facture ne seront pas enregistrées.',
      [
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
      ],
    );
  }

  async function handleSave() {
    if (!canProceed || !state.clientId) {
      showError('La facture est incomplète.');
      return;
    }

    let metadata;

    try {
      metadata = parseInvoiceInfoValues(state.info);
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
        await createInvoice.mutateAsync(input);
        showSuccess('Facture créée.');
        router.replace('/documents' as Href);
        return;
      }

      if (!invoiceId) {
        showError('Facture introuvable.');
        return;
      }

      await updateInvoice.mutateAsync({ invoiceId, input });
      showSuccess('Facture modifiée.');
      router.replace(`/documents/invoices/${invoiceId}` as Href);
    } catch (error) {
      showError(getInvoiceErrorMessage(readErrorMessage(error)));
    }
  }

  function renderStep() {
    switch (step) {
      case 1:
        return (
          <QuoteClientStep
            documentType="invoice"
            onSelectClient={handleSelectClient}
            selectedClientId={state.clientId}
          />
        );
      case 2:
        return (
          <QuoteAddLinesStep
            lines={asQuoteLines(state.lines)}
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
            documentType="invoice"
            info={{
              issuedAt: state.info.issuedAt,
              validUntil: state.info.dueAt,
              paymentTermsDays: state.info.paymentTermsDays,
              notes: state.info.notes,
              internalNotes: '',
            }}
            lines={asQuoteLines(state.lines)}
            onInfoChange={handleFinalizeInfoChange}
            onSecondaryDateChange={handleDueAtChange}
            secondaryDateLabel="Date d'échéance"
            secondaryDateValue={state.info.dueAt}
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
          ? 'Créer cette facture'
          : 'Enregistrer cette facture';

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
          primaryDisabled={step < TOTAL_STEPS ? !canProceed : false}
          primaryLabel={primaryActionLabel}
          primaryLoading={step >= TOTAL_STEPS && isSaving}
          summary={totalsSummary}
        />
      }
      header={
        isDesktop ? undefined : (
          <>
            <InvoiceScreenHeader showBackButton={false} title={title} />
            <QuoteWizardProgress currentStep={step} />
          </>
        )
      }
      variant={variant}>
      {renderStep()}
      <FeatureIntroModal
        config={invoiceIntro.config}
        onClose={invoiceIntro.onClose}
        onCta={invoiceIntro.onCta}
        onDontShowAgain={invoiceIntro.onDontShowAgain}
        visible={invoiceIntro.visible}
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
