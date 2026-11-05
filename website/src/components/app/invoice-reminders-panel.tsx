'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BellRing } from 'lucide-react';
import Link from 'next/link';

import { SecondaryButton } from '@/components/app/form-fields';
import { formatCurrency } from '@/lib/domain/format/currency';
import { formatDate } from '@/lib/domain/format/date';
import { formatDateTime } from '@/lib/domain/format/datetime';
import { NEXT_REMINDER_REASONS, REMINDER_STAGE_LABELS } from '@/lib/domain/reminders/templates';
import {
  fetchInvoiceReminders,
  fetchInvoiceRemindersEnabled,
  fetchNextReminder,
  sendManualReminder,
  setInvoiceRemindersEnabled,
} from '@/lib/domain/supabase/reminders';
import { useToast } from '@/providers/toast-provider';

/** Relances d'une facture : prochaine relance, relance manuelle, historique. */
export function InvoiceRemindersPanel({ invoiceId, status }: { invoiceId: string; status: string }) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();

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

  return (
    <div className="border-b border-app-border-soft px-5 py-4">
      <div className="mb-2.5 flex items-center justify-between gap-2">
        <p className="text-[11px] font-bold uppercase tracking-[0.1em] text-app-faint">Relances</p>
        <Link className="text-[12px] text-app-accent hover:underline" href="/app/settings/reminders">
          Réglages
        </Link>
      </div>

      <p className="text-[12.5px] text-app-text-3">
        {next?.stage && next.date
          ? `Prochaine relance : ${REMINDER_STAGE_LABELS[next.stage].toLowerCase()}, le ${formatDate(next.date)}.`
          : next?.reason
            ? (NEXT_REMINDER_REASONS[next.reason] ?? '')
            : ''}
      </p>

      {relaunchable ? (
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <SecondaryButton disabled={sendMutation.isPending} onClick={() => sendMutation.mutate()}>
            <BellRing size={15} />
            {sendMutation.isPending ? 'Envoi…' : 'Relancer maintenant'}
          </SecondaryButton>
          <label className="flex cursor-pointer items-center gap-2 text-[12.5px] text-app-text-3">
            <input
              checked={enabledQuery.data !== false}
              className="h-[14px] w-[14px] [accent-color:var(--app-accent)]"
              disabled={toggleMutation.isPending}
              onChange={(event) => toggleMutation.mutate(event.target.checked)}
              type="checkbox"
            />
            Relances automatiques pour cette facture
          </label>
        </div>
      ) : null}

      {history.length > 0 ? (
        <ul className="mt-3 space-y-1.5">
          {history.map((reminder) => (
            <li key={reminder.id} className="text-[12px]">
              <span className={reminder.status === 'failed' ? 'text-app-danger-text' : 'text-app-text-3'}>
                {REMINDER_STAGE_LABELS[reminder.stage]} ·{' '}
                {reminder.status === 'sent' ? 'envoyée' : reminder.status === 'pending' ? 'en cours' : 'non envoyée'} le{' '}
                {formatDateTime(reminder.sentAt ?? reminder.createdAt)}
                {reminder.amountDue !== null ? ` · ${formatCurrency(reminder.amountDue)} dus` : ''}
              </span>
              {reminder.status === 'failed' && reminder.error ? (
                <span className="block text-app-faint">{reminder.error}</span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
