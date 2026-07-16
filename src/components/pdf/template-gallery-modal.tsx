import { SymbolView } from 'expo-symbols';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  useWindowDimensions,
  View,
} from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PdfPreviewWebView } from '@/components/pdf/pdf-preview-webview';
import { AppText } from '@/components/ui/app-text';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { triggerImpactHaptic } from '@/lib/haptics';
import { ensureTemplatePreviewPdf } from '@/lib/pdf/template-preview-pdf';
import { spacing } from '@/constants/theme/spacing';
import { radius } from '@/constants/theme/radius';
import { PDF_TEMPLATES } from '@/lib/pdf/engine/templates';
import type { PdfTemplateDefinition } from '@/lib/pdf/engine/templates/types';

type TemplateGalleryModalProps = {
  visible: boolean;
  title: string;
  selectedTemplateId: string;
  onClose: () => void;
  onSelect: (templateId: string) => void;
  buildPreviewHtml: (templateId: string) => Promise<string>;
  /** Namespace for PDF preview cache (document id, settings scope, etc.). */
  cacheKey?: string;
};

const SWIPE_THRESHOLD = 56;
const TOTAL_TEMPLATES = PDF_TEMPLATES.length;

function findTemplateIndex(templateId: string): number {
  const index = PDF_TEMPLATES.findIndex((template) => template.id === templateId);
  return index >= 0 ? index : 0;
}

