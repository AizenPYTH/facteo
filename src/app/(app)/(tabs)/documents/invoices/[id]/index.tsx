import { router, type Href } from 'expo-router';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Share, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentActionsSheet } from '@/components/documents/document-actions-sheet';
import { SentDocumentsSection } from '@/components/documents/sent-documents-section';
import {
  CancelInvoiceModal,
  InvoiceDetailView,
  InvoiceScreenHeader,
  PaymentModal,
} from '@/components/invoices';
import { FeatureIntroModal } from '@/components/feature-intros';
import { PdfPreviewModal } from '@/components/pdf/pdf-preview-modal';
import { TemplateGalleryModal } from '@/components/pdf/template-gallery-modal';
import { DocumentClientSignatureBlock } from '@/components/signatures/document-client-signature-block';
import {
  IPAD_LIST_WIDTH,
  IPAD_NAVIGATION_RAIL_WIDTH,
  IPAD_PDF_PREVIEW_WIDTH,
  IpadSplitShell,
} from '@/components/tablet/ipad-split-shell';
import { TabletDocumentsList } from '@/components/tablet/tablet-documents-list';
import { TabletPdfPreviewPanel } from '@/components/tablet/tablet-pdf-preview-panel';
import { ActionBar } from '@/components/ui/action-bar';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { useDocumentActions } from '@/hooks/use-document-actions';
import { useThemedStyles, useColors } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { useDesktopListRedirect } from '@/hooks/use-desktop-list-redirect';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useFeatureIntro } from '@/hooks/use-feature-intro';
import { useInvoice } from '@/hooks/use-invoices';
import { useInvoiceMutations } from '@/hooks/use-invoice-mutations';
import { getInvoiceErrorMessage } from '@/lib/invoices/errors';
import { buildInvoicePdfHtml } from '@/lib/pdf/document-pdf';
import { resolvePdfTemplate } from '@/lib/pdf/engine/templates';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import { useSentDocuments } from '@/hooks/use-sent-documents';
import { useStripePayment } from '@/hooks/use-stripe-payment';
import { useSubscription } from '@/hooks/use-subscription';
import {
  canAddInvoicePayment,
  canCancelInvoice,
  canEditInvoice,
  canMarkInvoiceAsPaid,
  type InvoiceStatus,
} from '@/types/invoice';
import { useToast } from '@/providers/toast-provider';

const DOCUMENTS_FALLBACK = '/documents' as Href;

