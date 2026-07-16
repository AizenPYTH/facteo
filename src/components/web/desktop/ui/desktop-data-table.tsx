import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';

export type DesktopTableColumn<T> = {
  id: string;
  label: string;
  width?: number | string;
  flex?: number;
  align?: 'left' | 'center' | 'right';
  render: (item: T) => ReactNode;
};

type DesktopDataTableProps<T> = {
  columns: DesktopTableColumn<T>[];
  data: T[];
  keyExtractor: (item: T) => string;
  selectedKey?: string | null;
  onRowPress?: (item: T) => void;
  emptyMessage?: string;
};

export function DesktopDataTable<T>({
  columns,
  data,
  keyExtractor,
  selectedKey,
  onRowPress,
  emptyMessage = 'Aucun élément.',
}: DesktopDataTableProps<T>) {
  const styles = useStyles();

  return (
    <View style={styles.table}>
      <View style={styles.header}>
        {columns.map((column) => (
          <View
            key={column.id}
            style={[
              styles.headerCell,
              column.width != null && { width: column.width as number },
              column.flex != null && { flex: column.flex },
              column.align === 'right' && styles.alignRight,
              column.align === 'center' && styles.alignCenter,
            ]}>
            <Text style={styles.headerText}>{column.label}</Text>
          </View>
        ))}
      </View>

      <View style={styles.body}>
        {data.length === 0 ? (
          <Text style={styles.empty}>{emptyMessage}</Text>
        ) : (
          data.map((item) => {
            const key = keyExtractor(item);
            const selected = key === selectedKey;

            return (
              <Pressable
                key={key}
                onPress={() => onRowPress?.(item)}
                style={[styles.row, selected && styles.rowSelected]}>
                {columns.map((column) => (
                  <View
                    key={column.id}
                    style={[
                      styles.cell,
                      column.width != null && { width: column.width as number },
                      column.flex != null && { flex: column.flex },
                      column.align === 'right' && styles.alignRight,
                      column.align === 'center' && styles.alignCenter,
                    ]}>
                    {column.render(item)}
                  </View>
                ))}
              </Pressable>
            );
          })
        )}
      </View>
    </View>
  );
}

const useStyles = () =>
  useThemedStyles((colors) => ({
    table: {
      flex: 1,
      minHeight: 0,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      gap: spacing.sm,
      backgroundColor: colors.backgroundSecondary,
    },
    headerCell: {
      minWidth: 0,
    },
    headerText: {
      ...typography.caption1,
      color: colors.textTertiary,
      fontWeight: '600',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    body: {
      flex: 1,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      gap: spacing.sm,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
      cursor: 'pointer' as const,
    },
    rowSelected: {
      backgroundColor: colors.primarySubtle,
    },
    cell: {
      minWidth: 0,
    },
    alignRight: {
      alignItems: 'flex-end',
    },
    alignCenter: {
      alignItems: 'center',
    },
    empty: {
      ...typography.subheadline,
      color: colors.textSecondary,
      textAlign: 'center',
      padding: spacing.xl,
    },
  }));
