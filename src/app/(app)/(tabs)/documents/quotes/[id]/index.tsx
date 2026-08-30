import { router, type Href } from 'expo-router';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentActionsSheet } from '@/components/documents/document-actions-sheet';
import { SentDocumentsSection } from '@/components/documents/sent-documents-section';
import {
  ConvertQuoteModal,
  DeleteQuoteModal,
  QuoteDetailView,
  QuoteScreenHeader,
  QuoteStatusConfirmSheet,
  QuoteTypeChip,
} from '@/components/quotes';
import { AppText } from '@/components/ui/app-text';
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
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import { useDesktopListRedirect } from '@/hooks/use-desktop-list-redirect';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useDocumentActions } from '@/hooks/use-document-actions';
import { useIsLargeContentSize } from '@/hooks/use-is-large-content-size';
import { useQuoteMutations } from '@/hooks/use-quote-mutations';
import { useQuote } from '@/hooks/use-quote';
import { useSentDocuments } from '@/hooks/use-sent-documents';
import { useSettings } from '@/hooks/use-settings';
import { useSubscription } from '@/hooks/use-subscription';
import { getQuoteErrorMessage } from '@/lib/quotes/errors';
import { buildQuotePdfHtml } from '@/lib/pdf/document-pdf';
import { resolvePdfTemplate } from '@/lib/pdf/engine/templates';
import {
  canDeleteQuote,
  canEditQuote,
  type QuoteStatus,
} from '@/types/quote';
import { canConvertQuoteToInvoice } from '@/types/invoice';
import { useToast } from '@/providers/toast-provider';

const DOCUMENTS_FALLBACK = '/documents' as Href;

