import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  View,
  type ListRenderItem,
  type ViewStyle,
} from 'react-native';
import Animated from 'react-native-reanimated';

import { ListSkeleton } from '@/components/ui/list-skeleton';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { spacing } from '@/constants/theme/spacing';
import { fadeInUp } from '@/lib/motion/presets';
import type { Client } from '@/types/client';

import { ClientCard } from './client-card';
import { EmptyClients } from './empty-clients';

export type ClientsListProps = {
  clients: Client[];
  isInitialLoading?: boolean;
  isRefreshing?: boolean;
  isFetchingNextPage?: boolean;
  isSearching?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  onClientPress?: (client: Client) => void;
  contentContainerStyle?: ViewStyle;
  testID?: string;
};

export function ClientsList({
  clients,
  isInitialLoading = false,
  isRefreshing = false,
  isFetchingNextPage = false,
  isSearching = false,
  onRefresh,
  onEndReached,
  onClientPress,
  contentContainerStyle,
  testID,
}: ClientsListProps) {
  const styles = useStyles();
  const colors = useColors();
  const renderItem: ListRenderItem<Client> = ({ item, index }) => (
    <Animated.View entering={fadeInUp({ index, step: 40 })}>
      <ClientCard client={item} onPress={onClientPress} />
    </Animated.View>
  );

  const renderFooter = () => {
    if (!isFetchingNextPage) {
      return null;
    }

    return (
      <View style={styles.footer}>
        <ActivityIndicator color={colors.primary} size="small" />
      </View>
    );
  };

  if (isInitialLoading) {
    return (
      <View style={[styles.listContent, contentContainerStyle]}>
        <ListSkeleton />
      </View>
    );
  }

  return (
    <FlatList
      contentContainerStyle={[
        clients.length === 0 ? styles.emptyContent : styles.listContent,
        contentContainerStyle,
      ]}
      data={clients}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={<EmptyClients isSearching={isSearching} />}
      ListFooterComponent={renderFooter}
      onEndReached={onEndReached}
      onEndReachedThreshold={0.4}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            colors={[colors.primary]}
            onRefresh={onRefresh}
            refreshing={isRefreshing}
            tintColor={colors.primary}
          />
        ) : undefined
      }
      renderItem={renderItem}
      keyboardShouldPersistTaps="handled"
      nestedScrollEnabled
      showsVerticalScrollIndicator={false}
      style={styles.list}
      testID={testID}
    />
  );
}

function useStyles() {
  return useThemedStyles(() => ({
  list: {
    flex: 1,
  },
  listContent: {
    gap: spacing.sm,
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
}));
}
