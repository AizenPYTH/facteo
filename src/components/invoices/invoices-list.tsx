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

import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import type { Invoice } from '@/types/invoice';
import type { InvoiceStatusFilter } from '@/types/invoices-list';

import { EmptyInvoices } from './empty-invoices';
import { InvoiceCard } from './invoice-card';

export type InvoicesListProps = {
  invoices: Invoice[];
  onInvoicePress?: (invoice: Invoice) => void;
  isInitialLoading?: boolean;
  isRefreshing?: boolean;
  isFetchingNextPage?: boolean;
  isSearching?: boolean;
  statusFilter?: InvoiceStatusFilter;
  showCreateAction?: boolean;
  onRefresh?: () => void;
  onEndReached?: () => void;
  contentContainerStyle?: ViewStyle;
  selectedId?: string | null;
  testID?: string;
};

export function InvoicesList({
  invoices,
  isInitialLoading = false,
  isRefreshing = false,
  isFetchingNextPage = false,
  isSearching = false,
  statusFilter = 'all',
  showCreateAction = true,
  onRefresh,
  onEndReached,
  onInvoicePress,
  contentContainerStyle,
  selectedId,
  testID,
}: InvoicesListProps) {
  const styles = useStyles();
  const colors = useColors();
  const renderItem: ListRenderItem<Invoice> = ({ item, index }) => (
    <View>
      <InvoiceCard
        invoice={item}
        onPress={onInvoicePress}
        selected={item.id === selectedId}
      />
      {index < invoices.length - 1 ? <View style={styles.separator} /> : null}
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
        <Text style={styles.loadingText}>Chargement des factures...</Text>
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
        <EmptyInvoices
          isSearching={isSearching}
          showCreateAction={showCreateAction}
          statusFilter={statusFilter}
        />
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
  return useThemedStyles((colors) => ({
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
}));
}
