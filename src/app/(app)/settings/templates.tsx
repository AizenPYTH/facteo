import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { TemplateGalleryModal } from '@/components/pdf/template-gallery-modal';
import { SettingsScreenHeader } from '@/components/settings';
import { AppText } from '@/components/ui/app-text';
import { LoadingView } from '@/components/ui/loading-view';
import { useAuth } from '@/hooks/use-auth';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useSettings, useUpdateDocumentTemplates } from '@/hooks/use-settings';
import { useTenant } from '@/hooks/use-tenant';
import { buildTemplatePreviewHtml } from '@/lib/pdf/template-preview-html';
import { requireScope } from '@/lib/tenant/scope';
import { useToast } from '@/providers/toast-provider';

type DocumentKind = 'invoice' | 'quote';

export default function DocumentTemplatesScreen() {
  const styles = useStyles();
  const { data, isLoading } = useSettings();
  const { scope } = useTenant();
  const { user } = useAuth();
  const updateTemplates = useUpdateDocumentTemplates();
  const { showError } = useToast();

  const [quoteTemplateId, setQuoteTemplateId] = useState(data?.quoteTemplateId ?? 'classic-blue');
  const [invoiceTemplateId, setInvoiceTemplateId] = useState(data?.invoiceTemplateId ?? 'classic-blue');
  const [activeKind, setActiveKind] = useState<DocumentKind>('invoice');
  const [galleryVisible, setGalleryVisible] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (data) {
      setQuoteTemplateId(data.quoteTemplateId);
      setInvoiceTemplateId(data.invoiceTemplateId);
    }
  }, [data]);

  const selectedTemplateId = activeKind === 'invoice' ? invoiceTemplateId : quoteTemplateId;

  const persistTemplates = useCallback(
    (nextInvoiceId: string, nextQuoteId: string) => {
      if (saveTimerRef.current) {
        clearTimeout(saveTimerRef.current);
      }

      saveTimerRef.current = setTimeout(() => {
        void updateTemplates
          .mutateAsync({ quoteTemplateId: nextQuoteId, invoiceTemplateId: nextInvoiceId })
          .catch((error) => {
            showError(error instanceof Error ? error.message : 'Erreur lors de la sauvegarde.');
          });
      }, 350);
    },
    [showError, updateTemplates],
  );

  const handleSelectTemplate = useCallback(
    (templateId: string) => {
      if (activeKind === 'invoice') {
        setInvoiceTemplateId(templateId);
        persistTemplates(templateId, quoteTemplateId);
        return;
      }

      setQuoteTemplateId(templateId);
      persistTemplates(invoiceTemplateId, templateId);
    },
    [activeKind, invoiceTemplateId, persistTemplates, quoteTemplateId],
  );

  const buildPreviewHtml = useCallback(
    (templateId: string) => {
      if (!scope) {
        return Promise.resolve('');
      }

      return buildTemplatePreviewHtml(
        requireScope(scope),
        templateId,
        activeKind,
        user?.email ?? null,
      );
    },
    [activeKind, scope, user?.email],
  );

  const kindLabel = useMemo(
    () => (activeKind === 'invoice' ? 'factures' : 'devis'),
    [activeKind],
  );

  if (isLoading) {
    return (
      <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
        <LoadingView message="Chargement..." />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
      <SettingsScreenHeader title="Modèles de documents" />
      <View style={styles.content}>
        <AppText color="secondary" variant="subtitle">
          Parcourez les modèles en taille réelle. Le modèle sélectionné est enregistré
          automatiquement.
        </AppText>

        <View style={styles.segment}>
          <Pressable
            onPress={() => setActiveKind('invoice')}
            style={[styles.segmentItem, activeKind === 'invoice' && styles.segmentItemActive]}>
            <AppText medium={activeKind === 'invoice'} variant="body">
              Factures
            </AppText>
          </Pressable>
          <Pressable
            onPress={() => setActiveKind('quote')}
            style={[styles.segmentItem, activeKind === 'quote' && styles.segmentItemActive]}>
            <AppText medium={activeKind === 'quote'} variant="body">
              Devis
            </AppText>
          </Pressable>
        </View>

        <Pressable onPress={() => setGalleryVisible(true)} style={styles.openGallery}>
          <AppText medium variant="body">
            Ouvrir la galerie des modèles de {kindLabel}
          </AppText>
          <AppText color="secondary" variant="caption">
            Aperçu PDF réel · balayez entre les modèles
          </AppText>
        </Pressable>
      </View>

      <TemplateGalleryModal
        buildPreviewHtml={buildPreviewHtml}
        cacheKey={`settings-${activeKind}`}
        onClose={() => setGalleryVisible(false)}
        onSelect={handleSelectTemplate}
        selectedTemplateId={selectedTemplateId}
        title={activeKind === 'invoice' ? 'Modèles de factures' : 'Modèles de devis'}
        visible={galleryVisible}
      />
    </SafeAreaView>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    safeArea: { flex: 1, backgroundColor: colors.backgroundGrouped },
    content: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingTop: spacing.md,
      gap: spacing.lg,
    },
    segment: {
      flexDirection: 'row',
      backgroundColor: colors.surface,
      borderRadius: 12,
      padding: 4,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    segmentItem: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: 10,
    },
    segmentItemActive: {
      backgroundColor: colors.primarySubtle,
    },
    openGallery: {
      gap: spacing.xs,
      padding: spacing.lg,
      borderRadius: 16,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
  }));
}
