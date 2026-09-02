'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { AppTopBar } from '@/components/app/app-shell';
import { LoadingState, Panel } from '@/components/app/ui';
import {
  disconnectSuperPdp,
  getSuperPdpConnection,
  startSuperPdpOAuth,
  syncSuperPdp,
  type SuperPdpConnectionPublic,
} from '@/lib/superpdp/api';
import { useTenant } from '@/providers/company-provider';

function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  try {
    return new Date(value).toLocaleString('fr-FR');
  } catch {
    return value;
  }
}

export default function EInvoicingSettingsPage() {
  const { scope, activeCompany } = useTenant();
  const companyId = scope?.companyId ?? null;
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const [connection, setConnection] = useState<SuperPdpConnectionPublic | null>(null);

  const refresh = useCallback(async () => {
    if (!companyId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const result = await getSuperPdpConnection(companyId, 'status');
      setConnected(result.connected);
      setConnection(result.connection);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Chargement impossible.');
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  async function handleConnect() {
    if (!companyId) return;
    setBusy(true);
    setError(null);
    try {
      const redirectTo = `${window.location.origin}/app/settings/e-invoicing`;
      const { authorizationUrl } = await startSuperPdpOAuth(companyId, redirectTo);
      window.location.href = authorizationUrl;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Connexion impossible.');
      setBusy(false);
    }
  }

  async function handleVerify() {
    if (!companyId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await getSuperPdpConnection(companyId, 'verify');
      setConnected(result.connected);
      setConnection(result.connection);
      setMessage(result.verifyError || 'Connexion vérifiée.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Vérification impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function handleSync() {
    if (!companyId) return;
    setBusy(true);
    setError(null);
    try {
      const result = await syncSuperPdp(companyId, 'both');
      setMessage(
        `Synchronisation terminée · ${result.updatedOutgoing} émise(s) · ${result.upsertedIncoming} reçue(s)`,
      );
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Synchronisation impossible.');
    } finally {
      setBusy(false);
    }
  }

  async function handleDisconnect() {
    if (!companyId) return;
    if (!window.confirm('Déconnecter SUPER PDP pour cette entreprise ?')) return;
    setBusy(true);
    try {
      await disconnectSuperPdp(companyId);
      setConnected(false);
      setConnection(null);
      setMessage('SUPER PDP déconnecté.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Déconnexion impossible.');
    } finally {
      setBusy(false);
    }
  }

  if (loading) {
    return <LoadingState message="Chargement de la facturation électronique…" />;
  }

  const statusLabel = !connected
    ? '⚪ Non connecté'
    : connection?.status === 'needs_review'
      ? '🟠 Vérification SUPER PDP en cours'
      : '🟢 SUPER PDP connecté';

  return (
    <>
      <AppTopBar subtitle="Plateforme Agréée SUPER PDP" title="Facturation électronique">
        <Link className="text-sm font-medium text-primary hover:underline" href="/app/settings">
          ← Paramètres
        </Link>
      </AppTopBar>
      <div className="flex-1 overflow-y-auto p-6 xl:p-8">
        <div className="mx-auto max-w-3xl space-y-6">
          <Panel>
            <h2 className="text-lg font-semibold text-foreground">Facturation électronique</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Connectez votre entreprise à une Plateforme Agréée pour envoyer et recevoir vos
              factures électroniques.
            </p>
            <p className="mt-4 text-base font-medium">{statusLabel}</p>

            {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
            {message ? <p className="mt-3 text-sm text-emerald-700">{message}</p> : null}

            {!connected ? (
              <button
                className="mt-6 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
                disabled={busy || !companyId}
                onClick={() => void handleConnect()}
                type="button">
                {busy ? 'Connexion…' : 'Connecter SUPER PDP'}
              </button>
            ) : (
              <div className="mt-6 space-y-2 text-sm text-foreground">
                <p>Entreprise : {connection?.remote_company_name || activeCompany?.name || '—'}</p>
                <p>Statut réception : {connection?.reception_enabled ? 'Activé' : 'Non activé'}</p>
                <p>Statut émission : {connection?.emission_enabled ? 'Activé' : 'Non activé'}</p>
                <p>
                  Annuaire :{' '}
                  {connection?.directory_registered == null
                    ? 'À vérifier'
                    : connection.directory_registered
                      ? 'Inscrit'
                      : 'Non inscrit'}
                </p>
                <p>Dernière synchronisation : {formatDate(connection?.last_sync_at)}</p>
                {connection?.remote_env ? <p>Environnement : {connection.remote_env}</p> : null}

                <div className="flex flex-wrap gap-3 pt-4">
                  <button
                    className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60"
                    disabled={busy}
                    onClick={() => void handleVerify()}
                    type="button">
                    Vérifier la connexion
                  </button>
                  <button
                    className="rounded-lg border px-4 py-2 text-sm font-medium disabled:opacity-60"
                    disabled={busy}
                    onClick={() => void handleSync()}
                    type="button">
                    Synchroniser
                  </button>
                  <Link
                    className="rounded-lg border px-4 py-2 text-sm font-medium"
                    href="/app/settings/e-invoicing/received">
                    Factures reçues
                  </Link>
                  <button
                    className="rounded-lg border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-60"
                    disabled={busy}
                    onClick={() => void handleDisconnect()}
                    type="button">
                    Déconnecter
                  </button>
                </div>
              </div>
            )}
          </Panel>

          <Panel>
            <h2 className="text-lg font-semibold text-foreground">Portabilité</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Si votre entreprise était rattachée à une autre plateforme (ex. Qonto), le transfert
              administratif est géré par SUPER PDP. Utilisez « Vérifier la connexion » après
              migration. Aucune donnée Qonto n’est supprimée dans INVEQ.
            </p>
          </Panel>
        </div>
      </div>
    </>
  );
}
