'use client';

import { useQuery } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

import { PdfFitPreview } from '@/components/app/pdf-fit-preview';
import { useSettings } from '@/hooks/use-settings';
import { buildDraftPdfHtml, type DraftDocumentInput } from '@/lib/domain/pdf/draft-pdf';
import { requireScope } from '@/lib/domain/tenant/scope';
import { cn } from '@/lib/utils';
import { useTenant } from '@/providers/company-provider';
import type { DataScope } from '@/types/tenant';

/**
 * Retarde la prise en compte d'une valeur, en se réglant sur une signature
 * plutôt que sur la valeur elle-même.
 *
 * La version précédente prenait `draft` en dépendance d'effet. Or le composeur
 * reconstruit cet objet à chaque rendu : la dépendance changeait d'identité en
 * permanence, l'effet se réarmait, publiait 280 ms plus tard un objet neuf,
 * déclenchait un rendu — qui reconstruisait l'objet. La colonne d'aperçu se
 * rendait ainsi indéfiniment, quatre fois par seconde, sans qu'aucune donnée
 * n'ait changé.
 *
 * La signature est une chaîne : à contenu identique elle est identique, et le
 * cycle s'arrête de lui-même.
 */
type DraftSnapshot = { draft: DraftDocumentInput; signature: string };

function useDebouncedDraft(
  draft: DraftDocumentInput,
  signature: string,
  delay = 280,
): DraftSnapshot {
  const [snapshot, setSnapshot] = useState<DraftSnapshot>(() => ({ draft, signature }));
  const latest = useRef<DraftSnapshot>({ draft, signature });

  // Écrire dans une ref pendant le rendu est interdit par le compilateur React :
  // la synchronisation passe par un effet, qui s'exécute bien avant l'échéance.
  useEffect(() => {
    latest.current = { draft, signature };
  }, [draft, signature]);

  // Seule la signature arme le minuteur. Le brouillon voyage avec elle dans le
  // même objet, ce qui garantit que la clé de cache et le contenu envoyé au
  // générateur décrivent toujours le même document.
  useEffect(() => {
    const timer = setTimeout(() => setSnapshot(latest.current), delay);
    return () => clearTimeout(timer);
  }, [signature, delay]);

  return snapshot;
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
  const { activeCompany } = useTenant();
  const { settings } = useSettings();

  const companyAssetsKey = `${activeCompany?.logoUrl ?? ''}|${activeCompany?.signatureUrl ?? ''}`;
  const settingsKey = settings
    ? `${settings.invoiceTemplateId}|${settings.quoteTemplateId}|${settings.updatedAt ?? ''}`
    : '';

  /**
   * Tout ce dont dépend le rendu du PDF, et rien d'autre.
   *
   * `discountPercent` y figure désormais : la remise est reprise dans le
   * document mais était absente de la clé, si bien que la modifier laissait
   * l'aperçu inchangé.
   */
  const draftSignature = [
    scope?.companyId ?? '',
    draft.kind,
    draft.templateId,
    draft.clientId,
    draft.notes,
    companyAssetsKey,
    settingsKey,
    draft.lines
      .map(
        (line) =>
          `${line.description}|${line.quantity}|${line.unitPrice}|${line.vatRate}|${line.unit}|${line.discountPercent}`,
      )
      .join(';'),
  ].join('~');

  const debounced = useDebouncedDraft(draft, draftSignature);

  const query = useQuery({
    queryKey: ['composer-preview', debounced.signature],
    queryFn: () => buildDraftPdfHtml(requireScope(scope!), debounced.draft, userEmail),
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