export function TemplateGalleryModal({
  visible,
  title,
  selectedTemplateId,
  onClose,
  onSelect,
  buildPreviewHtml,
  cacheKey = 'default',
}: TemplateGalleryModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();

  const buildPreviewHtmlRef = useRef(buildPreviewHtml);
  const onSelectRef = useRef(onSelect);
  const gestureLockedRef = useRef(false);
  const loadGenerationRef = useRef(0);
  const cacheKeyRef = useRef(cacheKey);

  const [activeIndex, setActiveIndex] = useState(() => findTemplateIndex(selectedTemplateId));
  const [activePdfUri, setActivePdfUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [gestureLocked, setGestureLocked] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const contentOpacity = useSharedValue(1);
  const contentTranslateX = useSharedValue(0);
  const navButtonScale = useSharedValue(1);

  buildPreviewHtmlRef.current = buildPreviewHtml;
  onSelectRef.current = onSelect;
  gestureLockedRef.current = gestureLocked;
  cacheKeyRef.current = cacheKey;

  const activeTemplate: PdfTemplateDefinition = PDF_TEMPLATES[activeIndex] ?? PDF_TEMPLATES[0]!;

  const loadTemplatePdf = useCallback(async (templateId: string): Promise<string | null> => {
    try {
      const timeout = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Délai dépassé')), 30000);
      });

      return await Promise.race([
        ensureTemplatePreviewPdf(cacheKeyRef.current, templateId, buildPreviewHtmlRef.current),
        timeout,
      ]);
    } catch {
      return null;
    }
  }, []);

  const prefetchNeighbors = useCallback(
    (index: number) => {
      const neighbors = [index - 1, index + 1].filter(
        (neighbor) => neighbor >= 0 && neighbor < TOTAL_TEMPLATES,
      );

      for (const neighbor of neighbors) {
        const template = PDF_TEMPLATES[neighbor];
        if (template) {
          void loadTemplatePdf(template.id);
        }
      }
    },
    [loadTemplatePdf],
  );

  const displayTemplate = useCallback(
    async (index: number, direction: -1 | 0 | 1 = 0) => {
      const bounded = Math.max(0, Math.min(TOTAL_TEMPLATES - 1, index));
      const template = PDF_TEMPLATES[bounded];
      if (!template) {
        return;
      }

      const generation = ++loadGenerationRef.current;
      setActiveIndex(bounded);
      setLoading(true);
      setErrorMessage(null);

      if (direction !== 0) {
        contentOpacity.value = withTiming(0.35, { duration: 120 });
        contentTranslateX.value = withTiming(direction * 24, { duration: 120 });
      }

      const pdfUri = await loadTemplatePdf(template.id);

      if (generation !== loadGenerationRef.current) {
        return;
      }

      if (!pdfUri) {
        setLoading(false);
        setErrorMessage('Impossible de générer l’aperçu PDF.');
        contentOpacity.value = withTiming(1, { duration: 160 });
        contentTranslateX.value = withSpring(0, { damping: 20, stiffness: 260 });
        return;
      }

      setActiveIndex(bounded);
      setActivePdfUri(pdfUri);
      onSelectRef.current(template.id);
      prefetchNeighbors(bounded);
      setLoading(false);

      contentTranslateX.value = direction === 0 ? 0 : direction * -16;
      contentOpacity.value = withTiming(1, { duration: 220 });
      contentTranslateX.value = withSpring(0, { damping: 20, stiffness: 260 });
    },
    [contentOpacity, contentTranslateX, loadTemplatePdf, prefetchNeighbors],
  );

  const displayTemplateRef = useRef(displayTemplate);
  displayTemplateRef.current = displayTemplate;

  useEffect(() => {
    if (!visible) {
      loadGenerationRef.current += 1;
      setActivePdfUri(null);
      setLoading(false);
      setGestureLocked(false);
      setErrorMessage(null);
      return;
    }

    const initialIndex = findTemplateIndex(selectedTemplateId);
    void displayTemplateRef.current(initialIndex, 0);
  }, [cacheKey, selectedTemplateId, visible]);

  const goToIndex = useCallback(
    (nextIndex: number) => {
      if (gestureLockedRef.current || loading) {
        return;
      }

      const direction: -1 | 0 | 1 =
        nextIndex > activeIndex ? 1 : nextIndex < activeIndex ? -1 : 0;

      if (direction !== 0) {
        void triggerImpactHaptic();
      }

      void displayTemplate(nextIndex, direction);
    },
    [activeIndex, displayTemplate, loading],
  );

  const goNext = useCallback(() => {
    if (activeIndex < TOTAL_TEMPLATES - 1) {
      goToIndex(activeIndex + 1);
    }
  }, [activeIndex, goToIndex]);

  const goPrevious = useCallback(() => {
    if (activeIndex > 0) {
      goToIndex(activeIndex - 1);
    }
  }, [activeIndex, goToIndex]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-24, 24])
    .failOffsetY([-18, 18])
    .onEnd((event) => {
      if (gestureLockedRef.current) {
        return;
      }

      if (event.translationX <= -SWIPE_THRESHOLD) {
        runOnJS(goNext)();
        return;
      }

      if (event.translationX >= SWIPE_THRESHOLD) {
        runOnJS(goPrevious)();
      }
    });

  const contentAnimatedStyle = useAnimatedStyle(() => ({
    opacity: contentOpacity.value,
    transform: [{ translateX: contentTranslateX.value }],
  }));

  const navAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: navButtonScale.value }],
  }));

  const progressWidth = ((activeIndex + 1) / TOTAL_TEMPLATES) * Math.min(screenWidth - spacing.lg * 2, 280);

  return (
    <Modal animationType="fade" onRequestClose={onClose} statusBarTranslucent visible={visible}>
      <View style={[styles.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
        <View style={styles.header}>
          <Pressable accessibilityLabel="Fermer" hitSlop={12} onPress={onClose} style={styles.iconButton}>
            <SymbolView
              name={{ ios: 'xmark', android: 'close', web: 'close' }}
              size={18}
              tintColor={colors.textSecondary}
            />
          </Pressable>

          <View style={styles.headerCenter}>
            <AppText variant="title">{title}</AppText>
            <AppText color="secondary" variant="caption">
              Aperçu PDF · {TOTAL_TEMPLATES} modèles
            </AppText>
          </View>

          <View style={styles.iconButton} />
        </View>

        <View style={styles.templateMeta}>
          <AppText style={styles.templateName} variant="title">
            {activeTemplate.name}
          </AppText>
          <AppText color="secondary" variant="subtitle">
            {activeTemplate.description}
          </AppText>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: progressWidth }]} />
            </View>
            <AppText color="secondary" style={styles.progressLabel} variant="caption">
              {activeIndex + 1} / {TOTAL_TEMPLATES}
            </AppText>
          </View>
        </View>

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.viewerStage, contentAnimatedStyle]}>
            {errorMessage ? (
              <View style={styles.errorState}>
                <AppText color="secondary" variant="body">
                  {errorMessage}
                </AppText>
              </View>
            ) : activePdfUri ? (
              <PdfPreviewWebView
                key={`${cacheKey}-${activeTemplate.id}`}
                onGestureActiveChange={setGestureLocked}
                pdfUri={activePdfUri}
                preferPdfJs
              />
            ) : (
              <View style={styles.viewerLoading}>
                <ActivityIndicator color={colors.primary} size="small" />
                <AppText color="secondary" variant="caption">
                  Génération du PDF…
                </AppText>
              </View>
            )}

            {loading && activePdfUri ? (
              <View pointerEvents="none" style={styles.viewerLoadingOverlay}>
                <ActivityIndicator color={colors.primary} size="small" />
              </View>
            ) : null}
          </Animated.View>
        </GestureDetector>

        <View style={styles.footer}>
          <Animated.View style={navAnimatedStyle}>
            <Pressable
              accessibilityLabel="Modèle précédent"
              disabled={activeIndex === 0 || loading}
              onPress={goPrevious}
              onPressIn={() => {
                navButtonScale.value = withSpring(0.94, { damping: 18, stiffness: 320 });
              }}
              onPressOut={() => {
                navButtonScale.value = withSpring(1, { damping: 18, stiffness: 320 });
              }}
              style={[styles.navButton, activeIndex === 0 && styles.navButtonDisabled]}>
              <SymbolView
                name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
                size={20}
                tintColor={colors.primary}
              />
            </Pressable>
          </Animated.View>

          <AppText color="secondary" style={styles.hint} variant="caption">
            Rendu PDF final · balayez · pincez · double-tapez
          </AppText>

          <Animated.View style={navAnimatedStyle}>
            <Pressable
              accessibilityLabel="Modèle suivant"
              disabled={activeIndex === TOTAL_TEMPLATES - 1 || loading}
              onPress={goNext}
              onPressIn={() => {
                navButtonScale.value = withSpring(0.94, { damping: 18, stiffness: 320 });
              }}
              onPressOut={() => {
                navButtonScale.value = withSpring(1, { damping: 18, stiffness: 320 });
              }}
              style={[
                styles.navButton,
                activeIndex === TOTAL_TEMPLATES - 1 && styles.navButtonDisabled,
              ]}>
              <SymbolView
                name={{ ios: 'chevron.right', android: 'chevron_right', web: 'chevron_right' }}
                size={20}
                tintColor={colors.primary}
              />
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    container: {
      flex: 1,
      backgroundColor: '#EBEBF0',
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      gap: spacing.sm,
    },
    headerCenter: {
      flex: 1,
      alignItems: 'center',
      gap: 2,
    },
    iconButton: {
      width: 40,
      height: 40,
      alignItems: 'center',
      justifyContent: 'center',
    },
    templateMeta: {
      paddingHorizontal: spacing.lg,
      gap: 4,
      alignItems: 'center',
    },
    templateName: {
      textAlign: 'center',
    },
    progressRow: {
      marginTop: spacing.sm,
      width: '100%',
      maxWidth: 280,
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    progressTrack: {
      flex: 1,
      height: 3,
      borderRadius: radius.full,
      backgroundColor: colors.border,
      overflow: 'hidden',
    },
    progressFill: {
      height: '100%',
      borderRadius: radius.full,
      backgroundColor: colors.primary,
    },
    progressLabel: {
      minWidth: 44,
      textAlign: 'right',
    },
    viewerStage: {
      flex: 1,
      marginHorizontal: spacing.lg,
      borderRadius: radius.lg,
      overflow: 'hidden',
      backgroundColor: '#EBEBF0',
    },
    viewerLoading: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    viewerLoadingOverlay: {
      ...StyleSheet.absoluteFill,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: 'rgba(235, 235, 240, 0.55)',
    },
    errorState: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
    },
    footer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.xs,
      gap: spacing.md,
    },
    navButton: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    navButtonDisabled: {
      opacity: 0.35,
    },
    hint: {
      flex: 1,
      textAlign: 'center',
    },
  }));
