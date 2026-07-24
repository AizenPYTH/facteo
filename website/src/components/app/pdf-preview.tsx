'use client';

import { useQuery } from '@tanstack/react-query';

import { PdfFitPreview } from '@/components/app/pdf-fit-preview';
import { ErrorState } from '@/components/app/empty-state';
import { useAuth } from '@/providers/auth-provider';
import { useTenant } from '@/providers/company-provider';
import { buildInvoicePdfHtml, buildQuotePdfHtml } from '@/lib/domain/pdf/document-pdf';
import { requireScope } from '@/lib/domain/tenant/scope';
import type { InvoiceDetail } from '@inveq/types/invoice';
import type { QuoteDetail } from '@inveq/types/quote';

export function PdfPreviewPanel({
  kind,
  document,
  templateId,
}: {
  kind: 'invoice' | 'quote';
  document: InvoiceDetail | QuoteDetail | null | undefined;
  templateId?: string | null;
}) {
  const { user } = useAuth();
  const { scope, activeCompany } = useTenant();

  const companyAssetsKey = `${activeCompany?.logoUrl ?? ''}|${activeCompany?.signatureUrl ?? ''}|${activeCompany?.updatedAt ?? ''}`;

  const query = useQuery({
    queryKey: [
      'pdf-preview',
      kind,
      scope?.companyId,
      document?.id,
      document?.updatedAt,
      templateId ?? 'default',
      companyAssetsKey,
    ],
    queryFn: async () => {
      const activeScope = requireScope(scope);
      if (kind === 'invoice') {
        return buildInvoicePdfHtml(
          activeScope,
          document as InvoiceDetail,
          user?.email,
          templateId ?? undefined,
        );
      }
      return buildQuotePdfHtml(
        activeScope,
        document as QuoteDetail,
        user?.email,
        templateId ?? undefined,
      );
    },
    enabled: Boolean(document && scope?.companyId),
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });

  if (!document) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 text-sm text-slate-500">
        Sélectionnez un document pour afficher l&apos;aperçu.
      </div>
    );
  }

  if (query.error && !query.data) {
    return (
      <div className="flex h-full items-center justify-center p-8">
        <ErrorState
          description="Impossible de générer l'aperçu PDF."
          onRetry={() => void query.refetch()}
        />
      </div>
    );
  }

  return (
    <PdfFitPreview
      className="h-full"
      error={query.error}
      html={query.data}
      isLoading={query.isLoading && !query.data}
      isUpdating={query.isFetching && !query.isLoading}
      onRetry={() => void query.refetch()}
      title={`Aperçu ${document.number}`}
    />
  );
}
