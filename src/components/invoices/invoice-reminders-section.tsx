import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { router, type Href } from 'expo-router';
import { Pressable, Switch, Text, View } from 'react-native';

import { SectionHeader } from '@/components/dashboard/section-header';
import { Button } from '@/components/ui/button';
import { radius } from '@/constants/theme/radius';
import { spacing } from '@/constants/theme/spacing';
import { typography } from '@/constants/theme/typography';
import { useThemedStyles } from '@/hooks/use-colors';
import { formatCurrency } from '@/lib/format/currency';
import { formatDate } from '@/lib/format/date';
import { formatDateTime } from '@/lib/format/datetime';
import { NEXT_REMINDER_REASONS, REMINDER_STAGE_LABELS } from '@/lib/reminders/templates';
import {
  fetchInvoiceReminders,
  fetchInvoiceRemindersEnabled,
  fetchNextReminder,
  sendManualReminder,
  setInvoiceRemindersEnabled,
} from '@/lib/supabase/reminders';
import { useToast } from '@/providers/toast-provider';

/** Relances d'une facture : prochaine relance, relance manuelle, historique. */
export function InvoiceRemindersSection({ invoiceId, status }: { invoiceId: string; status: string }) {
  const styles = useStyles();
  const queryClient = useQueryClient();
  const { showError, showSuccess } = useToast();

  const historyQuery = useQuery({
    queryKey: ['invoice-reminders', invoiceId],
    queryFn: () => fetchInvoiceReminders(invoiceId),
  });
  const nextQuery = useQuery({
    queryKey: ['invoice-next-reminder', invoiceId, status],
    queryFn: () => fetchNextReminder(invoiceId),
  });
  const enabledQuery = useQuery({
    queryKey: ['invoice-reminders-enabled', invoiceId],
    queryFn: () => fetchInvoiceRemindersEnabled(invoiceId),
  });

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: ['invoice-reminders', invoiceId] });
    void queryClient.invalidateQueries({ queryKey: ['invoice-next-reminder', invoiceId] });
    void queryClient.invalidateQueries({ queryKey: ['invoice-reminders-enabled', invoiceId] });
  };

  const sendMutation = useMutation({
    mutationFn: () => sendManualReminder(invoiceId),
    onSuccess: () => {
      refresh();
      showSuccess('Relance envoyée au client.');
    },
    onError: (error) => {
      refresh();
      showError(error instanceof Error ? error.message : 'Échec.');
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (enabled: boolean) => setInvoiceRemindersEnabled(invoiceId, enabled),
    onSuccess: refresh,
    onError: (error) => showError(error instanceof Error ? error.message : 'Échec.'),
  });

  const relaunchable = ['sent', 'overdue', 'partially_paid'].includes(status);
  const next = nextQuery.data;
  const history = historyQuery.data ?? [];

  if (!relaunchable && history.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionHeader title="Relances" />
      <View style={styles.card}>
        <Text style={styles.body}>
          {next?.stage && next.date
            ? `Prochaine relance : ${REMINDER_STAGE_LABELS[next.stage].toLowerCase()}, le ${formatDate(next.date)}.`
            : next?.reason
              ? (NEXT_REMINDER_REASONS[next.reason] ?? '')
              : ''}
        </Text>

        {relaunchable ? (
          <>
            <Button loading={sendMutation.isPending} onPress={() => sendMutation.mutate()} title="Relancer maintenant" />
            <View style={styles.row}>
              <Text style={styles.label}>Relances automatiques pour cette facture</Text>
              <Switch
                accessibilityLabel="Relances automatiques pour cette facture"
                disabled={toggleMutation.isPending}
                onValueChange={(value) => toggleMutation.mutate(value)}
                value={enabledQuery.data !== false}
              />
            </View>
          </>
        ) : null}

        {history.map((reminder) => (
          <View key={reminder.id} style={styles.historyRow}>
            <Text style={[styles.meta, reminder.status === 'failed' && styles.failed]}>
              {REMINDER_STAGE_LABELS[reminder.stage]} ·{' '}
              {reminder.status === 'sent' ? 'envoyée' : reminder.status === 'pending' ? 'en cours' : 'non envoyée'} le{' '}
              {formatDateTime(reminder.sentAt ?? reminder.createdAt)}
              {reminder.amountDue !== null ? ` · ${formatCurrency(reminder.amountDue)} dus` : ''}
            </Text>
            {reminder.status === 'failed' && reminder.error ? <Text style={styles.meta}>{reminder.error}</Text> : null}
          </View>
        ))}

        <Pressable accessibilityRole="link" onPress={() => router.push('/settings/reminders' as Href)}>
          <Text style={styles.link}>Réglages des relances</Text>
        </Pressable>
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
      borderWidth: 1,
      borderColor: colors.border,
      padding: spacing.md,
      gap: spacing.sm,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.md,
    },
    label: {
      ...typography.footnote,
      color: colors.text,
      flex: 1,
    },
    body: {
      ...typography.footnote,
      color: colors.textSecondary,
    },
    meta: {
      ...typography.caption1,
      color: colors.textSecondary,
    },
    failed: {
      color: colors.error,
    },
    historyRow: {
      gap: 2,
    },
    link: {
      ...typography.footnote,
      color: colors.primary,
      paddingVertical: spacing.xs,
    },
  }));
}
