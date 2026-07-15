'use client';

import Link from 'next/link';

import { AppTopBar } from '@/components/app/app-shell';
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
    <>
      <AppTopBar subtitle="Activité récente sur votre compte" title="Historique">
        <Link className="text-sm font-medium text-primary hover:underline" href="/app/settings">
          ← Paramètres
        </Link>
      </AppTopBar>
      <div className="flex-1 overflow-y-auto p-6 xl:p-8">
        <div className="mx-auto max-w-5xl">
          <Panel title="Dernières actions">
            <DataTable
              columns={[
                { key: 'label', label: 'Action' },
                { key: 'type', label: 'Type' },
                { key: 'date', label: 'Date' },
                { key: 'amount', label: 'Montant' },
              ]}
              emptyMessage="Aucune activité enregistrée pour le moment."
              rows={activity.map((item) => ({
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
      </div>
    </>
  );
}
