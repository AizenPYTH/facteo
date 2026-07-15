'use client';

import Link from 'next/link';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useEffect, useState } from 'react';

import { AppTopBar } from '@/components/app/app-shell';
import { FormActions, PrimaryButton } from '@/components/app/form-fields';
import { Badge, LoadingState, Panel } from '@/components/app/ui';
import { useSettings } from '@/hooks/use-settings';
import { PDF_TEMPLATES } from '@/lib/pdf/engine/templates';
import { updateDocumentTemplates } from '@/lib/supabase/settings';
import { settingsQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { useTenant } from '@/providers/company-provider';
import { cn } from '@/lib/utils';

export default function TemplatesSettingsPage() {
  const { scope } = useTenant();
  const { formValues, loading } = useSettings();
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
    },
  });

  if (loading) {
    return <LoadingState message="Chargement des modèles…" />;
  }

  return (
    <>
      <AppTopBar subtitle="Personnalisez l’apparence de vos documents PDF" title="Modèles PDF">
        <Link className="text-sm font-medium text-primary hover:underline" href="/app/settings">
          ← Paramètres
        </Link>
      </AppTopBar>
      <div className="flex-1 overflow-y-auto p-6 xl:p-8">
        <div className="mx-auto max-w-5xl space-y-8">
          <Panel title="Modèle devis">
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PDF_TEMPLATES.map((template) => (
                <button
                  className={cn(
                    'rounded-xl border p-4 text-left transition',
                    quoteTemplateId === template.id
                      ? 'border-primary bg-blue-50/50 ring-2 ring-primary/20'
                      : 'border-slate-200 hover:border-primary/30',
                  )}
                  key={template.id}
                  onClick={() => setQuoteTemplateId(template.id)}
                  type="button">
                  <div
                    className="mb-3 h-2 rounded-full"
                    style={{ backgroundColor: template.theme.primary }}
                  />
                  <p className="font-semibold text-slate-900">{template.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{template.description}</p>
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
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {PDF_TEMPLATES.map((template) => (
                <button
                  className={cn(
                    'rounded-xl border p-4 text-left transition',
                    invoiceTemplateId === template.id
                      ? 'border-primary bg-blue-50/50 ring-2 ring-primary/20'
                      : 'border-slate-200 hover:border-primary/30',
                  )}
                  key={`inv-${template.id}`}
                  onClick={() => setInvoiceTemplateId(template.id)}
                  type="button">
                  <div
                    className="mb-3 h-2 rounded-full"
                    style={{ backgroundColor: template.theme.primary }}
                  />
                  <p className="font-semibold text-slate-900">{template.name}</p>
                  <p className="mt-1 text-xs text-slate-500">{template.description}</p>
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
            <PrimaryButton loading={mutation.isPending} onClick={() => mutation.mutate()} type="button">
              Enregistrer les modèles
            </PrimaryButton>
          </FormActions>
        </div>
      </div>
    </>
  );
}
