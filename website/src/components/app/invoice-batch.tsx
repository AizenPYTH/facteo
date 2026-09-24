'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Plus, Sparkles, Trash2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useRef, useState } from 'react';

import { AddressesPicker } from '@/components/app/document-composer/addresses-picker';
import { LegalIdsPicker } from '@/components/app/document-composer/legal-ids-picker';
import { StampPicker } from '@/components/app/document-composer/stamp-picker';
import {
  GhostButton,
  PrimaryButton,
  SecondaryButton,
  SelectInput,
  TextInput,
} from '@/components/app/form-fields';
import { LoadingState } from '@/components/app/ui';
import { useImagePaste } from '@/hooks/use-image-paste';
import { useSettings } from '@/hooks/use-settings';
import { calculateLineTotals } from '@/lib/calculations/totals';
import {
  analyzeInvoicesImage,
  toInvoiceLineValues,
  type AnalyzedInvoice,
} from '@/lib/domain/ai/invoices-image-analysis';
import { getClientDisplayName } from '@/lib/domain/clients/name';
import { formatCurrency } from '@/lib/domain/format/currency';
import { frenchDateInputToIso, todayDateInput } from '@/lib/domain/format/date-input';
import { COMPOSER_TEMPLATES, getDefaultComposerTemplateId } from '@/lib/domain/pdf/composer-templates';
import { createClient, fetchClientsPage } from '@/lib/domain/supabase/clients';
import { createInvoice } from '@/lib/domain/supabase/invoices';
import { clientsQueryKeys, invoicesQueryKeys } from '@/lib/domain/supabase/query-keys';
import { requireScope } from '@/lib/domain/tenant/scope';
import { cn } from '@/lib/utils';
import { useTenant } from '@/providers/company-provider';
import { useToast } from '@/providers/toast-provider';
import { createEmptyClientFormValues, type Client } from '@/types/client';
import { CLIENTS_PAGE_SIZE } from '@inveq/types/clients-list';
import { createLocalInvoiceLineId, type InvoiceLineValue } from '@inveq/types/invoice';
import {
  createEmptyInvoiceAddresses,
  INVOICE_TITLE_SUGGESTIONS,
  readRememberedLegalIds,
  type InvoiceAddresses,
  type IssuerLegalId,
  type StampColor,
  type StampPosition,
} from '@/types/pdf-options';

/** « Nouveau client » : créé à l'enregistrement avec le nom lu sur la capture. */
const NEW_CLIENT = '__new__';

type Draft = {
  key: string;
  detectedClient: string;
  clientAddress: string;
  clientChoice: string;
  issuedAt: string;
  paid: boolean;
  number: string;
  title: string;
  templateId: string;
  legalIds: IssuerLegalId[];
  stampColor: StampColor;
  stampPosition: StampPosition;
  addresses: InvoiceAddresses;
  lines: InvoiceLineValue[];
  error: string | null;
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

function matchClient(clients: Client[], name: string): string {
  const target = normalize(name);
  if (!target) return '';
  const found = clients.find((client) =>
    [getClientDisplayName(client), client.company ?? '', `${client.firstName} ${client.lastName}`, `${client.lastName} ${client.firstName}`]
      .map(normalize)
      .some((candidate) => candidate && candidate === target),
  );
  return found?.id ?? NEW_CLIENT;
}

function lineTotalTtc(line: InvoiceLineValue): number {
  const toNumber = (value: string) => Number(value.replace(',', '.')) || 0;
  return calculateLineTotals(
    toNumber(line.quantity),
    toNumber(line.unitPrice),
    toNumber(line.vatRate),
    toNumber(line.discountPercent),
  ).lineTotalTtc;
}

async function fileToBase64(file: File): Promise<string> {
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : '');
    reader.onerror = () => reject(new Error('Lecture de l’image impossible.'));
    reader.readAsDataURL(file);
  });
  const [, encoded = ''] = dataUrl.split(',');
  if (!encoded) throw new Error('Image invalide.');
  return encoded;
}

/**
 * Une capture → plusieurs factures. L'IA recopie ; tout se vérifie et se
 * corrige ici avant l'enregistrement, facture par facture.
 */
