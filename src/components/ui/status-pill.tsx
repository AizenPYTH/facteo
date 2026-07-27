import { StyleSheet, Text, View } from 'react-native';

import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { type } from '@/constants/theme/type-roles';
import { useThemedStyles } from '@/hooks/use-colors';

type StatusPillProps = {
  label: string;
  backgroundColor: string;
  textColor: string;
};

/** Design Language badge — soft pill, never a hard chip. */
export function StatusPill({ label, backgroundColor, textColor }: StatusPillProps) {
  const styles = useStyles();

  return (
    <View style={[styles.pill, { backgroundColor }]}>
      <Text style={[styles.label, { color: textColor }]}>{label}</Text>
    </View>
  );
}

function useStyles() {
  return useThemedStyles(() => ({
    pill: {
      alignSelf: 'flex-start',
      borderRadius: radius.full,
      paddingHorizontal: spacing[2.5],
      paddingVertical: spacing[1],
    },
    label: {
      ...type.badge,
      fontSize: 12,
      lineHeight: 16,
    },
  }));
}
