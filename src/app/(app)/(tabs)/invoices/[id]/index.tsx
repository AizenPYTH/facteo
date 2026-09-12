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
  PaymentModal,
} from '@/components/invoices';
import { PdfPreviewModal } from '@/components/pdf/pdf-preview-modal';
import { TemplateGalleryModal } from '@/components/pdf/template-gallery-modal';
import { DocumentClientSignatureBlock } from '@/components/signatures/document-client-signature-block';
import { LoadingView } from '@/components/ui/loading-view';
import { useDocumentActions } from '@/hooks/use-document-actions';
import { useElectronicInvoicing } from '@/hooks/use-electronic-invoicing';
import { useThemedStyles, useColors } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useDesktopListRedirect } from '@/hooks/use-desktop-list-redirect';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useInvoice } from '@/hooks/use-invoices';
import { useInvoiceMutations } from '@/hooks/use-invoice-mutations';
import { getInvoiceErrorMessage } from '@/lib/invoices/errors';
import { buildInvoicePdfHtml } from '@/lib/pdf/document-pdf';
import { sendElectronicInvoice } from '@/lib/superpdp/api';
import { formatElectronicInvoiceStatus } from '@/lib/superpdp/status';
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

export default function InvoiceDetailScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { isWeb, isDesktop, isTablet } = useBreakpoint();
  const { id, payment } = useLocalSearchParams<{ id: string; payment?: string }>();
  useDesktopListRedirect('/invoices');
  const invoiceId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();
  const { scope, isSwitching, companyId } = useTenant();
  const { data: invoice, isLoading, isFetched, refetch } = useInvoice(invoiceId ?? '');
  const {
    cancelInvoice,
    duplicateInvoice,
    markAsPaid,
    addPayment,
    updateInvoiceStatus,
  } = useInvoiceMutations();
  const { hasFeature } = useSubscription();
  const { data: eInvoicing } = useElectronicInvoicing();
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

  /**
   * Une facture réellement transmise au client n'est plus un brouillon.
   * On ne l'avance qu'après confirmation d'envoi par le fournisseur — jamais
   * sur une simple ouverture de l'application Mail.
   */
  const handleInvoiceSent = useCallback(async () => {
    if (!invoiceId || invoice?.status !== 'draft') {
      return;
    }

    try {
      await updateInvoiceStatus.mutateAsync({ invoiceId, status: 'sent' });
    } catch {
      // L'envoi a bien eu lieu : un échec de mise à jour du statut ne doit pas
      // être présenté comme un échec d'envoi. L'utilisateur peut toujours
      // utiliser « Marquer comme envoyée ».
    }
  }, [invoice?.status, invoiceId, updateInvoiceStatus]);

  const documentActions = useDocumentActions({
    buildHtml,
    clientEmail: invoice?.clientEmail,
    clientName: invoice?.clientName ?? '',
    documentId: invoice?.id ?? '',
    documentNumber: invoice?.number ?? '',
    documentType: 'invoice',
    documentUpdatedAt: invoice?.updatedAt,
    onSent: handleInvoiceSent,
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

  async function handleSendElectronic() {
    if (!invoiceId || !companyId || !invoice) {
      return;
    }
    if (invoice.status === 'draft' || invoice.status === 'canceled') {
      showError('Émettez d’abord la facture (hors brouillon / annulée).');
      return;
    }
    try {
      const result = await sendElectronicInvoice(companyId, invoiceId);
      if (result.idempotent) {
        showSuccess(result.message || 'Facture déjà transmise électroniquement.');
      } else {
        showSuccess('Facture envoyée en facturation électronique.');
      }
      await refetch();
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Envoi électronique impossible.');
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
    const signatureLocked = !hasFeature('client_signature');

    const primary = [
      {
        id: 'send',
        label: 'Envoyer par e-mail',
        icon: { ios: 'paperplane.fill', android: 'send', web: 'send' } as const,
        onPress: documentActions.handleSendEmail,
        loading: documentActions.isBusy('email'),
      },
      // L'envoi électronique n'apparaît que si l'entreprise est réellement
      // raccordée à la plateforme et autorisée à émettre. Sinon on propose le
      // raccordement, sans laisser croire qu'INVEQ est déjà connecté.
      ...(eInvoicing?.canEmit
        ? [
            {
              id: 'e-invoice',
              label: invoice.superpdpInvoiceId
                ? `Facture électronique · ${
                    formatElectronicInvoiceStatus(invoice.electronicInvoiceStatus) ?? 'transmise'
                  }`
                : 'Transmettre en facture électronique',
              icon: { ios: 'bolt.fill', android: 'bolt', web: 'bolt' } as const,
              onPress: () => void handleSendElectronic(),
            },
          ]
        : [
            {
              id: 'e-invoice-setup',
              label: 'Configurer la facturation électronique',
              icon: { ios: 'bolt.badge.clock', android: 'bolt', web: 'bolt' } as const,
              onPress: () => router.push('/settings/e-invoicing' as Href),
            },
          ]),
      {
        id: 'pdf',
        label: 'Aperçu du PDF',
        icon: { ios: 'doc.fill', android: 'picture_as_pdf', web: 'picture_as_pdf' } as const,
        onPress: documentActions.handleOpenPreview,
        loading: documentActions.isBusy('preview'),
      },
      {
        id: 'download',
        label: 'Télécharger PDF',
        icon: { ios: 'arrow.down.circle.fill', android: 'download', web: 'download' } as const,
        onPress: documentActions.handleDownload,
        loading: documentActions.isBusy('download'),
      },
      {
        id: 'share',
        label: 'Partager le PDF',
        icon: { ios: 'square.and.arrow.up', android: 'share', web: 'share' } as const,
        onPress: documentActions.handleShare,
        loading: documentActions.isBusy('share'),
      },
      {
        id: 'print',
        label: 'Imprimer',
        icon: { ios: 'printer.fill', android: 'print', web: 'print' } as const,
        onPress: documentActions.handlePrint,
        loading: documentActions.isBusy('print'),
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
    companyId,
    documentActions,
    eInvoicing?.canEmit,
    hasFeature,
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
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
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
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <InvoiceDetailView
          canAddPayment={false}
          invoice={invoice}
          onAddPayment={() => setPaymentVisible(true)}
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
        busyAction={documentActions.pendingAction}
        errorMessage={documentActions.pdfError}
        onClose={() => documentActions.setPreviewVisible(false)}
        onDownload={documentActions.handleDownload}
        onEmail={documentActions.handleSendEmail}
        onPageCountChange={documentActions.setPageCount}
        onPrint={documentActions.handlePrint}
        onShare={documentActions.handleShare}
        pageCount={documentActions.pageCount}
        pdfHtml={documentActions.previewHtml}
        pdfLoading={documentActions.pdfStatus === 'generating'}
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
