import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type EmptyInvoicesProps = {
  title?: string;
  description?: string;
  style?: ViewStyle;
  testID?: string;
};

const DEFAULT_TITLE = 'No invoices yet';
const DEFAULT_DESCRIPTION = 'Your latest invoices will appear here once you create one.';

export function EmptyInvoices({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESCRIPTION,
  style,
  testID,
}: EmptyInvoicesProps) {
  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.iconWrap}>
        <SymbolView
          name={{ ios: 'doc.text', android: 'description', web: 'description' }}
          size={28}
          tintColor={colors.iconTertiary}
          type="hierarchical"
        />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description}>{description}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  iconWrap: {
    width: 56,
    height: 56,
    borderRadius: radius.full,
    backgroundColor: colors.backgroundSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  title: {
    ...typography.headline,
    color: colors.text,
    textAlign: 'center',
  },
  description: {
    ...typography.subheadline,
    color: colors.textSecondary,
    textAlign: 'center',
  },
});
