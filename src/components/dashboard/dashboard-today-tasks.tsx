import { router, type Href } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { SectionHeader } from '@/components/dashboard/section-header';
import { useColors, useThemedStyles } from '@/hooks/use-colors';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { formatCurrency } from '@/lib/format/currency';
import type { Invoice } from '@/types/dashboard';

type DashboardTodayTasksProps = {
  invoices: Invoice[];
};

type Task = {
  id: string;
  title: string;
  meta: string;
  href: Href;
};

export function DashboardTodayTasks({ invoices }: DashboardTodayTasksProps) {
  const styles = useStyles();
  const tasks: Task[] = [];

  for (const invoice of invoices) {
    if (invoice.status === 'overdue') {
      tasks.push({
        id: `overdue-${invoice.id}`,
        title: `Relancer ${invoice.clientName}`,
        meta: `${invoice.number} · ${formatCurrency(invoice.amount)} · en retard`,
        href: `/invoices/${invoice.id}` as Href,
      });
    } else if (invoice.status === 'draft') {
      tasks.push({
        id: `draft-${invoice.id}`,
        title: `Reprendre ${invoice.number}`,
        meta: `${invoice.clientName} · brouillon`,
        href: `/invoices/${invoice.id}/edit` as Href,
      });
    } else if (invoice.status === 'sent' || invoice.status === 'partially_paid') {
      tasks.push({
        id: `pay-${invoice.id}`,
        title: `Suivre ${invoice.number}`,
        meta: `${invoice.clientName} · ${formatCurrency(invoice.amount)}`,
        href: `/invoices/${invoice.id}` as Href,
      });
    }
  }

  const visible = tasks.slice(0, 5);

  if (visible.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionHeader title="À traiter aujourd’hui" />
      <View style={styles.card}>
        {visible.map((task, index) => (
          <Pressable
            accessibilityRole="button"
            key={task.id}
            onPress={() => router.push(task.href)}
            style={[styles.row, index > 0 ? styles.rowBorder : null]}>
            <View style={styles.body}>
              <Text style={styles.title}>{task.title}</Text>
              <Text style={styles.meta}>{task.meta}</Text>
            </View>
            <Text style={styles.chevron}>›</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

function useStyles() {
  return useThemedStyles((colors) => ({
    section: {
      gap: spacing.md,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.card,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: colors.border,
      overflow: 'hidden',
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      minHeight: 52,
    },
    rowBorder: {
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.separator,
    },
    body: {
      flex: 1,
      gap: 2,
    },
    title: {
      ...typography.subheadlineMedium,
      color: colors.text,
    },
    meta: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    chevron: {
      ...typography.title3,
      color: colors.textTertiary,
      marginLeft: spacing.sm,
    },
  }));
}
