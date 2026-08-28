import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { TemplateGalleryModal } from '@/components/pdf/template-gallery-modal';
import { FeatureIntroModal } from '@/components/feature-intros';
import { SettingsScreenFrame } from '@/components/web/desktop/settings-screen-frame';
import { AppText } from '@/components/ui/app-text';
import { LoadingView } from '@/components/ui/loading-view';
import { useAuth } from '@/hooks/use-auth';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useFeatureIntro } from '@/hooks/use-feature-intro';
import { useSettings, useUpdateDocumentTemplates } from '@/hooks/use-settings';
import { useSubscription } from '@/hooks/use-subscription';
import { useTenant } from '@/hooks/use-tenant';
import { PremiumUpgradeBanner } from '@/components/subscription/premium-upgrade-banner';
import { buildTemplatePreviewHtml } from '@/lib/pdf/template-preview-html';
import { requireScope } from '@/lib/tenant/scope';
import { useToast } from '@/providers/toast-provider';

type DocumentKind = 'invoice' | 'quote';

export default function DocumentTemplatesScreen() {
  const styles = useStyles();
  const { data, isLoading } = useSettings();
  const { scope } = useTenant();
  const { user } = useAuth();
  const { hasFeature } = useSubscription();
  const templatesLocked = !hasFeature('pdf_templates');
  const updateTemplates = useUpdateDocumentTemplates();
  const { showError } = useToast();
  const templatesIntro = useFeatureIntro('templates');

  const [quoteTemplateId, setQuoteTemplateId] = useState(data?.quoteTemplateId ?? 'classic-blue');
  const [invoiceTemplateId, setInvoiceTemplateId] = useState(data?.invoiceTemplateId ?? 'classic-blue');
  const [activeKind, setActiveKind] = useState<DocumentKind>('invoice');
  const [galleryVisible, setGalleryVisible] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    templatesIntro.presentOnFirstVisit();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templatesIntro.isReady]);

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
        return Promise.reject(new Error('Espace entreprise indisponible.'));
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
      <SettingsScreenFrame title="Modèles de documents">
        <LoadingView message="Chargement..." />
      </SettingsScreenFrame>
    );
  }

  return (
    <SettingsScreenFrame title="Modèles de documents">
      <View style={styles.content}>
        {templatesLocked ? (
          <PremiumUpgradeBanner message="Les modèles PDF sont disponibles à partir de l’offre Basique" />
        ) : null}

        <AppText color="secondary" variant="subtitle">
          Parcourez les modèles en taille réelle. Le modèle sélectionné est enregistré
          automatiquement.
        </AppText>

        <View style={styles.segment}>
          <Pressable
            disabled={templatesLocked}
            onPress={() => setActiveKind('invoice')}
            style={[styles.segmentItem, activeKind === 'invoice' && styles.segmentItemActive]}>
            <AppText medium={activeKind === 'invoice'} variant="body">
              Factures
            </AppText>
          </Pressable>
          <Pressable
            disabled={templatesLocked}
            onPress={() => setActiveKind('quote')}
            style={[styles.segmentItem, activeKind === 'quote' && styles.segmentItemActive]}>
            <AppText medium={activeKind === 'quote'} variant="body">
              Devis
            </AppText>
          </Pressable>
        </View>

        <Pressable
          disabled={templatesLocked}
          onPress={() => {
            if (!templatesLocked) setGalleryVisible(true);
          }}
          style={[styles.openGallery, templatesLocked && styles.openGalleryLocked]}>
          <AppText medium variant="body">
            Ouvrir la galerie des modèles de {kindLabel}
          </AppText>
          <AppText color="secondary" variant="caption">
            {templatesLocked
              ? 'Disponible à partir de l’offre Basique'
              : 'Aperçu PDF réel · balayez entre les modèles'}
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
        visible={galleryVisible && !templatesLocked}
      />
      <FeatureIntroModal
        config={templatesIntro.config}
        onClose={templatesIntro.onClose}
        onCta={templatesIntro.onCta}
        onDontShowAgain={templatesIntro.onDontShowAgain}
        visible={templatesIntro.visible}
      />
    </SettingsScreenFrame>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    content: {
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
    openGalleryLocked: {
      opacity: 0.55,
    },
  }));
}
