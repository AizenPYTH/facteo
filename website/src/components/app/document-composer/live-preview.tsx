'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { PdfFitPreview } from '@/components/app/pdf-fit-preview';
import { useSettings } from '@/hooks/use-settings';
import { buildDraftPdfHtml, type DraftDocumentInput } from '@/lib/domain/pdf/draft-pdf';
import { requireScope } from '@/lib/domain/tenant/scope';
import { cn } from '@/lib/utils';
import { useTenant } from '@/providers/company-provider';
import type { DataScope } from '@/types/tenant';

function useDebouncedValue<T>(value: T, delay = 300): T {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}

export function ComposerLivePreview({
  className,
  draft,
  scope,
  showToolbar = true,
  userEmail,
}: {
  className?: string;
  draft: DraftDocumentInput;
  scope: DataScope | null;
  showToolbar?: boolean;
  userEmail?: string | null;
}) {
  const debouncedDraft = useDebouncedValue(draft, 280);
  const { activeCompany } = useTenant();
  const { settings } = useSettings();

  const companyAssetsKey = `${activeCompany?.logoUrl ?? ''}|${activeCompany?.signatureUrl ?? ''}`;
  const settingsKey = settings
    ? `${settings.invoiceTemplateId}|${settings.quoteTemplateId}|${settings.updatedAt ?? ''}`
    : '';

  const query = useQuery({
    queryKey: [
      'composer-preview',
      scope?.companyId,
      debouncedDraft.kind,
      debouncedDraft.templateId,
      debouncedDraft.clientId,
      debouncedDraft.notes,
      companyAssetsKey,
      settingsKey,
      debouncedDraft.lines
        .map((l) => `${l.description}|${l.quantity}|${l.unitPrice}|${l.vatRate}|${l.unit}`)
        .join(';'),
    ],
    queryFn: () => buildDraftPdfHtml(requireScope(scope!), debouncedDraft, userEmail),
    enabled: Boolean(scope?.companyId),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });

  return (
    <PdfFitPreview
      className={cn('h-full', className)}
      error={query.error}
      html={query.data}
      isLoading={query.isLoading && !query.data}
      isUpdating={query.isFetching && !query.isLoading}
      onRetry={() => void query.refetch()}
      showToolbar={showToolbar}
      title="Aperçu document"
    />
  );
}
