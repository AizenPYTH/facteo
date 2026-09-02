'use client';

import { useCallback, useEffect, useState } from 'react';
import { Unplug } from 'lucide-react';

import { AppDialog } from '@/components/app/app-dialog';
import {
  DangerButton,
  PrimaryButton,
  SecondaryButton,
  SecondaryLink,
} from '@/components/app/form-fields';
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

  const [confirmDisconnect, setConfirmDisconnect] = useState(false);

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
    setBusy(true);
    setConfirmDisconnect(false);
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
    <div className="mx-auto max-w-[720px] space-y-4 p-5 sm:p-6">
          <Panel>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-app-text">Facturation électronique</h2>
            <p className="mt-2 text-[13px] text-app-muted">
              Connectez votre entreprise à une Plateforme Agréée pour envoyer et recevoir vos
              factures électroniques.
            </p>
            <p className="mt-4 text-[14.5px] font-medium text-app-text">{statusLabel}</p>

            {error ? <p className="mt-3 text-[13px] text-app-danger">{error}</p> : null}
            {message ? <p className="mt-3 text-[13px] text-app-success-text">{message}</p> : null}

            {!connected ? (
              <PrimaryButton
                className="mt-6"
                disabled={busy || !companyId}
                onClick={() => void handleConnect()}
                type="button">
                {busy ? 'Connexion…' : 'Connecter SUPER PDP'}
              </PrimaryButton>
            ) : (
              <div className="mt-6 space-y-2 text-[13px] text-app-text-2">
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

                <div className="flex flex-wrap gap-2 pt-4">
                  <SecondaryButton
                    disabled={busy}
                    onClick={() => void handleVerify()}
                    type="button">
                    Vérifier la connexion
                  </SecondaryButton>
                  <SecondaryButton
                    disabled={busy}
                    onClick={() => void handleSync()}
                    type="button">
                    Synchroniser
                  </SecondaryButton>
                  <SecondaryLink href="/app/settings/e-invoicing/received">
                    Factures reçues
                  </SecondaryLink>
                  <DangerButton
                    disabled={busy}
                    onClick={() => setConfirmDisconnect(true)}
                    type="button">
                    Déconnecter
                  </DangerButton>
                </div>
              </div>
            )}
          </Panel>

          <Panel>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-app-text">Portabilité</h2>
            <p className="mt-2 text-[13px] text-app-muted">
              Si votre entreprise était rattachée à une autre plateforme (ex. Qonto), le transfert
              administratif est géré par SUPER PDP. Utilisez « Vérifier la connexion » après
              migration. Aucune donnée Qonto n’est supprimée dans INVEQ.
            </p>
          </Panel>

      <AppDialog
        description="Déconnecter SUPER PDP pour cette entreprise ?"
        footer={
          <>
            <SecondaryButton disabled={busy} onClick={() => setConfirmDisconnect(false)} type="button">
              Annuler
            </SecondaryButton>
            <DangerButton
              disabled={busy}
              onClick={() => void handleDisconnect()}
              type="button"
              variant="solid">
              Déconnecter
            </DangerButton>
          </>
        }
        icon={Unplug}
        onClose={() => setConfirmDisconnect(false)}
        open={confirmDisconnect}
        title="Déconnecter SUPER PDP"
        tone="danger"
      />
    </div>
  );
}
