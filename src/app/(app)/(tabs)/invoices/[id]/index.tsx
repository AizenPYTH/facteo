import { router, type Href } from 'expo-router';
import { useFocusEffect, useLocalSearchParams } from 'expo-router';
import * as Linking from 'expo-linking';
import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentActionsSheet } from '@/components/documents/document-actions-sheet';
import { SentDocumentsSection } from '@/components/documents/sent-documents-section';
import {
  CancelInvoiceModal,
  InvoiceDetailView,
  InvoiceScreenHeader,
  InvoiceStickyActionsBar,
  useInvoiceStickyActionsInset,
  PaymentModal,
} from '@/components/invoices';
import { PdfPreviewModal } from '@/components/pdf/pdf-preview-modal';
import { TemplateGalleryModal } from '@/components/pdf/template-gallery-modal';
import { DocumentClientSignatureBlock } from '@/components/signatures/document-client-signature-block';
import { LoadingView } from '@/components/ui/loading-view';
import { useDocumentActions } from '@/hooks/use-document-actions';
import { useThemedStyles, useColors } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useDesktopListRedirect } from '@/hooks/use-desktop-list-redirect';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useInvoice, useInvoiceRevisions } from '@/hooks/use-invoices';
import { useInvoiceMutations } from '@/hooks/use-invoice-mutations';
import { getInvoiceErrorMessage } from '@/lib/invoices/errors';
import { buildInvoicePdfHtml } from '@/lib/pdf/document-pdf';
import { newInvoiceHref } from '@/lib/navigation/new-document';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import { useSentDocuments } from '@/hooks/use-sent-documents';
import { useStripePayment } from '@/hooks/use-stripe-payment';
import { useSubscription } from '@/hooks/use-subscription';
import {
  canAddInvoicePayment,
  canCancelInvoice,
  canConvertInvoiceToCreditNote,
  canCorrectInvoice,
  canEditInvoice,
  canMarkInvoiceAsPaid,
  type InvoiceStatus,
} from '@/types/invoice';
import { useToast } from '@/providers/toast-provider';

