import { router, type Href } from 'expo-router';
import type { ComponentProps } from 'react';
import { SymbolView } from 'expo-symbols';
import { View } from 'react-native';

import { SectionHeader } from '@/components/dashboard/section-header';
import { Badge, type BadgeTone } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { ListRow, ListRowSeparator } from '@/components/ui/list-row';
import { spacing } from '@/constants/theme/spacing';
import { useThemedStyles } from '@/hooks/use-colors';
import { formatCurrency } from '@/lib/format/currency';
import type { Invoice } from '@/types/dashboard';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

type DashboardTodayTasksProps = {
  invoices: Invoice[];
};

type Task = {
  id: string;
  title: string;
  meta: string;
  icon: SymbolName;
  tone: BadgeTone;
  badge: string;
  href: Href;
};

const MAX_TASKS = 5;

/**
 * Ce que l'utilisateur doit faire aujourd'hui, ordonné par urgence : les
 * retards d'abord, les brouillons ensuite, le suivi en dernier. L'ordre
 * précédent suivait celui des factures récentes, donc rien de particulier.
 */
function buildTasks(invoices: Invoice[]): Task[] {
  const overdue: Task[] = [];
  const drafts: Task[] = [];
  const tracking: Task[] = [];

  for (const invoice of invoices) {
    if (invoice.status === 'overdue') {
      overdue.push({
        id: `overdue-${invoice.id}`,
        title: `Relancer ${invoice.clientName}`,
        meta: `${invoice.number} · ${formatCurrency(invoice.amount)}`,
        icon: { ios: 'exclamationmark.circle.fill', android: 'error', web: 'error' },
        tone: 'warning',
        badge: 'En retard',
        href: `/invoices/${invoice.id}` as Href,
      });
    } else if (invoice.status === 'draft') {
      drafts.push({
        id: `draft-${invoice.id}`,
        title: `Reprendre ${invoice.number}`,
        meta: invoice.clientName,
        icon: { ios: 'square.and.pencil', android: 'edit', web: 'edit' },
        tone: 'neutral',
        badge: 'Brouillon',
        href: `/invoices/${invoice.id}/edit` as Href,
      });
    } else if (invoice.status === 'sent' || invoice.status === 'partially_paid') {
      tracking.push({
        id: `pay-${invoice.id}`,
        title: `Suivre ${invoice.number}`,
        meta: `${invoice.clientName} · ${formatCurrency(invoice.amount)}`,
        icon: { ios: 'paperplane', android: 'send', web: 'send' },
        tone: invoice.status === 'partially_paid' ? 'info' : 'primary',
        badge: invoice.status === 'partially_paid' ? 'Partiel' : 'Envoyée',
        href: `/invoices/${invoice.id}` as Href,
      });
    }
  }

  return [...overdue, ...drafts, ...tracking].slice(0, MAX_TASKS);
}

export function DashboardTodayTasks({ invoices }: DashboardTodayTasksProps) {
  const styles = useStyles();
  const tasks = buildTasks(invoices);

  if (tasks.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionHeader title="À traiter aujourd’hui" />
      <Card flush variant="surface">
        {tasks.map((task, index) => (
          <View key={task.id}>
            {index > 0 ? <ListRowSeparator /> : null}
            <ListRow
              accessibilityHint="Ouvre le document"
              icon={task.icon}
              onPress={() => router.push(task.href)}
              subtitle={task.meta}
              title={task.title}
              trailing={<Badge label={task.badge} size="sm" tone={task.tone} />}
            />
          </View>
        ))}
      </Card>
    </View>
  );
}

function useStyles() {
  return useThemedStyles(() => ({
    section: {
      gap: spacing.md,
    },
  }));
}
