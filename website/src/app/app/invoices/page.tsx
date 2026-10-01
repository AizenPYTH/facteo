'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { DocumentComposer, InvoiceEditor } from '@/components/app/document-composer';
import { InvoicesWorkspace } from '@/components/app/document-workspace';
import { InvoiceBatch } from '@/components/app/invoice-batch';
import { LoadingState } from '@/components/app/ui';

function InvoicesPageInner() {
  const searchParams = useSearchParams();
  const isCreating = searchParams.get('create') === '1';

  if (isCreating) {
    return <DocumentComposer kind="invoice" />;
  }

  const editId = searchParams.get('edit');
  if (editId) {
    return <InvoiceEditor invoiceId={editId} />;
  }

  if (searchParams.get('batch') === '1') {
    return <InvoiceBatch />;
  }

  return <InvoicesWorkspace />;
}

export default function InvoicesPage() {
  return (
    <Suspense fallback={<LoadingState message="Chargement des factures…" />}>
      <InvoicesPageInner />
    </Suspense>
  );
}
