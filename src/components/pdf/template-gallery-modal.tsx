import { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
    10|import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PdfPreviewWebView } from '@/components/pdf/pdf-preview-webview';
import { TemplatePreviewCard } from '@/components/pdf/template-preview-card';
import { ActionBar } from '@/components/ui/action-bar';
import { AppText } from '@/components/ui/app-text';
import { Button } from '@/components/ui/button';
import { StatusChip } from '@/components/ui/status-chip';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { triggerImpactHaptic } from '@/lib/haptics';
    20|import { ensureTemplatePreviewPdf } from '@/lib/pdf/template-preview-pdf';
import { spacing } from '@/constants/theme/spacing';
import { radius } from '@/constants/theme/radius';
import { PDF_TEMPLATES } from '@/lib/pdf/engine/templates';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

type TemplateGalleryModalProps = {
  visible: boolean;
  title: string;
  selectedTemplateId: string;
    30|  onClose: () => void;
  onSelect: (templateId: string) => void;
  buildPreviewHtml: (templateId: string) => Promise<string>;
  /** Namespace for PDF preview cache (document id, settings scope, etc.). */
  cacheKey?: string;
};

const SWIPE_THRESHOLD = 56;
const TOTAL_TEMPLATES = PDF_TEMPLATES.length;

    40|function findTemplateIndex(templateId: string): number {
  const index = PDF_TEMPLATES.findIndex((template) => template.id === templateId);
  return index >= 0 ? index : 0;
}

/**
 * Galerie de modèles — DESIGN §5.8.
 * Aucun enregistrement au swipe : la navigation ne met à jour qu'un brouillon
 * local (`draftId`). Seul « Utiliser ce modèle » confirme le choix au parent.
    50| */
