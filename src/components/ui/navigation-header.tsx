import type { ReactNode } from 'react';
import { router } from 'expo-router';
import { SymbolView } from 'expo-symbols';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppText } from '@/components/ui/app-text';
import { triggerImpactHaptic } from '@/lib/haptics';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

const MIN_TOUCH_SIZE = 44;

type NavigationHeaderProps = {
  title: string;
  onBack?: () => void;
  backLabel?: string;
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
  showBackButton = true,
  style,
  useSafeTopInset = false,
  trailing,
}: NavigationHeaderProps) {
  const styles = useStyles();
  const colors = useColors();
  const insets = useSafeAreaInsets();

  function handleBack() {
    void triggerImpactHaptic();

    if (onBack) {
      onBack();
      return;
    }

    router.back();
  }

  const topPadding = useSafeTopInset ? Math.max(insets.top, spacing.sm) : spacing.sm;

  return (
    <View style={[styles.container, { paddingTop: topPadding }, style]}>
      <View style={styles.topRow}>
        {showBackButton ? (
          <Pressable
            accessibilityLabel={backLabel}
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
            <Text style={styles.backLabel}>{backLabel}</Text>
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
      <Text style={styles.modalTitle}>{title}</Text>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  trailing: {
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
  },
  backButton: {
    minHeight: MIN_TOUCH_SIZE,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingRight: spacing.sm,
  },
  backButtonPlaceholder: {
    minHeight: MIN_TOUCH_SIZE,
  },
  backLabel: {
    ...typography.subheadlineMedium,
    color: colors.primary,
  },
  pressed: {
    opacity: 0.7,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    minWidth: MIN_TOUCH_SIZE,
    minHeight: MIN_TOUCH_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
}
