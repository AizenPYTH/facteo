'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { HandCoins, Receipt } from 'lucide-react';
import Link from 'next/link';
import { useMemo, useState } from 'react';

import { AppDialog } from '@/components/app/app-dialog';
import { PrimaryButton, SecondaryButton } from '@/components/app/form-fields';
import { formatCurrency } from '@/lib/domain/format/currency';
import { formatDate } from '@/lib/domain/format/date';
import { invoicesQueryKeys, quotesQueryKeys } from '@/lib/domain/supabase/query-keys';
import {
  BILLING_ROLE_LABELS,
  createDepositInvoice,
  createFinalInvoiceFromQuote,
  fetchQuoteBillingState,
  previewDepositTtc,
  quoteVatGroups,
  type DepositMode,
} from '@/lib/domain/supabase/quote-billing';
import { useToast } from '@/providers/toast-provider';
import type { QuoteDetail } from '@inveq/types/quote';

export const quoteBillingQueryKey = (quoteId: string) => ['quote-billing', quoteId] as const;

/**
 * Facturation d'un devis : acomptes (pourcentage ou montant), reste à
 * facturer, facture de solde et liens entre les documents.
 */
export function QuoteBillingPanel({
  quote,
  onInvoiceCreated,
}: {
  quote: QuoteDetail;
  onInvoiceCreated: (invoiceId: string) => void;
}) {
  const queryClient = useQueryClient();
  const { showSuccess, showError } = useToast();
  const [depositOpen, setDepositOpen] = useState(false);
  const [mode, setMode] = useState<DepositMode>('percent');
  const [rawValue, setRawValue] = useState('30');

  const stateQuery = useQuery({
    queryKey: quoteBillingQueryKey(quote.id),
    queryFn: () => fetchQuoteBillingState(quote.id),
    enabled: quote.status === 'accepted' || quote.status === 'converted',
  });
  const state = stateQuery.data;

  const vatGroups = useMemo(() => quoteVatGroups(quote.lines), [quote.lines]);
  const value = Number(rawValue.replace(',', '.'));
  const preview = previewDepositTtc(vatGroups, quote.totalTtc, mode, value);

  const refresh = () => {
    void queryClient.invalidateQueries({ queryKey: quoteBillingQueryKey(quote.id) });
    void queryClient.invalidateQueries({ queryKey: quotesQueryKeys.all });
    void queryClient.invalidateQueries({ queryKey: invoicesQueryKeys.all });
  };

  const depositMutation = useMutation({
    mutationFn: () => createDepositInvoice(quote.id, mode, value),
    onSuccess: (created) => {
      refresh();
      setDepositOpen(false);
      showSuccess(`Facture d’acompte ${created.number} créée (${formatCurrency(created.totalTtc)}).`);
      onInvoiceCreated(created.id);
    },
    onError: (error) => showError(error instanceof Error ? error.message : 'Échec.'),
  });

  const finalMutation = useMutation({
    mutationFn: () => createFinalInvoiceFromQuote(quote.id),
    onSuccess: (created) => {
      refresh();
      showSuccess(
        created.role === 'balance'
          ? `Facture de solde ${created.number} créée (${formatCurrency(created.totalTtc)}).`
          : `Facture ${created.number} créée.`,
      );
      onInvoiceCreated(created.id);
    },
    onError: (error) => showError(error instanceof Error ? error.message : 'Échec.'),
  });

  if (quote.status !== 'accepted' && quote.status !== 'converted') {
    return null;
  }

  const deposits = state?.invoices.filter((invoice) => invoice.role === 'deposit') ?? [];
  const hasDeposits = deposits.some((invoice) => invoice.active);
  const valueError =
    !Number.isFinite(value) || value <= 0
      ? 'Indiquez une valeur positive.'
      : mode === 'percent' && value >= 100
        ? 'Un acompte est inférieur à 100 %.'
        : state && preview > state.remainingTtc - 0.01
          ? `Il doit rester un solde : au plus ${formatCurrency(Math.max(state.remainingTtc - 0.01, 0))}.`
          : null;

  return (
    <div className="border-b border-app-border-soft px-5 py-4">
      <p className="mb-2.5 text-[11px] font-bold uppercase tracking-[0.1em] text-app-faint">Facturation du devis</p>

      {state ? (
        <>
          <dl className="grid grid-cols-2 gap-2 text-[12.5px]">
            <div>
              <dt className="text-app-faint">Devis</dt>
              <dd className="app-num font-medium text-app-text">{formatCurrency(state.quoteTotalTtc)} TTC</dd>
            </div>
            <div>
              <dt className="text-app-faint">Acomptes facturés</dt>
              <dd className="app-num font-medium text-app-text">{formatCurrency(state.depositsTotalTtc)}</dd>
            </div>
            <div>
              <dt className="text-app-faint">Acomptes encaissés</dt>
              <dd className="app-num font-medium text-app-text">{formatCurrency(state.depositsPaid)}</dd>
            </div>
            <div>
              <dt className="text-app-faint">Reste à facturer</dt>
              <dd className="app-num font-semibold text-app-text">{formatCurrency(state.remainingTtc)}</dd>
            </div>
          </dl>

          {state.invoices.length > 0 ? (
            <ul className="mt-3 space-y-1.5">
              {state.invoices.map((invoice) => (
                <li key={invoice.id} className="flex items-center justify-between gap-2 text-[12.5px]">
                  <Link className="min-w-0 truncate text-app-accent hover:underline" href={`/app/invoices?selected=${invoice.id}`}>
                    {BILLING_ROLE_LABELS[invoice.role]} {invoice.number}
                    {invoice.role === 'deposit' && invoice.depositPercent ? ` · ${invoice.depositPercent.toLocaleString('fr-FR')} %` : ''}
                  </Link>
                  <span className={`app-num shrink-0 ${invoice.active ? 'text-app-text-3' : 'text-app-faint line-through'}`}>
                    {formatCurrency(invoice.totalTtc)}
                    {invoice.issuedAt ? ` · ${formatDate(invoice.issuedAt)}` : ''}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="mt-3 flex flex-wrap gap-2">
            {state.canCreateDeposit ? (
              <SecondaryButton onClick={() => setDepositOpen(true)}>
                <HandCoins size={15} />
                Facture d’acompte
              </SecondaryButton>
            ) : null}
            {/* Sans acompte, « Convertir en facture » (action principale) suffit. */}
            {state.canCreateFinal && hasDeposits ? (
              <PrimaryButton disabled={finalMutation.isPending} onClick={() => finalMutation.mutate()}>
                <Receipt size={15} />
                {finalMutation.isPending ? 'Création…' : `Facture de solde (${formatCurrency(state.remainingTtc)})`}
              </PrimaryButton>
            ) : null}
          </div>
        </>
      ) : (
        <p className="text-[12.5px] text-app-muted">{stateQuery.isLoading ? 'Chargement…' : 'Indisponible.'}</p>
      )}

      <AppDialog
        description="L’acompte reprend la répartition du devis par taux de TVA. Il sera déduit de la facture de solde."
        footer={
          <>
            <SecondaryButton onClick={() => setDepositOpen(false)}>Annuler</SecondaryButton>
            <PrimaryButton
              disabled={Boolean(valueError) || depositMutation.isPending}
              onClick={() => depositMutation.mutate()}>
              {depositMutation.isPending ? 'Création…' : `Créer l’acompte (${formatCurrency(preview)})`}
            </PrimaryButton>
          </>
        }
        icon={HandCoins}
        onClose={() => setDepositOpen(false)}
        open={depositOpen}
        size="sm"
        title={`Acompte sur le devis ${quote.number}`}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-1 rounded-app-control bg-app-hover p-1 text-[13px] font-semibold">
            {(['percent', 'amount'] as const).map((option) => (
              <button
                key={option}
                className={`rounded-md py-1.5 ${mode === option ? 'bg-white text-app-text shadow-sm' : 'text-app-muted'}`}
                onClick={() => {
                  setMode(option);
                  setRawValue(option === 'percent' ? '30' : '');
                }}
                type="button">
                {option === 'percent' ? 'Pourcentage' : 'Montant TTC'}
              </button>
            ))}
          </div>
          <label className="block text-[13px]">
            <span className="font-medium text-app-text-3">{mode === 'percent' ? 'Pourcentage du devis' : 'Montant TTC'}</span>
            <div className="mt-1 flex items-center gap-2">
              <input
                autoFocus
                className="w-full rounded-app-control border border-app-border px-3 py-2 text-app-text outline-none focus:border-app-accent"
                inputMode="decimal"
                onChange={(event) => setRawValue(event.target.value)}
                value={rawValue}
              />
              <span className="text-app-muted">{mode === 'percent' ? '%' : '€'}</span>
            </div>
          </label>
          <p className="text-[12.5px] text-app-muted">
            Acompte : <strong className="app-num text-app-text">{formatCurrency(preview)} TTC</strong>
            {state ? ` · reste à facturer ensuite : ${formatCurrency(Math.max(state.remainingTtc - preview, 0))}` : ''}
          </p>
          {valueError ? <p className="text-[12.5px] text-app-danger-text">{valueError}</p> : null}
        </div>
      </AppDialog>
    </div>
  );
}

/** Sur une facture liée à un devis : son rôle et les autres documents du même devis. */
export function InvoiceQuoteLinks({ quoteId, invoiceId }: { quoteId: string; invoiceId: string }) {
  const stateQuery = useQuery({
    queryKey: quoteBillingQueryKey(quoteId),
    queryFn: () => fetchQuoteBillingState(quoteId),
  });
  const state = stateQuery.data;
  if (!state) return null;
  const current = state.invoices.find((invoice) => invoice.id === invoiceId);

  return (
    <div className="border-b border-app-border-soft px-5 py-4">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-[0.1em] text-app-faint">
        {current ? BILLING_ROLE_LABELS[current.role] : 'Facture'} · devis{' '}
        <Link className="text-app-accent hover:underline" href={`/app/quotes?selected=${state.quoteId}`}>
          {state.quoteNumber}
        </Link>
      </p>
      <ul className="space-y-1.5">
        {state.invoices
          .filter((invoice) => invoice.id !== invoiceId)
          .map((invoice) => (
            <li key={invoice.id} className="flex items-center justify-between gap-2 text-[12.5px]">
              <Link className="truncate text-app-accent hover:underline" href={`/app/invoices?selected=${invoice.id}`}>
                {BILLING_ROLE_LABELS[invoice.role]} {invoice.number}
              </Link>
              <span className={`app-num ${invoice.active ? 'text-app-text-3' : 'text-app-faint line-through'}`}>
                {formatCurrency(invoice.totalTtc)}
              </span>
            </li>
          ))}
      </ul>
      <p className="mt-2 text-[12px] text-app-faint">
        Devis : {formatCurrency(state.quoteTotalTtc)} · acomptes : {formatCurrency(state.depositsTotalTtc)}
        {state.finalInvoiceId ? '' : ` · reste à facturer : ${formatCurrency(state.remainingTtc)}`}
      </p>
    </div>
  );
}