export default function QuoteDetailScreen() {
  const styles = useStyles();
  const colors = useColors();
  const isLargeContentSize = useIsLargeContentSize();
  const { width, height, isWeb, isDesktop, isTablet } = useBreakpoint();
  const { id } = useLocalSearchParams<{ id: string }>();
  useDesktopListRedirect('/documents/quotes');
  const quoteId = Array.isArray(id) ? id[0] : id;
  const isNativeTablet = !isWeb && isTablet;
  const isTabletLandscape = isNativeTablet && width > height;
  const tabletDocumentWidth = width - IPAD_NAVIGATION_RAIL_WIDTH - IPAD_LIST_WIDTH;
  const showPermanentPdf =
    isTabletLandscape && tabletDocumentWidth >= IPAD_PDF_PREVIEW_WIDTH * 2;
  const { user } = useAuth();
  const { scope, isSwitching } = useTenant();
  const { data: quote, isLoading, isFetched, refetch } = useQuote(quoteId ?? '');
  const { data: settings } = useSettings();
  const { hasFeature } = useSubscription();
  const {
    deleteQuote,
    duplicateQuote,
    updateQuoteStatus,
    convertToInvoice,
  } = useQuoteMutations();
  const { showError, showSuccess } = useToast();

  const [actionsVisible, setActionsVisible] = useState(false);
  const [templateGalleryVisible, setTemplateGalleryVisible] = useState(false);
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [convertVisible, setConvertVisible] = useState(false);
  const [pendingStatus, setPendingStatus] = useState<QuoteStatus | null>(null);
  const [signModalVisible, setSignModalVisible] = useState(false);
  const [tabletListVisible, setTabletListVisible] = useState(false);

  const { data: sentDocuments = [], isLoading: sentDocumentsLoading } = useSentDocuments(
    'quote',
    quoteId ?? '',
  );

  const buildHtml = useCallback(
    (templateId?: string) => {
      if (!scope || !quote) {
        return Promise.resolve('');
      }

      return buildQuotePdfHtml(requireScope(scope), quote, user?.email ?? null, templateId);
    },
    [quote, scope, user?.email],
  );

  const documentActions = useDocumentActions({
    buildHtml,
    clientEmail: quote?.clientEmail,
    clientName: quote?.clientName ?? '',
    documentId: quote?.id ?? '',
    documentNumber: quote?.number ?? '',
    documentType: 'quote',
  });
  const { loadPreviewPdf } = documentActions;

  useFocusEffect(
    useCallback(() => {
      void refetch();
    }, [refetch]),
  );

  useEffect(() => {
    if (isFetched && !quote && quoteId) {
      showError('Devis introuvable');
      router.replace(DOCUMENTS_FALLBACK);
    }
  }, [isFetched, quote, quoteId, showError]);

  useEffect(() => {
    if (!showPermanentPdf || !quote) {
      return;
    }

    void loadPreviewPdf().catch(() => {
      showError('Impossible de préparer l’aperçu PDF.');
    });
  }, [loadPreviewPdf, quote, showError, showPermanentPdf]);

  async function commitStatusChange(status: QuoteStatus) {
    if (!quoteId) {
      return;
    }

    try {
      await updateQuoteStatus.mutateAsync({ quoteId, status });
      showSuccess('Statut mis à jour.');
      setPendingStatus(null);
    } catch (error) {
      showError(getQuoteErrorMessage(readErrorMessage(error)));
    }
  }

  async function handleDuplicate() {
    if (!quoteId) {
      return;
    }

    try {
      const duplicated = await duplicateQuote.mutateAsync(quoteId);
      showSuccess('Devis dupliqué.');
      router.push(`/documents/quotes/${duplicated.id}` as Href);
    } catch (error) {
      showError(getQuoteErrorMessage(readErrorMessage(error)));
    }
  }

  /** Conversion devis → facture — jamais immédiate, confirmation obligatoire (DESIGN §5.4). */
  async function handleConvert() {
    if (!quoteId) {
      return;
    }

    try {
      const invoice = await convertToInvoice.mutateAsync(quoteId);
      setConvertVisible(false);
      showSuccess('Facture créée en brouillon.');
      router.push(`/documents/invoices/${invoice.id}` as Href);
    } catch (error) {
      showError(getQuoteErrorMessage(readErrorMessage(error)));
    }
  }

  async function handleDelete() {
    if (!quoteId) {
      return;
    }

    try {
      await deleteQuote.mutateAsync(quoteId);
      setDeleteVisible(false);
      showSuccess('Devis supprimé.');
      router.back();
    } catch (error) {
      showError(getQuoteErrorMessage(readErrorMessage(error)));
    }
  }

  const primaryAction = useMemo(() => {
    if (!quote) {
      return null;
    }

    if (quote.status === 'draft') {
      return {
        label: 'Envoyer',
        onPress: () => void documentActions.handleSendEmail(),
        loading: documentActions.emailLoading,
        caption: 'Le devis sera envoyé par e-mail à votre client.',
      };
    }

    if (quote.status === 'sent') {
      return {
        label: 'Marquer comme accepté',
        onPress: () => setPendingStatus('accepted'),
        loading: false,
        caption: undefined,
      };
    }

    if (canConvertQuoteToInvoice(quote.status)) {
      return {
        label: 'Convertir en facture',
        onPress: () => setConvertVisible(true),
        loading: false,
        caption: "La facture est créée en brouillon, rien n'est envoyé.",
      };
    }

    if (quote.status === 'converted' && quote.convertedInvoiceId) {
      return {
        label: 'Voir la facture',
        onPress: () => router.push(`/documents/invoices/${quote.convertedInvoiceId}` as Href),
        loading: false,
        caption: undefined,
      };
    }

    return null;
  }, [documentActions, quote]);

  const secondaryActions = useMemo(() => {
    if (!quote || quote.status !== 'sent') {
      return [];
    }

    return [
      {
        id: 'reject',
        label: 'Marquer comme refusé',
        onPress: () => setPendingStatus('rejected'),
      },
      {
        id: 'expire',
        label: 'Marquer comme expiré',
        onPress: () => setPendingStatus('expired'),
      },
    ];
  }, [quote]);

  const actionSections = useMemo(() => {
    if (!quote) {
      return [];
    }

    const editable = canEditQuote(quote.status);
    const deletable = canDeleteQuote(quote.status);
    const signatureLocked = !hasFeature('client_signature');

    const documentSection = [
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
        label: signatureLocked ? 'Faire signer (offre supérieure)' : 'Faire signer',
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
      ...(quote.status === 'draft'
        ? [
            {
              id: 'mark-sent',
              label: 'Marquer comme envoyé',
              icon: { ios: 'checkmark.seal.fill', android: 'verified', web: 'verified' } as const,
              onPress: () => setPendingStatus('sent'),
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
              onPress: () => router.push(`/documents/quotes/${quote.id}/edit` as Href),
            },
          ]
        : []),
      {
        id: 'duplicate',
        label: 'Dupliquer',
        icon: { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' } as const,
        onPress: () => void handleDuplicate(),
      },
      ...(quote.convertedInvoiceId
        ? [
            {
              id: 'view-invoice',
              label: 'Voir la facture',
              icon: { ios: 'doc.text.fill', android: 'receipt_long', web: 'receipt_long' } as const,
              onPress: () => router.push(`/documents/invoices/${quote.convertedInvoiceId}` as Href),
            },
          ]
        : []),
      ...(deletable
        ? [
            {
              id: 'delete',
              label: 'Supprimer',
              icon: { ios: 'trash.fill', android: 'delete', web: 'delete' } as const,
              onPress: () => setDeleteVisible(true),
              destructive: true,
            },
          ]
        : []),
    ];

    return [documentSection, workflow, manage].filter((section) => section.length > 0);
  }, [documentActions, hasFeature, quote]);

  const header = (
    <QuoteScreenHeader
      backLabel="Documents"
      fallbackHref={DOCUMENTS_FALLBACK}
      title={quote?.number ?? 'Devis'}
      trailing={
        quote ? (
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

  if (isSwitching || isLoading || !quote) {
    if (isNativeTablet) {
      return (
        <IpadSplitShell
          document={
            <SafeAreaView
              edges={['top', 'bottom', 'right']}
              style={styles.safeArea}>
              <View style={styles.header}>
                <QuoteScreenHeader
                  backLabel="Documents"
                  fallbackHref={DOCUMENTS_FALLBACK}
                  onBack={() => setTabletListVisible(true)}
                  showBackButton={!isTabletLandscape}
                  title="Devis"
                />
              </View>
              <LoadingView message="Chargement du devis..." />
            </SafeAreaView>
          }
          list={
            <TabletDocumentsList
              initialSegment="quotes"
              onDismiss={
                isTabletLandscape ? undefined : () => setTabletListVisible(false)
              }
              selectedId={quoteId}
              selectedType="quote"
            />
          }
          listVisible={tabletListVisible}
          onDismissList={() => setTabletListVisible(false)}
        />
      );
    }

    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <View style={styles.header}>{header}</View>
        <LoadingView message="Chargement du devis..." />
      </SafeAreaView>
    );
  }

  const template = resolvePdfTemplate(documentActions.templateId);
  const hasActionBar = Boolean(primaryAction) || secondaryActions.length > 0;
  const previewCard = (
    <View style={styles.previewCard}>
      <Pressable
        accessibilityLabel={`Ouvrir l’aperçu PDF du devis ${quote.number}`}
        accessibilityRole="button"
        onPress={() => void documentActions.handleOpenPreview()}
        style={({ pressed }) => [styles.previewRow, pressed && styles.pressed]}>
        <View style={[styles.previewAccent, { backgroundColor: template.theme.primary }]} />
        <View style={styles.previewContent}>
          <AppText medium variant="body">
            Aperçu PDF
          </AppText>
          <AppText color="secondary" variant="caption">
            {quote.number} · modèle {template.name}
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
      <View style={[styles.previewActions, isLargeContentSize && styles.actionsColumn]}>
        <Button
          accessibilityLabel="Ouvrir l’aperçu PDF"
          onPress={() => void documentActions.handleOpenPreview()}
          style={[
            styles.previewActionButton,
            isLargeContentSize && styles.previewActionButtonLarge,
          ]}
          title="Ouvrir"
          variant="secondary"
        />
        <Button
          accessibilityLabel="Partager le PDF"
          loading={documentActions.loading}
          onPress={() => void documentActions.handleShare()}
          style={[
            styles.previewActionButton,
            isLargeContentSize && styles.previewActionButtonLarge,
          ]}
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
        subtitle={quote.clientName}
        title={quote.number}
        visible={actionsVisible}
      />

      <TemplateGalleryModal
        buildPreviewHtml={documentActions.buildPreviewHtml}
        cacheKey={`quote-${quote.id}`}
        onClose={() => setTemplateGalleryVisible(false)}
        onSelect={documentActions.applyTemplate}
        selectedTemplateId={documentActions.templateId}
        title="Modèle du devis"
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
        title={`Aperçu · ${quote.number}`}
        visible={documentActions.previewVisible}
      />

      <ConvertQuoteModal
        defaultPaymentTermsDays={settings ? Number(settings.paymentTermsDays) : 30}
        loading={convertToInvoice.isPending}
        onCancel={() => setConvertVisible(false)}
        onConfirm={handleConvert}
        quote={quote}
        visible={convertVisible}
      />

      <QuoteStatusConfirmSheet
        currentStatus={quote.status}
        loading={updateQuoteStatus.isPending}
        onCancel={() => setPendingStatus(null)}
        onConfirm={() => {
          if (pendingStatus) {
            void commitStatusChange(pendingStatus);
          }
        }}
        targetStatus={pendingStatus}
        visible={pendingStatus !== null}
      />

      <DeleteQuoteModal
        loading={deleteQuote.isPending}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={handleDelete}
        quoteNumber={quote.number}
        visible={deleteVisible}
      />
    </>
  );

  if (isNativeTablet) {
    const tabletHeaderActions = (
      <View
        style={[
          styles.tabletHeaderActions,
          isLargeContentSize && styles.tabletHeaderActionsLarge,
        ]}>
        {primaryAction ? (
          <Button
            loading={primaryAction.loading}
            onPress={primaryAction.onPress}
            style={styles.tabletHeaderAction}
            title={primaryAction.label}
          />
        ) : null}
        {secondaryActions.map((action) => (
          <Button
            key={action.id}
            onPress={action.onPress}
            style={styles.tabletHeaderAction}
            title={action.label}
            variant="secondary"
          />
        ))}
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
                <QuoteScreenHeader
                  backLabel="Documents"
                  fallbackHref={DOCUMENTS_FALLBACK}
                  onBack={() => setTabletListVisible(true)}
                  showBackButton={!isTabletLandscape}
                  title={quote.number}
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
                  <QuoteTypeChip />
                  <QuoteDetailView quote={quote} />

                  {!showPermanentPdf ? previewCard : null}

                  <DocumentClientSignatureBlock
                    documentId={quote.id}
                    documentLabel={`le devis ${quote.number}`}
                    documentType="quote"
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
                    title={quote.number}
                  />
                ) : null}
              </View>
            </SafeAreaView>
          }
          list={
            <TabletDocumentsList
              initialSegment="quotes"
              onDismiss={
                isTabletLandscape ? undefined : () => setTabletListVisible(false)
              }
              selectedId={quote.id}
              selectedType="quote"
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
        <QuoteTypeChip />

        <QuoteDetailView quote={quote} />

        {previewCard}

        <DocumentClientSignatureBlock
          documentId={quote.id}
          documentLabel={`le devis ${quote.number}`}
          documentType="quote"
          onSignModalVisibleChange={setSignModalVisible}
          showSignAction={false}
          signModalVisible={signModalVisible}
        />

        <SentDocumentsSection documents={sentDocuments} loading={sentDocumentsLoading} />
      </ScrollView>

      {hasActionBar ? (
        <ActionBar caption={primaryAction?.caption}>
          {primaryAction ? (
            <Button
              loading={primaryAction.loading}
              onPress={primaryAction.onPress}
              title={primaryAction.label}
            />
          ) : null}
          {secondaryActions.map((action) => (
            <Button
              key={action.id}
              onPress={action.onPress}
              title={action.label}
              variant="secondary"
            />
          ))}
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
    tabletHeaderActionsLarge: {
      flexDirection: 'column' as const,
      alignItems: 'stretch' as const,
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
    actionsColumn: {
      flexDirection: 'column' as const,
    },
    previewActionButton: {
      flex: 1,
    },
    previewActionButtonLarge: {
      flex: 0,
      width: '100%' as const,
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
