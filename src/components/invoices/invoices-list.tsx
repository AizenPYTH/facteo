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
import type { Invoice } from '@/types/invoice';

import { EmptyInvoices } from './empty-invoices';
import { InvoiceCard } from './invoice-card';

export type InvoicesListProps = {
  invoices: Invoice[];
  onInvoicePress?: (invoice: Invoice) => void;
  isInitialLoading?: boolean;
  isRefreshing?: boolean;
  isFetchingNextPage?: boolean;
  isSearching?: boolean;
  showCreateAction?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  contentContainerStyle?: ViewStyle;
  testID?: string;
};

export function InvoicesList({
  invoices,
  isInitialLoading = false,
  isRefreshing = false,
  isFetchingNextPage = false,
  isSearching = false,
  showCreateAction = true,
  onRefresh,
  onEndReached,
  onInvoicePress,
  contentContainerStyle,
  testID,
}: InvoicesListProps) {
  const styles = useStyles();
  const colors = useColors();
  const renderItem: ListRenderItem<Invoice> = ({ item, index }) => (
    <Animated.View entering={fadeInUp({ index, step: 40 })}>
      <InvoiceCard invoice={item} onPress={onInvoicePress} />
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
        invoices.length === 0 ? styles.emptyContent : styles.listContent,
        contentContainerStyle,
      ]}
      data={invoices}
      keyExtractor={(item) => item.id}
      ListEmptyComponent={
        <EmptyInvoices isSearching={isSearching} showCreateAction={showCreateAction} />
      }
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
