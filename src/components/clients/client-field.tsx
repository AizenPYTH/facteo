import { StyleSheet, Text, View } from 'react-native';

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { textHierarchy } from '@/constants/theme/typography';

type ClientFieldProps = {
  label: string;
  value: string | null;
  emphasize?: boolean;
};

export function ClientField({ label, value, emphasize = false }: ClientFieldProps) {
  const styles = useStyles();
  const colors = useColors();
  const displayValue = value?.trim() || 'Non renseigné';

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text
        numberOfLines={2}
        style={[styles.value, emphasize ? styles.valueEmphasized : null]}>
        {displayValue}
      </Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  field: {
    gap: 2,
  },
  label: {
    ...textHierarchy.caption,
    color: colors.textSecondary,
    textTransform: 'uppercase',
  },
  value: {
    ...textHierarchy.subtitle,
    color: colors.text,
    flexShrink: 1,
  },
  valueEmphasized: {
    ...textHierarchy.body,
    fontWeight: '500',
  },
}));
}
