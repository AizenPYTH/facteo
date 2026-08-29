import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeatureIntroErrorBoundary } from '@/components/feature-intros/feature-intro-error-boundary';
import { FeatureIntroStage } from '@/components/feature-intros/feature-intro-stage';
import { FeatureIntroVignettes } from '@/components/feature-intros/feature-intro-vignettes';
import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { motion } from '@/constants/theme/design-system';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import type { FeatureIntroConfig } from '@/lib/feature-intros/types';

type FeatureIntroModalProps = {
  visible: boolean;
  config: FeatureIntroConfig;
  onClose: () => void;
  onDontShowAgain: () => void;
  onCta: () => void;
};

/**
 * Reusable first-use animated intro shell.
 * Feature-specific visuals live in FeatureIntroStage + config steps.
 */
export function FeatureIntroModal({
  visible,
  config,
  onClose,
  onDontShowAgain,
  onCta,
}: FeatureIntroModalProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTablet = Math.min(width, height) >= 600;
  const [stepIndex, setStepIndex] = useState(0);
  const [reduceMotionEnabled, setReduceMotionEnabled] = useState(false);

  useEffect(() => {
    let mounted = true;
    void AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      if (mounted) {
        setReduceMotionEnabled(enabled);
      }
    });
    const subscription = AccessibilityInfo.addEventListener(
      'reduceMotionChanged',
      setReduceMotionEnabled,
    );

    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);

  useEffect(() => {
    if (!visible) {
      setStepIndex(0);
      return;
    }

    if (reduceMotionEnabled) {
      setStepIndex(config.steps.length - 1);
      return;
    }

    setStepIndex(0);
    const timers: ReturnType<typeof setTimeout>[] = [];
    let elapsed = 0;
    config.steps.forEach((step, index) => {
      if (index === 0) {
        elapsed += step.durationMs;
        return;
      }
      const delay = elapsed;
      timers.push(
        setTimeout(() => {
          setStepIndex((current) => Math.max(current, index));
        }, delay),
      );
      elapsed += step.durationMs;
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [visible, config, reduceMotionEnabled]);

  const lastStepIndex = config.steps.length - 1;

  return (
    <FeatureIntroErrorBoundary onError={onClose}>
      <Modal
        animationType={reduceMotionEnabled ? 'none' : 'fade'}
        onRequestClose={onClose}
        statusBarTranslucent
        transparent
        visible={visible}>
        <View style={[styles.overlay, { paddingTop: insets.top + spacing.sm, paddingBottom: insets.bottom + spacing.sm }]}>
          <Pressable
            accessibilityLabel="Fermer l’introduction"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />

          <Animated.View
            entering={reduceMotionEnabled ? undefined : FadeIn.duration(motion.fast)}
            style={[styles.card, isTablet && styles.cardTablet]}>
            <View style={styles.header}>
              <Text style={styles.kicker}>Découvrir</Text>
              <Pressable
                accessibilityLabel="Fermer"
                accessibilityRole="button"
                hitSlop={12}
                onPress={onClose}>
                <Text style={[styles.close, { color: colors.primary }]}>Fermer</Text>
              </Pressable>
            </View>

            <ScrollView
              contentContainerStyle={styles.content}
              showsVerticalScrollIndicator={false}
              style={styles.scroll}>
              <Text style={styles.title}>{config.title}</Text>

              {!reduceMotionEnabled ? (
                <Pressable
                  accessibilityLabel="Passer à l’étape suivante"
                  accessibilityRole="button"
                  disabled={stepIndex >= lastStepIndex}
                  onPress={() =>
                    setStepIndex((current) => Math.min(current + 1, lastStepIndex))
                  }>
                  <FeatureIntroStage
                    featureId={config.id}
                    reduceMotionEnabled={false}
                    stepIndex={stepIndex}
                  />
                </Pressable>
              ) : null}

              <Text style={styles.promise}>{config.promise}</Text>

              <FeatureIntroVignettes
                activeStepIndex={reduceMotionEnabled ? undefined : stepIndex}
                featureId={config.id}
                prominent={reduceMotionEnabled}
                steps={config.steps}
              />

              <View
                accessibilityLabel={`Étape ${stepIndex + 1} sur 3`}
                accessibilityRole="progressbar"
                accessibilityValue={{ min: 1, max: 3, now: stepIndex + 1 }}
                accessible
                style={styles.progress}>
                {config.steps.map((item, index) => (
                  <View
                    key={item.key}
                    style={[styles.segment, index <= stepIndex && styles.segmentActive]}
                  />
                ))}
              </View>
            </ScrollView>

            <View style={styles.actions}>
              <Button onPress={onCta} title={config.ctaLabel} />
              <Button onPress={onClose} title="Plus tard" variant="tertiary" />
              <Button
                onPress={onDontShowAgain}
                title="Ne plus afficher"
                variant="tertiary"
              />
            </View>
          </Animated.View>
        </View>
      </Modal>
    </FeatureIntroErrorBoundary>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    overlay: {
      flex: 1,
      backgroundColor: colors.overlay,
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      backgroundColor: colors.surface,
      borderRadius: radius.sheet,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.lg,
      gap: spacing.md,
      maxHeight: '94%',
    },
    cardTablet: {
      maxWidth: 480,
      padding: spacing.xl,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    kicker: {
      ...typography.caption1,
      color: colors.textTertiary,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    close: {
      ...typography.subheadlineMedium,
    },
    title: {
      ...typography.title2,
      color: colors.text,
    },
    scroll: {
      flexShrink: 1,
    },
    content: {
      gap: spacing.md,
      paddingBottom: spacing.xs,
    },
    promise: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    progress: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    segment: {
      flex: 1,
      height: 4,
      borderRadius: radius.chip,
      backgroundColor: colors.borderStrong,
    },
    segmentActive: {
      backgroundColor: colors.primary,
    },
    actions: {
      gap: spacing.xs,
    },
  }));
}
