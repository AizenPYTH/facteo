'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { FormActions, PrimaryButton } from '@/components/app/form-fields';
import { Badge, LoadingState, Panel } from '@/components/app/ui';
import { useSettings } from '@/hooks/use-settings';
import { useSubscription } from '@/hooks/use-subscription';
import { PDF_TEMPLATES } from '@/lib/pdf/engine/templates';
import { updateDocumentTemplates } from '@/lib/supabase/settings';
import { settingsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { useTenant } from '@/providers/company-provider';
import { useToast } from '@/providers/toast-provider';
import { toUserFacingError } from '@/lib/errors/messages';
import { cn } from '@/lib/utils';

export default function TemplatesSettingsPage() {
  const { scope } = useTenant();
  const { formValues, loading } = useSettings();
  const { hasFeature } = useSubscription();
  const { showSuccess, showError } = useToast();
  const templatesLocked = !hasFeature('pdf_templates');
  const queryClient = useQueryClient();
  const [quoteTemplateId, setQuoteTemplateId] = useState(formValues.quoteTemplateId);
  const [invoiceTemplateId, setInvoiceTemplateId] = useState(formValues.invoiceTemplateId);

  useEffect(() => {
    setQuoteTemplateId(formValues.quoteTemplateId);
    setInvoiceTemplateId(formValues.invoiceTemplateId);
  }, [formValues.quoteTemplateId, formValues.invoiceTemplateId]);

  const mutation = useMutation({
    mutationFn: () =>
      updateDocumentTemplates(requireScope(scope), { quoteTemplateId, invoiceTemplateId }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: settingsQueryKeys.all });
      showSuccess('Modèles PDF enregistrés.');
    },
    onError: (error) => showError(toUserFacingError(error.message)),
  });

  if (loading) {
    return <LoadingState message="Chargement des modèles…" />;
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-4 p-5 sm:p-6">
      {templatesLocked ? (
        <Panel title="Offre requise">
          <p className="text-[13px] text-app-text-2">
            Les modèles PDF sont disponibles à partir de l’offre Basique. Passez à une offre
            supérieure pour personnaliser vos documents.
          </p>
          <Link
            className="mt-3 inline-block text-[13px] font-semibold text-app-accent hover:underline"
            href="/app/settings/subscription">
            Voir les offres et payer
          </Link>
        </Panel>
      ) : null}

      <Panel title="Modèle devis">
        <div className={cn('grid gap-3 sm:grid-cols-2', templatesLocked && 'pointer-events-none opacity-50')}>
          {PDF_TEMPLATES.map((template) => (
            <button
              className={cn(
                'rounded-[12px] border p-4 text-left transition-colors duration-150',
                quoteTemplateId === template.id
                  ? 'border-app-accent bg-app-accent-tint/60'
                  : 'border-app-border hover:border-app-accent-border',
              )}
              disabled={templatesLocked}
              key={template.id}
              onClick={() => setQuoteTemplateId(template.id)}
              type="button">
              <div
                className="mb-3 h-2 rounded-full"
                style={{ backgroundColor: template.theme.primary }}
              />
              <p className="font-semibold text-app-text">{template.name}</p>
              <p className="mt-1 text-[12px] text-app-muted">{template.description}</p>
              {quoteTemplateId === template.id ? (
                <Badge className="mt-3" variant="info">
                  Sélectionné
                </Badge>
              ) : null}
            </button>
          ))}
        </div>
      </Panel>

      <Panel title="Modèle facture">
        <div className={cn('grid gap-3 sm:grid-cols-2', templatesLocked && 'pointer-events-none opacity-50')}>
          {PDF_TEMPLATES.map((template) => (
            <button
              className={cn(
                'rounded-[12px] border p-4 text-left transition-colors duration-150',
                invoiceTemplateId === template.id
                  ? 'border-app-accent bg-app-accent-tint/60'
                  : 'border-app-border hover:border-app-accent-border',
              )}
              disabled={templatesLocked}
              key={`inv-${template.id}`}
              onClick={() => setInvoiceTemplateId(template.id)}
              type="button">
              <div
                className="mb-3 h-2 rounded-full"
                style={{ backgroundColor: template.theme.primary }}
              />
              <p className="font-semibold text-app-text">{template.name}</p>
              <p className="mt-1 text-[12px] text-app-muted">{template.description}</p>
              {invoiceTemplateId === template.id ? (
                <Badge className="mt-3" variant="info">
                  Sélectionné
                </Badge>
              ) : null}
            </button>
          ))}
        </div>
      </Panel>

      <FormActions>
        <PrimaryButton
          disabled={templatesLocked}
          loading={mutation.isPending}
          onClick={() => mutation.mutate()}
          type="button">
          Enregistrer
        </PrimaryButton>
      </FormActions>
    </div>
  );
}