export function TemplateGalleryModal({
  visible,
  title,
  selectedTemplateId,
  onClose,
  onSelect,
  buildPreviewHtml,
  cacheKey = 'default',
}: TemplateGalleryModalProps) {
    60|  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  const buildPreviewHtmlRef = useRef(buildPreviewHtml);
  const gestureLockedRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const cacheKeyRef = useRef(cacheKey);

  const [activeIndex, setActiveIndex] = useState(() => findTemplateIndex(selectedTemplateId));
    70|  const [draftId, setDraftId] = useState(selectedTemplateId);
  const [activePdfUri, setActivePdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gestureLocked, setGestureLocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const contentOpacity = useSharedValue(1);
  const contentTranslateX = useSharedValue(0);

    80|  buildPreviewHtmlRef.current = buildPreviewHtml;
  gestureLockedRef.current = gestureLocked;
  cacheKeyRef.current = cacheKey;

  const activeTemplate: PdfTemplateDefinition = PDF_TEMPLATES[activeIndex] ?? PDF_TEMPLATES[0]!;
  const currentTemplate = PDF_TEMPLATES.find((template) => template.id === selectedTemplateId);
  const hasPendingChange = draftId !== selectedTemplateId;

    90|  const loadTemplatePdf = useCallback(async (templateId: string): Promise<string | null> => {
    try {
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Délai dépassé')), 30000);
      });

      return await Promise.race([
        ensureTemplatePreviewPdf(cacheKeyRef.current, templateId, buildPreviewHtmlRef.current),
        timeout,
   100|      ]);
    } catch {
      return null;
    }
  }, []);

  const prefetchNeighbors = useCallback(
    (index: number) => {
      const neighbors = [index - 1, index + 1].filter(
        (neighbor) => neighbor >= 0 && neighbor < TOTAL_TEMPLATES,
   110|      );

      for (const neighbor of neighbors) {
        const template = PDF_TEMPLATES[neighbor];
        if (template) {
          void loadTemplatePdf(template.id);
        }
      }
    },
    [loadTemplatePdf],
   120|  );

  const displayTemplate = useCallback(
    async (index: number, direction: -1 | 0 | 1 = 0) => {
      const bounded = Math.max(0, Math.min(TOTAL_TEMPLATES - 1, index));
      const template = PDF_TEMPLATES[bounded];
      if (!template) {
        return;
      }

   130|      const generation = ++loadGenerationRef.current;
      setActiveIndex(bounded);
      setLoading(true);
      setErrorMessage(null);

      if (direction !== 0) {
        contentOpacity.value = withTiming(0.35, { duration: 120 });
        contentTranslateX.value = withTiming(direction * 24, { duration: 120 });
      }

   140|      const pdfUri = await loadTemplatePdf(template.id);

      if (generation !== loadGenerationRef.current) {
        return;
      }

      if (!pdfUri) {
        setLoading(false);
        setErrorMessage('Impossible de générer l’aperçu PDF.');
        contentOpacity.value = withTiming(1, { duration: 160 });
        contentTranslateX.value = withSpring(0, { damping: 20, stiffness: 260 });
   150|        return;
      }

      setActiveIndex(bounded);
      setActivePdfUri(pdfUri);
      // Navigation seule — pas d'enregistrement au swipe (DESIGN §5.8).
      setDraftId(template.id);
      prefetchNeighbors(bounded);
      setLoading(false);
   160|
      contentTranslateX.value = direction === 0 ? 0 : direction * -16;
      contentOpacity.value = withTiming(1, { duration: 220 });
      contentTranslateX.value = withSpring(0, { damping: 20, stiffness: 260 });
    },
    [contentOpacity, contentTranslateX, loadTemplatePdf, prefetchNeighbors],
  );

  const displayTemplateRef = useRef(displayTemplate);
  displayTemplateRef.current = displayTemplate;
   170|
  useEffect(() => {
    if (!visible) {
      loadGenerationRef.current += 1;
      setActivePdfUri(null);
      setLoading(false);
      setGestureLocked(false);
      setErrorMessage(null);
      return;
   180|    }

    const initialIndex = findTemplateIndex(selectedTemplateId);
    setDraftId(selectedTemplateId);
    void displayTemplateRef.current(initialIndex, 0);
  }, [cacheKey, selectedTemplateId, visible]);

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (gestureLockedRef.current || loading) {
   190|        return;
      }

      const direction: -1 | 0 | 1 =
        nextIndex > activeIndex ? 1 : nextIndex < activeIndex ? -1 : 0;

      if (direction !== 0) {
        void triggerImpactHaptic();
      }

      void displayTemplate(nextIndex, direction);
   200|    },
    [activeIndex, displayTemplate, loading],
  );

  const panGesture = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-18, 18])
    .onEnd((event) => {
      if (gestureLockedRef.current) {
        return;
      }
   210|
      if (event.translationX <= -SWIPE_THRESHOLD && activeIndex < TOTAL_TEMPLATES - 1) {
        runOnJS(goToIndex)(activeIndex + 1);
        return;
      }

      if (event.translationX >= SWIPE_THRESHOLD && activeIndex > 0) {
        runOnJS(goToIndex)(activeIndex - 1);
      }
    });

   220|  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: contentTranslateX.value }],
  }));

  function handleClose() {
    // Annuler : le brouillon est abandonné, rien n'est transmis au parent.
    onClose();
  }

   230|  function handleConfirm() {
    onSelect(draftId);
    onClose();
  }

  return (
    <Modal animationType="fade" onRequestClose={handleClose} statusBarTranslucent visible={visible}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
   240|          <Button onPress={handleClose} title="Annuler" variant="tertiary" />
          <View style={styles.headerCenter}>
            <AppText numberOfLines={1} variant="title">
              {title}
            </AppText>
            <AppText color="secondary" variant="caption">
              Aperçu PDF · {TOTAL_TEMPLATES} modèles
            </AppText>
   250|          </View>
          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.body}>
          <ScrollView
            contentContainerStyle={styles.thumbnailColumnContent}
            showsVerticalScrollIndicator={false}
            style={styles.thumbnailColumn}>
            {PDF_TEMPLATES.map((template, index) => {
   260|              const isDraft = template.id === draftId;
              const isCurrent = template.id === selectedTemplateId;

              return (
                <Pressable
                  accessibilityLabel={`Modèle ${template.name}`}
                  key={template.id}
                  onPress={() => goToIndex(index)}
                  style={[styles.thumbnail, isDraft && styles.thumbnailActive]}>
                  <TemplatePreviewCard compact selected={isDraft} template={template} />
   270|                  {isCurrent ? (
                    <View style={styles.thumbnailCurrentDot} />
                  ) : null}
                </Pressable>
              );
            })}
          </ScrollView>

          <View style={styles.viewer}>
   280|            <View style={styles.templateMeta}>
              <View style={styles.templateMetaHeader}>
                <AppText numberOfLines={1} style={styles.templateName} variant="title">
                  {activeTemplate.name}
                </AppText>
                <View style={styles.badgeRow}>
                  <StatusChip label="Sélectionné" tone="sent" />
   290|                  {hasPendingChange && currentTemplate ? (
                    <StatusChip
                      label={`Modèle actuel : ${currentTemplate.name}`}
                      tone="draft"
                    />
                  ) : null}
                </View>
              </View>
              <AppText color="secondary" numberOfLines={2} variant="subtitle">
   300|                {activeTemplate.description}
              </AppText>
            </View>

            <GestureDetector gesture={panGesture}>
              <Animated.View style={[styles.viewerStage, contentAnimatedStyle]}>
                {errorMessage ? (
                  <View style={styles.errorState}>
                    <AppText color="secondary" variant="body">
                      {errorMessage}
   310|                    </AppText>
                  </View>
                ) : activePdfUri ? (
                  <PdfPreviewWebView
                    key={`${cacheKey}-${activeTemplate.id}`}
                    onGestureActiveChange={setGestureLocked}
                    pdfUri={activePdfUri}
                    preferPdfJs
                  />
                ) : (
   320|                  <View style={styles.viewerLoading}>
                    <ActivityIndicator color={colors.primary} size="small" />
                    <AppText color="secondary" variant="caption">
                      Génération du PDF…
                    </AppText>
                  </View>
                )}

                {loading && activePdfUri ? (
                  <View pointerEvents="none" style={styles.viewerLoadingOverlay}>
   330|                    <ActivityIndicator color={colors.primary} size="small" />
                  </View>
                ) : null}
              </Animated.View>
            </GestureDetector>
          </View>
        </View>

        <ActionBar caption="Appliqué aux prochains documents. Les documents déjà émis ne changent pas.">
          <Button onPress={handleConfirm} title="Utiliser ce modèle" />
   340|        </ActionBar>
      </View>
    </Modal>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    container: {
      flex: 1,
   350|      backgroundColor: colors.backgroundGrouped,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      gap: spacing.sm,
    },
    headerCenter: {
   360|      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    headerSpacer: {
      minWidth: 64,
    },
    body: {
      flex: 1,
      flexDirection: 'row',
   370|      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
    },
    thumbnailColumn: {
      width: 92,
    },
    thumbnailColumnContent: {
      gap: spacing.sm,
      paddingBottom: spacing.sm,
   380|    },
    thumbnail: {
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: 'transparent',
      padding: 2,
    },
    thumbnailActive: {
      borderColor: colors.primary,
      backgroundColor: colors.primarySubtle,
   390|    },
    thumbnailCurrentDot: {
      position: 'absolute',
      top: 4,
      right: 4,
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.textTertiary,
      borderWidth: 1,
   400|      borderColor: colors.surface,
    },
    viewer: {
      flex: 1,
      gap: spacing.sm,
    },
    templateMeta: {
      gap: 4,
    },
    templateMetaHeader: {
   410|      flexDirection: 'row',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: spacing.sm,
    },
    templateName: {
      flexShrink: 1,
    },
    badgeRow: {
   420|      flexDirection: 'row',
      gap: spacing.xs,
      flexWrap: 'wrap',
    },
    viewerStage: {
      flex: 1,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: '#EBEBF0',
    },
   430|    viewerLoading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    viewerLoadingOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
   440|      backgroundColor: 'rgba(235, 235, 240, 0.55)',
    },
    errorState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
  }));
