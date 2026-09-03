import { SymbolView } from 'expo-symbols';
import { Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

type VoiceRecordButtonProps = {
  onPress: () => void;
  disabled?: boolean;
};

export function VoiceRecordButton({ onPress, disabled = false }: VoiceRecordButtonProps) {
  const styles = useStyles();
  const colors = useColors();

  return (
    <PressableScale
      accessibilityRole="button"
      disabled={disabled}
      onPress={onPress}
      style={[styles.container, disabled && styles.disabled]}>
      <View style={styles.iconWrap}>
        <SymbolView
          name={{ ios: 'mic.fill', android: 'mic', web: 'mic' }}
          size={20}
          tintColor={colors.primary}
          type="hierarchical"
        />
      </View>
      <Text style={styles.label}>🎤 Créer avec la voix</Text>
    </PressableScale>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    container: {
      minHeight: 50,
      borderRadius: radius.button,
      borderWidth: 1,
      borderColor: colors.primaryMuted,
      backgroundColor: colors.primarySubtle,
      paddingHorizontal: spacing.md,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    iconWrap: {
      width: 30,
      height: 30,
      borderRadius: radius.full,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    label: {
      ...typography.headline,
      color: colors.primary,
    },
    disabled: {
      opacity: 0.5,
    },
  }));
}
