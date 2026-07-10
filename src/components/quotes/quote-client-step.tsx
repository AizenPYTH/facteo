import { SymbolView } from 'expo-symbols';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { ClientSearchBar } from '@/components/clients/client-search-bar';
import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteClients } from '@/hooks/use-clients';
import type { Client } from '@/types/client';

type QuoteClientStepProps = {
  selectedClientId: string | null;
  onSelectClient: (client: Client) => void;
};

export function QuoteClientStep({ selectedClientId, onSelectClient }: QuoteClientStepProps) {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { clients, isLoading } = useInfiniteClients(debouncedSearch);

  const sortedClients = useMemo(
    () =>
      [...clients].sort((left, right) => {
        if (left.id === selectedClientId) {
          return -1;
        }

        if (right.id === selectedClientId) {
          return 1;
        }

        return left.name.localeCompare(right.name, 'fr');
      }),
    [clients, selectedClientId],
  );

  if (isLoading && clients.length === 0) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Chargement des clients...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.description}>Choisissez le client pour ce devis.</Text>
      <ClientSearchBar onChangeText={setSearch} value={search} />

      <FlatList
        contentContainerStyle={styles.listContent}
        data={sortedClients}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Aucun client trouvé. Ajoutez un client d'abord.</Text>
        }
        renderItem={({ item }) => {
          const isSelected = item.id === selectedClientId;
          const displayName = item.company?.trim() || item.name;

          return (
            <Pressable
              accessibilityRole="button"
              onPress={() => onSelectClient(item)}
              style={({ pressed }) => [
                styles.clientRow,
                isSelected && styles.clientRowSelected,
                pressed && styles.pressed,
              ]}>
              <View style={styles.clientInfo}>
                <Text style={styles.clientName}>{displayName}</Text>
                {item.company ? (
                  <Text style={styles.clientMeta}>{item.name}</Text>
                ) : null}
              </View>
              {isSelected ? (
                <SymbolView
                  name={{ ios: 'checkmark.circle.fill', android: 'check_circle', web: 'check_circle' }}
                  size={22}
                  tintColor={colors.primary}
                  type="hierarchical"
                />
              ) : null}
            </Pressable>
          );
        }}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  description: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  listContent: {
    gap: spacing.sm,
    paddingBottom: spacing.md,
  },
  clientRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
  },
  clientRowSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primarySubtle,
  },
  pressed: {
    opacity: 0.9,
  },
  clientInfo: {
    flex: 1,
    gap: 2,
  },
  clientName: {
    ...typography.bodyMedium,
    color: colors.text,
  },
  clientMeta: {
    ...typography.footnote,
    color: colors.textSecondary,
  },
  emptyText: {
    ...typography.subheadline,
    color: colors.textSecondary,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
});
