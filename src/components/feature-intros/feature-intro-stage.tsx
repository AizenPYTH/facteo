import { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import type { FeatureIntroId } from '@/lib/feature-intros/types';

type FeatureIntroStageProps = {
  featureId: FeatureIntroId;
  stepIndex: number;
  reduceMotionEnabled?: boolean;
};

/**
 * Mini visual simulations for each feature intro.
 * Purely decorative — no network, no real data.
 */
export function FeatureIntroStage({
  featureId,
  stepIndex,
  reduceMotionEnabled = false,
}: FeatureIntroStageProps) {
  switch (featureId) {
    case 'scanner':
      return (
        <ScannerStage reduceMotionEnabled={reduceMotionEnabled} stepIndex={stepIndex} />
      );
    case 'invoice':
      return (
        <InvoiceStage reduceMotionEnabled={reduceMotionEnabled} stepIndex={stepIndex} />
      );
    case 'quote':
      return <QuoteStage reduceMotionEnabled={reduceMotionEnabled} stepIndex={stepIndex} />;
    case 'ai':
      return <AiStage reduceMotionEnabled={reduceMotionEnabled} stepIndex={stepIndex} />;
    case 'templates':
      return (
        <TemplatesStage reduceMotionEnabled={reduceMotionEnabled} stepIndex={stepIndex} />
      );
    case 'payments':
      return (
        <PaymentsStage reduceMotionEnabled={reduceMotionEnabled} stepIndex={stepIndex} />
      );
    case 'statistics':
      return (
        <StatisticsStage reduceMotionEnabled={reduceMotionEnabled} stepIndex={stepIndex} />
      );
    default:
      return null;
  }
}

type StageProps = {
  stepIndex: number;
  reduceMotionEnabled: boolean;
};

function ScannerStage({ stepIndex, reduceMotionEnabled }: StageProps) {
  const styles = useStageStyles();
  const colors = useColors();
  const scanY = useSharedValue(0);

  useEffect(() => {
    if (reduceMotionEnabled) {
      scanY.value = 0;
      return;
    }

    scanY.value = withRepeat(
      withTiming(1, { duration: 900, easing: Easing.inOut(Easing.quad) }),
      -1,
      true,
    );
  }, [reduceMotionEnabled, scanY]);

  const laserStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: interpolate(scanY.value, [0, 1], [0, 88]) }],
  }));

  return (
    <View style={styles.stage}>
      <View style={styles.phone}>
        <View style={styles.phoneNotch} />
        {stepIndex === 0 ? (
          <View style={styles.scanFrame}>
            <View style={[styles.corner, styles.tl]} />
            <View style={[styles.corner, styles.tr]} />
            <View style={[styles.corner, styles.bl]} />
            <View style={[styles.corner, styles.br]} />
            {reduceMotionEnabled ? null : (
              <Animated.View
                style={[styles.laser, { backgroundColor: colors.primary }, laserStyle]}
              />
            )}
          </View>
        ) : null}

        {stepIndex >= 1 ? (
          <Animated.View
            entering={reduceMotionEnabled ? undefined : FadeInDown.duration(350)}
            style={styles.productCard}>
            <Text style={styles.productTitle}>Samsung Galaxy Buds</Text>
            <Text style={styles.productMeta}>Réf. SM-R177 · EAN 8806092</Text>
            <View style={styles.productRow}>
              <Text style={styles.productPrice}>249,99 €</Text>
              <Text style={styles.productVat}>TVA 20 %</Text>
            </View>
          </Animated.View>
        ) : null}

        {stepIndex >= 2 ? (
          <Animated.View
            entering={reduceMotionEnabled ? undefined : FadeInUp.duration(400)}
            style={styles.invoiceLine}>
            <Text style={styles.invoiceLineLabel}>→ Ligne facture</Text>
            <Text style={styles.invoiceLineValue}>1 × 208,33 € HT</Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

function InvoiceStage({ stepIndex, reduceMotionEnabled }: StageProps) {
  const styles = useStageStyles();
  return (
    <View style={styles.stage}>
      <View style={styles.docCard}>
        <Text style={styles.docBadge}>FACTURE</Text>
        <Animated.View
          entering={reduceMotionEnabled ? undefined : FadeIn.duration(280)}
          style={styles.docRow}>
          <Text style={styles.docLabel}>Client</Text>
          <Text style={styles.docValue}>{stepIndex >= 0 ? 'Atelier Nord SAS' : '—'}</Text>
        </Animated.View>
        {stepIndex >= 1 ? (
          <Animated.View
            entering={reduceMotionEnabled ? undefined : FadeInDown.duration(300)}
            style={styles.docLines}>
            <Text style={styles.docLine}>• Prestation audit — 800 €</Text>
            <Text style={styles.docLine}>• Maintenance — 120 €</Text>
          </Animated.View>
        ) : null}
        {stepIndex >= 2 ? (
          <Animated.View
            entering={reduceMotionEnabled ? undefined : FadeInUp.duration(320)}
            style={styles.docTotal}>
            <Text style={styles.docTotalLabel}>Total TTC</Text>
            <Text style={styles.docTotalValue}>1 104,00 €</Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

function QuoteStage({ stepIndex, reduceMotionEnabled }: StageProps) {
  const styles = useStageStyles();
  return (
    <View style={styles.stage}>
      <View style={styles.docCard}>
        <Text style={styles.docBadge}>DEVIS</Text>
        <Text style={styles.docValue}>{stepIndex >= 0 ? 'Client : Maison Verte' : 'Client…'}</Text>
        {stepIndex >= 1 ? (
          <Animated.View
            entering={reduceMotionEnabled ? undefined : FadeInDown.duration(300)}
            style={styles.docLines}>
            <Text style={styles.docLine}>• Conception — 1 200 €</Text>
            <Text style={styles.docLine}>• Installation — 450 €</Text>
          </Animated.View>
        ) : null}
        {stepIndex >= 2 ? (
          <Animated.View
            entering={reduceMotionEnabled ? undefined : FadeInUp.duration(350)}
            style={styles.convertChip}>
            <Text style={styles.convertText}>Devis → Facture</Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

function AiStage({ stepIndex, reduceMotionEnabled }: StageProps) {
  const styles = useStageStyles();
  const pulse = useSharedValue(0.4);

  useEffect(() => {
    if (reduceMotionEnabled) {
      pulse.value = 1;
      return;
    }

    pulse.value = withRepeat(
      withSequence(withTiming(1, { duration: 500 }), withTiming(0.4, { duration: 500 })),
      -1,
      false,
    );
  }, [pulse, reduceMotionEnabled]);

  const pulseStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <View style={styles.stage}>
      <View style={styles.aiCard}>
        <View style={styles.aiBubbleUser}>
          <Text style={styles.aiBubbleText}>« Analyse cette photo produit »</Text>
        </View>
        {stepIndex >= 1 ? (
          <Animated.View style={[styles.aiThinking, pulseStyle]}>
            <Text style={styles.aiThinkingText}>Analyse IA…</Text>
          </Animated.View>
        ) : null}
        {stepIndex >= 2 ? (
          <Animated.View
            entering={reduceMotionEnabled ? undefined : FadeInDown.duration(350)}
            style={styles.aiBubbleResult}>
            <Text style={styles.aiBubbleText}>Produit prêt · 3 champs détectés</Text>
          </Animated.View>
        ) : null}
      </View>
    </View>
  );
}

function TemplatesStage({ stepIndex, reduceMotionEnabled }: StageProps) {
  const styles = useStageStyles();
  const colors = useColors();
  return (
    <View style={styles.stage}>
      <View style={styles.templatesRow}>
        {['A', 'B', 'C'].map((label, index) => {
          const selected = stepIndex >= 1 && index === 1;
          return (
            <Animated.View
              key={label}
              entering={reduceMotionEnabled ? undefined : FadeIn.delay(index * 80)}
              style={[
                styles.templateCard,
                selected && { borderColor: colors.primary, borderWidth: 2 },
              ]}>
              <View style={[styles.templateHeader, { backgroundColor: colors.primarySubtle }]} />
              <Text style={styles.templateLabel}>Modèle {label}</Text>
            </Animated.View>
          );
        })}
      </View>
      {stepIndex >= 2 ? (
        <Animated.View
          entering={reduceMotionEnabled ? undefined : FadeInUp.duration(350)}
          style={styles.previewStrip}>
          <Text style={styles.previewText}>Aperçu facture — Modèle B</Text>
        </Animated.View>
      ) : null}
    </View>
  );
}

function PaymentsStage({ stepIndex, reduceMotionEnabled }: StageProps) {
  const styles = useStageStyles();
  return (
    <View style={styles.stage}>
      <View style={styles.docCard}>
        <Text style={styles.docBadge}>FACTURE #1042</Text>
        <Text style={styles.docValue}>1 104,00 € TTC</Text>
        {stepIndex >= 1 ? (
          <Animated.View
            entering={reduceMotionEnabled ? undefined : FadeInDown.duration(300)}
            style={styles.payChip}>
            <Text style={styles.payChipText}>Paiement CB · 1 104 €</Text>
          </Animated.View>
        ) : null}
        {stepIndex >= 2 ? (
          <Animated.View
            entering={reduceMotionEnabled ? undefined : FadeInUp.duration(350)}
            style={styles.paidBadge}>
            <Text style={styles.paidText}>Payée</Text>
          </Animated.View>
        ) : (
          <Text style={styles.docMeta}>{stepIndex === 0 ? 'En attente' : '…'}</Text>
        )}
      </View>
    </View>
  );
}

function StatisticsStage({ stepIndex, reduceMotionEnabled }: StageProps) {
  const styles = useStageStyles();
  const colors = useColors();
  const heights = [0.35, 0.55, 0.42, 0.78, 0.62, 0.9];
  const progress = useSharedValue(0);

  useEffect(() => {
    if (reduceMotionEnabled) {
      progress.value = 1;
      return;
    }

    progress.value = 0;
    progress.value = withDelay(80, withTiming(1, { duration: 700, easing: Easing.out(Easing.cubic) }));
  }, [progress, reduceMotionEnabled, stepIndex]);

  return (
    <View style={styles.stage}>
      <View style={styles.statsCard}>
        {stepIndex >= 0 ? (
          <View style={styles.kpiRow}>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>CA</Text>
              <Text style={styles.kpiValue}>{stepIndex >= 2 ? '24,8 k€' : '…'}</Text>
            </View>
            <View style={styles.kpi}>
              <Text style={styles.kpiLabel}>Factures</Text>
              <Text style={styles.kpiValue}>{stepIndex >= 2 ? '38' : '…'}</Text>
            </View>
          </View>
        ) : null}
        {stepIndex >= 1 ? (
          <View style={styles.bars}>
            {heights.map((h, index) => (
              <Bar key={index} color={colors.primary} heightRatio={h} progress={progress} />
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}

const BAR_MAX_HEIGHT = 96;

function Bar({
  heightRatio,
  progress,
  color,
}: {
  heightRatio: number;
  progress: SharedValue<number>;
  color: string;
}) {
  // Use numeric heights only — percentage strings in useAnimatedStyle can crash iOS.
  const style = useAnimatedStyle(() => ({
    height: interpolate(progress.value, [0, 1], [8, heightRatio * BAR_MAX_HEIGHT]),
    backgroundColor: color,
  }));
  return <Animated.View style={[barBase, style]} />;
}

const barBase = {
  flex: 1,
  borderRadius: 4,
  alignSelf: 'flex-end' as const,
  minHeight: 8,
};

function useStageStyles() {
  return useThemedStyles((colors) => ({
    stage: {
      minHeight: 200,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.sm,
    },
    phone: {
      width: 180,
      minHeight: 210,
      borderRadius: 28,
      borderWidth: 2,
      borderColor: colors.borderStrong,
      backgroundColor: colors.surfaceSecondary,
      padding: spacing.md,
      gap: spacing.sm,
      overflow: 'hidden',
    },
    phoneNotch: {
      alignSelf: 'center',
      width: 48,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.border,
      marginBottom: spacing.xs,
    },
    scanFrame: {
      height: 110,
      borderRadius: radius.md,
      backgroundColor: colors.background,
      overflow: 'hidden',
      justifyContent: 'flex-start',
    },
    corner: {
      position: 'absolute',
      width: 18,
      height: 18,
      borderColor: colors.primary,
    },
    tl: { top: 8, left: 8, borderTopWidth: 3, borderLeftWidth: 3 },
    tr: { top: 8, right: 8, borderTopWidth: 3, borderRightWidth: 3 },
    bl: { bottom: 8, left: 8, borderBottomWidth: 3, borderLeftWidth: 3 },
    br: { bottom: 8, right: 8, borderBottomWidth: 3, borderRightWidth: 3 },
    laser: {
      height: 2,
      width: '100%',
      opacity: 0.9,
    },
    productCard: {
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.sm,
      gap: 4,
    },
    productTitle: {
      ...typography.footnoteMedium,
      color: colors.text,
    },
    productMeta: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    productRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: 4,
    },
    productPrice: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
    productVat: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    invoiceLine: {
      borderRadius: radius.sm,
      backgroundColor: colors.primarySubtle,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
      gap: 2,
    },
    invoiceLineLabel: {
      ...typography.caption1,
      color: colors.primary,
    },
    invoiceLineValue: {
      ...typography.footnoteMedium,
      color: colors.text,
    },
    docCard: {
      width: '100%',
      maxWidth: 280,
      borderRadius: radius.lg,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      padding: spacing.md,
      gap: spacing.sm,
    },
    docBadge: {
      ...typography.caption1,
      color: colors.primary,
      letterSpacing: 1,
      fontWeight: '700',
    },
    docRow: {
      gap: 2,
    },
    docLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    docValue: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    docLines: {
      gap: 4,
    },
    docLine: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    docTotal: {
      marginTop: spacing.xs,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
      paddingTop: spacing.sm,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    docTotalLabel: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    docTotalValue: {
      ...typography.headline,
      color: colors.text,
    },
    docMeta: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
    convertChip: {
      alignSelf: 'flex-start',
      backgroundColor: colors.primarySubtle,
      borderRadius: radius.chip,
      paddingHorizontal: spacing.sm,
      paddingVertical: 6,
    },
    convertText: {
      ...typography.footnoteMedium,
      color: colors.primary,
    },
    aiCard: {
      width: '100%',
      maxWidth: 280,
      gap: spacing.sm,
    },
    aiBubbleUser: {
      alignSelf: 'flex-end',
      backgroundColor: colors.primarySubtle,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      maxWidth: '90%',
    },
    aiBubbleResult: {
      alignSelf: 'flex-start',
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      maxWidth: '90%',
    },
    aiBubbleText: {
      ...typography.footnote,
      color: colors.text,
    },
    aiThinking: {
      alignSelf: 'center',
    },
    aiThinkingText: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    templatesRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    templateCard: {
      width: 72,
      height: 96,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      backgroundColor: colors.surface,
      overflow: 'hidden',
      padding: 6,
      gap: 6,
    },
    templateHeader: {
      height: 28,
      borderRadius: 4,
    },
    templateLabel: {
      ...typography.caption2,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    previewStrip: {
      marginTop: spacing.md,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    previewText: {
      ...typography.footnoteMedium,
      color: colors.text,
    },
    payChip: {
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.md,
      padding: spacing.sm,
    },
    payChipText: {
      ...typography.footnote,
      color: colors.text,
    },
    paidBadge: {
      alignSelf: 'flex-start',
      backgroundColor: colors.successSubtle,
      borderRadius: radius.chip,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
    },
    paidText: {
      ...typography.footnoteMedium,
      color: colors.success,
    },
    statsCard: {
      width: '100%',
      maxWidth: 280,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.md,
      minHeight: 180,
    },
    kpiRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    kpi: {
      flex: 1,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: radius.md,
      padding: spacing.sm,
      gap: 2,
    },
    kpiLabel: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    kpiValue: {
      ...typography.headline,
      color: colors.text,
    },
    bars: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: 6,
      height: 96,
    },
  }));
}
