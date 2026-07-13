import { router, type Href } from 'expo-router';
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
import { Button } from '@/components/ui/button';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteClients } from '@/hooks/use-clients';
import { getClientDisplayName, type Client } from '@/types/client';

type QuoteClientStepProps = {
  selectedClientId: string | null;
  onSelectClient: (client: Client) => void;
};

function ClientRow({
  client,
  isSelected,
  onPress,
}: {
  client: Client;
  isSelected: boolean;
  onPress: () => void;
}) {
  const styles = useStyles();
  const colors = useColors();
  const displayName = getClientDisplayName(client);
  const secondaryLabel =
    client.company?.trim() &&
    [client.firstName, client.lastName].filter(Boolean).join(' ')
      ? [client.firstName, client.lastName].filter(Boolean).join(' ')
      : null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      style={({ pressed }) => [
        styles.clientRow,
        isSelected && styles.clientRowSelected,
        pressed && styles.pressed,
      ]}>
      <View style={styles.clientInfo}>
        <Text style={styles.clientName}>{displayName}</Text>
        {secondaryLabel ? <Text style={styles.clientMeta}>{secondaryLabel}</Text> : null}
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
}

export function QuoteClientStep({ selectedClientId, onSelectClient }: QuoteClientStepProps) {
  const styles = useStyles();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, 300);
  const { clients, isLoading } = useInfiniteClients(debouncedSearch);

  const isSearching = debouncedSearch.trim().length > 0;

  const recentClients = useMemo(
    () =>
      [...clients]
        .sort(
          (left, right) =>
            new Date(right.updatedAt).getTime() - new Date(left.updatedAt).getTime(),
        )
        .slice(0, 5),
    [clients],
  );

  const listClients = useMemo(() => {
    if (isSearching) {
      return [...clients].sort((left, right) =>
        getClientDisplayName(left).localeCompare(getClientDisplayName(right), 'fr'),
      );
    }

    const recentIds = new Set(recentClients.map((client) => client.id));
    const remaining = clients
      .filter((client) => !recentIds.has(client.id))
      .sort((left, right) =>
        getClientDisplayName(left).localeCompare(getClientDisplayName(right), 'fr'),
      );

    return [...recentClients, ...remaining];
  }, [clients, isSearching, recentClients]);

  const sortedClients = useMemo(
    () =>
      [...listClients].sort((left, right) => {
        if (left.id === selectedClientId) {
          return -1;
        }

        if (right.id === selectedClientId) {
          return 1;
        }

        return 0;
      }),
    [listClients, selectedClientId],
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

      <Button
        onPress={() => router.push('/clients/new' as Href)}
        title="Nouveau client"
        variant="ghost"
      />

      <ClientSearchBar onChangeText={setSearch} value={search} />

      {!isSearching && recentClients.length > 0 ? (
        <Text style={styles.sectionLabel}>Clients récents</Text>
      ) : null}

      <FlatList
        contentContainerStyle={styles.listContent}
        data={sortedClients}
        keyExtractor={(item) => item.id}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled
        ListEmptyComponent={
          <Text style={styles.emptyText}>
            Aucun client trouvé. Créez un client pour continuer.
          </Text>
        }
        renderItem={({ item }) => (
          <ClientRow
            client={item}
            isSelected={item.id === selectedClientId}
            onPress={() => onSelectClient(item)}
          />
        )}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  container: {
    flex: 1,
    gap: spacing.md,
  },
  description: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  sectionLabel: {
    ...typography.footnoteMedium,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
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
}));
}
