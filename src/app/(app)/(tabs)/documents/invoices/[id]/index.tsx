import { router, type Href } from 'expo-router';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, Share, View } from 'react-native';
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
import { ActionBar } from '@/components/ui/action-bar';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { useDocumentActions } from '@/hooks/use-document-actions';
import { useThemedStyles, useColors } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { spacing } from '@/constants/theme/spacing';
import { useDesktopListRedirect } from '@/hooks/use-desktop-list-redirect';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useFeatureIntro } from '@/hooks/use-feature-intro';
import { useInvoice } from '@/hooks/use-invoices';
import { useInvoiceMutations } from '@/hooks/use-invoice-mutations';
import { getInvoiceErrorMessage } from '@/lib/invoices/errors';
import { buildInvoicePdfHtml } from '@/lib/pdf/document-pdf';
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
  const { isWeb, isDesktop, isTablet } = useBreakpoint();
  const { id, payment } = useLocalSearchParams<{ id: string; payment?: string }>();
  useDesktopListRedirect('/documents/invoices');
  const invoiceId = Array.isArray(id) ? id[0] : id;
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
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        {header}
        <LoadingView message="Chargement de la facture..." />
      </SafeAreaView>
    );
  }

  const showPaymentLink =
    invoice.amountDue > 0 && invoice.status !== 'paid' && invoice.status !== 'canceled';

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
    content: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingBottom: spacing.xl,
      gap: spacing.lg,
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
