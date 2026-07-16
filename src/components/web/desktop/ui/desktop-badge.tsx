import { SymbolView } from 'expo-symbols';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type DesktopBadgeProps = {
  label: string;
  tone?: 'default' | 'success' | 'warning' | 'danger' | 'info';
};

export function DesktopBadge({ label, tone = 'default' }: DesktopBadgeProps) {
  const styles = useStyles();
  const toneStyle =
    tone === 'success'
      ? styles.success
      : tone === 'warning'
        ? styles.warning
        : tone === 'danger'
          ? styles.danger
          : tone === 'info'
            ? styles.info
            : styles.default;

  const textStyle =
    tone === 'success'
      ? styles.textSuccess
      : tone === 'warning'
        ? styles.textWarning
        : tone === 'danger'
          ? styles.textDanger
          : tone === 'info'
            ? styles.textInfo
            : styles.textDefault;

  return (
    <View style={[styles.badge, toneStyle]}>
      <Text style={[styles.label, textStyle]}>{label}</Text>
    </View>
  );
}

type DesktopActionButtonProps = {
  label: string;
  icon: SymbolName;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  destructive?: boolean;
};

export function DesktopActionButton({
  label,
  icon,
  onPress,
  loading = false,
  disabled = false,
  destructive = false,
}: DesktopActionButtonProps) {
  const styles = useActionStyles();
  const colors = useColors();
  const tint = destructive ? colors.error : colors.text;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        pressed && styles.pressed,
        (disabled || loading) && styles.disabled,
      ]}>
      <SymbolView
        name={icon}
        size={18}
        tintColor={disabled ? colors.textTertiary : tint}
        type="hierarchical"
      />
      <Text style={[styles.label, destructive && styles.destructive, disabled && styles.disabledText]}>
        {loading ? 'Chargement…' : label}
      </Text>
    </Pressable>
  );
}

type DesktopPaginationProps = {
  loadedCount: number;
  totalCount?: number | null;
  hasMore: boolean;
  loading?: boolean;
  onLoadMore: () => void;
};

export function DesktopPagination({
  loadedCount,
  totalCount,
  hasMore,
  loading = false,
  onLoadMore,
}: DesktopPaginationProps) {
  const styles = usePaginationStyles();

  const label =
    totalCount != null
      ? `${loadedCount} sur ${totalCount} éléments`
      : `${loadedCount} élément${loadedCount > 1 ? 's' : ''} chargé${loadedCount > 1 ? 's' : ''}`;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      {hasMore ? (
        <Pressable
          accessibilityRole="button"
          disabled={loading}
          onPress={onLoadMore}
          style={({ pressed }) => [styles.more, pressed && styles.morePressed, loading && styles.disabled]}>
          <Text style={styles.moreText}>{loading ? 'Chargement…' : 'Charger plus'}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    badge: {
      alignSelf: 'flex-start',
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.full,
    },
    default: { backgroundColor: colors.backgroundSecondary },
    success: { backgroundColor: colors.successSubtle },
    warning: { backgroundColor: colors.warningSubtle },
    danger: { backgroundColor: colors.errorSubtle },
    info: { backgroundColor: colors.primarySubtle },
    label: { ...typography.caption2, fontWeight: '600' },
    textDefault: { color: colors.textSecondary },
    textSuccess: { color: colors.success },
    textWarning: { color: colors.warning },
    textDanger: { color: colors.error },
    textInfo: { color: colors.primary },
  }));

const useActionStyles = () =>
  useThemedStyles((colors) => ({
    button: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.backgroundSecondary,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    pressed: { backgroundColor: colors.primarySubtle, opacity: 0.92 },
    disabled: { opacity: 0.5 },
    label: { ...typography.subheadlineMedium, color: colors.text, flex: 1 },
    destructive: { color: colors.error },
    disabledText: { color: colors.textTertiary },
  }));

const usePaginationStyles = () =>
  useThemedStyles((colors) => ({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
      backgroundColor: colors.backgroundSecondary,
    },
    label: { ...typography.caption1, color: colors.textSecondary },
    more: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    morePressed: { opacity: 0.88 },
    disabled: { opacity: 0.6 },
    moreText: { ...typography.caption1, color: colors.primary, fontWeight: '600' },
  }));
