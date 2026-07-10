import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type EmptyQuotesProps = {
  isSearching?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function EmptyQuotes({ isSearching = false, style, testID }: EmptyQuotesProps) {
  const title = isSearching ? 'Aucun résultat' : 'Aucun devis';
  const description = isSearching
    ? 'Essayez un autre numéro de devis.'
    : 'Créez votre premier devis pour vos clients.';

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.iconWrap}>
        <SymbolView
          name={{
            ios: isSearching ? 'magnifyingglass' : 'doc.text',
            android: isSearching ? 'search' : 'description',
            web: isSearching ? 'search' : 'description',
          }}
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
    paddingVertical: spacing['3xl'],
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
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
