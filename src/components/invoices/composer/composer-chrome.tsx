import { BlurView } from 'expo-blur';
import { useEffect, useState } from 'react';
import { Animated, Easing, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useKeyboardState } from 'react-native-keyboard-controller';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  ComposerIcon,
  PrimaryButton,
  SegmentedControl,
} from '@/components/composer/primitives';
import { COMPOSER_STEPS, type ComposerIssue } from '@/components/invoices/composer/composer-model';
import {
  composerRadius,
  tabularNums,
  useComposerColors,
  useComposerStyles,
  type ComposerColors,
} from '@/constants/theme/composer';
import { useReduceMotion } from '@/hooks/use-reduce-motion';
import { formatPriceHT } from '@/lib/format/currency';
import { triggerImpactHaptic } from '@/lib/haptics';

/* -------------------------------------------------------------------------- */
/* Barre de navigation                                                         */
/* -------------------------------------------------------------------------- */

type ComposerNavBarProps = {
  mode: 'create' | 'edit';
  title: string;
  step: number;
  onCancel: () => void;
  onPreview: () => void;
  onStepSelect: (step: number) => void;
};

/**
 * « Annuler · titre · Aperçu ». En création, progression en 3 segments ;
 * en modification, contrôle segmenté Client / Lignes / Modèle (navigation libre).
 */
export function ComposerNavBar({
  mode,
  title,
  step,
  onCancel,
  onPreview,
  onStepSelect,
}: ComposerNavBarProps) {
  const styles = useComposerStyles(chromeStyles);
  const current = COMPOSER_STEPS[step - 1] ?? COMPOSER_STEPS[0];

  return (
    <View style={styles.nav}>
      <View style={styles.navRow}>
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={onCancel}
          style={({ pressed }) => [styles.navSide, pressed && styles.pressed]}>
          <Text maxFontSizeMultiplier={1.3} style={styles.navAction}>
            Annuler
          </Text>
        </Pressable>
        <Text
          accessibilityRole="header"
          maxFontSizeMultiplier={1.3}
          numberOfLines={1}
          style={styles.navTitle}>
          {title}
        </Text>
        <Pressable
          accessibilityHint="Ouvre l’aperçu PDF de la facture"
          accessibilityRole="button"
          hitSlop={8}
          onPress={onPreview}
          style={({ pressed }) => [styles.navSide, styles.navSideEnd, pressed && styles.pressed]}>
          <Text maxFontSizeMultiplier={1.3} style={styles.navAction}>
            Aperçu
          </Text>
        </Pressable>
      </View>

      {mode === 'create' ? (
        <View
          accessibilityLabel={`Étape ${step} sur 3, ${current.name}`}
          accessible
          style={styles.progress}>
          <View style={styles.progressTrack}>
            {COMPOSER_STEPS.map((entry) => (
              <ProgressSegment active={entry.step <= step} key={entry.step} />
            ))}
          </View>
          <View style={styles.progressLabels}>
            <Text maxFontSizeMultiplier={1.3} style={styles.progressStep}>
              Étape {step} sur 3
            </Text>
            <Text maxFontSizeMultiplier={1.3} style={styles.progressName}>
              {current.name}
            </Text>
          </View>
        </View>
      ) : (
        <View style={styles.segmentWrap}>
          <SegmentedControl
            onChange={(value) => onStepSelect(Number(value))}
            options={COMPOSER_STEPS.map((entry) => ({
              value: String(entry.step),
              label: entry.short,
            }))}
            value={String(step)}
          />
        </View>
      )}
    </View>
  );
}

