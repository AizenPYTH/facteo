import { StyleSheet, Text, View } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { typography } from '@/constants/theme/typography';

type ProductFieldProps = {
  label: string;
  value: string | null;
  emphasize?: boolean;
};

export function ProductField({ label, value, emphasize = false }: ProductFieldProps) {
  const displayValue = value?.trim() || 'Non renseigné';

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text
        numberOfLines={1}
        style={[styles.value, emphasize ? styles.valueEmphasized : null]}>
        {displayValue}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  field: {
    gap: 2,
  },
  label: {
    ...typography.caption1,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  value: {
    ...typography.subheadline,
    color: colors.text,
  },
  valueEmphasized: {
    ...typography.bodyMedium,
  },
});
