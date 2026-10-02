import { router, type Href } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { InteractionManager, Platform, Text, View } from 'react-native';
import {
  KeyboardAwareScrollView,
  KeyboardStickyView,
  type KeyboardAwareScrollViewRef,
} from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

import { VoiceDictationCard } from '@/components/ai/voice-dictation-card';
import {
  COMPACT_BOTTOM_BAR_HEIGHT,
  ComposerBottomBar,
  ComposerErrorBanner,
  ComposerNavBar,
} from '@/components/invoices/composer/composer-chrome';
import { ComposerClientSection } from '@/components/invoices/composer/composer-client-section';
import { ComposerDatesSection } from '@/components/invoices/composer/composer-dates-section';
import { ComposerLinesStep } from '@/components/invoices/composer/composer-lines-step';
import {
  collectIssues,
  formatShortFrenchDate,
} from '@/components/invoices/composer/composer-model';
import { ComposerPreviewSheet } from '@/components/invoices/composer/composer-preview-sheet';
import { ComposerTemplateStep } from '@/components/invoices/composer/composer-template-step';
import { InvoicePresentationSection } from '@/components/invoices/invoice-presentation-section';
import { TemplateGalleryModal } from '@/components/pdf/template-gallery-modal';
import { InvoiceScreenHeader } from '@/components/invoices/invoice-screen-header';
import { DocumentFinalizeStep } from '@/components/quotes/document-finalize-step';
import { QuoteAddLinesStep } from '@/components/quotes/quote-add-lines-step';
import { QuoteClientStep } from '@/components/quotes/quote-client-step';
import { QuoteWizardProgress } from '@/components/quotes/quote-wizard-progress';
import { DocumentTotalsBar } from '@/components/documents/document-totals-bar';
import { FormNavigationProvider } from '@/components/ui/form/form-navigation';
import { WizardActionBar } from '@/components/ui/wizard-action-bar';
import { WizardScreen } from '@/components/ui/wizard-screen';
import { useAuth } from '@/hooks/use-auth';
import { useCompanyProfile } from '@/hooks/use-company-profile';
import { useTenant } from '@/hooks/use-tenant';
import { takePendingDictation } from '@/lib/ai/pending-dictation';
import { processVoiceCommand, type ProcessVoiceCommandResult } from '@/lib/ai/voice-transcription';
import { createClient, fetchClientsPage } from '@/lib/supabase/clients';
import { fetchCatalogItems } from '@/lib/supabase/products';
import { requireScope } from '@/lib/tenant/scope';
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
import {
  composerRadius,
  tabularNums,
  useComposerStyles,
  type ComposerColors,
} from '@/constants/theme/composer';
import { triggerErrorHaptic } from '@/lib/haptics';
import { buildInvoiceDraftPdfHtml } from '@/lib/pdf/document-pdf';
import { resolvePdfTemplate } from '@/lib/pdf/engine/templates/registry';
import { DEFAULT_PDF_TEMPLATE_ID } from '@/lib/pdf/engine/templates/types';
import { buildTemplatePreviewHtml } from '@/lib/pdf/template-preview-html';
import { fetchInvoicePdfOptions } from '@/lib/supabase/invoices';
import { createEmptyClientFormValues, getClientDisplayName, type Client } from '@/types/client';
import {
  INVOICE_STATUS_LABELS,
  type InvoiceLineValue,
  type InvoiceStatus,
} from '@/types/invoice';
import { createEmptyQuoteLine, formatDecimalForInput, type QuoteLineValue } from '@/types/quote';
import {
  createDefaultInvoicePdfOptions,
  readRememberedLegalIds,
  rememberLegalIds,
  type InvoicePdfOptions,
} from '@/types/pdf-options';

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
  /** Ouverture par le raccourci Siri : le texte mis de côté est appliqué. */
  fromSiri?: boolean;
  /** Modification : numéro et statut affichés en tête (iPhone). */
  headerInfo?: { number: string; status?: InvoiceStatus | null };
};

