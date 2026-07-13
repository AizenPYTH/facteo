import { Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/use-colors';
import { textHierarchy } from '@/constants/theme/typography';

type QuoteFieldProps = {
  label: string;
  value: string | null;
  emphasize?: boolean;
};

export function QuoteField({ label, value, emphasize = false }: QuoteFieldProps) {
  const styles = useStyles();
  const displayValue = value?.trim() || '—';

  return (
    <View style={styles.field}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, emphasize ? styles.valueEmphasized : null]}>{displayValue}</Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    field: {
      gap: 2,
      flex: 1,
      minWidth: 0,
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
