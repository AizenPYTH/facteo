import { router, type Href } from 'expo-router';
import { useCallback, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  AddClientFab,
  ClientSearchBar,
  ClientTypeFilterBar,
  type ClientTypeFilter,
  ClientsList,
  ClientsScreenHeader,
} from '@/components/clients';
import { ClientsDesktopScreen } from '@/components/web/desktop/screens/clients-desktop-screen';
import { useBreakpoint } from '@/hooks/use-breakpoint';
import { useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { useDebouncedValue } from '@/hooks/use-debounced-value';
import { useScreenInsets } from '@/hooks/use-screen-insets';
import { useInfiniteClients } from '@/hooks/use-clients';
import { useTenant } from '@/hooks/use-tenant';
import type { Client } from '@/types/client';

const FAB_CLEARANCE = 104;
const SEARCH_DEBOUNCE_MS = 300;

export default function ClientsScreen() {
  const { isDesktop, isTablet, isWeb } = useBreakpoint();

  if (isWeb && (isDesktop || isTablet)) {
    return <ClientsDesktopScreen />;
  }

  return <ClientsMobileScreen />;
}

function ClientsMobileScreen() {
  const styles = useStyles();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<ClientTypeFilter>('all');
  const debouncedSearch = useDebouncedValue(search, SEARCH_DEBOUNCE_MS);
  const insets = useScreenInsets();
  const { isSwitching } = useTenant();

  const {
    clients,
    data,
    isLoading,
    isRefetching,
    error,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetch,
  } = useInfiniteClients(debouncedSearch);

  const visibleClients = useMemo(() => {
    if (typeFilter === 'all') {
      return clients;
    }

    return clients.filter((client) => {
      const isCompany = Boolean(client.company?.trim() || client.siren || client.siret);
      return typeFilter === 'company' ? isCompany : !isCompany;
    });
  }, [clients, typeFilter]);

  const isSearching = debouncedSearch.trim().length > 0;
  const isInitialLoading = (isLoading || isSwitching) && clients.length === 0;
  const showFab = visibleClients.length > 0 || isSearching || typeFilter !== 'all';
  const totalCount = data?.pages[0]?.totalCount ?? visibleClients.length;

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
        <ClientsScreenHeader count={totalCount ?? undefined} />
        <ClientSearchBar onChangeText={setSearch} value={search} />
        <ClientTypeFilterBar onChange={setTypeFilter} value={typeFilter} />
      </View>

      <View style={styles.listContainer}>
        <ClientsList
          clients={visibleClients}
          contentContainerStyle={{
            paddingBottom: insets.scrollBottom + FAB_CLEARANCE,
          }}
          error={error}
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
          style={{ bottom: insets.floatingBottom }}
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
