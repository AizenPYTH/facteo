import { Platform, Pressable, Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { triggerSelectionHaptic } from '@/lib/haptics';
import {
  useThemePreference,
  type ThemePreference,
} from '@/providers/theme-preference-provider';

const OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: 'system', label: 'Système' },
  { value: 'light', label: 'Clair' },
  { value: 'dark', label: 'Sombre' },
];

/**
 * Apparence : Système / Clair / Sombre — le choix affiché = mode réellement actif.
 */
export function AppearancePreference() {
  const styles = useStyles();
  const { preference, colorScheme, setPreference } = useThemePreference();
  const supported = Platform.OS !== 'web';

  const activeLabel =
    preference === 'system'
      ? `Système (${colorScheme === 'dark' ? 'sombre' : 'clair'})`
      : preference === 'dark'
        ? 'Sombre'
        : 'Clair';

  return (
    <View style={styles.root}>
      <View style={styles.header}>
        <Text style={styles.title}>Apparence</Text>
        <Text style={styles.subtitle}>{activeLabel}</Text>
      </View>
      <View accessibilityLabel="Apparence" accessibilityRole="radiogroup" style={styles.track}>
        {OPTIONS.map((option) => {
          const selected = preference === option.value;
          return (
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: !supported }}
              disabled={!supported}
              key={option.value}
              onPress={() => {
                if (!supported || selected) return;
                void triggerSelectionHaptic();
                void setPreference(option.value);
              }}
              style={[styles.option, selected && styles.optionSelected]}>
              <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]}>
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
      {!supported ? (
        <Text style={styles.hint}>Le choix d’apparence sera bientôt disponible sur le web.</Text>
      ) : null}
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    root: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      gap: spacing.md,
    },
    title: {
      ...typography.body,
      color: colors.text,
    },
    subtitle: {
      ...typography.footnote,
      color: colors.textTertiary,
    },
    track: {
      flexDirection: 'row' as const,
      backgroundColor: colors.surfaceSecondary,
      borderRadius: 11,
      padding: 4,
      gap: 4,
    },
    option: {
      flex: 1,
      minHeight: 40,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      borderRadius: 8,
    },
    optionSelected: {
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    optionLabel: {
      ...typography.subheadlineMedium,
      color: colors.textSecondary,
    },
    optionLabelSelected: {
      color: colors.text,
    },
    hint: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
  }));
}
