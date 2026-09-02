'use client';

import { useCallback, useEffect, useState } from 'react';

import { PrimaryButton, SecondaryLink } from '@/components/app/form-fields';
import { LoadingState, Panel } from '@/components/app/ui';
import { getSupabaseBrowserClient } from '@/lib/supabase/browser';
import { syncSuperPdp } from '@/lib/superpdp/api';
import { useTenant } from '@/providers/company-provider';

type ReceivedInvoice = {
  id: string;
  supplier_name: string | null;
  invoice_number: string | null;
  issue_date: string | null;
  subtotal_ht: number | null;
  total_vat: number | null;
  total_ttc: number | null;
  electronic_invoice_status: string | null;
  received_at: string | null;
  latest_status_code: string | null;
};

export default function ReceivedEInvoicesPage() {
  const { scope } = useTenant();
  const companyId = scope?.companyId ?? null;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rows, setRows] = useState<ReceivedInvoice[]>([]);

  const load = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const supabase = getSupabaseBrowserClient();
    const { data, error: queryError } = await supabase
      .from('superpdp_received_invoices')
      .select(
        'id, supplier_name, invoice_number, issue_date, subtotal_ht, total_vat, total_ttc, electronic_invoice_status, received_at, latest_status_code',
      )
      .eq('company_id', companyId)
      .order('received_at', { ascending: false })
      .limit(100);
    if (queryError) setError('Impossible de charger les factures reçues.');
    setRows((data as ReceivedInvoice[]) ?? []);
    setLoading(false);
  }, [companyId]);

  useEffect(() => {
    void load();
  }, [load]);

  async function handleSync() {
    if (!companyId) return;
    setBusy(true);
    setError(null);
    try {
      await syncSuperPdp(companyId, 'in');
      await load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Synchronisation impossible.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingState message="Chargement des factures reçues…" />;
  }

  return (
    <div className="mx-auto max-w-[720px] space-y-4 p-5 sm:p-6">
      <SecondaryLink href="/app/settings/e-invoicing">← Facturation électronique</SecondaryLink>
      <Panel>
        <p className="text-[13px] text-app-muted">
          Factures électroniques reçues via SUPER PDP. Elles ne sont jamais marquées comme
          payées automatiquement. Le module achats n’existe pas encore dans INVEQ.
        </p>
        <PrimaryButton
          className="mt-4"
          disabled={busy || !companyId}
          onClick={() => void handleSync()}
          type="button">
          {busy ? 'Synchronisation…' : 'Synchroniser'}
        </PrimaryButton>
        {error ? <p className="mt-3 text-[13px] text-app-danger">{error}</p> : null}
      </Panel>

      {rows.length === 0 ? (
        <Panel>
          <p className="text-[13px] text-app-muted">Aucune facture reçue pour le moment.</p>
        </Panel>
      ) : (
        rows.map((item) => (
          <Panel key={item.id}>
            <h3 className="font-semibold text-app-text">{item.supplier_name || 'Fournisseur'}</h3>
            <div className="mt-2 space-y-1 text-[13px] text-app-muted">
              <p>N° {item.invoice_number || '—'}</p>
              <p>Date {item.issue_date || '—'}</p>
              <p>
                HT {item.subtotal_ht ?? '—'} · TVA {item.total_vat ?? '—'} · TTC{' '}
                {item.total_ttc ?? '—'}
              </p>
              <p>
                Statut {item.electronic_invoice_status || '—'}
                {item.latest_status_code ? ` (${item.latest_status_code})` : ''}
              </p>
              <p>
                Réception{' '}
                {item.received_at ? new Date(item.received_at).toLocaleString('fr-FR') : '—'}
              </p>
            </div>
          </Panel>
        ))
      )}
    </div>
  );
}
