'use client';

import Link from 'next/link';
import { useMemo } from 'react';

import { AppTopBar } from '@/components/app/app-shell';
import { Badge, DataTable, LoadingState } from '@/components/app/ui';
import { useInfiniteInvoices } from '@/hooks/use-invoices';
import { formatCurrency } from '@/lib/domain/format/currency';
import { formatDate } from '@/lib/domain/format/date';

export default function PaymentsPage() {
  const query = useInfiniteInvoices('', 'paid');

  const invoices = useMemo(
    () => query.data?.pages.flatMap((page) => page.invoices) ?? [],
    [query.data],
  );

  if (query.isLoading) {
    return <LoadingState message="Chargement des paiements…" />;
  }

  return (
    <>
      <AppTopBar subtitle={`${invoices.length} paiement(s) enregistré(s)`} title="Paiements" />

      <div className="flex-1 overflow-y-auto p-8">
        <DataTable
          columns={[
            { key: 'number', label: 'Facture' },
            { key: 'client', label: 'Client' },
            { key: 'date', label: 'Date' },
            { key: 'amount', label: 'Montant' },
            { key: 'status', label: 'Statut' },
          ]}
          emptyMessage="Aucun paiement enregistré."
          rows={invoices.map((invoice) => ({
            number: (
              <Link
                className="font-medium text-slate-900 hover:text-primary"
                href={`/app/invoices?selected=${invoice.id}`}>
                {invoice.number}
              </Link>
            ),
            client: invoice.clientName,
            date: formatDate(invoice.issuedAt),
            amount: formatCurrency(invoice.totalTtc),
            status: <Badge variant="success">Payée</Badge>,
          }))}
        />
      </div>
    </>
  );
}
