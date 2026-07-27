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
import type { Invoice } from '@/types/invoice';

import { EmptyInvoices } from './empty-invoices';
import { InvoiceCard } from './invoice-card';

export type InvoicesListProps = {
  invoices: Invoice[];
  onInvoicePress?: (invoice: Invoice) => void;
  onInvoiceLongPress?: (invoice: Invoice) => void;
  selectionMode?: boolean;
  selectedIds?: ReadonlySet<string>;
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
  selectionMode = false,
  selectedIds,
  onRefresh,
  onEndReached,
  onInvoicePress,
  onInvoiceLongPress,
  contentContainerStyle,
  testID,
}: InvoicesListProps) {
  const styles = useStyles();
  const colors = useColors();
  const renderItem: ListRenderItem<Invoice> = ({ item, index }) => (
    <View>
      <InvoiceCard
        index={index}
        invoice={item}
        onLongPress={onInvoiceLongPress}
        onPress={onInvoicePress}
        selected={selectedIds?.has(item.id) ?? false}
        selectionMode={selectionMode}
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
    return <DocumentListSkeleton />;
  }

  return (
    <FlatList
      contentContainerStyle={[
        invoices.length === 0 ? styles.emptyContent : styles.listContent,
        contentContainerStyle,
      ]}
      data={invoices}
      extraData={selectionMode ? selectedIds : undefined}
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
      marginLeft: spacing.md,
    },
  }));
}