export default function InvoiceDetailScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { width, height, isWeb, isDesktop, isTablet } = useBreakpoint();
  const { id, payment } = useLocalSearchParams<{ id: string; payment?: string }>();
  useDesktopListRedirect('/documents/invoices');
  const invoiceId = Array.isArray(id) ? id[0] : id;
  const isNativeTablet = !isWeb && isTablet;
  const isTabletLandscape = isNativeTablet && width > height;
  const tabletDocumentWidth = width - IPAD_NAVIGATION_RAIL_WIDTH - IPAD_LIST_WIDTH;
  const showPermanentPdf =
    isTabletLandscape && tabletDocumentWidth >= IPAD_PDF_PREVIEW_WIDTH * 2;
  const { user } = useAuth();
  const { scope, isSwitching } = useTenant();
  const { data: invoice, isLoading, isFetched, refetch } = useInvoice(invoiceId ?? '');
  const {
    cancelInvoice,
    duplicateInvoice,
    markAsPaid,
    addPayment,
    updateInvoiceStatus,
  } = useInvoiceMutations();
  const { hasFeature } = useSubscription();
  const { isConfigured, createLink } = useStripePayment(invoiceId ?? '');
  const { showError, showSuccess } = useToast();

  const [actionsVisible, setActionsVisible] = useState(false);
  const [templateGalleryVisible, setTemplateGalleryVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [paymentLinkLoading, setPaymentLinkLoading] = useState(false);
  const [tabletListVisible, setTabletListVisible] = useState(false);
  const paymentsIntro = useFeatureIntro('payments');

  function openPaymentFlow() {
    paymentsIntro.runWithIntro(() => {
      setPaymentVisible(true);
    });
  }

  const { data: sentDocuments = [], isLoading: sentDocumentsLoading } = useSentDocuments(
    'invoice',
    invoiceId ?? '',
  );

  const buildHtml = useCallback(
    (templateId?: string) => {
      if (!scope || !invoice) {
        return Promise.resolve('');
      }

      return buildInvoicePdfHtml(requireScope(scope), invoice, user?.email ?? null, templateId);
    },
    [invoice, scope, user?.email],
  );

  const documentActions = useDocumentActions({
    buildHtml,
    clientEmail: invoice?.clientEmail,
    clientName: invoice?.clientName ?? '',
    documentId: invoice?.id ?? '',
    documentNumber: invoice?.number ?? '',
    documentType: 'invoice',
  });
  const { loadPreviewPdf } = documentActions;

  useEffect(() => {
    if (isFetched && !invoice && invoiceId) {
      showError('Facture introuvable');
      router.replace(DOCUMENTS_FALLBACK);
    }
  }, [isFetched, invoice, invoiceId, showError]);

  useEffect(() => {
    if (payment === 'success') {
      showSuccess('Paiement enregistré.');
      void refetch();
      return;
    }

    if (payment === 'canceled') {
      showError('Paiement annulé.');
    }
  }, [payment, refetch, showError, showSuccess]);

  useEffect(() => {
    if (!showPermanentPdf || !invoice) {
      return;
    }

    void loadPreviewPdf().catch(() => {
      showError('Impossible de préparer l’aperçu PDF.');
    });
  }, [invoice, loadPreviewPdf, showError, showPermanentPdf]);

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  async function handleStatusChange(status: InvoiceStatus) {
    if (!invoiceId) {
      return;
    }

    try {
      await updateInvoiceStatus.mutateAsync({ invoiceId, status });
      showSuccess('Statut mis à jour.');
    } catch (error) {
      showError(getInvoiceErrorMessage(readErrorMessage(error)));
    }
  }

  async function handleMarkAsPaid() {
    if (!invoiceId) {
      return;
    }

    try {
      await markAsPaid.mutateAsync({ invoiceId });
      showSuccess('Facture payée.');
    } catch (error) {
      showError(getInvoiceErrorMessage(readErrorMessage(error)));
    }
  }

  async function handleAddPayment(input: {
    amount: number;
    paidAt?: string;
    paymentMethod?: string;
    paymentReference?: string;
    notes?: string;
  }) {
    if (!invoiceId) {
      return;
    }

    try {
      await addPayment.mutateAsync({
        invoiceId,
        input: {
          amount: input.amount,
          paidAt: input.paidAt,
          paymentMethod: input.paymentMethod ?? null,
          paymentReference: input.paymentReference ?? null,
          notes: input.notes ?? null,
        },
      });
      setPaymentVisible(false);
      showSuccess('Paiement enregistré.');
    } catch (error) {
      showError(getInvoiceErrorMessage(readErrorMessage(error)));
    }
  }

  async function handleDuplicate() {
    if (!invoiceId) {
      return;
    }

    try {
      const duplicated = await duplicateInvoice.mutateAsync(invoiceId);
      showSuccess('Facture dupliquée.');
      router.push(`/documents/invoices/${duplicated.id}` as Href);
    } catch (error) {
      showError(getInvoiceErrorMessage(readErrorMessage(error)));
    }
  }

  async function handleCancel() {
    if (!invoiceId) {
      return;
    }

    try {
      await cancelInvoice.mutateAsync(invoiceId);
      setCancelVisible(false);
      showSuccess('Facture annulée.');
    } catch (error) {
      showError(getInvoiceErrorMessage(readErrorMessage(error)));
    }
  }

  /** Lien de paiement — partage pour le client, jamais le checkout vendeur. */
  async function handlePaymentLink() {
    if (!hasFeature('stripe_payments')) {
      router.push('/settings/premium' as Href);
      return;
    }

    if (!isConfigured) {
      showError('Le lien de paiement n’est pas encore configuré.');
      return;
    }

    if (!invoice) {
      return;
    }

    setPaymentLinkLoading(true);
    try {
      const url =
        invoice.stripePaymentLink ??
        (await createLink.mutateAsync(invoice.amountDue)).paymentLinkUrl;

      await Share.share({
        message: `Lien de paiement pour la facture ${invoice.number} : ${url}`,
        url,
      });
      showSuccess('Lien prêt à être partagé avec votre client.');
    } catch {
      showError('Impossible de préparer le lien de paiement.');
    } finally {
      setPaymentLinkLoading(false);
    }
  }

  const primaryAction = useMemo(() => {
    if (!invoice) {
      return null;
    }

    if (invoice.status === 'draft') {
      return {
        label: 'Envoyer',
        onPress: () => void documentActions.handleSendEmail(),
        loading: documentActions.emailLoading,
        caption: 'La facture sera envoyée par e-mail à votre client.',
      };
    }

    if (invoice.status === 'overdue') {
      return {
        label: 'Relancer',
        onPress: () => void documentActions.handleSendEmail(),
        loading: documentActions.emailLoading,
        caption: 'Un e-mail de relance sera envoyé au client.',
      };
    }

    return null;
  }, [documentActions.emailLoading, documentActions, invoice]);

  const actionSections = useMemo(() => {
    if (!invoice) {
      return [];
    }

    const editable = canEditInvoice(invoice.status);
    const cancelable = canCancelInvoice(invoice.status);
    const markableAsPaid = canMarkInvoiceAsPaid(invoice.status);
    const canPayPartially = canAddInvoicePayment(invoice);
    const signatureLocked = !hasFeature('client_signature');

    const primary = [
      {
        id: 'send',
        label: 'Envoyer par e-mail',
        icon: { ios: 'paperplane.fill', android: 'send', web: 'send' } as const,
        onPress: () => void documentActions.handleSendEmail(),
        loading: documentActions.emailLoading,
      },
      {
        id: 'pdf',
        label: 'Générer le PDF',
        icon: { ios: 'doc.fill', android: 'picture_as_pdf', web: 'picture_as_pdf' } as const,
        onPress: () => void documentActions.handleShare(),
        loading: documentActions.loading,
      },
      {
        id: 'print',
        label: 'Imprimer',
        icon: { ios: 'printer.fill', android: 'print', web: 'print' } as const,
        onPress: () => void documentActions.handlePrint(),
        loading: documentActions.loading,
      },
      {
        id: 'template',
        label: 'Changer de modèle',
        icon: { ios: 'paintpalette.fill', android: 'palette', web: 'palette' } as const,
        onPress: () => setTemplateGalleryVisible(true),
      },
      {
        id: 'sign',
        label: signatureLocked ? 'Faire signer (Premium)' : 'Faire signer',
        icon: { ios: 'pencil.tip', android: 'draw', web: 'draw' } as const,
        onPress: () => {
          if (signatureLocked) {
            router.push('/settings/premium' as Href);
            return;
          }

          setSignModalVisible(true);
        },
      },
    ];

    const workflow = [
      ...(invoice.status === 'draft'
        ? [
            {
              id: 'mark-sent',
              label: 'Marquer comme envoyée',
              icon: { ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' } as const,
              onPress: () => void handleStatusChange('sent'),
            },
          ]
        : []),
      ...(markableAsPaid
        ? [
            {
              id: 'mark-paid',
              label: 'Marquer comme payée',
              icon: {
                ios: 'checkmark.circle.fill',
                android: 'check_circle',
                web: 'check_circle',
              } as const,
              onPress: () => void handleMarkAsPaid(),
            },
          ]
        : []),
      ...(canPayPartially
        ? [
            {
              id: 'partial-pay',
              label: 'Paiement partiel',
              icon: {
                ios: 'eurosign.circle.fill',
                android: 'payments',
                web: 'payments',
              } as const,
              onPress: () => openPaymentFlow(),
            },
          ]
        : []),
      ...(invoice.amountDue > 0
        ? [
            {
              id: 'payment-link',
              label: hasFeature('stripe_payments')
                ? 'Lien de paiement'
                : 'Lien de paiement (Premium)',
              icon: { ios: 'link', android: 'link', web: 'link' } as const,
              onPress: () => void handlePaymentLink(),
              loading: paymentLinkLoading || createLink.isPending,
            },
          ]
        : []),
    ];

    const manage = [
      ...(editable
        ? [
            {
              id: 'edit',
              label: 'Modifier',
              icon: { ios: 'square.and.pencil', android: 'edit', web: 'edit' } as const,
              onPress: () => router.push(`/documents/invoices/${invoice.id}/edit` as Href),
            },
          ]
        : []),
      {
        id: 'duplicate',
        label: 'Dupliquer',
        icon: { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' } as const,
        onPress: () => void handleDuplicate(),
      },
      ...(cancelable
        ? [
            {
              id: 'cancel',
              label: 'Annuler la facture',
              icon: { ios: 'xmark.circle.fill', android: 'cancel', web: 'cancel' } as const,
              onPress: () => setCancelVisible(true),
              destructive: true,
            },
          ]
        : []),
    ];

    return [primary, workflow, manage].filter((section) => section.length > 0);
  }, [createLink.isPending, documentActions, hasFeature, invoice, paymentLinkLoading]);

  const header = (
    <InvoiceScreenHeader
      backLabel="Documents"
      fallbackHref={DOCUMENTS_FALLBACK}
      title={invoice?.number ?? 'Facture'}
      trailing={
        invoice ? (
          <Pressable
            accessibilityLabel="Plus d’actions"
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setActionsVisible(true)}
            style={({ pressed }) => [styles.actionsButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'ellipsis.circle', android: 'more_horiz', web: 'more_horiz' }}
              size={26}
              tintColor={colors.primary}
            />
          </Pressable>
        ) : null
      }
    />
  );

  if (isWeb && (isDesktop || isTablet)) {
    return null;
  }

  if (isSwitching || isLoading || !invoice) {
    if (isNativeTablet) {
      return (
        <IpadSplitShell
          document={
            <SafeAreaView
              edges={['top', 'bottom', 'right']}
              style={styles.safeArea}>
              <View style={styles.header}>
                <InvoiceScreenHeader
                  backLabel="Documents"
                  fallbackHref={DOCUMENTS_FALLBACK}
                  onBack={() => setTabletListVisible(true)}
                  showBackButton={!isTabletLandscape}
                  title="Facture"
                />
              </View>
              <LoadingView message="Chargement de la facture..." />
            </SafeAreaView>
          }
          list={
            <TabletDocumentsList
              initialSegment="invoices"
              onDismiss={
                isTabletLandscape ? undefined : () => setTabletListVisible(false)
              }
              selectedId={invoiceId}
              selectedType="invoice"
            />
          }
          listVisible={tabletListVisible}
          onDismissList={() => setTabletListVisible(false)}
        />
      );
    }

    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {header}
        <LoadingView message="Chargement de la facture..." />
      </SafeAreaView>
    );
  }

  const showPaymentLink =
    invoice.amountDue > 0 && invoice.status !== 'paid' && invoice.status !== 'canceled';
  const template = resolvePdfTemplate(documentActions.templateId);
  const previewCard = (
    <View style={styles.previewCard}>
      <Pressable
        onPress={() => void documentActions.handleOpenPreview()}
        style={({ pressed }) => [styles.previewRow, pressed && styles.pressed]}>
        <View style={[styles.previewAccent, { backgroundColor: template.theme.primary }]} />
        <View style={styles.previewContent}>
          <AppText medium variant="body">
            Aperçu PDF
          </AppText>
          <AppText color="secondary" variant="caption">
            {invoice.number} · modèle {template.name}
          </AppText>
        </View>
        {documentActions.loading || documentActions.pdfLoading ? (
          <ActivityIndicator color={colors.primary} />
        ) : (
          <SymbolView
            name={{ ios: 'doc.richtext', android: 'description', web: 'description' }}
            size={26}
            tintColor={colors.primary}
          />
        )}
      </Pressable>
      <View style={styles.previewActions}>
        <Button
          onPress={() => void documentActions.handleOpenPreview()}
          style={styles.previewActionButton}
          title="Ouvrir"
          variant="secondary"
        />
        <Button
          loading={documentActions.loading}
          onPress={() => void documentActions.handleShare()}
          style={styles.previewActionButton}
          title="Partager"
          variant="secondary"
        />
      </View>
    </View>
  );

  const moreActionsButton = (
    <Pressable
      accessibilityLabel="Plus d’actions"
      accessibilityRole="button"
      hitSlop={8}
      onPress={() => setActionsVisible(true)}
      style={({ pressed }) => [styles.actionsButton, pressed && styles.pressed]}>
      <SymbolView
        name={{ ios: 'ellipsis.circle', android: 'more_horiz', web: 'more_horiz' }}
        size={26}
        tintColor={colors.primary}
      />
    </Pressable>
  );

  const overlays = (
    <>
      <DocumentActionsSheet
        onClose={() => setActionsVisible(false)}
        sections={actionSections}
        subtitle={invoice.clientName}
        title={invoice.number}
        visible={actionsVisible}
      />

      <TemplateGalleryModal
        buildPreviewHtml={documentActions.buildPreviewHtml}
        cacheKey={`invoice-${invoice.id}`}
        onClose={() => setTemplateGalleryVisible(false)}
        onSelect={documentActions.applyTemplate}
        selectedTemplateId={documentActions.templateId}
        title="Modèle de la facture"
        visible={templateGalleryVisible}
      />

      <PdfPreviewModal
        loading={documentActions.loading}
        onClose={() => documentActions.setPreviewVisible(false)}
        onEmail={() => void documentActions.handleSendEmail()}
        onPageCountChange={documentActions.setPageCount}
        onPrint={() => void documentActions.handlePrint()}
        onSave={() => void documentActions.handleShare()}
        onShare={() => void documentActions.handleShare()}
        pageCount={documentActions.pageCount}
        pdfLoading={documentActions.pdfLoading}
        pdfUri={documentActions.previewPdfUri}
        title={`Aperçu · ${invoice.number}`}
        visible={documentActions.previewVisible}
      />

      <CancelInvoiceModal
        invoiceNumber={invoice.number}
        loading={cancelInvoice.isPending}
        onCancel={() => setCancelVisible(false)}
        onConfirm={handleCancel}
        visible={cancelVisible}
      />

      <PaymentModal
        loading={addPayment.isPending}
        maxAmount={invoice.amountDue}
        onCancel={() => setPaymentVisible(false)}
        onConfirm={handleAddPayment}
        visible={paymentVisible}
      />
      <FeatureIntroModal
        config={paymentsIntro.config}
        onClose={paymentsIntro.onClose}
        onCta={paymentsIntro.onCta}
        onDontShowAgain={paymentsIntro.onDontShowAgain}
        visible={paymentsIntro.visible}
      />
    </>
  );

  if (isNativeTablet) {
    const tabletHeaderActions = (
      <View style={styles.tabletHeaderActions}>
        {primaryAction ? (
          <Button
            loading={primaryAction.loading}
            onPress={primaryAction.onPress}
            style={styles.tabletHeaderAction}
            title={primaryAction.label}
          />
        ) : null}
        {showPaymentLink ? (
          <Button
            loading={paymentLinkLoading || createLink.isPending}
            onPress={() => void handlePaymentLink()}
            style={styles.tabletHeaderAction}
            title={
              hasFeature('stripe_payments') ? 'Lien de paiement' : 'Lien de paiement (Premium)'
            }
            variant={primaryAction ? 'secondary' : 'primary'}
          />
        ) : null}
        {moreActionsButton}
      </View>
    );

    return (
      <>
        <IpadSplitShell
          document={
            <SafeAreaView
              edges={['top', 'bottom', 'right']}
              style={styles.safeArea}>
              <View style={styles.tabletHeader}>
                <InvoiceScreenHeader
                  backLabel="Documents"
                  fallbackHref={DOCUMENTS_FALLBACK}
                  onBack={() => setTabletListVisible(true)}
                  showBackButton={!isTabletLandscape}
                  title={invoice.number}
                  trailing={tabletHeaderActions}
                />
                {primaryAction?.caption ? (
                  <AppText
                    color="tertiary"
                    style={styles.tabletHeaderCaption}
                    variant="caption">
                    {primaryAction.caption}
                  </AppText>
                ) : null}
              </View>

              <View style={styles.tabletBody}>
                <ScrollView
                  contentContainerStyle={[styles.content, styles.tabletContent]}
                  keyboardDismissMode="on-drag"
                  showsVerticalScrollIndicator={false}
                  style={styles.tabletScroll}>
                  <InvoiceDetailView
                    canAddPayment={false}
                    invoice={invoice}
                    onAddPayment={() => openPaymentFlow()}
                  />

                  {!showPermanentPdf ? previewCard : null}

                  <DocumentClientSignatureBlock
                    documentId={invoice.id}
                    documentLabel={`la facture ${invoice.number}`}
                    documentType="invoice"
                    onSignModalVisibleChange={setSignModalVisible}
                    showSignAction={false}
                    signModalVisible={signModalVisible}
                  />

                  <SentDocumentsSection
                    documents={sentDocuments}
                    loading={sentDocumentsLoading}
                  />
                </ScrollView>

                {showPermanentPdf ? (
                  <TabletPdfPreviewPanel
                    loading={documentActions.pdfLoading}
                    onOpen={() => void documentActions.handleOpenPreview()}
                    onRetry={() => {
                      void documentActions.loadPreviewPdf().catch(() => {
                        showError('Impossible de préparer l’aperçu PDF.');
                      });
                    }}
                    onShare={() => void documentActions.handleShare()}
                    pdfUri={documentActions.previewPdfUri}
                    shareLoading={documentActions.loading}
                    title={invoice.number}
                  />
                ) : null}
              </View>
            </SafeAreaView>
          }
          list={
            <TabletDocumentsList
              initialSegment="invoices"
              onDismiss={
                isTabletLandscape ? undefined : () => setTabletListVisible(false)
              }
              selectedId={invoice.id}
              selectedType="invoice"
            />
          }
          listVisible={tabletListVisible}
          onDismissList={() => setTabletListVisible(false)}
        />
        {overlays}
      </>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>{header}</View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <InvoiceDetailView
          canAddPayment={false}
          invoice={invoice}
          onAddPayment={() => openPaymentFlow()}
        />

        {previewCard}

        <DocumentClientSignatureBlock
          documentId={invoice.id}
          documentLabel={`la facture ${invoice.number}`}
          documentType="invoice"
          onSignModalVisibleChange={setSignModalVisible}
          showSignAction={false}
          signModalVisible={signModalVisible}
        />

        <SentDocumentsSection documents={sentDocuments} loading={sentDocumentsLoading} />
      </ScrollView>

      {primaryAction || showPaymentLink ? (
        <ActionBar caption={primaryAction?.caption}>
          {primaryAction ? (
            <Button
              loading={primaryAction.loading}
              onPress={primaryAction.onPress}
              title={primaryAction.label}
            />
          ) : null}
          {showPaymentLink ? (
            <Button
              loading={paymentLinkLoading || createLink.isPending}
              onPress={() => void handlePaymentLink()}
              title={
                hasFeature('stripe_payments') ? 'Lien de paiement' : 'Lien de paiement (Premium)'
              }
              variant={primaryAction ? 'secondary' : 'primary'}
            />
          ) : null}
        </ActionBar>
      ) : null}

      {overlays}
    </SafeAreaView>
  );
}

function readErrorMessage(error: unknown): string {
  if (error && typeof error === 'object' && 'message' in error) {
    return String((error as { message: string }).message);
  }

  return '';
}

function useStyles() {
  return useThemedStyles((colors) => ({
    safeArea: {
      flex: 1,
      backgroundColor: colors.backgroundGrouped,
    },
    header: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingTop: spacing.sm,
    },
    tabletHeader: {
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.surface,
    },
    tabletHeaderActions: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'flex-end' as const,
      flexWrap: 'wrap' as const,
      gap: spacing.sm,
    },
    tabletHeaderAction: {
      minWidth: 120,
    },
    tabletHeaderCaption: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingBottom: spacing.sm,
      textAlign: 'right' as const,
    },
    tabletBody: {
      flex: 1,
      minWidth: 0,
      minHeight: 0,
      flexDirection: 'row' as const,
    },
    tabletScroll: {
      flex: 1,
      minWidth: 0,
    },
    tabletContent: {
      flexGrow: 1,
      paddingTop: spacing.md,
    },
    content: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
    },
    previewCard: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.md,
    },
    previewRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.md,
    },
    previewAccent: {
      width: 4,
      alignSelf: 'stretch' as const,
      borderRadius: 999,
    },
    previewContent: {
      flex: 1,
      gap: 2,
    },
    previewActions: {
      flexDirection: 'row' as const,
      gap: spacing.sm,
    },
    previewActionButton: {
      flex: 1,
    },
    actionsButton: {
      minWidth: components.touchTarget,
      minHeight: components.touchTarget,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    pressed: {
      opacity: 0.7,
    },
  }));
}
