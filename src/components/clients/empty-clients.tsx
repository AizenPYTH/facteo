import { SymbolView } from 'expo-symbols';
import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';

export type EmptyClientsProps = {
  isSearching?: boolean;
  style?: ViewStyle;
  testID?: string;
};

export function EmptyClients({ isSearching = false, style, testID }: EmptyClientsProps) {
  const title = isSearching ? 'Aucun résultat' : 'Aucun client';
  const description = isSearching
    ? 'Essayez un autre nom, email ou entreprise.'
    : 'Ajoutez votre premier client pour créer des devis et des factures.';

  return (
    <View style={[styles.container, style]} testID={testID}>
      <View style={styles.iconWrap}>
        <SymbolView
          name={{
            ios: isSearching ? 'magnifyingglass' : 'person.2',
            android: isSearching ? 'search' : 'group',
            web: isSearching ? 'search' : 'group',
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
