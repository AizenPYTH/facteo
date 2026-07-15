'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

import { DocumentComposer } from '@/components/app/document-composer';
import { QuotesWorkspace } from '@/components/app/document-workspace';
import { LoadingState } from '@/components/app/ui';

function QuotesPageInner() {
  const searchParams = useSearchParams();
  const isCreating = searchParams.get('create') === '1';

  if (isCreating) {
    return <DocumentComposer kind="quote" />;
  }

  return <QuotesWorkspace />;
}

export default function QuotesPage() {
  return (
    <Suspense fallback={<LoadingState message="Chargement des devis…" />}>
      <QuotesPageInner />
    </Suspense>
  );
}
