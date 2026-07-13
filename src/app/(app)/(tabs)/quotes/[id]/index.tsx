import { router, type Href } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentFinalizePanel } from '@/components/pdf/document-finalize-panel';
import { DocumentClientSignatureBlock } from '@/components/signatures/document-client-signature-block';
import { SentDocumentsSection } from '@/components/documents/sent-documents-section';
import {
  DeleteQuoteModal,
  QuoteDetailView,
  QuoteScreenHeader,
} from '@/components/quotes';
import { Button } from '@/components/ui/button';
import { LoadingView } from '@/components/ui/loading-view';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import { useQuoteMutations } from '@/hooks/use-quote-mutations';
import { useQuote } from '@/hooks/use-quote';
import { useSentDocuments } from '@/hooks/use-sent-documents';
import { getQuoteErrorMessage } from '@/lib/quotes/errors';
import { buildQuotePdfHtml } from '@/lib/pdf/document-pdf';
import {
  canDeleteQuote,
  canEditQuote,
  type QuoteStatus,
} from '@/types/quote';
import { canConvertQuoteToInvoice } from '@/types/invoice';
import { useToast } from '@/providers/toast-provider';

export default function QuoteDetailScreen() {
  const styles = useStyles();
  const colors = useColors();
  const { id } = useLocalSearchParams<{ id: string }>();
  const quoteId = Array.isArray(id) ? id[0] : id;
  const { user } = useAuth();
  const { scope } = useTenant();
  const { data: quote, isLoading, isFetched } = useQuote(quoteId ?? '');
  const {
    deleteQuote,
    duplicateQuote,
    updateQuoteStatus,
    convertToInvoice,
  } = useQuoteMutations();
  const { showError, showSuccess } = useToast();
  const [deleteVisible, setDeleteVisible] = useState(false);
  const [signModalVisible, setSignModalVisible] = useState(false);
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

  useEffect(() => {
    if (isFetched && !quote && quoteId) {
      showError('Devis introuvable');
      router.back();
    }
  }, [isFetched, quote, quoteId, showError]);

  async function handleStatusChange(status: QuoteStatus) {
    if (!quoteId) {
      return;
    }

    try {
      await updateQuoteStatus.mutateAsync({ quoteId, status });
      showSuccess('Statut mis à jour.');
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
      router.push(`/quotes/${duplicated.id}` as Href);
    } catch (error) {
      showError(getQuoteErrorMessage(readErrorMessage(error)));
    }
  }

  async function handleConvert() {
    if (!quoteId) {
      return;
    }

    try {
      const invoice = await convertToInvoice.mutateAsync(quoteId);
      showSuccess('Facture créée.');
      router.push(`/invoices/${invoice.id}` as Href);
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

  if (isLoading || !quote) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <LoadingView message="Chargement du devis..." />
      </SafeAreaView>
    );
  }

  const editable = canEditQuote(quote.status);
  const deletable = canDeleteQuote(quote.status);
  const convertible = canConvertQuoteToInvoice(quote.status);

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <View style={styles.header}>
        <QuoteScreenHeader title={quote.number} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}>
        <QuoteDetailView quote={quote} />

        <DocumentFinalizePanel
          buildHtml={buildHtml}
          canMarkAsSent={quote.status === 'draft'}
          clientEmail={quote.clientEmail}
          clientName={quote.clientName}
          documentId={quote.id}
          documentNumber={quote.number}
          documentType="quote"
          markAsSentLoading={updateQuoteStatus.isPending}
          onMarkAsSent={() => void handleStatusChange('sent')}
          onSignPress={() => setSignModalVisible(true)}
        />

        <DocumentClientSignatureBlock
          documentId={quote.id}
          documentLabel={`le devis ${quote.number}`}
          documentType="quote"
          onSignModalVisibleChange={setSignModalVisible}
          showSignAction={false}
          signModalVisible={signModalVisible}
        />

        <SentDocumentsSection documents={sentDocuments} loading={sentDocumentsLoading} />

        <View style={styles.statusActions}>
          {quote.status === 'sent' ? (
            <>
              <Button
                loading={updateQuoteStatus.isPending}
                onPress={() => handleStatusChange('accepted')}
                title="Marquer comme accepté"
              />
              <Button
                loading={updateQuoteStatus.isPending}
                onPress={() => handleStatusChange('rejected')}
                title="Marquer comme refusé"
                variant="ghost"
              />
              <Button
                loading={updateQuoteStatus.isPending}
                onPress={() => handleStatusChange('expired')}
                title="Marquer comme expiré"
                variant="ghost"
              />
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        {editable ? (
          <Button
            onPress={() => router.push(`/quotes/${quote.id}/edit` as Href)}
            title="Modifier"
            variant="ghost"
          />
        ) : null}
        <Button
          loading={duplicateQuote.isPending}
          onPress={handleDuplicate}
          title="Dupliquer"
          variant="ghost"
        />
        {convertible ? (
          <Button
            loading={convertToInvoice.isPending}
            onPress={handleConvert}
            title="Convertir en facture"
            variant="ghost"
          />
        ) : null}
        {quote.convertedInvoiceId ? (
          <Button
            onPress={() => router.push(`/invoices/${quote.convertedInvoiceId}` as Href)}
            title="Voir la facture"
            variant="ghost"
          />
        ) : null}
        {deletable ? (
          <Button onPress={() => setDeleteVisible(true)} title="Supprimer" variant="ghost" />
        ) : null}
      </View>

      <DeleteQuoteModal
        loading={deleteQuote.isPending}
        onCancel={() => setDeleteVisible(false)}
        onConfirm={handleDelete}
        quoteNumber={quote.number}
        visible={deleteVisible}
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
    paddingBottom: spacing.md,
  },
  content: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingBottom: spacing.lg,
    gap: spacing.lg,
  },
  statusActions: {
    gap: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    gap: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.separator,
    backgroundColor: colors.surface,
  },
}));
}