export function InvoiceBatch() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { scope, activeCompany, loading: tenantLoading } = useTenant();
  const { settings } = useSettings();
  const { showError, showSuccess } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [analyzing, setAnalyzing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const clientsQuery = useQuery({
    queryKey: clientsQueryKeys.list(scope?.companyId ?? '', ''),
    queryFn: () => fetchClientsPage(requireScope(scope), { page: 0, pageSize: CLIENTS_PAGE_SIZE }),
    enabled: Boolean(scope?.companyId),
  });
  const clients = clientsQuery.data?.clients ?? [];

  function toDraft(invoice: AnalyzedInvoice, index: number): Draft {
    return {
      key: `${Date.now()}-${index}`,
      detectedClient: invoice.client_name,
      clientAddress: invoice.client_address,
      clientChoice: matchClient(clients, invoice.client_name),
      issuedAt: invoice.issued_date ?? todayDateInput(),
      paid: false,
      number: '',
      title: '',
      templateId: getDefaultComposerTemplateId('invoice', settings),
      legalIds: readRememberedLegalIds(),
      stampColor: 'auto',
      stampPosition: 'auto',
      // L'adresse lue sur la capture est celle de l'acheteur : livraison par défaut.
      addresses: {
        ...createEmptyInvoiceAddresses(),
        shipping: [invoice.client_name, invoice.client_address].filter(Boolean).join('\n'),
      },
      lines: invoice.lines.map((line) => ({
        ...toInvoiceLineValues(line),
        id: createLocalInvoiceLineId(),
        productId: null,
        discountPercent: '0',
      })),
      error: null,
    };
  }

  async function analyze(files: File[]) {
    const file = files.find((entry) => entry.type.startsWith('image/'));
    if (!file || analyzing) return;
    setAnalyzing(true);
    setPreview((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    try {
      const invoices = await analyzeInvoicesImage({
        imageBase64: await fileToBase64(file),
        mimeType: file.type || 'image/png',
      });
      if (invoices.length === 0) {
        throw new Error('Aucune facture reconnue sur cette image.');
      }
      setDrafts((current) => [...current, ...invoices.map(toDraft)]);
      showSuccess(
        `${invoices.length} facture${invoices.length > 1 ? 's' : ''} détectée${invoices.length > 1 ? 's' : ''}. Vérifiez puis enregistrez.`,
      );
    } catch (error) {
      showError(error instanceof Error ? error.message : 'Analyse impossible.');
    } finally {
      setAnalyzing(false);
    }
  }

  useImagePaste((images) => void analyze(images), !analyzing && !saving);

  function update(key: string, patch: Partial<Draft>) {
    setDrafts((current) => current.map((draft) => (draft.key === key ? { ...draft, ...patch } : draft)));
  }

  function updateLine(key: string, lineId: string, patch: Partial<InvoiceLineValue>) {
    setDrafts((current) =>
      current.map((draft) =>
        draft.key === key
          ? { ...draft, lines: draft.lines.map((line) => (line.id === lineId ? { ...line, ...patch } : line)) }
          : draft,
      ),
    );
  }

  async function saveAll() {
    const activeScope = requireScope(scope);
    setSaving(true);
    const remaining: Draft[] = [];
    let created = 0;

    for (const draft of drafts) {
      try {
        const lines = draft.lines.filter((line) => line.description.trim());
        if (lines.length === 0) throw new Error('Aucune ligne.');

        let clientId = draft.clientChoice;
        if (!clientId) throw new Error('Choisissez un client.');
        if (clientId === NEW_CLIENT) {
          const name = draft.detectedClient.trim();
          if (!name) throw new Error('Choisissez un client.');
          const client = await createClient(activeScope, {
            ...createEmptyClientFormValues(),
            lastName: name,
            address: draft.clientAddress,
          });
          clientId = client.id;
        }

        const issuedAtIso = frenchDateInputToIso(draft.issuedAt);
        if (!issuedAtIso) throw new Error('Date d’émission invalide.');

        await createInvoice(activeScope, {
          clientId,
          lines,
          issuedAt: issuedAtIso,
          alreadyPaid: draft.paid,
          dueAt: draft.paid ? null : undefined,
          number: draft.number.trim() || null,
          pdfOptions: {
            title: draft.title.trim() || null,
            legalIds: draft.legalIds,
            stampColor: draft.stampColor,
            stampPosition: draft.stampPosition,
            templateId: draft.templateId || null,
            showEmail: false,
            addresses: draft.addresses,
          },
        });
        created += 1;
      } catch (error) {
        remaining.push({
          ...draft,
          error: error instanceof Error ? error.message : 'Enregistrement impossible.',
        });
      }
    }

    setSaving(false);
    void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: clientsQueryKeys.all });

    if (remaining.length === 0) {
      showSuccess(`${created} facture${created > 1 ? 's' : ''} enregistrée${created > 1 ? 's' : ''}.`);
      router.push('/app/invoices');
      return;
    }

    setDrafts(remaining);
    if (created > 0) showSuccess(`${created} facture${created > 1 ? 's' : ''} enregistrée${created > 1 ? 's' : ''}.`);
    showError(`${remaining.length} facture${remaining.length > 1 ? 's' : ''} à corriger (voir en rouge).`);
  }

  if (tenantLoading) {
    return <LoadingState message="Chargement…" />;
  }

  return (
    <div className="h-full overflow-y-auto bg-app-canvas">
      <div className="mx-auto max-w-[1100px] space-y-4 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-[20px] font-semibold tracking-[-0.01em] text-app-text">
              Créer plusieurs factures
            </h1>
            <p className="mt-1 text-[13px] text-app-muted">
              Collez une capture (Ctrl+V) : l’IA recopie chaque commande en facture. Vérifiez, ajustez,
              puis enregistrez tout d’un coup.
            </p>
          </div>
          <SecondaryButton onClick={() => router.push('/app/invoices')}>Annuler</SecondaryButton>
        </div>

        <input
          accept="image/*"
          className="hidden"
          onChange={(event) => {
            void analyze(Array.from(event.target.files ?? []));
            event.target.value = '';
          }}
          ref={fileInputRef}
          type="file"
        />

        <button
          className={cn(
            'flex w-full items-center gap-4 rounded-app-control border-2 border-dashed border-app-accent-border bg-app-accent-tint/50 px-5 py-5 text-left transition-colors hover:bg-app-accent-tint',
            analyzing && 'pointer-events-none opacity-70',
          )}
          onClick={() => fileInputRef.current?.click()}
          type="button">
          {preview ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt="" className="h-16 w-16 shrink-0 rounded-app-field object-cover" src={preview} />
          ) : (
            <ImagePlus className="shrink-0 text-app-accent" size={28} />
          )}
          <span>
            <span className="block text-[14px] font-semibold text-app-text">
              {analyzing ? 'Lecture de la capture…' : 'Collez une capture ici (Ctrl+V) ou cliquez pour choisir une image'}
            </span>
            <span className="mt-0.5 block text-[12.5px] text-app-muted">
              Commandes, ventes, tableau… L’IA recopie les lignes sans rien calculer.
            </span>
          </span>
          {analyzing ? <Sparkles className="ml-auto animate-pulse text-app-accent" size={20} /> : null}
        </button>

        {drafts.map((draft, index) => {
          const total = draft.lines.reduce((sum, line) => sum + lineTotalTtc(line), 0);

          return (
            <section
              className={cn(
                'rounded-app-control border bg-app-surface p-4 shadow-sm',
                draft.error ? 'border-app-danger-text' : 'border-app-border',
              )}
              key={draft.key}>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-[15px] font-semibold text-app-text">
                  Facture {index + 1}
                  {draft.detectedClient ? (
                    <span className="ml-2 font-normal text-app-muted">· {draft.detectedClient}</span>
                  ) : null}
                </h2>
                <div className="flex items-center gap-3">
                  <span className="app-num text-[15px] font-semibold text-app-accent">{formatCurrency(total)} TTC</span>
                  <GhostButton
                    className="text-app-danger-text"
                    onClick={() => setDrafts((current) => current.filter((entry) => entry.key !== draft.key))}>
                    <Trash2 size={15} />
                    Retirer
                  </GhostButton>
                </div>
              </div>

              {draft.error ? (
                <p className="mb-3 rounded-app-field bg-app-danger-tint px-3 py-2 text-[12.5px] font-medium text-app-danger-text">
                  {draft.error}
                </p>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <Field label="Client">
                  <SelectInput
                    onChange={(event) => update(draft.key, { clientChoice: event.target.value, error: null })}
                    value={draft.clientChoice}>
                    <option value="">Choisir un client…</option>
                    {draft.detectedClient ? (
                      <option value={NEW_CLIENT}>+ Créer « {draft.detectedClient} »</option>
                    ) : null}
                    {clients.map((client) => (
                      <option key={client.id} value={client.id}>
                        {getClientDisplayName(client)}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Date d’émission">
                  <TextInput
                    className="app-num"
                    onChange={(event) => update(draft.key, { issuedAt: event.target.value })}
                    type="date"
                    value={draft.issuedAt}
                  />
                </Field>
                <Field label="Numéro">
                  <TextInput
                    className="app-num"
                    maxLength={40}
                    onChange={(event) => update(draft.key, { number: event.target.value, error: null })}
                    placeholder="Automatique"
                    value={draft.number}
                  />
                </Field>
                <Field label="Titre">
                  <TextInput
                    list="invoice-batch-titles"
                    maxLength={60}
                    onChange={(event) => update(draft.key, { title: event.target.value })}
                    placeholder="Facture"
                    value={draft.title}
                  />
                </Field>
                <Field label="Modèle">
                  <SelectInput
                    onChange={(event) => update(draft.key, { templateId: event.target.value })}
                    value={draft.templateId}>
                    {COMPOSER_TEMPLATES.map((template) => (
                      <option key={template.id} value={template.id}>
                        {template.id} · {template.label}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <label className="flex cursor-pointer items-center gap-2 self-end pb-2.5 text-[13px] font-medium text-app-text-3">
                  <input
                    checked={draft.paid}
                    className="h-[14px] w-[14px] [accent-color:var(--app-accent)]"
                    onChange={(event) => update(draft.key, { paid: event.target.checked })}
                    type="checkbox"
                  />
                  Déjà payée (tampon)
                </label>
              </div>

              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[560px] text-[13px]">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-[0.08em] text-app-faint">
                      <th className="pb-1.5 font-semibold">Désignation</th>
                      <th className="w-20 pb-1.5 font-semibold">Qté</th>
                      <th className="w-28 pb-1.5 font-semibold">P.U. HT</th>
                      <th className="w-20 pb-1.5 font-semibold">TVA %</th>
                      <th className="w-24 pb-1.5 text-right font-semibold">Total TTC</th>
                      <th className="w-8" />
                    </tr>
                  </thead>
                  <tbody>
                    {draft.lines.map((line) => (
                      <tr className="border-t border-app-border-soft" key={line.id}>
                        <td className="py-1.5 pr-2">
                          <TextInput
                            onChange={(event) => updateLine(draft.key, line.id, { description: event.target.value })}
                            value={line.description}
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <TextInput
                            className="app-num"
                            inputMode="decimal"
                            onChange={(event) => updateLine(draft.key, line.id, { quantity: event.target.value })}
                            value={line.quantity}
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <TextInput
                            className="app-num"
                            inputMode="decimal"
                            onChange={(event) => updateLine(draft.key, line.id, { unitPrice: event.target.value })}
                            value={line.unitPrice}
                          />
                        </td>
                        <td className="py-1.5 pr-2">
                          <TextInput
                            className="app-num"
                            inputMode="decimal"
                            onChange={(event) => updateLine(draft.key, line.id, { vatRate: event.target.value })}
                            value={line.vatRate}
                          />
                        </td>
                        <td className="app-num py-1.5 text-right font-semibold text-app-text">
                          {formatCurrency(lineTotalTtc(line))}
                        </td>
                        <td className="py-1.5 pl-1">
                          <button
                            aria-label="Supprimer la ligne"
                            className="rounded p-1 text-app-muted hover:text-app-danger-text"
                            onClick={() =>
                              update(draft.key, { lines: draft.lines.filter((entry) => entry.id !== line.id) })
                            }
                            type="button">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                <GhostButton
                  className="mt-1"
                  onClick={() =>
                    update(draft.key, {
                      lines: [
                        ...draft.lines,
                        {
                          id: createLocalInvoiceLineId(),
                          productId: null,
                          description: '',
                          quantity: '1',
                          unit: 'unité',
                          unitPrice: '0',
                          vatRate: '20',
                          discountPercent: '0',
                        },
                      ],
                    })
                  }>
                  <Plus size={14} />
                  Ajouter une ligne
                </GhostButton>
              </div>

              <details className="mt-3 rounded-app-field border border-app-border-soft px-3 py-2">
                <summary className="cursor-pointer text-[13px] font-medium text-app-text-3">
                  SIREN / SIRET / TVA, tampon et adresses
                </summary>
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  <LegalIdsPicker
                    company={activeCompany}
                    onChange={(legalIds) => update(draft.key, { legalIds })}
                    value={draft.legalIds}
                  />
                  <StampPicker
                    color={draft.stampColor}
                    onColorChange={(stampColor) => update(draft.key, { stampColor })}
                    onPositionChange={(stampPosition) => update(draft.key, { stampPosition })}
                    position={draft.stampPosition}
                  />
                </div>
                <div className="mt-4">
                  <AddressesPicker
                    client={clients.find((client) => client.id === draft.clientChoice) ?? null}
                    company={activeCompany}
                    onChange={(addresses) => update(draft.key, { addresses })}
                    value={draft.addresses}
                  />
                </div>
              </details>
            </section>
          );
        })}

        <datalist id="invoice-batch-titles">
          {INVOICE_TITLE_SUGGESTIONS.map((title) => (
            <option key={title} value={title} />
          ))}
        </datalist>

        {drafts.length > 0 ? (
          <div className="sticky bottom-0 flex items-center justify-between gap-3 rounded-app-control border border-app-border bg-app-surface px-4 py-3 shadow-lg">
            <span className="text-[13px] text-app-muted">
              {drafts.length} facture{drafts.length > 1 ? 's' : ''} prête{drafts.length > 1 ? 's' : ''} à enregistrer
            </span>
            <PrimaryButton disabled={saving} onClick={() => void saveAll()}>
              {saving
                ? 'Enregistrement…'
                : `Enregistrer ${drafts.length > 1 ? `les ${drafts.length} factures` : 'la facture'}`}
            </PrimaryButton>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[12px] font-medium text-app-text-3">{label}</span>
      {children}
    </label>
  );
}