function ProgressSegment({ active }: { active: boolean }) {
  const styles = useComposerStyles(chromeStyles);
  const reduceMotion = useReduceMotion();
  const [fill] = useState(() => new Animated.Value(active ? 1 : 0));

  useEffect(() => {
    Animated.timing(fill, {
      toValue: active ? 1 : 0,
      duration: reduceMotion ? 0 : 180,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, [active, fill, reduceMotion]);

  return (
    <View style={styles.progressSegment}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            opacity: fill,
          },
        ]}
      />
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Barre inférieure                                                            */
/* -------------------------------------------------------------------------- */

type ComposerBottomBarProps = {
  totalTtc: number;
  totalVat: number;
  lineCount: number;
  canGoBack: boolean;
  onBack: () => void;
  primaryLabel: string;
  onPrimary: () => void;
  loading?: boolean;
  /** Hauteur clavier fermé (réserve stable sous le contenu défilant). */
  onHeightChange?: (height: number) => void;
};

/** Hauteur de la barre clavier ouvert : boutons seuls (12 + 54 + 8 + filet). */
export const COMPACT_BOTTOM_BAR_HEIGHT = 75;

/**
 * Total TTC toujours visible + action principale. Clavier ouvert, seule la
 * rangée de boutons reste (le total prendrait la place du champ en saisie).
 */
export function ComposerBottomBar({
  totalTtc,
  totalVat,
  lineCount,
  canGoBack,
  onBack,
  primaryLabel,
  onPrimary,
  loading = false,
  onHeightChange,
}: ComposerBottomBarProps) {
  const styles = useComposerStyles(chromeStyles);
  const colors = useComposerColors();
  const insets = useSafeAreaInsets();
  const keyboardVisible = useKeyboardState((state) => state.isVisible);
  const paddingBottom = keyboardVisible ? 8 : Math.max(insets.bottom, 12);
  const lineLabel = `${lineCount} ligne${lineCount > 1 ? 's' : ''}`;

  return (
    <View
      onLayout={(event) => {
        // Seule la hauteur clavier fermé est remontée : la réserve sous le
        // contenu ne doit pas varier pendant l'animation du clavier.
        if (!keyboardVisible) onHeightChange?.(event.nativeEvent.layout.height);
      }}
      style={[styles.bar, { paddingBottom }]}>
      {Platform.OS === 'ios' ? (
        <BlurView
          intensity={40}
          style={StyleSheet.absoluteFill}
          tint={colors.scheme === 'dark' ? 'dark' : 'light'}
        />
      ) : null}
      <View style={[StyleSheet.absoluteFill, styles.barTint]} />

      {keyboardVisible ? null : (
        <View
          accessibilityLabel={`Total TTC ${formatPriceHT(totalTtc)}, ${lineLabel}, TVA ${formatPriceHT(totalVat)}`}
          accessible
          style={styles.totalRow}>
          <View style={styles.totalBlock}>
            <Text maxFontSizeMultiplier={1.3} style={styles.totalCaption}>
              Total TTC
            </Text>
            <Text
              adjustsFontSizeToFit
              maxFontSizeMultiplier={1.2}
              numberOfLines={1}
              style={styles.totalValue}>
              {formatPriceHT(totalTtc)}
            </Text>
          </View>
          <Text maxFontSizeMultiplier={1.3} numberOfLines={2} style={styles.totalMeta}>
            {lineLabel} · TVA {formatPriceHT(totalVat)}
          </Text>
        </View>
      )}

      <View style={styles.actions}>
        {canGoBack ? (
          <Pressable
            accessibilityLabel="Étape précédente"
            accessibilityRole="button"
            onPress={() => {
              void triggerImpactHaptic();
              onBack();
            }}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <ComposerIcon
              color={colors.ink}
              name={{ ios: 'chevron.left', android: 'chevron_left', web: 'chevron_left' }}
              size={17}
            />
          </Pressable>
        ) : null}
        <PrimaryButton
          label={primaryLabel}
          loading={loading}
          onPress={() => {
            void triggerImpactHaptic();
            onPrimary();
          }}
          style={styles.primary}
        />
      </View>
    </View>
  );
}

/* -------------------------------------------------------------------------- */
/* Bandeau d'erreurs                                                           */
/* -------------------------------------------------------------------------- */

export function ComposerErrorBanner({
  issues,
  onGoToStep,
}: {
  issues: ComposerIssue[];
  onGoToStep: (step: number) => void;
}) {
  const styles = useComposerStyles(chromeStyles);
  const colors = useComposerColors();

  if (issues.length === 0) {
    return null;
  }

  const shown = issues.slice(0, 6);
  const title =
    issues.length === 1 ? '1 point à corriger' : `${issues.length} points à corriger`;

  return (
    <View accessibilityLiveRegion="polite" style={styles.banner}>
      <View style={styles.bannerHeader}>
        <ComposerIcon
          color={colors.danger}
          name={{ ios: 'exclamationmark.circle', android: 'error', web: 'error' }}
          size={18}
        />
        <Text maxFontSizeMultiplier={1.3} style={styles.bannerTitle}>
          {title}
        </Text>
      </View>
      {shown.map((issue) => (
        <Pressable
          accessibilityHint={`Aller à l’étape ${issue.step}`}
          accessibilityRole="link"
          key={issue.key}
          onPress={() => onGoToStep(issue.step)}
          style={({ pressed }) => [styles.bannerRow, pressed && styles.pressed]}>
          <Text maxFontSizeMultiplier={1.3} numberOfLines={1} style={styles.bannerLabel}>
            {issue.label}
          </Text>
          <Text maxFontSizeMultiplier={1.3} style={styles.bannerLink}>
            Étape {issue.step} ›
          </Text>
        </Pressable>
      ))}
      {issues.length > shown.length ? (
        <Text maxFontSizeMultiplier={1.3} style={styles.bannerMore}>
          et {issues.length - shown.length} autre{issues.length - shown.length > 1 ? 's' : ''}…
        </Text>
      ) : null}
    </View>
  );
}

function chromeStyles(colors: ComposerColors) {
  return {
    pressed: {
      opacity: 0.55,
    },
    nav: {
      backgroundColor: colors.bg,
      paddingBottom: 10,
    },
    navRow: {
      height: 44,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      paddingHorizontal: 16,
    },
    navSide: {
      width: 84,
      minHeight: 44,
      justifyContent: 'center' as const,
    },
    navSideEnd: {
      alignItems: 'flex-end' as const,
    },
    navAction: {
      fontSize: 17,
      color: colors.accent,
    },
    navTitle: {
      flex: 1,
      textAlign: 'center' as const,
      fontSize: 17,
      fontWeight: '600' as const,
      color: colors.ink,
    },
    progress: {
      paddingHorizontal: 20,
      paddingTop: 6,
    },
    progressTrack: {
      flexDirection: 'row' as const,
      gap: 6,
    },
    progressSegment: {
      flex: 1,
      height: 4,
      borderRadius: 99,
      backgroundColor: colors.track,
      overflow: 'hidden' as const,
    },
    progressFill: {
      flex: 1,
      borderRadius: 99,
      backgroundColor: colors.accent,
    },
    progressLabels: {
      flexDirection: 'row' as const,
      justifyContent: 'space-between' as const,
      marginTop: 9,
    },
    progressStep: {
      fontSize: 13,
      color: colors.ink3,
    },
    progressName: {
      fontSize: 13,
      fontWeight: '600' as const,
      color: colors.ink2,
    },
    segmentWrap: {
      paddingHorizontal: 16,
      paddingTop: 4,
    },
    bar: {
      paddingTop: 12,
      paddingHorizontal: 16,
      borderTopWidth: 1,
      borderTopColor: colors.line,
      overflow: 'hidden' as const,
    },
    barTint: {
      backgroundColor: colors.bar,
    },
    totalRow: {
      flexDirection: 'row' as const,
      alignItems: 'flex-start' as const,
      justifyContent: 'space-between' as const,
      gap: 12,
      paddingHorizontal: 4,
      paddingBottom: 10,
    },
    totalBlock: {
      flexShrink: 1,
    },
    totalCaption: {
      fontSize: 13,
      color: colors.ink3,
    },
    totalValue: {
      ...tabularNums,
      fontSize: 24,
      fontWeight: '800' as const,
      letterSpacing: -0.6,
      color: colors.ink,
    },
    totalMeta: {
      ...tabularNums,
      flexShrink: 1,
      fontSize: 13.5,
      color: colors.ink3,
      textAlign: 'right' as const,
      paddingTop: 1,
    },
    actions: {
      flexDirection: 'row' as const,
      gap: 10,
    },
    backButton: {
      width: 54,
      height: 54,
      borderRadius: composerRadius.button,
      backgroundColor: colors.soft,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
    primary: {
      flex: 1,
    },
    banner: {
      borderRadius: composerRadius.card,
      backgroundColor: colors.dangerSoft,
      paddingVertical: 14,
      paddingHorizontal: 16,
      marginBottom: 18,
    },
    bannerHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 8,
    },
    bannerTitle: {
      fontSize: 15,
      fontWeight: '700' as const,
      color: colors.danger,
    },
    bannerRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: 12,
      minHeight: 32,
      marginTop: 4,
    },
    bannerLabel: {
      flex: 1,
      fontSize: 14,
      color: colors.ink2,
    },
    bannerLink: {
      fontSize: 14,
      fontWeight: '600' as const,
      color: colors.danger,
    },
    bannerMore: {
      fontSize: 13,
      color: colors.ink3,
      marginTop: 6,
    },
  };
}
