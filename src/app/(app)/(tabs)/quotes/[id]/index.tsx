import { router, type Href } from 'expo-router';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { DocumentDetailSkeleton } from '@/components/documents/document-detail-skeleton';
import { DocumentFinalizePanel } from '@/components/pdf/document-finalize-panel';
import { DocumentClientSignatureBlock } from '@/components/signatures/document-client-signature-block';
import { SentDocumentsSection } from '@/components/documents/sent-documents-section';
import {
  DeleteQuoteModal,
  QuoteDetailView,
  QuoteScreenHeader,
} from '@/components/quotes';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useAuth } from '@/hooks/use-auth';
import { useTenant } from '@/hooks/use-tenant';
import { requireScope } from '@/lib/tenant/scope';
import { useDesktopListRedirect } from '@/hooks/use-desktop-list-redirect';
import { useBreakpoint } from '@/hooks/use-breakpoint';
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
  const { isWeb, isDesktop, isTablet } = useBreakpoint();
  const { id } = useLocalSearchParams<{ id: string }>();
  useDesktopListRedirect('/quotes');
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
  const [convertVisible, setConvertVisible] = useState(false);
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
      setConvertVisible(false);
      // On nomme la facture produite : « Facture créée » ne disait pas laquelle,
      // et l'écran changeait sans que le lien avec le devis soit explicite.
      showSuccess(`Facture ${invoice.number} créée depuis ${quote?.number ?? 'ce devis'}.`);
      router.push(`/invoices/${invoice.id}` as Href);
    } catch (error) {
      setConvertVisible(false);
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

  if (isWeb && (isDesktop || isTablet)) {
    return null;
  }

  if (isLoading || !quote) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <DocumentDetailSkeleton />
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
        {quote.convertedInvoiceId ? (
          // La conversion ne laissait qu'un bouton parmi cinq en pied d'écran :
          // rien ne disait, en haut du devis, qu'une facture en était issue.
          <Card
            accessibilityHint="Ouvre la facture issue de ce devis"
            accessibilityLabel="Voir la facture issue de ce devis"
            onPress={() => router.push(`/invoices/${quote.convertedInvoiceId}` as Href)}
            variant="subtle">
            <Text style={styles.bannerTitle}>Ce devis a été converti</Text>
            <Text style={styles.bannerMessage}>
              Une facture a été créée à partir de ces prestations. Appuyez pour l’ouvrir.
            </Text>
          </Card>
        ) : null}

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
            onPress={() => setConvertVisible(true)}
            title="Convertir en facture"
          />
        ) : null}
        {deletable ? (
          <Button onPress={() => setDeleteVisible(true)} title="Supprimer" variant="ghost" />
        ) : null}
      </View>

      <ConfirmDialog
        confirmLabel="Convertir"
        loading={convertToInvoice.isPending}
        message={`Une facture reprenant les prestations de ${quote.number} sera créée. Le devis, lui, reste inchangé.`}
        onCancel={() => setConvertVisible(false)}
        onConfirm={handleConvert}
        title="Convertir en facture ?"
        visible={convertVisible}
      />

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
  bannerTitle: {
    ...typography.subheadlineMedium,
    color: colors.text,
  },
  bannerMessage: {
    ...typography.footnote,
    color: colors.textSecondary,
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
