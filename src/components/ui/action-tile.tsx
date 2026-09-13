import { SymbolView, type SymbolViewProps } from 'expo-symbols';
import { StyleSheet, View } from 'react-native';

import { AppText } from '@/components/ui/app-text';
import { PressableScale } from '@/components/ui/pressable-scale';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';

type ActionTileProps = {
  title: string;
  subtitle?: string;
  icon: SymbolViewProps['name'];
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: 'primary' | 'default';
  testID?: string;
};

export function ActionTile({
  title,
  subtitle,
  icon,
  onPress,
  loading = false,
  disabled = false,
  variant = 'default',
  testID,
}: ActionTileProps) {
  const styles = useStyles();
  const colors = useColors();
  const isPrimary = variant === 'primary';

  return (
    <PressableScale
      accessibilityLabel={subtitle ? `${title}. ${subtitle}` : title}
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={[
        styles.tile,
        isPrimary && styles.tilePrimary,
        (disabled || loading) && styles.tileDisabled,
      ]}
      testID={testID}>
      <View style={[styles.iconWrap, isPrimary && styles.iconWrapPrimary]}>
        <SymbolView
          name={icon}
          size={22}
          tintColor={isPrimary ? '#FFFFFF' : colors.primary}
        />
      </View>
      <View style={styles.textWrap}>
        <AppText medium style={isPrimary ? styles.titlePrimary : undefined} variant="body">
          {title}
        </AppText>
        {subtitle ? (
          <AppText color={isPrimary ? undefined : 'secondary'} style={isPrimary ? styles.subtitlePrimary : undefined} variant="caption">
            {subtitle}
          </AppText>
        ) : null}
      </View>
    </PressableScale>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    tile: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
    },
    tilePrimary: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    tileDisabled: {
      opacity: 0.5,
    },
    iconWrap: {
      width: 44,
      height: 44,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primarySubtle,
    },
    iconWrapPrimary: {
      backgroundColor: 'rgba(255,255,255,0.18)',
    },
    textWrap: {
      flex: 1,
      gap: 2,
    },
    titlePrimary: {
      color: '#FFFFFF',
    },
    subtitlePrimary: {
      color: 'rgba(255,255,255,0.82)',
    },
  }));
