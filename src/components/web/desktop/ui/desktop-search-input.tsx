import { SymbolView } from 'expo-symbols';
import { StyleSheet, TextInput, View } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useColors, useThemedStyles } from '@/hooks/use-colors';

type DesktopSearchInputProps = {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  compact?: boolean;
};

export function DesktopSearchInput({
  value,
  onChangeText,
  placeholder = 'Rechercher…',
  compact = false,
}: DesktopSearchInputProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <View style={compact ? styles.wrapCompact : styles.wrap}>
      <SymbolView
        name={{ ios: 'magnifyingglass', android: 'search', web: 'search' }}
        size={16}
        tintColor={colors.textTertiary}
        type="hierarchical"
      />
      <TextInput
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textTertiary}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    wrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.md,
      minHeight: 40,
    },
    wrapCompact: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: colors.backgroundSecondary,
      borderRadius: radius.md,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      paddingHorizontal: spacing.sm,
      minHeight: 34,
    },
    input: {
      flex: 1,
      ...typography.subheadline,
      color: colors.text,
      paddingVertical: spacing.sm,
      ...(StyleSheet.flatten({ outlineStyle: 'none' }) as object),
    },
  }));