export function InvoiceWizardScreen({
  mode,
  title,
  invoiceId,
  initialState,
  variant = 'mobile',
  onStepChange,
  fromSiri = false,
  headerInfo,
}: InvoiceWizardScreenProps) {
  const { createInvoice, updateInvoice } = useInvoiceMutations();
  const { showError, showSuccess } = useToast();
  const { data: companyProfile } = useCompanyProfile();
  const { data: settings } = useSettings();
  const { user } = useAuth();
  const { scope } = useTenant();

  const [step, setStep] = useState(1);

  useEffect(() => {
    onStepChange?.(step);
  }, [onStepChange, step]);
  const [state, setState] = useState<InvoiceWizardState>(
    initialState ?? createEmptyInvoiceWizardState(),
  );

  // Présentation (création uniquement) : numéro libre, titre, modèle, SIREN…
  const [customNumber, setCustomNumber] = useState('');
  const [pdfOptions, setPdfOptions] = useState<InvoicePdfOptions>(createDefaultInvoicePdfOptions);

  // Assistant iPhone : erreurs affichées jusqu'à l'étape validée, feuilles.
  const [errorScope, setErrorScope] = useState(0);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [barHeight, setBarHeight] = useState(150);
  const scrollRef = useRef<KeyboardAwareScrollViewRef>(null);
  const composerStyles = useComposerStyles(wizardStyles);

  useEffect(() => {
    if (mode !== 'create') return;
    let cancelled = false;
    void readRememberedLegalIds().then((legalIds) => {
      if (!cancelled) setPdfOptions((current) => ({ ...current, legalIds }));
    });
    return () => {
      cancelled = true;
    };
  }, [mode]);

  const templateId = pdfOptions.templateId ?? settings?.invoiceTemplateId ?? null;
  const forecastNumber = settings
    ? `${settings.invoicePrefix?.trim() || 'FAC'}-${new Date().getUTCFullYear()}-${String(
        settings.nextInvoiceNumber,
      ).padStart(6, '0')}`
    : null;

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

  /**
   * Résultat d'une dictée : client retrouvé (ou créé), lignes ajoutées avec le
   * prix du catalogue quand la dictée n'en donne pas, délai de paiement.
   */
  async function applyVoiceCommand({ command }: ProcessVoiceCommandResult): Promise<string> {
    const activeScope = requireScope(scope);
    const summary: string[] = [];
    const normalize = (value: string) =>
      value
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, ' ')
        .trim();
    let client: { id: string; name: string } | null = null;

    const spokenClient = command.client.trim();
    if (spokenClient) {
      const wanted = normalize(spokenClient);
      const { clients: found } = await fetchClientsPage(activeScope, { search: spokenClient, page: 0 });
      const match =
        found.find((entry) => normalize(getClientDisplayName(entry)) === wanted) ??
        found.find((entry) => normalize(getClientDisplayName(entry)).includes(wanted)) ??
        found[0];
      if (match) {
        client = { id: match.id, name: getClientDisplayName(match) };
        summary.push(`client ${client.name}`);
      } else {
        const created = await createClient(activeScope, {
          ...createEmptyClientFormValues(),
          company: spokenClient,
        });
        client = { id: created.id, name: spokenClient };
        summary.push(`client ${spokenClient} créé`);
      }
    }

    let newLines: InvoiceLineValue[] = [];
    if (command.items.length > 0 && user?.id) {
      const [products, services] = await Promise.all([
        fetchCatalogItems(user.id, 'product'),
        fetchCatalogItems(user.id, 'service'),
      ]);
      const catalog = [...products, ...services].map((item) => ({ item, key: normalize(item.name) }));
      newLines = command.items.map((spoken) => {
        const key = normalize(spoken.description);
        const fromCatalog = (
          catalog.find((entry) => entry.key === key) ??
          catalog.find((entry) => key.length > 3 && (entry.key.includes(key) || key.includes(entry.key)))
        )?.item;
        const vat = command.vat ?? fromCatalog?.vat_rate ?? 20;
        const price = spoken.price_ht > 0 ? spoken.price_ht : (fromCatalog?.unit_price ?? 0);
        return {
          ...createEmptyQuoteLine(),
          productId: fromCatalog?.id ?? null,
          title: fromCatalog?.name ?? spoken.description,
          description: fromCatalog?.description ?? '',
          quantity: formatDecimalForInput(spoken.quantity > 0 ? spoken.quantity : 1),
          unit: spoken.unit || fromCatalog?.unit || 'unité',
          unitPrice: formatDecimalForInput(price),
          vatRate: formatDecimalForInput(vat),
          discountPercent: formatDecimalForInput(command.discount ?? 0),
        };
      });
      summary.push(`${newLines.length} ligne${newLines.length > 1 ? 's' : ''}`);
    }

    const days =
      command.payment_terms !== null && command.payment_terms >= 0
        ? Math.round(command.payment_terms)
        : null;
    if (days !== null) {
      summary.push(`paiement à ${days} jours`);
    }

    if (summary.length === 0) {
      throw new Error('Rien d’exploitable dans la dictée. Précisez le client et les lignes.');
    }

    setState((current) => {
      const info = { ...current.info };
      if (days !== null) {
        info.paymentTermsDays = String(days);
        const issuedIso = frenchDateInputToIso(info.issuedAt);
        info.dueAt = addDaysFrenchDateInput(days, issuedIso ? new Date(issuedIso) : undefined);
      }
      return {
        ...current,
        clientId: client?.id ?? current.clientId,
        clientName: client?.name ?? current.clientName,
        lines: [...current.lines.filter((line) => line.title.trim() || line.description.trim()), ...newLines],
        info,
      };
    });
    if (client && newLines.length > 0) {
      setStep(2);
    }
    return `C’est rempli : ${summary.join(', ')}. Vérifiez puis validez.`;
  }

  // Dictée Siri : appliquée une seule fois, une fois l'écran installé. On
  // laisse à la fenêtre de Siri le temps de se refermer avant d'afficher quoi
  // que ce soit : présenter pendant sa sortie fait tomber l'application.
  const dictationHandledRef = useRef(false);
  useEffect(() => {
    if (!fromSiri || mode !== 'create' || !scope || !user?.id || dictationHandledRef.current) return;
    dictationHandledRef.current = true;
    let cancelled = false;
    const task = InteractionManager.runAfterInteractions(() => {
      setTimeout(() => {
        const text = takePendingDictation();
        if (cancelled || !text) return;
        void (async () => {
          try {
            const result = await processVoiceCommand({ documentType: 'invoice', transcript: text });
            if (!cancelled) showSuccess(await applyVoiceCommand(result));
          } catch (error) {
            if (!cancelled) showError(error instanceof Error ? error.message : 'Dictée impossible.');
          }
        })();
      }, 800);
    });
    return () => {
      cancelled = true;
      task.cancel();
    };
    // applyVoiceCommand lit l'état courant via setState : pas besoin de le suivre.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromSiri, mode, scope, user?.id]);

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
      dueAt: info.validUntil,
      paymentTermsDays: info.paymentTermsDays,
      notes: info.notes,
    };

    const days = Number(info.paymentTermsDays);
    if (info.issuedAt && /^\d+$/.test(info.paymentTermsDays) && days > 0) {
      const issuedIso = frenchDateInputToIso(info.issuedAt);
      if (issuedIso) {
        next.dueAt = addDaysFrenchDateInput(days, new Date(issuedIso));
      }
    }

    handleInfoChange(next);
  }

  function canGoNext(): boolean {
    switch (step) {
      case 1:
        return Boolean(state.clientId);
      case 2:
        return state.lines.length > 0 && areInvoiceLinesValid(state.lines);
      case 3:
        return (
          Boolean(state.clientId) &&
          areInvoiceLinesValid(state.lines) &&
          isInvoiceInfoValid(state.info)
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
          showError('Ajoutez au moins une prestation à la facture.');
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
        showError('La facture est incomplète.');
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
        await createInvoice.mutateAsync({
          ...input,
          number: customNumber.trim() || null,
          pdfOptions: { ...pdfOptions, templateId },
        });
        void rememberLegalIds(pdfOptions.legalIds);
        showSuccess('Facture créée.');
        router.replace('/invoices' as Href);
        return;
      }

      if (!invoiceId) {
        showError('Facture introuvable.');
        return;
      }

      await updateInvoice.mutateAsync({ invoiceId, input });
      showSuccess('Facture modifiée.');
      router.replace(`/invoices/${invoiceId}` as Href);
    } catch (error) {
      showError(getInvoiceErrorMessage(readErrorMessage(error)));
    }
  }

  function renderStep() {
    switch (step) {
      case 1:
        return mode === 'create' ? (
          <View style={{ flex: 1 }}>
            <VoiceDictationCard documentType="invoice" onResult={applyVoiceCommand} />
            <QuoteClientStep
              onSelectClient={handleSelectClient}
              selectedClientId={state.clientId}
            />
          </View>
        ) : (
          <QuoteClientStep
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
            footer={
              mode === 'create' ? (
                <InvoicePresentationSection
                  company={companyProfile ?? null}
                  forecastNumber={forecastNumber}
                  number={customNumber}
                  onChange={setPdfOptions}
                  onNumberChange={setCustomNumber}
                  value={{ ...pdfOptions, templateId }}
                />
              ) : null
            }
          />
        );
      default:
        return null;
    }
  }

  /**
   * Le bouton nomme SA DESTINATION, jamais « Suivant ».
   *
   * « Suivant » se lisait comme « champ suivant » : en saisissant le titre
   * d'une prestation, on appuyait dessus en croyant passer à la description,
   * et on se retrouvait à l'étape de validation avec une ligne à peine
   * commencée. Deux sens du même mot cohabitaient à l'écran, celui du clavier
   * (champ suivant) et celui du pied (étape suivante).
   *
   * Le clavier garde « Suivant » pour enchaîner les champs ; le pied annonce
   * désormais où il mène.
   */
  const primaryActionLabel =
    step === 1
      ? 'Ajouter les prestations'
      : step === 2
        ? 'Voir le récapitulatif'
        : mode === 'create'
        ? 'Créer la facture'
        : 'Enregistrer les modifications';

  const isDesktop = variant === 'desktop';

  const handlePrimary = step < TOTAL_STEPS ? handleNext : () => void handleSave();

  /* ------------------------------------------------------------------------ */
  /* iPhone : présentation « Nouvelle facture » (handoff iOS)                  */
  /* ------------------------------------------------------------------------ */

  const infoValid = isInvoiceInfoValid(state.info);
  const issues = useMemo(
    () => collectIssues({ clientId: state.clientId, lines: state.lines, infoValid }),
    [infoValid, state.clientId, state.lines],
  );
  const visibleIssues = errorScope > 0 ? issues.filter((issue) => issue.step <= errorScope) : [];

  const scrollToTop = useCallback(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: false });
  }, []);

  function goToStep(target: number) {
    setStep(Math.min(TOTAL_STEPS, Math.max(1, target)));
    scrollToTop();
  }

  function revealErrors(scope: number) {
    void triggerErrorHaptic();
    setErrorScope((current) => Math.max(current, scope));
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }

  function handleComposerPrimary() {
    // Modification : on enregistre depuis n'importe quel onglet.
    if (mode === 'edit' || step >= TOTAL_STEPS) {
      if (issues.length > 0 || !canSaveAll()) {
        revealErrors(TOTAL_STEPS);
        return;
      }
      void handleSave();
      return;
    }

    if (!canGoNext()) {
      revealErrors(step);
      return;
    }

    goToStep(step + 1);
  }

  function canSaveAll(): boolean {
    return (
      Boolean(state.clientId) && areInvoiceLinesValid(state.lines) && isInvoiceInfoValid(state.info)
    );
  }

  function handleIssuedAtChange(issuedAt: string) {
    setState((current) => {
      const info = { ...current.info, issuedAt };
      const issuedIso = frenchDateInputToIso(issuedAt);
      const days = current.info.paymentTermsDays.trim();
      if (issuedIso) {
        if (/^\d+$/.test(days) && Number(days) > 0) {
          info.dueAt = addDaysFrenchDateInput(Number(days), new Date(issuedIso));
        } else if (!days) {
          info.dueAt = issuedAt;
        }
      }
      return { ...current, info };
    });
  }

  /** `null` : paiement à réception (échéance = émission). */
  function handlePaymentDelayChange(days: number | null) {
    setState((current) => {
      const info = { ...current.info };
      const issuedIso = frenchDateInputToIso(info.issuedAt);
      if (days === null) {
        info.paymentTermsDays = '';
        info.dueAt = info.issuedAt;
      } else {
        info.paymentTermsDays = String(days);
        info.dueAt = addDaysFrenchDateInput(days, issuedIso ? new Date(issuedIso) : undefined);
      }
      return { ...current, info };
    });
  }

  function handlePaymentDelayInput(value: string) {
    const days = Number(value);
    if (/^\d+$/.test(value) && days > 0) {
      handlePaymentDelayChange(days);
      return;
    }
    setState((current) => ({ ...current, info: { ...current.info, paymentTermsDays: value } }));
  }

  const activeTemplate = resolvePdfTemplate(templateId);

  const buildDraftHtml = useCallback(async () => {
    const activeScope = requireScope(scope);
    const options =
      mode === 'edit' && invoiceId
        ? await fetchInvoicePdfOptions(activeScope, invoiceId)
        : { ...pdfOptions, templateId };
    return buildInvoiceDraftPdfHtml(
      activeScope,
      {
        number:
          customNumber.trim() ||
          (mode === 'edit' ? headerInfo?.number : forecastNumber) ||
          'Brouillon',
        issuedAt: frenchDateInputToIso(state.info.issuedAt),
        dueAt: frenchDateInputToIso(state.info.dueAt),
        notes: state.info.notes.trim() || null,
        lines: state.lines,
        totals,
        clientId: state.clientId,
        clientName: state.clientName,
        pdfOptions: options,
      },
      user?.email ?? null,
    );
  }, [
    customNumber,
    forecastNumber,
    headerInfo?.number,
    invoiceId,
    mode,
    pdfOptions,
    scope,
    state,
    templateId,
    totals,
    user?.email,
  ]);

  const buildGalleryHtml = useCallback(
    (galleryTemplateId: string) =>
      buildTemplatePreviewHtml(requireScope(scope), galleryTemplateId, 'invoice', user?.email ?? null),
    [scope, user?.email],
  );

  function renderComposerStep() {
    switch (step) {
      case 1:
        return (
          <>
            {mode === 'create' ? (
              <VoiceDictationCard documentType="invoice" onResult={applyVoiceCommand} variant="hero" />
            ) : null}
            <ComposerClientSection
              clientId={state.clientId}
              clientName={state.clientName}
              hasError={errorScope >= 1 && !state.clientId}
              onSelectClient={handleSelectClient}
            />
            <ComposerDatesSection
              dueAt={state.info.dueAt}
              hasError={errorScope >= 1 && !infoValid}
              issuedAt={state.info.issuedAt}
              onDelayChange={handlePaymentDelayChange}
              onDelayInput={handlePaymentDelayInput}
              onDueAtChange={handleDueAtChange}
              onIssuedAtChange={handleIssuedAtChange}
              paymentTermsDays={state.info.paymentTermsDays}
            />
          </>
        );
      case 2:
        return (
          <ComposerLinesStep
            lines={asQuoteLines(state.lines)}
            onAddLine={handleAddLine}
            onChangeLine={handleChangeLine}
            onRemoveLine={handleRemoveLine}
            showErrors={errorScope >= 2}
          />
        );
      case 3:
        return (
          <ComposerTemplateStep
            clientName={state.clientName}
            company={companyProfile ?? null}
            customNumber={customNumber}
            dueAt={state.info.dueAt}
            forecastNumber={forecastNumber}
            lines={state.lines}
            mode={mode}
            notes={state.info.notes}
            onCustomNumberChange={setCustomNumber}
            onNotesChange={(notes) => handleInfoChange({ ...state.info, notes })}
            onOpenGallery={() => setGalleryOpen(true)}
            onOpenPreview={() => setPreviewOpen(true)}
            onPdfOptionsChange={setPdfOptions}
            paymentTermsDays={state.info.paymentTermsDays}
            pdfOptions={{ ...pdfOptions, templateId }}
            templateId={templateId}
            totals={totals}
          />
        );
      default:
        return null;
    }
  }

  if (!isDesktop) {
    // « Continuer » (jamais « Suivant », lu comme « champ suivant ») ; la
    // progression nomme l'étape. En modification, on enregistre de partout.
    const composerPrimaryLabel =
      mode === 'edit'
        ? 'Enregistrer les modifications'
        : step < TOTAL_STEPS
          ? 'Continuer'
          : 'Créer la facture';

    return (
      <FormNavigationProvider onSubmit={handleComposerPrimary} submitReturnKey="done">
        <View style={composerStyles.root}>
          <SafeAreaView edges={['top']} style={composerStyles.safeArea}>
            <ComposerNavBar
              mode={mode}
              onCancel={() => router.back()}
              onPreview={() => setPreviewOpen(true)}
              onStepSelect={goToStep}
              step={step}
              title={title}
            />
            <KeyboardAwareScrollView
              bottomOffset={COMPACT_BOTTOM_BAR_HEIGHT + 16}
              contentContainerStyle={[composerStyles.scrollContent, { paddingBottom: barHeight + 28 }]}
              keyboardDismissMode={Platform.OS === 'ios' ? 'interactive' : 'on-drag'}
              keyboardShouldPersistTaps="handled"
              ref={scrollRef}
              showsVerticalScrollIndicator={false}
              style={composerStyles.scroll}>
              {mode === 'edit' && headerInfo ? (
                <View style={composerStyles.editHeader}>
                  <View style={composerStyles.editHeaderText}>
                    <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={composerStyles.editNumber}>
                      {headerInfo.number}
                    </Text>
                    {formatShortFrenchDate(state.info.issuedAt) ? (
                      <Text maxFontSizeMultiplier={1.3} style={composerStyles.editIssued}>
                        Émise le {formatShortFrenchDate(state.info.issuedAt)}
                      </Text>
                    ) : null}
                  </View>
                  {headerInfo.status ? (
                    <View style={composerStyles.statusPill}>
                      <View style={composerStyles.statusDot} />
                      <Text maxFontSizeMultiplier={1.3} style={composerStyles.statusLabel}>
                        {INVOICE_STATUS_LABELS[headerInfo.status]}
                      </Text>
                    </View>
                  ) : null}
                </View>
              ) : null}
              <ComposerErrorBanner issues={visibleIssues} onGoToStep={goToStep} />
              {renderComposerStep()}
            </KeyboardAwareScrollView>
          </SafeAreaView>

          <View pointerEvents="box-none" style={composerStyles.barDock}>
            <KeyboardStickyView offset={{ closed: 0, opened: 0 }}>
              <ComposerBottomBar
                canGoBack={mode === 'create' && step > 1}
                lineCount={state.lines.length}
                loading={isSaving}
                onBack={() => goToStep(step - 1)}
                onHeightChange={setBarHeight}
                onPrimary={handleComposerPrimary}
                primaryLabel={composerPrimaryLabel}
                totalTtc={totals.totalTtc}
                totalVat={totals.totalVat}
              />
            </KeyboardStickyView>
          </View>

          <ComposerPreviewSheet
            buildHtml={buildDraftHtml}
            onChangeTemplate={
              mode === 'create'
                ? () => {
                    setPreviewOpen(false);
                    // Laisser la feuille se refermer avant de présenter la galerie.
                    setTimeout(() => setGalleryOpen(true), 400);
                  }
                : undefined
            }
            onClose={() => setPreviewOpen(false)}
            templateName={activeTemplate.name}
            visible={previewOpen}
          />
          {mode === 'create' && scope ? (
            <TemplateGalleryModal
              buildPreviewHtml={buildGalleryHtml}
              cacheKey="settings-invoice"
              onClose={() => setGalleryOpen(false)}
              onSelect={(nextTemplateId) =>
                setPdfOptions((current) => ({ ...current, templateId: nextTemplateId }))
              }
              selectedTemplateId={templateId ?? DEFAULT_PDF_TEMPLATE_ID}
              title="Modèles de facture"
              visible={galleryOpen}
            />
          ) : null}
        </View>
      </FormNavigationProvider>
    );
  }

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
            <InvoiceScreenHeader showBackButton={false} title={title} />
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

function wizardStyles(colors: ComposerColors) {
  return {
    root: {
      flex: 1,
      backgroundColor: colors.bg,
    },
    safeArea: {
      flex: 1,
    },
    scroll: {
      flex: 1,
    },
    scrollContent: {
      flexGrow: 1,
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    barDock: {
      position: 'absolute' as const,
      left: 0,
      right: 0,
      bottom: 0,
    },
    editHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: 12,
      paddingHorizontal: 4,
      paddingTop: 6,
      paddingBottom: 16,
    },
    editHeaderText: {
      flex: 1,
      minWidth: 0,
    },
    editNumber: {
      ...tabularNums,
      fontSize: 24,
      fontWeight: '800' as const,
      letterSpacing: -0.6,
      color: colors.ink,
    },
    editIssued: {
      fontSize: 14,
      color: colors.ink3,
      marginTop: 2,
    },
    statusPill: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 6,
      height: 28,
      paddingHorizontal: 11,
      borderRadius: composerRadius.pill,
      backgroundColor: colors.accentSoft,
    },
    statusDot: {
      width: 6,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.accent,
    },
    statusLabel: {
      fontSize: 13,
      fontWeight: '700' as const,
      color: colors.accentInk,
    },
  };
}
