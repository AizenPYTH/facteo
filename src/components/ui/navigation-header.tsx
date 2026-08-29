import type { ReactNode } from 'react';
import { type Href } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { useSafeBack } from '@/hooks/use-safe-back';
import { triggerImpactHaptic } from '@/lib/haptics';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { components } from '@/constants/theme/design-system';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type NavigationHeaderProps = {
  title: string;
  onBack?: () => void;
  /** Destination nommée — DESIGN §4 (« Documents », « Clients », « Réglages »). */
  backLabel?: string;
  /** Repli si canGoBack() est faux. */
  fallbackHref?: Href;
  showBackButton?: boolean;
  style?: ViewStyle;
  /** Activez si l'écran n'utilise pas SafeAreaView. */
  useSafeTopInset?: boolean;
  trailing?: ReactNode;
};

export function NavigationHeader({
  title,
  onBack,
  backLabel = 'Retour',
  fallbackHref = '/',
  showBackButton = true,
  style,
  useSafeTopInset = false,
  trailing,
}: NavigationHeaderProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const safeBack = useSafeBack(fallbackHref);

  function handleBack() {
    void triggerImpactHaptic();

    if (onBack) {
      onBack();
      return;
    }

    safeBack();
  }

  const topPadding = useSafeTopInset ? Math.max(insets.top, spacing.sm) : spacing.sm;

  return (
    <View style={[styles.container, { paddingTop: topPadding }, style]}>
      <View style={styles.topRow}>
        {showBackButton ? (
          <Pressable
            accessibilityLabel={`Retour vers ${backLabel}`}
            accessibilityRole="button"
            hitSlop={8}
            onPress={handleBack}
            style={({ pressed }) => [styles.backButton, pressed && styles.pressed]}>
            <SymbolView
              name={{ ios: 'chevron.left', android: 'arrow_back', web: 'arrow_back' }}
              size={20}
              tintColor={colors.primary}
              type="hierarchical"
            />
            <Text maxFontSizeMultiplier={1.4} style={styles.backLabel}>
              {backLabel}
            </Text>
          </Pressable>
        ) : (
          <View style={styles.backButtonPlaceholder} />
        )}
        {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      </View>
      <AppText accessibilityRole="header" numberOfLines={2} variant="display">
        {title}
      </AppText>
    </View>
  );
}

type ModalHeaderProps = {
  title: string;
  onClose: () => void;
  closeLabel?: string;
  style?: ViewStyle;
};

export function ModalHeader({
  title,
  onClose,
  closeLabel = 'Fermer',
  style,
}: ModalHeaderProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.modalHeader, { paddingTop: insets.top + spacing.sm }, style]}>
      <Text maxFontSizeMultiplier={1.4} style={styles.modalTitle}>
        {title}
      </Text>
      <Pressable
        accessibilityLabel={closeLabel}
        accessibilityRole="button"
        hitSlop={12}
        onPress={onClose}
        style={({ pressed }) => [styles.closeButton, pressed && styles.pressed]}>
        <SymbolView
          name={{ ios: 'xmark.circle.fill', android: 'close', web: 'close' }}
          size={28}
          tintColor={colors.iconTertiary}
          type="hierarchical"
        />
      </Pressable>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingBottom: spacing.md,
      gap: spacing.sm,
    },
    topRow: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.sm,
    },
    trailing: {
      minHeight: components.touchTarget,
      justifyContent: 'center' as const,
    },
    backButton: {
      minHeight: components.touchTarget,
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: spacing.xs,
      alignSelf: 'flex-start' as const,
      paddingRight: spacing.sm,
    },
    backButtonPlaceholder: {
      minHeight: components.touchTarget,
    },
    backLabel: {
      ...typography.subheadlineMedium,
      color: colors.primary,
    },
    pressed: {
      opacity: 0.7,
    },
    modalHeader: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.md,
      paddingHorizontal: spacing.screenPaddingHorizontal,
      paddingBottom: spacing.md,
    },
    modalTitle: {
      ...typography.title3,
      color: colors.text,
      flex: 1,
    },
    closeButton: {
      minWidth: components.touchTarget,
      minHeight: components.touchTarget,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
    },
  }));
}
