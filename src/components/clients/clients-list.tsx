import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  View,
  type ListRenderItem,
  type ViewStyle,
} from 'react-native';

import { DocumentListSkeleton } from '@/components/ui/document-list-skeleton';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { elevation } from '@/constants/theme/surfaces';
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
    <View>
      <ClientCard client={item} index={index} onPress={onClientPress} />
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
    return <DocumentListSkeleton />;
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
  return useThemedStyles((colors) => ({
    list: {
      flex: 1,
    },
    listContent: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
      ...elevation[1],
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
    separator: {
      height: StyleSheet.hairlineWidth,
      backgroundColor: colors.separator,
      marginLeft: spacing.md + 44 + spacing.md,
    },
  }));
}
