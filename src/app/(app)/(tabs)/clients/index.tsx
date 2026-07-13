import { router, type Href } from 'expo-router';
import { useCallback, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  AddClientFab,
  ClientSearchBar,
  ClientsList,
  ClientsScreenHeader,
} from '@/components/clients';
import { BottomTabInset } from '@/constants/theme';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useInfiniteClients } from '@/hooks/use-clients';
import { useTenant } from '@/hooks/use-tenant';
import type { Client } from '@/types/client';

const FAB_CLEARANCE = 104;
const SEARCH_DEBOUNCE_MS = 300;

export default function ClientsScreen() {
  const styles = useStyles();
  const colors = useColors();
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const insets = useSafeAreaInsets();
  const { isSwitching } = useTenant();

  const {
    clients,
    isLoading,
    isRefetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteClients(debouncedSearch);

  const isSearching = debouncedSearch.trim().length > 0;
  const isInitialLoading = (isLoading || isSwitching) && clients.length === 0;
  const showFab = clients.length > 0 || isSearching;

  const handleRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);

  const handleClientPress = useCallback((client: Client) => {
    router.push(`/clients/${client.id}` as Href);
  }, []);

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <View style={styles.headerSection}>
        <ClientsScreenHeader />
        <ClientSearchBar onChangeText={setSearch} value={search} />
      </View>

      <View style={styles.listContainer}>
        <ClientsList
          clients={clients}
          contentContainerStyle={{
            paddingBottom: insets.bottom + BottomTabInset + FAB_CLEARANCE,
          }}
          isFetchingNextPage={isFetchingNextPage}
          isInitialLoading={isInitialLoading}
          isRefreshing={isRefetching && !isFetchingNextPage}
          isSearching={isSearching}
          onClientPress={handleClientPress}
          onEndReached={handleEndReached}
          onRefresh={handleRefresh}
        />
      </View>

      {showFab ? (
        <AddClientFab
          label="Ajouter un client"
          style={{ bottom: insets.bottom + BottomTabInset + spacing.md }}
        />
      ) : null}
    </SafeAreaView>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
  safeArea: {
    flex: 1,
    backgroundColor: colors.backgroundGrouped,
  },
  headerSection: {
    paddingHorizontal: spacing.screenPaddingHorizontal,
    paddingTop: spacing.md,
    paddingBottom: spacing.md,
    gap: spacing.md,
  },
  listContainer: {
    flex: 1,
    paddingHorizontal: spacing.screenPaddingHorizontal,
  },
}));
}
