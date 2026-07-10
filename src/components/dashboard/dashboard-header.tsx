import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type DashboardHeaderProps = {
  firstName?: string;
  companyName?: string;
  greetingPrefix?: string;
  style?: ViewStyle;
};

export function DashboardHeader({
  firstName,
  companyName,
  greetingPrefix = 'Bonjour',
  style,
}: DashboardHeaderProps) {
  const greeting = firstName ? `${greetingPrefix}, ${firstName}` : greetingPrefix;

  return (
    <View style={[styles.container, style]}>
      <Text accessibilityRole="header" style={styles.greeting}>
        {greeting}
      </Text>
      {companyName ? <Text style={styles.company}>{companyName}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.xs,
  },
  greeting: {
    ...typography.largeTitle,
    color: colors.text,
  },
  company: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
});
