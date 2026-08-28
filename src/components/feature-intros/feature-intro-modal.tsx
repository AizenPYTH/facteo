import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { FeatureIntroErrorBoundary } from '@/components/feature-intros/feature-intro-error-boundary';
import { FeatureIntroStage } from '@/components/feature-intros/feature-intro-stage';
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

  useEffect(() => {
    if (!visible) {
      setStepIndex(0);
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
          setStepIndex(index);
        }, delay),
      );
      elapsed += step.durationMs;
    });

    return () => {
      timers.forEach(clearTimeout);
    };
  }, [visible, config]);

  const step = config.steps[Math.min(stepIndex, config.steps.length - 1)];

  return (
    <FeatureIntroErrorBoundary onError={onClose}>
      <Modal
        animationType="fade"
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
            entering={FadeIn.duration(motion.fast)}
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

            <Text style={styles.title}>{config.title}</Text>

            <FeatureIntroStage featureId={config.id} stepIndex={stepIndex} />

            {step ? (
              <Animated.View
                key={step.key}
                entering={FadeInDown.duration(220)}
                style={styles.copy}>
                <Text style={styles.headline}>{step.headline}</Text>
                <Text style={styles.body}>{step.body}</Text>
              </Animated.View>
            ) : null}

            <View style={styles.dots}>
              {config.steps.map((item, index) => (
                <View
                  key={item.key}
                  style={[styles.dot, index === stepIndex && styles.dotActive]}
                />
              ))}
            </View>

            <View style={styles.actions}>
              <Button onPress={onCta} title={config.ctaLabel} elevated />
              <Button onPress={onDontShowAgain} title="Ne plus afficher" variant="ghost" />
              <Pressable accessibilityRole="button" onPress={onClose} hitSlop={8}>
                <Text style={styles.skip}>Passer</Text>
              </Pressable>
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
    copy: {
      gap: spacing.xs,
      minHeight: 72,
    },
    headline: {
      ...typography.headline,
      color: colors.text,
    },
    body: {
      ...typography.subheadline,
      color: colors.textSecondary,
    },
    dots: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: 6,
    },
    dot: {
      width: 7,
      height: 7,
      borderRadius: 4,
      backgroundColor: colors.borderStrong,
    },
    dotActive: {
      backgroundColor: colors.primary,
      width: 18,
    },
    actions: {
      gap: spacing.xs,
    },
    skip: {
      ...typography.footnote,
      color: colors.textTertiary,
      textAlign: 'center',
      paddingVertical: spacing.xs,
    },
  }));
}
