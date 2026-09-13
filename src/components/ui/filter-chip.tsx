import { ScrollView, Text, View } from 'react-native';

import { PressableScale } from '@/components/ui/pressable-scale';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';

export type FilterChipProps = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** Compteur affiché à droite du libellé, quand il est connu. */
  count?: number;
  testID?: string;
};

/**
 * Puce de filtre.
 *
 * Les barres de filtres rendaient un `<Text onPress>` : la zone tactile se
 * limitait au texte, sous le seuil de 44 pt, et rien n'annonçait l'état
 * sélectionné à VoiceOver. La puce est maintenant un vrai bouton.
 */
export function FilterChip({ label, selected, onPress, count, testID }: FilterChipProps) {
  const styles = useStyles();

  return (
    <PressableScale
      accessibilityLabel={count === undefined ? label : `${label}, ${count}`}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      intensity="subtle"
      onPress={onPress}
      style={[styles.chip, selected && styles.chipSelected]}
      testID={testID}>
      <Text
        maxFontSizeMultiplier={1.3}
        numberOfLines={1}
        style={[styles.label, selected && styles.labelSelected]}>
        {label}
      </Text>
      {count !== undefined ? (
        <Text maxFontSizeMultiplier={1.3} style={[styles.count, selected && styles.labelSelected]}>
          {count}
        </Text>
      ) : null}
    </PressableScale>
  );
}

export type FilterChipBarProps<T extends string> = {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  testID?: string;
};

/** Rangée défilante de puces. Une seule valeur active à la fois. */
export function FilterChipBar<T extends string>({
  options,
  value,
  onChange,
  testID,
}: FilterChipBarProps<T>) {
  const styles = useStyles();

  return (
    <ScrollView
      contentContainerStyle={styles.barContent}
      horizontal
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsHorizontalScrollIndicator={false}
      testID={testID}>
      <View style={styles.barRow}>
        {options.map((option) => (
          <FilterChip
            key={option.value}
            label={option.label}
            onPress={() => onChange(option.value)}
            selected={option.value === value}
          />
        ))}
      </View>
    </ScrollView>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    barContent: {
      paddingVertical: spacing[1],
    },
    barRow: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    chip: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing[1.5],
      minHeight: 40,
      paddingHorizontal: spacing.md,
      borderRadius: radius.full,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    chipSelected: {
      backgroundColor: colors.primarySubtle,
      borderColor: colors.primary,
    },
    label: {
      ...typography.subheadlineMedium,
      color: colors.textSecondary,
    },
    labelSelected: {
      color: colors.primary,
    },
    count: {
      ...typography.caption1,
      color: colors.textTertiary,
    },
  }));
}
