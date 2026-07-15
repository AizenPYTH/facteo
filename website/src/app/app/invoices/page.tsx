'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { DocumentComposer } from '@/components/app/document-composer';
import { InvoicesWorkspace } from '@/components/app/document-workspace';
import { LoadingState } from '@/components/app/ui';

function InvoicesPageInner() {
  const searchParams = useSearchParams();
  const isCreating = searchParams.get('create') === '1';

  if (isCreating) {
    return <DocumentComposer kind="invoice" />;
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