export default function InvoiceDetailScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { isWeb, isDesktop, isTablet } = useBreakpoint();
  const { id, payment } = useLocalSearchParams<{ id: string; payment?: string }>();
  useDesktopListRedirect('/invoices');
  const invoiceId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();
  const { scope, isSwitching } = useTenant();
  const { data: invoice, isLoading, isFetched, refetch } = useInvoice(invoiceId ?? '');
  const {
    cancelInvoice,
    duplicateInvoice,
    createCreditNote,
    correctInvoice,
    markAsPaid,
    addPayment,
    updateInvoiceStatus,
  } = useInvoiceMutations();
  const { data: revisions = [] } = useInvoiceRevisions(invoiceId ?? '');
  const { hasFeature } = useSubscription();
  const { isConfigured, createLink, openPaymentLink } = useStripePayment(invoiceId ?? '');
  const { showError, showSuccess } = useToast();

  const [actionsVisible, setActionsVisible] = useState(false);
  const [templateGalleryVisible, setTemplateGalleryVisible] = useState(false);
  const [cancelVisible, setCancelVisible] = useState(false);
  const [paymentVisible, setPaymentVisible] = useState(false);
  const [signModalVisible, setSignModalVisible] = useState(false);

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
    amountDue: invoice?.amountDue,
    dueAt: invoice?.dueAt,
  });

  useEffect(() => {
    if (isFetched && !invoice && invoiceId) {
      showError('Facture introuvable');
      router.back();
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
      router.push(`/invoices/${duplicated.id}` as Href);
    } catch (error) {
      showError(getInvoiceErrorMessage(readErrorMessage(error)));
    }
  }

  async function handleConvertToCreditNote() {
    if (!invoiceId) {
      return;
    }

    try {
      const creditNote = await createCreditNote.mutateAsync(invoiceId);
      showSuccess('Avoir créé.');
      router.push(`/invoices/${creditNote.id}` as Href);
    } catch (error) {
      showError(getInvoiceErrorMessage(readErrorMessage(error)));
    }
  }

  async function handleCorrectInvoice() {
    if (!invoiceId) {
      return;
    }

    try {
      const { correctedInvoice } = await correctInvoice.mutateAsync(invoiceId);
      showSuccess('Avoir créé et nouvelle facture en brouillon.');
      router.push(`/invoices/${correctedInvoice.id}/edit` as Href);
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

  async function handleStripePayment() {
    if (!hasFeature('stripe_payments')) {
      router.push('/settings/premium' as Href);
      return;
    }

    if (!isConfigured) {
      showError('Le paiement en ligne n’est pas encore configuré.');
      return;
    }

    if (!invoice) {
      return;
    }

    try {
      if (invoice.stripePaymentLink) {
        await openPaymentLink(invoice.stripePaymentLink);
        return;
      }

      const result = await createLink.mutateAsync(invoice.amountDue);
      await Linking.openURL(result.paymentLinkUrl);
      showSuccess('Redirection vers Stripe...');
    } catch {
      showError('Impossible d’ouvrir le paiement en ligne.');
    }
  }

  const actionSections = useMemo(() => {
    if (!invoice) {
      return [];
    }

    const editable = canEditInvoice(invoice.status);
    const cancelable = canCancelInvoice(invoice.status);
    const markableAsPaid = canMarkInvoiceAsPaid(invoice.status);
    const canPayPartially = canAddInvoicePayment(invoice);
    const canCreditNote =
      invoice.documentKind === 'invoice' && canConvertInvoiceToCreditNote(invoice.status);
    const canCorrect =
      invoice.documentKind === 'invoice' && canCorrectInvoice(invoice.status);
    const signatureLocked = !hasFeature('client_signature');

    const primary = [
      ...(markableAsPaid
        ? [
            {
              id: 'remind',
              label: 'Relancer le client',
              icon: { ios: 'bell.badge.fill', android: 'notifications_active', web: 'notifications_active' } as const,
              onPress: () => void documentActions.handleRemindEmail(),
              loading: documentActions.remindLoading,
            },
          ]
        : []),
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
              icon: { ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' } as const,
              onPress: () => void handleMarkAsPaid(),
            },
          ]
        : []),
      ...(canPayPartially
        ? [
            {
              id: 'partial-pay',
              label: 'Paiement partiel',
              icon: { ios: 'eurosign.circle.fill', android: 'payments', web: 'payments' } as const,
              onPress: () => setPaymentVisible(true),
            },
          ]
        : []),
      ...(invoice.amountDue > 0
        ? [
            {
              id: 'stripe',
              label: hasFeature('stripe_payments') ? 'Payer en ligne' : 'Payer en ligne (Premium)',
              icon: { ios: 'creditcard.fill', android: 'credit_card', web: 'credit_card' } as const,
              onPress: () => void handleStripePayment(),
            },
          ]
        : []),
    ];

    const manage = [
      ...(invoice.clientId
        ? [
            {
              id: 'replay',
              label: 'Comme la dernière fois',
              icon: { ios: 'arrow.clockwise', android: 'replay', web: 'replay' } as const,
              onPress: () =>
                router.push(newInvoiceHref(invoice.clientId, { replay: true })),
            },
          ]
        : []),
      ...(editable
        ? [
            {
              id: 'edit',
              label: 'Modifier',
              icon: { ios: 'square.and.pencil', android: 'edit', web: 'edit' } as const,
              onPress: () => router.push(`/invoices/${invoice.id}/edit` as Href),
            },
          ]
        : []),
      {
        id: 'duplicate',
        label: 'Dupliquer',
        icon: { ios: 'doc.on.doc', android: 'content_copy', web: 'content_copy' } as const,
        onPress: () => void handleDuplicate(),
      },
      ...(canCreditNote
        ? [
            {
              id: 'credit-note',
              label: 'Convertir en avoir',
              icon: {
                ios: 'arrow.uturn.backward.circle.fill',
                android: 'undo',
                web: 'undo',
              } as const,
              onPress: () => void handleConvertToCreditNote(),
            },
          ]
        : []),
      ...(canCorrect
        ? [
            {
              id: 'correct',
              label: 'Corriger (avoir + nouvelle facture)',
              icon: {
                ios: 'arrow.triangle.2.circlepath',
                android: 'sync',
                web: 'sync',
              } as const,
              onPress: () => void handleCorrectInvoice(),
            },
          ]
        : []),
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
  }, [
    documentActions,
    hasFeature,
    invoice,
  ]);

  const stickyInset = useInvoiceStickyActionsInset();
  const editable = invoice ? canEditInvoice(invoice.status) : false;
  const canCreditNote =
    !!invoice &&
    invoice.documentKind === 'invoice' &&
    canConvertInvoiceToCreditNote(invoice.status);
  const canCorrect =
    !!invoice && invoice.documentKind === 'invoice' && canCorrectInvoice(invoice.status);

  const stickyActions = useMemo(() => {
    if (!invoice) {
      return [];
    }

    return [
      ...(editable
        ? [
            {
              id: 'edit',
              label: 'Modifier',
              primary: true as const,
              onPress: () => router.push(`/invoices/${invoice.id}/edit` as Href),
            },
          ]
        : [
            {
              id: 'send',
              label: 'Envoyer',
              primary: true as const,
              onPress: () => void documentActions.handleSendEmail(),
            },
          ]),
      {
        id: 'duplicate',
        label: 'Dupliquer',
        onPress: () => void handleDuplicate(),
      },
      ...(canCreditNote
        ? [
            {
              id: 'credit-note',
              label: 'Avoir',
              onPress: () => void handleConvertToCreditNote(),
            },
          ]
        : []),
      ...(canCorrect
        ? [
            {
              id: 'correct',
              label: 'Corriger',
              onPress: () => void handleCorrectInvoice(),
            },
          ]
        : []),
      {
        id: 'history',
        label: 'Historique',
        onPress: () => setActionsVisible(true),
      },
    ];
  }, [
    canCorrect,
    canCreditNote,
    documentActions,
    editable,
    invoice,
  ]);

  if (isWeb && (isDesktop || isTablet)) {
    return null;
  }

  if (isSwitching || isLoading || !invoice) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <LoadingView message="Chargement de la facture..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.header}>
        <InvoiceScreenHeader
          title={invoice.number}
          trailing={
            <Pressable
              accessibilityLabel="Actions"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => setActionsVisible(true)}
              style={({ pressed }) => [styles.actionsButton, pressed && styles.pressed]}>
              <SymbolView
                name={{ ios: 'ellipsis.circle', android: 'more_horiz', web: 'more_horiz' }}
                size={26}
                tintColor={colors.primary}
              />
              <Text style={styles.actionsLabel}>Actions</Text>
            </Pressable>
          }
        />
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: stickyInset + spacing.xl }]}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <InvoiceDetailView
          canAddPayment={false}
          invoice={invoice}
          onAddPayment={() => setPaymentVisible(true)}
          revisions={revisions}
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

      <InvoiceStickyActionsBar actions={stickyActions} />

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
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      minHeight: 44,
      paddingHorizontal: spacing.xs,
    },
    actionsLabel: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
    pressed: {
      opacity: 0.75,
    },
  }));
}
