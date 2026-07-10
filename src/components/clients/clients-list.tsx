import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  type ListRenderItem,
  type ViewStyle,
} from 'react-native';

import { colors } from '@/constants/theme/colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
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
  const renderItem: ListRenderItem<Client> = ({ item, index }) => (
    <View>
      <ClientCard client={item} onPress={onClientPress} />
      {index < clients.length - 1 ? <View style={styles.separator} /> : null}
    </View>
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
      <View style={styles.loading}>
        <ActivityIndicator color={colors.primary} size="large" />
        <Text style={styles.loadingText}>Chargement des clients...</Text>
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
      showsVerticalScrollIndicator={false}
      style={styles.list}
      testID={testID}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flex: 1,
  },
  listContent: {
    backgroundColor: colors.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  emptyContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing['3xl'],
    gap: spacing.md,
  },
  loadingText: {
    ...typography.subheadline,
    color: colors.textSecondary,
  },
  footer: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.separator,
    marginLeft: spacing.md,
  },
});
