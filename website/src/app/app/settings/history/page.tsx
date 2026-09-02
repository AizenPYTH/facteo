'use client';

import { Badge, DataTable, LoadingState, Panel } from '@/components/app/ui';
import { useDashboard } from '@/hooks/use-dashboard';
import { formatDate } from '@/lib/domain/format/date';

export default function HistorySettingsPage() {
  const { extended, loading } = useDashboard();

  if (loading) {
    return <LoadingState message="Chargement de l’historique…" />;
  }

  const activity = extended.recentActivity;

  return (
    <div className="mx-auto max-w-[720px] p-5 sm:p-6">
      <Panel title="Dernières actions">
        <DataTable
          columns={[
            { key: 'label', label: 'Action' },
            { key: 'type', label: 'Type' },
            { key: 'date', label: 'Date' },
            { key: 'amount', label: 'Montant', align: 'right' },
          ]}
          emptyMessage="Aucune activité enregistrée pour le moment."
          rows={activity.map((item) => ({
            id: item.date + item.label,
            label: item.label,
            type: (
              <Badge variant={item.type === 'invoice' ? 'info' : 'default'}>
                {item.type === 'invoice' ? 'Facture' : 'Devis'}
              </Badge>
            ),
            date: formatDate(item.date),
            amount: '—',
          }))}
        />
      </Panel>
    </div>
  );
}
